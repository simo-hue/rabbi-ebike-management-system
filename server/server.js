const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Performance monitoring variables
let requestCount = 0;
let errorCount = 0;
let totalResponseTime = 0;
const startTime = Date.now();

// In-memory log storage
const logs = [];
const maxLogs = 100;

const addLog = (level, message, details = null) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    details
  };
  
  logs.unshift(logEntry);
  if (logs.length > maxLogs) {
    logs.pop();
  }
  
  console.log(`[${level.toUpperCase()}] ${message}`, details || '');
};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Performance tracking middleware
app.use((req, res, next) => {
  const start = Date.now();
  requestCount++;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    totalResponseTime += duration;
    
    if (res.statusCode >= 400) {
      errorCount++;
    }
  });
  
  next();
});

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
    bike_count INTEGER NOT NULL,
    has_trailer_hook BOOLEAN DEFAULT 0,
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
  )`);

  // Fixed costs table
  db.run(`CREATE TABLE IF NOT EXISTS fixed_costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    category TEXT DEFAULT 'general',
    frequency TEXT DEFAULT 'monthly', -- monthly, yearly, one-time
    start_date DATE,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Bike usage analytics table
  db.run(`CREATE TABLE IF NOT EXISTS bike_usage_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bike_type TEXT NOT NULL,
    bike_size TEXT,
    bike_suspension TEXT,
    has_trailer_hook BOOLEAN,
    usage_date DATE NOT NULL,
    total_bookings INTEGER DEFAULT 0,
    total_hours INTEGER DEFAULT 0,
    total_revenue REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Revenue analytics table
  db.run(`CREATE TABLE IF NOT EXISTS revenue_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    category TEXT NOT NULL, -- hourly, half-day, full-day, guide
    total_bookings INTEGER DEFAULT 0,
    total_revenue REAL DEFAULT 0,
    average_booking_value REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, category)
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

  // Insert default fixed costs if none exist
  db.get("SELECT COUNT(*) as count FROM fixed_costs", (err, row) => {
    if (row.count === 0) {
      const defaultCosts = [
        ["Affitto Locale", "Canone mensile affitto negozio/deposito", 800, "rent", "monthly", new Date().toISOString().split('T')[0]],
        ["Assicurazione", "Polizza RC e furto per le biciclette", 150, "insurance", "monthly", new Date().toISOString().split('T')[0]],
        ["Utenze", "Energia elettrica, acqua, gas", 120, "utilities", "monthly", new Date().toISOString().split('T')[0]],
        ["Connessione Internet", "Linea internet per il gestionale", 35, "internet", "monthly", new Date().toISOString().split('T')[0]]
      ];
      
      defaultCosts.forEach(cost => {
        db.run(`INSERT INTO fixed_costs (name, description, amount, category, frequency, start_date) VALUES (?, ?, ?, ?, ?, ?)`, cost);
      });
    }
  });

  // Add missing columns to booking_bikes if they don't exist
  db.all("PRAGMA table_info(booking_bikes)", (err, columns) => {
    if (err) return;
    
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('has_trailer_hook')) {
      db.run(`ALTER TABLE booking_bikes ADD COLUMN has_trailer_hook BOOLEAN DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          addLog('error', 'Failed to add has_trailer_hook column', err.message);
        }
      });
    }
    
    // Also fix the count column name if it exists as 'count' instead of 'bike_count'
    if (columnNames.includes('count') && !columnNames.includes('bike_count')) {
      db.run(`ALTER TABLE booking_bikes RENAME COLUMN count TO bike_count`, (err) => {
        if (err && !err.message.includes('no such column')) {
          addLog('error', 'Failed to rename count column', err.message);
        }
      });
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

// Fixed costs endpoints
app.get('/api/fixed-costs', (req, res) => {
  db.all("SELECT * FROM fixed_costs ORDER BY category, name", (err, costs) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(costs);
  });
});

app.post('/api/fixed-costs', (req, res) => {
  const { name, description, amount, category, frequency, startDate } = req.body;
  
  db.run(`INSERT INTO fixed_costs (name, description, amount, category, frequency, start_date) 
          VALUES (?, ?, ?, ?, ?, ?)`, 
    [name, description || null, amount, category || 'general', frequency || 'monthly', startDate || new Date().toISOString().split('T')[0]], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Costo fisso aggiunto con successo' });
    }
  );
});

app.put('/api/fixed-costs/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, amount, category, frequency, startDate, isActive } = req.body;
  
  db.run(`UPDATE fixed_costs SET 
    name = ?, description = ?, amount = ?, category = ?, frequency = ?, start_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`, 
    [name, description, amount, category, frequency, startDate, isActive ? 1 : 0, id], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Costo fisso non trovato' });
      }
      res.json({ message: 'Costo fisso aggiornato con successo' });
    }
  );
});

app.delete('/api/fixed-costs/:id', (req, res) => {
  const { id } = req.params;
  
  db.run("DELETE FROM fixed_costs WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Costo fisso non trovato' });
    }
    res.json({ message: 'Costo fisso eliminato con successo' });
  });
});

// Analytics endpoints
app.get('/api/analytics/bike-performance', (req, res) => {
  const { period = 'month' } = req.query;
  
  let dateFilter = '';
  const now = new Date();
  
  switch (period) {
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = `WHERE booking_date >= '${weekAgo.toISOString().split('T')[0]}'`;
      break;
    case 'month':
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = `WHERE booking_date >= '${monthAgo.toISOString().split('T')[0]}'`;
      break;
    case 'year':
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      dateFilter = `WHERE booking_date >= '${yearAgo.toISOString().split('T')[0]}'`;
      break;
  }
  
  const query = `
    SELECT 
      bb.bike_type,
      bb.bike_size,
      bb.bike_suspension,
      bb.has_trailer_hook,
      COUNT(DISTINCT b.id) as total_bookings,
      SUM(bb.bike_count) as total_units_rented,
      SUM(b.total_price * (bb.bike_count / (
        SELECT SUM(bike_count) FROM booking_bikes WHERE booking_id = b.id
      ))) as estimated_revenue,
      AVG(b.total_price * (bb.bike_count / (
        SELECT SUM(bike_count) FROM booking_bikes WHERE booking_id = b.id
      ))) as avg_revenue_per_booking,
      SUM(
        CASE 
          WHEN b.category = 'full-day' THEN 8 * bb.bike_count
          WHEN b.category = 'half-day' THEN 4 * bb.bike_count
          ELSE (CAST(substr(b.end_time, 1, 2) AS INTEGER) - CAST(substr(b.start_time, 1, 2) AS INTEGER)) * bb.bike_count
        END
      ) as total_hours
    FROM booking_bikes bb
    JOIN bookings b ON bb.booking_id = b.id
    ${dateFilter}
    AND b.status = 'confirmed'
    GROUP BY bb.bike_type, bb.bike_size, bb.bike_suspension, bb.has_trailer_hook
    ORDER BY estimated_revenue DESC
  `;
  
  db.all(query, (err, results) => {
    if (err) {
      addLog('error', 'Failed to get bike performance analytics', err.message);
      return res.status(500).json({ error: err.message });
    }
    
    addLog('info', `Bike performance analytics retrieved for period: ${period}`);
    res.json(results);
  });
});

app.get('/api/analytics/revenue-breakdown', (req, res) => {
  const { period = 'month' } = req.query;
  
  let dateFilter = '';
  const now = new Date();
  
  switch (period) {
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = `WHERE booking_date >= '${weekAgo.toISOString().split('T')[0]}'`;
      break;
    case 'month':
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = `WHERE booking_date >= '${monthAgo.toISOString().split('T')[0]}'`;
      break;
    case 'year':
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      dateFilter = `WHERE booking_date >= '${yearAgo.toISOString().split('T')[0]}'`;
      break;
  }
  
  const queries = {
    byCategory: `
      SELECT 
        category,
        COUNT(*) as bookings,
        SUM(total_price) as revenue,
        AVG(total_price) as avg_booking_value
      FROM bookings 
      ${dateFilter} AND status = 'confirmed'
      GROUP BY category
      ORDER BY revenue DESC
    `,
    byGuide: `
      SELECT 
        needs_guide,
        COUNT(*) as bookings,
        SUM(total_price) as revenue
      FROM bookings 
      ${dateFilter} AND status = 'confirmed'
      GROUP BY needs_guide
    `,
    fixedCosts: `
      SELECT 
        fc.*,
        CASE 
          WHEN fc.frequency = 'monthly' THEN fc.amount * 12
          WHEN fc.frequency = 'yearly' THEN fc.amount
          ELSE fc.amount
        END as annual_cost
      FROM fixed_costs fc 
      WHERE fc.is_active = 1
      ORDER BY annual_cost DESC
    `
  };
  
  const results = {};
  let completed = 0;
  
  Object.keys(queries).forEach(key => {
    db.all(queries[key], (err, rows) => {
      if (err) {
        addLog('error', `Failed to get ${key} analytics`, err.message);
        return res.status(500).json({ error: err.message });
      }
      
      results[key] = rows;
      completed++;
      
      if (completed === Object.keys(queries).length) {
        // Calculate net profit
        const totalRevenue = results.byCategory.reduce((sum, cat) => sum + cat.revenue, 0);
        const totalFixedCosts = results.fixedCosts.reduce((sum, cost) => sum + cost.annual_cost, 0);
        
        results.summary = {
          totalRevenue,
          totalFixedCosts,
          netProfit: totalRevenue - totalFixedCosts,
          profitMargin: totalRevenue > 0 ? ((totalRevenue - totalFixedCosts) / totalRevenue) * 100 : 0
        };
        
        addLog('info', `Revenue breakdown analytics retrieved for period: ${period}`);
        res.json(results);
      }
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

// Get database statistics
app.get('/api/database/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM bookings) as totalBookings,
        (SELECT COUNT(DISTINCT bike_type) FROM bookings) as totalBikeTypes,
        (SELECT COUNT(DISTINCT bike_number) FROM bookings) as totalBikes
    `).get();
    
    // Get database file size
    const fs = require('fs');
    let databaseSize = 0;
    try {
      const fileStats = fs.statSync(dbPath);
      databaseSize = fileStats.size;
    } catch (err) {
      console.log('Could not get database file size:', err.message);
    }
    
    res.json({
      ...stats,
      databaseSize,
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database stats error:', error);
    res.status(500).json({ error: 'Failed to get database statistics' });
  }
});

// Get performance metrics
app.get('/api/monitoring/metrics', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const avgResponseTime = requestCount > 0 ? Math.round(totalResponseTime / requestCount) : 0;
  const errorRate = requestCount > 0 ? errorCount / requestCount : 0;
  
  res.json({
    totalRequests: requestCount,
    avgResponseTime,
    errorRate,
    uptime
  });
});

// Get logs
app.get('/api/monitoring/logs', (req, res) => {
  res.json(logs);
});

// Export all data - COMPLETE BACKUP
app.get('/api/data/export', (req, res) => {
  try {
    addLog('info', 'Complete data export requested');
    
    // Export all tables
    const bookings = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
    const bookingBikes = db.prepare('SELECT * FROM booking_bikes').all();
    const bikes = db.prepare('SELECT * FROM bikes').all();
    const settings = db.prepare('SELECT * FROM settings').all();
    const serverConfig = db.prepare('SELECT * FROM server_config').all();
    
    // Get database schema for restoration
    const schema = {
      settings: db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='settings'").get(),
      bikes: db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='bikes'").get(),
      bookings: db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'").get(),
      booking_bikes: db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='booking_bikes'").get(),
      server_config: db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='server_config'").get()
    };
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '2.0',
      appVersion: '1.0.0',
      description: 'Complete Rabbi E-Bike system backup including all data and configuration',
      schema,
      data: {
        bookings,
        booking_bikes: bookingBikes,
        bikes,
        settings,
        server_config: serverConfig
      },
      stats: {
        totalBookings: bookings.length,
        totalBikes: bikes.length,
        totalSettings: settings.length,
        totalServerConfig: serverConfig.length,
        totalBookingBikes: bookingBikes.length
      }
    };
    
    addLog('info', `Complete backup exported: ${bookings.length} bookings, ${bikes.length} bike records, ${settings.length} settings, ${serverConfig.length} server configs`);
    res.json(exportData);
  } catch (error) {
    addLog('error', 'Failed to export complete data', error.message);
    res.status(500).json({ error: 'Failed to export complete data', details: error.message });
  }
});

// Import data - COMPLETE RESTORE
app.post('/api/data/import', (req, res) => {
  try {
    const importData = req.body;
    addLog('info', 'Complete data import/restore requested');
    
    // Validate backup format
    if (!importData || !importData.data) {
      return res.status(400).json({ error: 'Invalid backup data format' });
    }

    const { data, version, stats } = importData;
    
    // Check backup version compatibility
    if (version && parseFloat(version) < 2.0) {
      addLog('warn', `Importing older backup format version ${version}`);
    }

    // Start transaction-like operations
    db.serialize(() => {
      try {
        // Clear all existing data
        addLog('info', 'Clearing existing data...');
        
        // Delete in correct order to respect foreign key constraints
        db.run('DELETE FROM booking_bikes');
        db.run('DELETE FROM bookings');
        if (data.bikes) db.run('DELETE FROM bikes WHERE id > 0'); // Keep auto-increment
        if (data.settings) db.run('DELETE FROM settings WHERE id > 1'); // Keep default settings
        
        // Import bookings
        if (data.bookings && data.bookings.length > 0) {
          addLog('info', `Importing ${data.bookings.length} bookings...`);
          const bookingStmt = db.prepare(`
            INSERT INTO bookings (id, customer_name, phone, email, start_time, end_time, booking_date, category, needs_guide, status, total_price, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          for (const booking of data.bookings) {
            bookingStmt.run([
              booking.id, 
              booking.customer_name || booking.customerName, 
              booking.phone, 
              booking.email,
              booking.start_time || booking.startTime, 
              booking.end_time || booking.endTime,
              booking.booking_date || (booking.date ? new Date(booking.date).toISOString().split('T')[0] : null),
              booking.category, 
              booking.needs_guide || booking.needsGuide || 0,
              booking.status, 
              booking.total_price || booking.totalPrice || 0,
              booking.created_at || new Date().toISOString(), 
              booking.updated_at || new Date().toISOString()
            ]);
          }
          bookingStmt.finalize();
        }

        // Import booking_bikes relationships
        if (data.booking_bikes && data.booking_bikes.length > 0) {
          addLog('info', `Importing ${data.booking_bikes.length} booking-bike relationships...`);
          const bookingBikeStmt = db.prepare(`
            INSERT INTO booking_bikes (booking_id, bike_type, bike_size, bike_suspension, bike_count, has_trailer_hook)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          
          for (const bb of data.booking_bikes) {
            bookingBikeStmt.run([
              bb.booking_id,
              bb.bike_type,
              bb.bike_size,
              bb.bike_suspension,
              bb.bike_count || 1,
              bb.has_trailer_hook || 0
            ]);
          }
          bookingBikeStmt.finalize();
        }

        // Import bikes
        if (data.bikes && data.bikes.length > 0) {
          addLog('info', `Importing ${data.bikes.length} bike records...`);
          const bikeStmt = db.prepare(`
            INSERT INTO bikes (type, size, suspension, count, has_trailer_hook, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          
          for (const bike of data.bikes) {
            bikeStmt.run([
              bike.type,
              bike.size,
              bike.suspension,
              bike.count || 1,
              bike.has_trailer_hook || 0,
              bike.created_at || new Date().toISOString(),
              bike.updated_at || new Date().toISOString()
            ]);
          }
          bikeStmt.finalize();
        }

        // Import settings
        if (data.settings && data.settings.length > 0) {
          addLog('info', `Importing ${data.settings.length} settings...`);
          const settingsStmt = db.prepare(`
            INSERT OR REPLACE INTO settings 
            (id, shop_name, phone, email, opening_time, closing_time, pricing_hourly, pricing_half_day, pricing_full_day, pricing_guide_hourly, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          for (const setting of data.settings) {
            settingsStmt.run([
              setting.id || 1,
              setting.shop_name,
              setting.phone,
              setting.email,
              setting.opening_time,
              setting.closing_time,
              setting.pricing_hourly,
              setting.pricing_half_day,
              setting.pricing_full_day,
              setting.pricing_guide_hourly,
              setting.created_at || new Date().toISOString(),
              setting.updated_at || new Date().toISOString()
            ]);
          }
          settingsStmt.finalize();
        }

        // Import server config
        if (data.server_config && data.server_config.length > 0) {
          addLog('info', `Importing ${data.server_config.length} server configurations...`);
          const config = data.server_config[0];
          const configStmt = db.prepare(`
            INSERT OR REPLACE INTO server_config 
            (id, server_port, auto_backup, backup_interval_hours, max_backup_files, debug_mode, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          
          configStmt.run([
            1, // Always use ID 1 for main config
            config.server_port || 3001,
            config.auto_backup !== undefined ? config.auto_backup : 1,
            config.backup_interval_hours || 24,
            config.max_backup_files || 30,
            config.debug_mode !== undefined ? config.debug_mode : 0,
            new Date().toISOString()
          ]);
          configStmt.finalize();
        }

        // Log successful import
        const summary = {
          bookings: data.bookings?.length || 0,
          booking_bikes: data.booking_bikes?.length || 0,
          bikes: data.bikes?.length || 0,
          settings: data.settings?.length || 0,
          server_config: data.server_config?.length || 0
        };

        addLog('info', `Complete restore successful: ${summary.bookings} bookings, ${summary.bikes} bike records, ${summary.settings} settings, ${summary.server_config} server configs`);
        
        res.json({ 
          success: true, 
          message: 'Complete system restore successful',
          imported: summary,
          backupVersion: version,
          restoreDate: new Date().toISOString()
        });

      } catch (innerError) {
        addLog('error', 'Transaction failed during restore', innerError.message);
        res.status(500).json({ 
          error: 'Failed to restore data', 
          details: innerError.message 
        });
      }
    });

  } catch (error) {
    addLog('error', 'Failed to import/restore data', error.message);
    res.status(500).json({ 
      error: 'Failed to restore system from backup', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Rabbi E-Bike Server running on port ${PORT}`);
  console.log(`📂 Database: ${dbPath}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
});