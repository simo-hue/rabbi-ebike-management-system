const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database setup
const dbPath = path.join(__dirname, 'rabbi_ebike.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Settings table
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    shop_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    opening_time TEXT NOT NULL,
    closing_time TEXT NOT NULL,
    pricing_hourly REAL NOT NULL,
    pricing_half_day REAL NOT NULL,
    pricing_full_day REAL NOT NULL,
    pricing_guide_hourly REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Bikes table
  db.run(`CREATE TABLE IF NOT EXISTS bikes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    size TEXT NOT NULL,
    suspension TEXT NOT NULL,
    count INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Bookings table
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    booking_date DATE NOT NULL,
    category TEXT NOT NULL,
    needs_guide BOOLEAN NOT NULL,
    status TEXT NOT NULL,
    total_price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Booking bikes (many-to-many relationship)
  db.run(`CREATE TABLE IF NOT EXISTS booking_bikes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT NOT NULL,
    bike_type TEXT NOT NULL,
    bike_size TEXT NOT NULL,
    bike_suspension TEXT NOT NULL,
    count INTEGER NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
  )`);

  // Server configuration table
  db.run(`CREATE TABLE IF NOT EXISTS server_config (
    id INTEGER PRIMARY KEY,
    server_port INTEGER DEFAULT 3001,
    auto_backup BOOLEAN DEFAULT 1,
    backup_interval_hours INTEGER DEFAULT 24,
    max_backup_files INTEGER DEFAULT 30,
    debug_mode BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default settings if none exist
  db.get("SELECT COUNT(*) as count FROM settings", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO settings (
        id, shop_name, phone, email, opening_time, closing_time,
        pricing_hourly, pricing_half_day, pricing_full_day, pricing_guide_hourly
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        "Rabbi E-Bike Rent Go & Fun",
        "+39 123 456 7890",
        "info@ecoride.it",
        "09:00",
        "19:00",
        15,
        45,
        70,
        25
      ]);
    }
  });

  // Insert default bikes if none exist
  db.get("SELECT COUNT(*) as count FROM bikes", (err, row) => {
    if (row.count === 0) {
      const defaultBikes = [
        ["adulto", "S", "front-only", 2],
        ["adulto", "M", "front-only", 3],
        ["adulto", "L", "front-only", 2],
        ["adulto", "M", "full-suspension", 2],
        ["bambino", "S", "front-only", 1]
      ];
      
      defaultBikes.forEach(bike => {
        db.run("INSERT INTO bikes (type, size, suspension, count) VALUES (?, ?, ?, ?)", bike);
      });
    }
  });

  // Insert default server config if none exist
  db.get("SELECT COUNT(*) as count FROM server_config", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO server_config (id) VALUES (1)`);
    }
  });
});

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  db.get("SELECT * FROM settings WHERE id = 1", (err, settings) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.all("SELECT * FROM bikes ORDER BY type, size, suspension", (err, bikes) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        shopName: settings.shop_name,
        phone: settings.phone,
        email: settings.email,
        openingTime: settings.opening_time,
        closingTime: settings.closing_time,
        pricing: {
          hourly: settings.pricing_hourly,
          halfDay: settings.pricing_half_day,
          fullDay: settings.pricing_full_day,
          guideHourly: settings.pricing_guide_hourly
        },
        totalBikes: bikes.map(bike => ({
          type: bike.type,
          size: bike.size,
          suspension: bike.suspension,
          count: bike.count
        }))
      });
    });
  });
});

app.put('/api/settings', (req, res) => {
  const { shopName, phone, email, openingTime, closingTime, pricing, totalBikes } = req.body;
  
  db.run(`UPDATE settings SET 
    shop_name = ?, phone = ?, email = ?, opening_time = ?, closing_time = ?,
    pricing_hourly = ?, pricing_half_day = ?, pricing_full_day = ?, pricing_guide_hourly = ?,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = 1`, [
    shopName, phone, email, openingTime, closingTime,
    pricing.hourly, pricing.halfDay, pricing.fullDay, pricing.guideHourly
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Update bikes
    db.run("DELETE FROM bikes", (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const stmt = db.prepare("INSERT INTO bikes (type, size, suspension, count) VALUES (?, ?, ?, ?)");
      totalBikes.forEach(bike => {
        stmt.run([bike.type, bike.size, bike.suspension, bike.count]);
      });
      stmt.finalize();
      
      res.json({ success: true });
    });
  });
});

// Bookings endpoints
app.get('/api/bookings', (req, res) => {
  db.all(`SELECT b.*, GROUP_CONCAT(bb.bike_type || '|' || bb.bike_size || '|' || bb.bike_suspension || '|' || bb.count) as bikes
          FROM bookings b
          LEFT JOIN booking_bikes bb ON b.id = bb.booking_id
          GROUP BY b.id
          ORDER BY b.booking_date, b.start_time`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const bookings = rows.map(row => ({
      id: row.id,
      customerName: row.customer_name,
      phone: row.phone,
      email: row.email,
      startTime: row.start_time,
      endTime: row.end_time,
      date: new Date(row.booking_date),
      category: row.category,
      needsGuide: Boolean(row.needs_guide),
      status: row.status,
      totalPrice: row.total_price,
      bikeDetails: row.bikes ? row.bikes.split(',').map(bike => {
        const [type, size, suspension, count] = bike.split('|');
        return { type, size, suspension, count: parseInt(count) };
      }) : []
    }));
    
    res.json(bookings);
  });
});

app.post('/api/bookings', (req, res) => {
  const { id, customerName, phone, email, startTime, endTime, date, category, needsGuide, status, totalPrice, bikeDetails } = req.body;
  
  db.run(`INSERT INTO bookings (
    id, customer_name, phone, email, start_time, end_time, booking_date, 
    category, needs_guide, status, total_price
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    id, customerName, phone, email, startTime, endTime, 
    new Date(date).toISOString().split('T')[0], category, needsGuide, status, totalPrice
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Insert bike details
    const stmt = db.prepare("INSERT INTO booking_bikes (booking_id, bike_type, bike_size, bike_suspension, count) VALUES (?, ?, ?, ?, ?)");
    bikeDetails.forEach(bike => {
      stmt.run([id, bike.type, bike.size, bike.suspension, bike.count]);
    });
    stmt.finalize();
    
    res.json({ success: true, id });
  });
});

app.put('/api/bookings/:id', (req, res) => {
  const { customerName, phone, email, startTime, endTime, date, category, needsGuide, status, totalPrice, bikeDetails } = req.body;
  
  db.run(`UPDATE bookings SET 
    customer_name = ?, phone = ?, email = ?, start_time = ?, end_time = ?, 
    booking_date = ?, category = ?, needs_guide = ?, status = ?, total_price = ?,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`, [
    customerName, phone, email, startTime, endTime, 
    new Date(date).toISOString().split('T')[0], category, needsGuide, status, totalPrice, req.params.id
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Update bike details
    db.run("DELETE FROM booking_bikes WHERE booking_id = ?", [req.params.id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const stmt = db.prepare("INSERT INTO booking_bikes (booking_id, bike_type, bike_size, bike_suspension, count) VALUES (?, ?, ?, ?, ?)");
      bikeDetails.forEach(bike => {
        stmt.run([req.params.id, bike.type, bike.size, bike.suspension, bike.count]);
      });
      stmt.finalize();
      
      res.json({ success: true });
    });
  });
});

app.delete('/api/bookings/:id', (req, res) => {
  db.run("DELETE FROM booking_bikes WHERE booking_id = ?", [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.run("DELETE FROM bookings WHERE id = ?", [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
  });
});

// Server configuration endpoints
app.get('/api/server-config', (req, res) => {
  db.get("SELECT * FROM server_config WHERE id = 1", (err, config) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(config);
  });
});

app.put('/api/server-config', (req, res) => {
  const { serverPort, autoBackup, backupIntervalHours, maxBackupFiles, debugMode } = req.body;
  
  db.run(`UPDATE server_config SET 
    server_port = ?, auto_backup = ?, backup_interval_hours = ?, max_backup_files = ?, debug_mode = ?,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = 1`, [
    serverPort, autoBackup, backupIntervalHours, maxBackupFiles, debugMode
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// Database management endpoints
app.post('/api/backup', (req, res) => {
  const backupPath = path.join(__dirname, 'backups', `backup_${Date.now()}.db`);
  const fs = require('fs');
  
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'backups'))) {
    fs.mkdirSync(path.join(__dirname, 'backups'));
  }
  
  // Copy database file
  fs.copyFile(dbPath, backupPath, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, backupPath });
  });
});

app.get('/api/database-stats', (req, res) => {
  const stats = {};
  
  db.get("SELECT COUNT(*) as count FROM bookings", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.totalBookings = result.count;
    
    db.get("SELECT COUNT(*) as count FROM bikes", (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.totalBikeTypes = result.count;
      
      db.get("SELECT SUM(count) as total FROM bikes", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalBikes = result.total;
        
        const fs = require('fs');
        fs.stat(dbPath, (err, stat) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.databaseSize = stat.size;
          stats.lastModified = stat.mtime;
          
          res.json(stats);
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Rabbi E-Bike Server running on port ${PORT}`);
  console.log(`📂 Database: ${dbPath}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
});