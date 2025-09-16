const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const logger = require('./logger');
const { DatabaseOptimizer, MaintenanceScheduler } = require('./database-optimizer');
const { optimizedMiddleware, scheduleMemoryCleanup, LightweightMonitor } = require('./optimizations');

const app = express();
const PORT = process.env.PORT || 9273;

// Performance monitoring variables
let requestCount = 0;
let errorCount = 0;
let totalResponseTime = 0;
const startTime = Date.now();

// Initialize lightweight monitoring for shop performance
const shopMonitor = new LightweightMonitor();

// Legacy log compatibility - redirect to new logger
const addLog = (level, message, details = null) => {
  const logMethod = level.toLowerCase();
  if (typeof logger[logMethod] === 'function') {
    logger[logMethod]('LEGACY', message, details || {});
  } else {
    logger.info('LEGACY', `[${level.toUpperCase()}] ${message}`, details || {});
  }
};

// Enhanced error handling helper
const handleDatabaseError = (res, err, operation = 'database operation', statusCode = 500) => {
  const errorId = Date.now().toString();
  addLog('error', `Database error during ${operation}`, { errorId, error: err.message });
  
  // Don't expose internal database errors to client
  const clientMessage = statusCode === 500 ? 'Internal server error' : err.message;
  return res.status(statusCode).json({ 
    error: clientMessage,
    errorId: errorId
  });
};

// Input validation helper
const validateRequired = (fields, data) => {
  const missing = [];
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }
  return missing;
};

// Enhanced data validation helpers
const validateEmail = (email) => {
  // Allow null, undefined, or empty strings (optional field)
  if (!email || typeof email !== 'string' || email.trim() === '') return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const validatePhone = (phone) => {
  // Allow null, undefined, or empty strings (optional field)
  if (!phone || typeof phone !== 'string' || phone.trim() === '') return true;
  // Clean phone number for validation
  const cleanPhone = phone.trim().replace(/\s/g, '');
  // More flexible phone number validation - allow various formats
  const phoneRegex = /^[\+]?[0-9\-\(\)\s]{6,20}$/;
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 6;
};

const validateTimeFormat = (time) => {
  if (!time) return false;
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const validateBikeType = (type) => {
  const validTypes = ['bambino', 'adulto', 'carrello-porta-bimbi', 'trailer'];
  return validTypes.includes(type);
};

const validateBikeSize = (size, bikeType) => {
  // Trailers don't require size
  if (bikeType === 'trailer' || bikeType === 'carrello-porta-bimbi') {
    return !size || size === null || size === undefined; // Should be empty for trailers
  }
  const validSizes = ['S', 'M', 'L', 'XL'];
  return validSizes.includes(size);
};

const validateBikeSuspension = (suspension, bikeType) => {
  // Trailers don't require suspension
  if (bikeType === 'trailer' || bikeType === 'carrello-porta-bimbi') {
    return !suspension || suspension === null || suspension === undefined; // Should be empty for trailers
  }
  const validSuspensions = ['full-suspension', 'front-only'];
  return validSuspensions.includes(suspension);
};

const validateBookingStatus = (status) => {
  const validStatuses = ['confirmed', 'pending', 'cancelled'];
  return validStatuses.includes(status);
};

const validateBookingCategory = (category) => {
  const validCategories = ['hourly', 'half-day', 'full-day'];
  return validCategories.includes(category);
};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Add optimized middleware for shop performance
app.use(optimizedMiddleware);

// Enhanced performance tracking middleware with detailed logging
app.use((req, res, next) => {
  const start = Date.now();
  requestCount++;
  const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
  
  // Log incoming request
  addLog('debug', `Incoming ${req.method} ${req.path}`, {
    requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    query: req.query,
    bodySize: JSON.stringify(req.body).length
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    totalResponseTime += duration;
    
    // Update shop monitoring
    shopMonitor.logRequest();
    if (res.statusCode >= 400) {
      shopMonitor.logError();
      errorCount++;
    }
    
    // Log response details
    const logLevel = res.statusCode >= 400 ? 'warn' : 'debug';
    addLog(logLevel, `${req.method} ${req.path} - ${res.statusCode}`, {
      requestId,
      duration: `${duration}ms`,
      statusCode: res.statusCode
    });
    
    // Use new logger for request logging
    logger.logRequest(req, res, start);
    
    // Enhanced performance logging for slow requests
    if (duration > 1000) {
      logger.warn('PERFORMANCE', 'Slow request detected', {
        requestId,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        queryParams: Object.keys(req.query).length,
        bodySize: JSON.stringify(req.body).length
      });
      
      addLog('warn', 'Slow request detected', {
        requestId,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`
      });
    }
    
    // Track error responses with enhanced logging
    if (res.statusCode >= 500) {
      logger.error('HTTP_ERROR', `Server error response`, {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      });
    }
  });
  
  next();
});

// Database setup with monitoring
const dbPath = path.join(__dirname, 'rabbi_ebike.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    addLog('error', 'Failed to open database', err.message);
    logger.error('DATABASE', 'Failed to connect to SQLite database', {
      dbPath,
      error: err.message,
      errorCode: err.code,
      errno: err.errno,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  } else {
    addLog('info', `Database connected successfully: ${dbPath}`);
    logger.info('DATABASE', 'Successfully connected to SQLite database', {
      dbPath,
      filename: path.basename(dbPath),
      mode: 'READWRITE',
      timestamp: new Date().toISOString()
    });
    
    // Log database initialization
    logger.logDatabase('connected', {
      path: dbPath,
      size: (() => {
        try {
          const fs = require('fs');
          return fs.statSync(dbPath).size;
        } catch (e) {
          return 0;
        }
      })()
    });
    
    // Initialize database optimizer for shop performance
    initializeDatabaseOptimizer();
  }
});

// Database query monitoring wrapper - DISABLED due to deadlock
// const originalRun = db.run;
// const originalGet = db.get;
// const originalAll = db.all;

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
    pricing_trailer_hourly REAL DEFAULT 8,
    pricing_trailer_half_day REAL DEFAULT 20,
    pricing_trailer_full_day REAL DEFAULT 35,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Bikes table (legacy - for compatibility)
  db.run(`CREATE TABLE IF NOT EXISTS bikes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    size TEXT NOT NULL,
    suspension TEXT NOT NULL,
    count INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Individual bikes table (new - for garage management)
  db.run(`CREATE TABLE IF NOT EXISTS individual_bikes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT,
    type TEXT NOT NULL,
    size TEXT,
    suspension TEXT,
    has_trailer_hook BOOLEAN DEFAULT 0,
    description TEXT,
    min_height INTEGER,
    max_height INTEGER,
    purchase_date DATE,
    purchase_price REAL,
    is_active BOOLEAN DEFAULT 1,
    maintenance_history TEXT DEFAULT '[]',
    total_maintenance_cost REAL DEFAULT 0,
    last_maintenance_date DATE,
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
    server_port INTEGER DEFAULT 7421,
    auto_backup BOOLEAN DEFAULT 1,
    backup_interval_hours INTEGER DEFAULT 24,
    max_backup_files INTEGER DEFAULT 30,
    debug_mode BOOLEAN DEFAULT 0,
    notification_email TEXT,
    sms_notifications BOOLEAN DEFAULT 0,
    maintenance_reminder_days INTEGER DEFAULT 30,
    low_battery_alert BOOLEAN DEFAULT 1,
    auto_pricing_updates BOOLEAN DEFAULT 0,
    peak_hour_multiplier REAL DEFAULT 1.5,
    seasonal_discount REAL DEFAULT 0,
    minimum_booking_hours INTEGER DEFAULT 1,
    max_booking_days INTEGER DEFAULT 7,
    weather_integration BOOLEAN DEFAULT 0,
    gps_tracking BOOLEAN DEFAULT 0,
    insurance_required BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add missing columns to existing server_config table for backward compatibility
  const addColumnIfNotExists = (tableName, columnName, columnDefinition) => {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`, (err) => {
      // Ignore duplicate column errors - they're expected
      if (err && !err.message.includes('duplicate column name')) {
        console.warn(`Error adding column ${columnName}: ${err.message}`);
      }
    });
  };

  // Add all new columns if they don't exist - errors are handled in callback
  addColumnIfNotExists('server_config', 'notification_email', 'TEXT');
  addColumnIfNotExists('server_config', 'sms_notifications', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('server_config', 'maintenance_reminder_days', 'INTEGER DEFAULT 30');
  addColumnIfNotExists('server_config', 'low_battery_alert', 'BOOLEAN DEFAULT 1');
  addColumnIfNotExists('server_config', 'auto_pricing_updates', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('server_config', 'peak_hour_multiplier', 'REAL DEFAULT 1.5');
  addColumnIfNotExists('server_config', 'seasonal_discount', 'REAL DEFAULT 0');
  addColumnIfNotExists('server_config', 'minimum_booking_hours', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('server_config', 'max_booking_days', 'INTEGER DEFAULT 7');
  addColumnIfNotExists('server_config', 'weather_integration', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('server_config', 'gps_tracking', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('server_config', 'insurance_required', 'BOOLEAN DEFAULT 0');

  // Add check constraints for data integrity (SQLite limitations, we'll do this programmatically)
  // This will be enforced in the validation helpers we added

  // Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_booking_bikes_booking_id ON booking_bikes(booking_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_booking_bikes_type ON booking_bikes(bike_type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_fixed_costs_category ON fixed_costs(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_fixed_costs_active ON fixed_costs(is_active)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_analytics_date ON bike_usage_analytics(usage_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_analytics(date)`);

  // Migrate existing settings table to add trailer pricing columns if they don't exist
  db.all("PRAGMA table_info(settings)", (err, columns) => {
    if (!err && columns) {
      const hasTrailerHourly = columns.some(col => col.name === 'pricing_trailer_hourly');
      if (!hasTrailerHourly) {
        db.run(`ALTER TABLE settings ADD COLUMN pricing_trailer_hourly REAL DEFAULT 8`);
        db.run(`ALTER TABLE settings ADD COLUMN pricing_trailer_half_day REAL DEFAULT 20`);
        db.run(`ALTER TABLE settings ADD COLUMN pricing_trailer_full_day REAL DEFAULT 35`);
        addLog('info', 'Added trailer pricing columns to settings table');
      }
    }
  });

  // Insert default settings if none exist
  db.get("SELECT COUNT(*) as count FROM settings", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO settings (
        id, shop_name, phone, email, opening_time, closing_time,
        pricing_hourly, pricing_half_day, pricing_full_day, pricing_guide_hourly,
        pricing_trailer_hourly, pricing_trailer_half_day, pricing_trailer_full_day
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        "Rabbi E-Bike Rent Go & Fun",
        "+39 123 456 7890",
        "info@ecoride.it",
        "09:00",
        "19:00",
        15,
        45,
        70,
        25,
        8,
        20,
        35
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

  // Add database triggers for automatic updated_at timestamps
  db.run(`CREATE TRIGGER IF NOT EXISTS update_settings_timestamp 
    AFTER UPDATE ON settings 
    FOR EACH ROW 
    BEGIN 
      UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END`);

  db.run(`CREATE TRIGGER IF NOT EXISTS update_bookings_timestamp 
    AFTER UPDATE ON bookings 
    FOR EACH ROW 
    BEGIN 
      UPDATE bookings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END`);

  db.run(`CREATE TRIGGER IF NOT EXISTS update_fixed_costs_timestamp 
    AFTER UPDATE ON fixed_costs 
    FOR EACH ROW 
    BEGIN 
      UPDATE fixed_costs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END`);

  db.run(`CREATE TRIGGER IF NOT EXISTS update_individual_bikes_timestamp 
    AFTER UPDATE ON individual_bikes 
    FOR EACH ROW 
    BEGIN 
      UPDATE individual_bikes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END`);

  // Fix inconsistent column names in booking_bikes table
  db.all("PRAGMA table_info(booking_bikes)", (err, columns) => {
    if (!err && columns) {
      const hasCountColumn = columns.some(col => col.name === 'count');
      const hasBikeCountColumn = columns.some(col => col.name === 'bike_count');
      
      // If we have 'count' but not 'bike_count', rename it
      if (hasCountColumn && !hasBikeCountColumn) {
        db.run(`ALTER TABLE booking_bikes RENAME COLUMN count TO bike_count`);
        addLog('info', 'Renamed count column to bike_count in booking_bikes table');
      }
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
  logger.info('HEALTH_CHECK', 'Health check requested', {
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  logger.info('SETTINGS', 'Settings retrieval requested', {
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });
  
  db.get("SELECT * FROM settings WHERE id = 1", (err, settings) => {
    if (err) {
      logger.error('SETTINGS', 'Failed to fetch settings from database', {
        error: err.message,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress
      });
    } else {
      logger.debug('SETTINGS', 'Settings query completed successfully', { 
        hasSettings: !!settings 
      });
    }
    
    if (err) {
      return handleDatabaseError(res, err, 'fetching settings');
    }
    
    if (!settings) {
      return res.status(404).json({ error: "Settings not found" });
    }
    
    // Now get bikes data since settings query works
    db.all("SELECT * FROM bikes ORDER BY type, size, suspension", (err, bikes) => {
      if (err) {
        return handleDatabaseError(res, err, 'fetching bikes');
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
          guideHourly: settings.pricing_guide_hourly,
          trailerHourly: settings.pricing_trailer_hourly || 8,
          trailerHalfDay: settings.pricing_trailer_half_day || 20,
          trailerFullDay: settings.pricing_trailer_full_day || 35
        },
        bikes: bikes.map(bike => ({
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
  const { shopName, phone, email, openingTime, closingTime, pricing, bikes } = req.body;
  
  db.run(`UPDATE settings SET 
    shop_name = ?, phone = ?, email = ?, opening_time = ?, closing_time = ?,
    pricing_hourly = ?, pricing_half_day = ?, pricing_full_day = ?, pricing_guide_hourly = ?,
    pricing_trailer_hourly = ?, pricing_trailer_half_day = ?, pricing_trailer_full_day = ?,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = 1`, [
    shopName, phone, email, openingTime, closingTime,
    pricing.hourly, pricing.halfDay, pricing.fullDay, pricing.guideHourly,
    pricing.trailerHourly || 8, pricing.trailerHalfDay || 20, pricing.trailerFullDay || 35
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
      bikes.forEach(bike => {
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
  const { name, description, amount, category, frequency, start_date } = req.body;
  
  db.run(`INSERT INTO fixed_costs (name, description, amount, category, frequency, start_date) 
          VALUES (?, ?, ?, ?, ?, ?)`, 
    [name, description || null, amount, category || 'general', frequency || 'monthly', start_date || new Date().toISOString().split('T')[0]], 
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
  const updates = req.body;
  
  const allowedFields = ['name', 'description', 'amount', 'category', 'frequency', 'start_date', 'is_active'];
  const setClause = [];
  const values = [];
  
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      setClause.push(`${key} = ?`);
      values.push(key === 'is_active' ? (updates[key] ? 1 : 0) : updates[key]);
    }
  });
  
  if (setClause.length === 0) {
    return res.status(400).json({ error: 'Nessun campo valido da aggiornare' });
  }
  
  setClause.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  db.run(`UPDATE fixed_costs SET ${setClause.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Costo fisso non trovato' });
    }
    res.json({ message: 'Costo fisso aggiornato con successo' });
  });
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

// Bookings endpoints with optimized query
app.get('/api/bookings', (req, res) => {
  // Use separate queries for better performance and reliability
  db.all(`SELECT * FROM bookings ORDER BY booking_date DESC, start_time ASC`, (err, bookings) => {
    if (err) {
      return handleDatabaseError(res, err, 'fetch bookings');
    }
    
    if (bookings.length === 0) {
      return res.json([]);
    }
    
    // Get all bike details in one query
    const bookingIds = bookings.map(b => `'${b.id}'`).join(',');
    db.all(`SELECT * FROM booking_bikes WHERE booking_id IN (${bookingIds})`, (err, bikeDetails) => {
      if (err) {
        return handleDatabaseError(res, err, 'fetch booking bikes');
      }
      
      // Group bike details by booking_id
      const bikesByBooking = bikeDetails.reduce((acc, bike) => {
        if (!acc[bike.booking_id]) {
          acc[bike.booking_id] = [];
        }
        acc[bike.booking_id].push({
          type: bike.bike_type,
          size: bike.bike_size,
          suspension: bike.bike_suspension,
          count: bike.bike_count,
          hasTrailerHook: bike.has_trailer_hook
        });
        return acc;
      }, {});
      
      // Map bookings with their bike details
      const result = bookings.map(booking => ({
        id: booking.id,
        customerName: booking.customer_name,
        phone: booking.phone,
        email: booking.email,
        startTime: booking.start_time,
        endTime: booking.end_time,
        date: new Date(booking.booking_date),
        category: booking.category,
        needsGuide: booking.needs_guide,
        status: booking.status,
        totalPrice: booking.total_price,
        bikeDetails: bikesByBooking[booking.id] || []
      }));
      
      addLog('info', `Retrieved ${result.length} bookings with bike details`);
      res.json(result);
    });
  });
});

app.post('/api/bookings', (req, res) => {
  const { customerName, phone, email, startTime, endTime, date, category, needsGuide, status, totalPrice, bikeDetails } = req.body;
  
  // Generate unique ID for the booking
  const id = Date.now().toString();
  
  // Log booking creation attempt
  logger.info('BOOKING_CREATE', 'New booking creation request received', {
    bookingId: id,
    customerName,
    phone,
    email,
    startTime,
    endTime,
    date,
    category,
    needsGuide,
    totalPrice,
    bikeDetailsCount: bikeDetails ? bikeDetails.length : 0,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });
  
  // Validate required fields (phone and email are optional)
  const missing = validateRequired(['customerName', 'startTime', 'endTime', 'date', 'category'], req.body);
  if (missing.length > 0) {
    logger.warn('BOOKING_CREATE', 'Booking creation failed - missing fields', {
      bookingId: id,
      customerName,
      missingFields: missing,
      providedFields: Object.keys(req.body)
    });
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  // Sanitize and validate email format
  const sanitizedEmail = email && typeof email === 'string' ? email.trim() : null;
  if (sanitizedEmail && !validateEmail(sanitizedEmail)) {
    logger.warn('BOOKING_CREATE', 'Booking creation failed - invalid email format', {
      bookingId: id,
      customerName,
      email: sanitizedEmail,
      phone
    });
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Sanitize and validate phone format
  const sanitizedPhone = phone && typeof phone === 'string' ? phone.trim() : null;
  if (sanitizedPhone && !validatePhone(sanitizedPhone)) {
    logger.warn('BOOKING_CREATE', 'Booking creation failed - invalid phone format', {
      bookingId: id,
      customerName,
      phone: sanitizedPhone,
      email: sanitizedEmail
    });
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  // Validate time formats
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return res.status(400).json({ error: 'Invalid time format (use HH:MM)' });
  }

  // Validate booking category
  if (!validateBookingCategory(category)) {
    return res.status(400).json({ error: 'Invalid booking category' });
  }

  // Validate booking status
  if (status && !validateBookingStatus(status)) {
    return res.status(400).json({ error: 'Invalid booking status' });
  }

  // Validate date format
  let bookingDate;
  try {
    bookingDate = new Date(date).toISOString().split('T')[0];
    if (bookingDate === 'Invalid Date' || isNaN(new Date(date).getTime())) {
      throw new Error('Invalid date format');
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  // Validate price
  const parsedPrice = parseFloat(totalPrice);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: 'Invalid total price' });
  }

  // Validate bike details
  if (!bikeDetails || !Array.isArray(bikeDetails) || bikeDetails.length === 0) {
    return res.status(400).json({ error: 'At least one bike must be selected' });
  }

  // Validate each bike detail
  console.log('[DEBUG] Validating bikeDetails:', JSON.stringify(bikeDetails, null, 2));
  for (const bike of bikeDetails) {
    console.log('[DEBUG] Validating bike:', JSON.stringify(bike, null, 2));
    if (!validateBikeType(bike.type)) {
      console.log('[ERROR] Invalid bike type:', bike.type);
      return res.status(400).json({ error: `Invalid bike type: ${bike.type}` });
    }
    if (!validateBikeSize(bike.size, bike.type)) {
      console.log('[ERROR] Invalid bike size:', bike.size, 'for type:', bike.type);
      return res.status(400).json({ error: `Invalid bike size: ${bike.size} for type: ${bike.type}` });
    }
    if (!validateBikeSuspension(bike.suspension, bike.type)) {
      console.log('[ERROR] Invalid bike suspension:', bike.suspension, 'for type:', bike.type);
      return res.status(400).json({ error: `Invalid bike suspension: ${bike.suspension} for type: ${bike.type}` });
    }
    if (!Number.isInteger(bike.count) || bike.count <= 0) {
      console.log('[ERROR] Invalid bike count:', bike.count);
      return res.status(400).json({ error: 'Bike count must be a positive integer' });
    }
  }
  
  // Use transaction for booking creation
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    // Insert booking
    db.run(`INSERT INTO bookings (
      id, customer_name, phone, email, start_time, end_time, booking_date, 
      category, needs_guide, status, total_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      id, customerName.trim(), sanitizedPhone || null, sanitizedEmail || null, startTime, endTime, 
      bookingDate, category, needsGuide, status, parsedPrice
    ], function(err) {
      if (err) {
        db.run("ROLLBACK");
        return handleDatabaseError(res, err, 'booking creation');
      }
      
      // Insert bike details
      let bikeInsertError = false;
      const stmt = db.prepare("INSERT INTO booking_bikes (booking_id, bike_type, bike_size, bike_suspension, bike_count, has_trailer_hook) VALUES (?, ?, ?, ?, ?, ?)");
      
      for (const bike of bikeDetails) {
        stmt.run([id, bike.type, bike.size, bike.suspension, bike.count, bike.hasTrailerHook || false], function(err) {
          if (err) {
            bikeInsertError = true;
            addLog('error', 'Failed to insert bike details', { bookingId: id, error: err.message });
          }
        });
      }
      
      stmt.finalize(() => {
        if (bikeInsertError) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: 'Failed to create booking with bike details' });
        } else {
          db.run("COMMIT");
          // Log successful booking creation with detailed information
          logger.info('BOOKING_CREATE', 'New booking created successfully with transaction', {
            bookingId: id,
            customerName,
            phone,
            email,
            startTime,
            endTime,
            date,
            category,
            needsGuide,
            status: status || 'confirmed',
            totalPrice,
            bikeDetails,
            bikeCount: bikeDetails ? bikeDetails.reduce((total, bike) => total + bike.count, 0) : 0,
            transactionCompleted: true
          });
          
          // Use the new logger's specific booking method
          logger.logBooking('created', {
            id,
            customerName,
            totalPrice,
            date
          });
          
          addLog('info', 'New booking created successfully with transaction', { bookingId: id, customer: customerName });
          res.json({ success: true, id });
        }
      });
    });
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
      
      const stmt = db.prepare("INSERT INTO booking_bikes (booking_id, bike_type, bike_size, bike_suspension, bike_count) VALUES (?, ?, ?, ?, ?)");
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
        (SELECT COUNT(DISTINCT bb.bike_type) FROM booking_bikes bb) as totalBikeTypes,
        (SELECT SUM(bb.bike_count) FROM booking_bikes bb) as totalBikes
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
  const errorRate = requestCount > 0 ? (errorCount / requestCount * 100).toFixed(2) : 0;
  
  // Get database stats
  const dbStats = {
    path: dbPath,
    connected: true // We're responding so DB is connected
  };
  
  // Get memory usage
  const memoryUsage = process.memoryUsage();
  
  // Calculate recent activity (last 5 minutes)
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  // For now, return empty logs array - in a full implementation this would come from the logger
  const logs = [];
  const recentLogs = logs.filter(log => new Date(log.timestamp).getTime() > fiveMinutesAgo);
  const recentErrors = recentLogs.filter(log => log.level === 'error').length;
  const recentWarnings = recentLogs.filter(log => log.level === 'warn').length;
  
  res.json({
    // Basic metrics
    totalRequests: requestCount,
    avgResponseTime: `${avgResponseTime}ms`,
    errorRate: `${errorRate}%`,
    totalErrors: errorCount,
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
    
    // System metrics
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    
    // Database metrics
    database: dbStats,
    
    // Recent activity (last 5 minutes)
    recent: {
      errors: recentErrors,
      warnings: recentWarnings,
      totalLogs: recentLogs.length
    },
    
    // Timestamps
    startTime: new Date(startTime).toISOString(),
    currentTime: new Date().toISOString()
  });
});

// Get logs
app.get('/api/monitoring/logs', (req, res) => {
  const logs = []; // In una implementazione completa, questa verrebbe dal logger
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
    addLog('warn', 'Complete data import/restore requested - this will replace all existing data');
    
    // Validate backup format
    if (!importData || !importData.data) {
      return res.status(400).json({ error: 'Invalid backup data format' });
    }

    const { data, version, stats } = importData;
    
    // Create automatic backup before restore for safety
    try {
      const preRestoreBackup = {
        exportDate: new Date().toISOString(),
        version: '2.0',
        description: 'Automatic backup before restore operation',
        data: {
          bookings: db.prepare('SELECT * FROM bookings').all(),
          booking_bikes: db.prepare('SELECT * FROM booking_bikes').all(),
          bikes: db.prepare('SELECT * FROM bikes').all(),
          settings: db.prepare('SELECT * FROM settings').all(),
          server_config: db.prepare('SELECT * FROM server_config').all()
        }
      };
      
      const fs = require('fs');
      const backupPath = path.join(__dirname, 'backups', `pre-restore-${Date.now()}.json`);
      
      // Ensure backups directory exists
      if (!fs.existsSync(path.join(__dirname, 'backups'))) {
        fs.mkdirSync(path.join(__dirname, 'backups'), { recursive: true });
      }
      
      fs.writeFileSync(backupPath, JSON.stringify(preRestoreBackup, null, 2));
      addLog('info', `Pre-restore backup created: ${backupPath}`);
    } catch (backupErr) {
      addLog('error', 'Failed to create pre-restore backup', backupErr.message);
      return res.status(500).json({ error: 'Failed to create safety backup before restore' });
    }
    
    // Check backup version compatibility
    if (version && parseFloat(version) < 2.0) {
      addLog('warn', `Importing older backup format version ${version}`);
    }

    // Validate data structure before proceeding
    const validationErrors = [];
    
    if (data.bookings && !Array.isArray(data.bookings)) {
      validationErrors.push('Bookings data must be an array');
    }
    
    if (data.booking_bikes && !Array.isArray(data.booking_bikes)) {
      validationErrors.push('Booking bikes data must be an array');
    }
    
    if (data.settings && !Array.isArray(data.settings)) {
      validationErrors.push('Settings data must be an array');
    }
    
    if (validationErrors.length > 0) {
      addLog('error', 'Import data validation failed', validationErrors);
      return res.status(400).json({ error: 'Invalid data structure', details: validationErrors });
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
            config.server_port || 7421,
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

// Reset application to initial state - COMPLETE RESET
app.post('/api/data/reset', (req, res) => {
  try {
    addLog('warn', 'Complete application reset requested - this will delete ALL data');
    logger.warn('SYSTEM', 'Complete application reset initiated', {
      timestamp: new Date().toISOString(),
      requestOrigin: req.ip
    });
    
    // Create automatic backup before reset for safety
    try {
      const preResetBackup = {
        exportDate: new Date().toISOString(),
        version: '2.0',
        description: 'Automatic backup before complete reset operation',
        data: {
          bookings: db.prepare('SELECT * FROM bookings').all(),
          booking_bikes: db.prepare('SELECT * FROM booking_bikes').all(),
          bikes: db.prepare('SELECT * FROM bikes').all(),
          settings: db.prepare('SELECT * FROM settings').all(),
          server_config: db.prepare('SELECT * FROM server_config').all(),
          individual_bikes: db.prepare('SELECT * FROM individual_bikes').all(),
          fixed_costs: db.prepare('SELECT * FROM fixed_costs').all(),
          bike_usage_analytics: db.prepare('SELECT * FROM bike_usage_analytics').all(),
          revenue_analytics: db.prepare('SELECT * FROM revenue_analytics').all()
        }
      };
      
      const fs = require('fs');
      const backupPath = path.join(__dirname, 'backups', `pre-reset-${Date.now()}.json`);
      
      // Ensure backups directory exists
      if (!fs.existsSync(path.join(__dirname, 'backups'))) {
        fs.mkdirSync(path.join(__dirname, 'backups'), { recursive: true });
      }
      
      fs.writeFileSync(backupPath, JSON.stringify(preResetBackup, null, 2));
      addLog('info', `Pre-reset backup created: ${backupPath}`);
      logger.info('BACKUP', 'Pre-reset backup created', { backupPath });
    } catch (backupErr) {
      addLog('error', 'Failed to create pre-reset backup', backupErr.message);
      logger.error('BACKUP', 'Failed to create pre-reset backup', { error: backupErr.message });
      return res.status(500).json({ error: 'Failed to create safety backup before reset' });
    }

    // Begin transaction for complete reset
    db.serialize(() => {
      try {
        addLog('info', 'Starting complete database reset...');
        
        // Clear all data tables
        const clearTables = [
          'DELETE FROM booking_bikes',
          'DELETE FROM bookings', 
          'DELETE FROM individual_bikes',
          'DELETE FROM fixed_costs',
          'DELETE FROM bike_usage_analytics',
          'DELETE FROM revenue_analytics'
        ];
        
        clearTables.forEach(sql => {
          const result = db.prepare(sql).run();
          addLog('info', `Cleared table: ${sql.split(' ')[2]} (${result.changes} rows deleted)`);
        });
        
        // Reset settings to default values
        const defaultSettings = {
          shop_name: 'Rabbi E-Bike',
          phone: '+39 000 000 0000',
          email: 'info@rabbiebikerentals.com',
          opening_time: '09:00',
          closing_time: '18:00',
          pricing_hourly: 15,
          pricing_half_day: 40,
          pricing_full_day: 70,
          pricing_guide_hourly: 25,
          pricing_trailer_hourly: 8,
          pricing_trailer_half_day: 20,
          pricing_trailer_full_day: 35
        };
        
        // Reset settings
        const settingsStmt = db.prepare(`
          INSERT OR REPLACE INTO settings 
          (id, shop_name, phone, email, opening_time, closing_time, 
           pricing_hourly, pricing_half_day, pricing_full_day, pricing_guide_hourly,
           pricing_trailer_hourly, pricing_trailer_half_day, pricing_trailer_full_day,
           created_at, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        settingsStmt.run([
          defaultSettings.shop_name,
          defaultSettings.phone,
          defaultSettings.email,
          defaultSettings.opening_time,
          defaultSettings.closing_time,
          defaultSettings.pricing_hourly,
          defaultSettings.pricing_half_day,
          defaultSettings.pricing_full_day,
          defaultSettings.pricing_guide_hourly,
          defaultSettings.pricing_trailer_hourly,
          defaultSettings.pricing_trailer_half_day,
          defaultSettings.pricing_trailer_full_day,
          new Date().toISOString(),
          new Date().toISOString()
        ]);
        settingsStmt.finalize();
        
        // Reset bikes to basic inventory
        const defaultBikes = [
          { type: 'adulto', size: 'S', suspension: 'front-only', count: 3 },
          { type: 'adulto', size: 'M', suspension: 'front-only', count: 5 },
          { type: 'adulto', size: 'L', suspension: 'front-only', count: 4 },
          { type: 'adulto', size: 'XL', suspension: 'front-only', count: 2 },
          { type: 'adulto', size: 'M', suspension: 'full-suspension', count: 2 },
          { type: 'adulto', size: 'L', suspension: 'full-suspension', count: 2 },
          { type: 'bambino', size: 'S', suspension: 'front-only', count: 4 },
          { type: 'bambino', size: 'M', suspension: 'front-only', count: 3 },
          { type: 'carrello-porta-bimbi', size: '', suspension: '', count: 2 },
          { type: 'trailer', size: '', suspension: '', count: 3 }
        ];
        
        const bikeStmt = db.prepare(`
          INSERT OR REPLACE INTO bikes 
          (id, type, size, suspension, count)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        defaultBikes.forEach((bike, index) => {
          bikeStmt.run([
            index + 1,
            bike.type,
            bike.size,
            bike.suspension,
            bike.count
          ]);
        });
        bikeStmt.finalize();
        
        // Reset server config to defaults
        const serverConfigStmt = db.prepare(`
          INSERT OR REPLACE INTO server_config 
          (id, server_port, auto_backup, backup_interval_hours, max_backup_files, debug_mode, updated_at)
          VALUES (1, 9273, 1, 24, 30, 0, ?)
        `);
        serverConfigStmt.run([new Date().toISOString()]);
        serverConfigStmt.finalize();
        
        // Log successful reset
        addLog('info', 'Complete application reset successful - all data cleared and defaults restored');
        logger.info('SYSTEM', 'Complete application reset completed', {
          timestamp: new Date().toISOString(),
          tablesCleared: clearTables.length,
          defaultsRestored: true
        });
        
        res.json({ 
          success: true, 
          message: 'Complete application reset successful',
          cleared: {
            bookings: true,
            individual_bikes: true,
            fixed_costs: true,
            analytics: true
          },
          restored: {
            settings: true,
            default_bikes: defaultBikes.length,
            server_config: true
          },
          resetDate: new Date().toISOString()
        });

      } catch (innerError) {
        addLog('error', 'Transaction failed during reset', innerError.message);
        logger.error('SYSTEM', 'Reset transaction failed', { error: innerError.message });
        res.status(500).json({ 
          error: 'Failed to reset application', 
          details: innerError.message 
        });
      }
    });

  } catch (error) {
    addLog('error', 'Failed to reset application', error.message);
    logger.error('SYSTEM', 'Application reset failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to reset application to initial state', 
      details: error.message 
    });
  }
});

// ============================
// LOG MANAGEMENT ENDPOINTS
// ============================

// Get log directory information
app.get('/api/logs/info', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info('LOG_MANAGEMENT', 'Getting log directory information');
    
    const [logFiles, directorySize] = await Promise.all([
      logger.getLogFiles(),
      logger.getLogDirectorySize()
    ]);
    
    const result = {
      ...directorySize,
      files: logFiles.map(file => ({
        name: file.name,
        size: file.size,
        sizeFormatted: logger.formatFileSize(file.size),
        created: file.created,
        modified: file.modified
      }))
    };
    
    logger.logPerformance('LOG_INFO_REQUEST', Date.now() - startTime);
    res.json(result);
    
  } catch (error) {
    logger.error('LOG_MANAGEMENT', 'Failed to get log info', { error: error.message });
    res.status(500).json({ error: 'Failed to get log information', details: error.message });
  }
});

// Clean old logs
app.post('/api/logs/clean', async (req, res) => {
  const startTime = Date.now();
  const { daysToKeep = 30 } = req.body;
  
  try {
    logger.info('LOG_MANAGEMENT', 'Starting log cleanup', { daysToKeep });
    
    const result = await logger.cleanOldLogs(parseInt(daysToKeep));
    
    logger.logPerformance('LOG_CLEANUP', Date.now() - startTime, result);
    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${result.deletedCount} files (${result.deletedSizeFormatted})`,
      ...result
    });
    
  } catch (error) {
    logger.error('LOG_MANAGEMENT', 'Failed to clean logs', { error: error.message, daysToKeep });
    res.status(500).json({ error: 'Failed to clean logs', details: error.message });
  }
});

// Clear all logs
app.delete('/api/logs/clear', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.warn('LOG_MANAGEMENT', 'Clearing all logs - this action cannot be undone');
    
    const result = await logger.clearAllLogs();
    
    logger.logPerformance('LOG_CLEAR_ALL', Date.now() - startTime, result);
    res.json({
      success: true,
      message: `All logs cleared. Deleted ${result.deletedCount} files (${result.deletedSizeFormatted})`,
      ...result
    });
    
  } catch (error) {
    logger.error('LOG_MANAGEMENT', 'Failed to clear all logs', { error: error.message });
    res.status(500).json({ error: 'Failed to clear all logs', details: error.message });
  }
});

// Download log file
app.get('/api/logs/download/:filename', (req, res) => {
  const { filename } = req.params;
  
  try {
    // Validate filename to prevent directory traversal
    if (!/^rabbi-ebike-\d{4}-\d{2}-\d{2}\.log$/.test(filename)) {
      logger.warn('LOG_MANAGEMENT', 'Invalid log filename requested', { filename });
      return res.status(400).json({ error: 'Invalid log filename' });
    }
    
    const logPath = path.join(__dirname, 'logs', filename);
    
    // Check if file exists
    if (!require('fs').existsSync(logPath)) {
      logger.warn('LOG_MANAGEMENT', 'Log file not found', { filename });
      return res.status(404).json({ error: 'Log file not found' });
    }
    
    logger.info('LOG_MANAGEMENT', 'Downloading log file', { filename });
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(logPath);
    
  } catch (error) {
    logger.error('LOG_MANAGEMENT', 'Failed to download log file', { error: error.message, filename });
    res.status(500).json({ error: 'Failed to download log file', details: error.message });
  }
});

// Individual Bikes CRUD endpoints
// GET all bikes
app.get('/api/individual-bikes', (req, res) => {
  logger.info('BIKES', 'Fetching all individual bikes');
  
  db.all("SELECT * FROM individual_bikes ORDER BY created_at DESC", (err, bikes) => {
    if (err) {
      logger.error('BIKES', 'Failed to fetch individual bikes', { error: err.message });
      return handleDatabaseError(res, err, 'fetching individual bikes');
    }
    
    // Transform database format to frontend format
    const transformedBikes = bikes.map(bike => ({
      id: bike.id,
      name: bike.name,
      brand: bike.brand,
      model: bike.model,
      type: bike.type,
      size: bike.size,
      suspension: bike.suspension,
      hasTrailerHook: !!bike.has_trailer_hook,
      description: bike.description || '',
      minHeight: bike.min_height,
      maxHeight: bike.max_height,
      purchaseDate: bike.purchase_date ? new Date(bike.purchase_date) : undefined,
      purchasePrice: bike.purchase_price,
      isActive: !!bike.is_active,
      maintenance: JSON.parse(bike.maintenance_history || '[]'),
      totalMaintenanceCost: bike.total_maintenance_cost || 0,
      lastMaintenanceDate: bike.last_maintenance_date ? new Date(bike.last_maintenance_date) : undefined
    }));
    
    logger.info('BIKES', `Retrieved ${bikes.length} individual bikes`);
    res.json(transformedBikes);
  });
});

// POST new bike
app.post('/api/individual-bikes', (req, res) => {
  const bike = req.body;
  const bikeId = bike.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
  logger.info('BIKES', 'Creating new individual bike', { bikeName: bike.name, bikeType: bike.type, bikeId });
  
  const stmt = db.prepare(`
    INSERT INTO individual_bikes (
      id, name, brand, model, type, size, suspension, has_trailer_hook, 
      description, min_height, max_height, purchase_date, purchase_price, 
      is_active, maintenance_history, total_maintenance_cost
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run([
    bikeId,
    bike.name,
    bike.brand,
    bike.model || null,
    bike.type,
    bike.size || null,
    bike.suspension || null,
    bike.hasTrailerHook ? 1 : 0,
    bike.description || null,
    bike.minHeight || null,
    bike.maxHeight || null,
    bike.purchaseDate || null,
    bike.purchasePrice || null,
    bike.isActive !== false ? 1 : 0,
    JSON.stringify(bike.maintenance || []),
    bike.totalMaintenanceCost || 0
  ], function(err) {
    if (err) {
      logger.error('BIKES', 'Failed to create individual bike', { error: err.message, bikeName: bike.name });
      return handleDatabaseError(res, err, 'creating individual bike');
    }
    
    // Retrieve the created bike to return the complete object
    const selectStmt = db.prepare('SELECT * FROM individual_bikes WHERE id = ?');
    selectStmt.get([bikeId], (err, row) => {
      if (err) {
        logger.error('BIKES', 'Failed to retrieve created bike', { error: err.message, bikeId });
        return handleDatabaseError(res, err, 'retrieving created bike');
      }
      
      if (row) {
        const createdBike = {
          id: row.id,
          name: row.name,
          brand: row.brand,
          model: row.model,
          type: row.type,
          size: row.size,
          suspension: row.suspension,
          hasTrailerHook: !!row.has_trailer_hook,
          description: row.description || '',
          minHeight: row.min_height,
          maxHeight: row.max_height,
          purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
          purchasePrice: row.purchase_price,
          isActive: !!row.is_active,
          maintenance: JSON.parse(row.maintenance_history || '[]'),
          totalMaintenanceCost: row.total_maintenance_cost || 0,
          lastMaintenanceDate: row.last_maintenance_date ? new Date(row.last_maintenance_date) : undefined
        };
        
        logger.logBike('created', { id: bikeId, type: bike.type, name: bike.name });
        res.status(201).json(createdBike);
      } else {
        logger.error('BIKES', 'Created bike not found', { bikeId });
        res.status(500).json({ error: 'Created bike not found' });
      }
    });
    selectStmt.finalize();
  });
  
  stmt.finalize();
});

// PUT update bike
app.put('/api/individual-bikes/:id', (req, res) => {
  const { id } = req.params;
  const bike = req.body;
  
  logger.info('BIKES', 'Updating individual bike', { bikeId: id, bikeName: bike.name });
  
  const stmt = db.prepare(`
    UPDATE individual_bikes SET
      name = ?, brand = ?, model = ?, type = ?, size = ?, suspension = ?, 
      has_trailer_hook = ?, description = ?, min_height = ?, max_height = ?, 
      purchase_date = ?, purchase_price = ?, is_active = ?, maintenance_history = ?, 
      total_maintenance_cost = ?, last_maintenance_date = ?
    WHERE id = ?
  `);
  
  stmt.run([
    bike.name,
    bike.brand,
    bike.model || null,
    bike.type,
    bike.size || null,
    bike.suspension || null,
    bike.hasTrailerHook ? 1 : 0,
    bike.description || null,
    bike.minHeight || null,
    bike.maxHeight || null,
    bike.purchaseDate || null,
    bike.purchasePrice || null,
    bike.isActive ? 1 : 0,
    JSON.stringify(bike.maintenance || []),
    bike.totalMaintenanceCost || 0,
    bike.lastMaintenanceDate || null,
    id
  ], function(err) {
    if (err) {
      logger.error('BIKES', 'Failed to update individual bike', { error: err.message, bikeId: id });
      return handleDatabaseError(res, err, 'updating individual bike');
    }
    
    if (this.changes === 0) {
      logger.warn('BIKES', 'No bike found to update', { bikeId: id });
      return res.status(404).json({ error: 'Bike not found' });
    }
    
    logger.logBike('updated', { id, type: bike.type, name: bike.name });
    res.json({ message: 'Bike updated successfully', changes: this.changes });
  });
  
  stmt.finalize();
});

// DELETE bike
app.delete('/api/individual-bikes/:id', (req, res) => {
  const { id } = req.params;
  
  logger.info('BIKES', 'Deleting individual bike', { bikeId: id });
  
  // First get bike info for logging
  db.get("SELECT * FROM individual_bikes WHERE id = ?", [id], (err, bike) => {
    if (err) {
      logger.error('BIKES', 'Failed to fetch bike for deletion', { error: err.message, bikeId: id });
      return handleDatabaseError(res, err, 'fetching bike for deletion');
    }
    
    if (!bike) {
      logger.warn('BIKES', 'No bike found to delete', { bikeId: id });
      return res.status(404).json({ error: 'Bike not found' });
    }
    
    // Delete the bike
    db.run("DELETE FROM individual_bikes WHERE id = ?", [id], function(err) {
      if (err) {
        logger.error('BIKES', 'Failed to delete individual bike', { error: err.message, bikeId: id });
        return handleDatabaseError(res, err, 'deleting individual bike');
      }
      
      logger.logBike('deleted', { id, type: bike.type, name: bike.name });
      res.json({ message: 'Bike deleted successfully', changes: this.changes });
    });
  });
});

// Database optimizer initialization
let dbOptimizer = null;
let maintenanceScheduler = null;

async function initializeDatabaseOptimizer() {
  try {
    console.log('🔧 Initializing database optimizer for shop performance...');
    
    dbOptimizer = new DatabaseOptimizer(dbPath);
    await dbOptimizer.optimize();
    
    // Start maintenance scheduler
    maintenanceScheduler = new MaintenanceScheduler(dbOptimizer);
    maintenanceScheduler.start();
    
    console.log('✅ Database optimizer initialized successfully');
    logger.info('DATABASE', 'Database optimizer initialized', {
      optimizerActive: true,
      maintenanceScheduled: true
    });
  } catch (error) {
    console.warn('⚠️ Database optimizer initialization failed:', error.message);
    logger.warn('DATABASE', 'Database optimizer initialization failed', {
      error: error.message,
      fallbackMode: true
    });
  }
}

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('📦 Shutting down server gracefully...');
  if (dbOptimizer) {
    dbOptimizer.close();
  }
  if (db) {
    db.close();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📦 Shutting down server gracefully...');
  if (dbOptimizer) {
    dbOptimizer.close();
  }
  if (db) {
    db.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Rabbi E-Bike Server running on port ${PORT}`);
  console.log(`📂 Database: ${dbPath}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`🏪 Optimized for local shop usage`);
  
  // Start memory cleanup for shop computers
  scheduleMemoryCleanup();
  console.log('🧹 Memory cleanup scheduled');
  
  // Log server startup with advanced logging
  logger.info('SERVER', 'Rabbi E-Bike Server started successfully', {
    port: PORT,
    database: dbPath,
    apiUrl: `http://localhost:${PORT}/api`,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    startupTime: new Date().toISOString(),
    processId: process.pid,
    workingDirectory: process.cwd(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    optimizations: {
      databaseOptimizer: !!dbOptimizer,
      maintenanceScheduler: !!maintenanceScheduler,
      shopMonitoring: true,
      memoryCleanup: true
    }
  });
});