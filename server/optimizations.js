// 🚀 OTTIMIZZAZIONI PER USO LOCALE NEGOZIO
// Da implementare nel server.js esistente

// === MEMORIA E CPU ===
// 1. Limitare logging eccessivo per computer meno potenti
const PRODUCTION_LOGGING = process.env.NODE_ENV === 'production';

// Middleware ottimizzato per performance
const optimizedMiddleware = (req, res, next) => {
  // Solo logging essenziale in produzione
  if (!PRODUCTION_LOGGING || req.path.includes('/health')) {
    // Skip detailed logging per richieste frequenti
    return next();
  }
  
  // Logging minimo
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) { // Solo richieste lente
      console.log(`Slow: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};

// === DATABASE OTTIMIZZAZIONI ===
// 2. Connection pooling SQLite ottimizzato
const sqlite3 = require('sqlite3').verbose();

const optimizedDB = {
  // Cache prepared statements per performance
  _statements: new Map(),
  
  getStatement(sql) {
    if (!this._statements.has(sql)) {
      this._statements.set(sql, db.prepare(sql));
    }
    return this._statements.get(sql);
  },
  
  // Cleanup statements on app shutdown
  cleanup() {
    for (const stmt of this._statements.values()) {
      stmt.finalize();
    }
    this._statements.clear();
  }
};

// 3. Database performance settings
const optimizeDatabase = (db) => {
  // Ottimizzazioni SQLite per computer locali
  db.exec(`
    PRAGMA journal_mode = WAL;        -- Migliori performance
    PRAGMA synchronous = NORMAL;      -- Bilanciamento performance/sicurezza
    PRAGMA cache_size = 10000;        -- Cache 40MB (adatto a RAM limitata)
    PRAGMA temp_store = memory;       -- Temp tables in memoria
    PRAGMA mmap_size = 268435456;     -- 256MB memory mapping
    PRAGMA optimize;                  -- Auto-ottimizzazione
  `);
};

// === MEMORY MANAGEMENT ===
// 4. Garbage collection periodico per computer con poca RAM
const scheduleMemoryCleanup = () => {
  if (global.gc) {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed > 100 * 1024 * 1024) { // > 100MB
        global.gc();
        console.log('🧹 Memory cleanup performed');
      }
    }, 10 * 60 * 1000); // Ogni 10 minuti
  }
};

// === REQUEST CACHING ===
// 5. Cache semplice per richieste frequenti
class SimpleCache {
  constructor(ttl = 60000) { // 1 minuto default
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    });
    
    // Cleanup vecchie entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }
}

const apiCache = new SimpleCache(30000); // 30 secondi per dati statici

// === NETWORK OTTIMIZZAZIONI ===
// 6. Compression per ridurre traffico di rete locale (opzionale)
let compression = null;
try {
  compression = require('compression');
} catch (e) {
  console.log('ℹ️ Compression module not available, skipping network optimization');
}

const compressFilter = compression ? (req, res) => {
  // Non comprimere se locale
  if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
    return false;
  }
  return compression.filter(req, res);
} : null;

// === STARTUP OTTIMIZZAZIONI ===
// 7. Caricamento dati preemptive per startup veloce
const preloadCriticalData = async () => {
  try {
    // Precarica settings e bikes per dashboard immediato
    const settings = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM settings WHERE id = 1", (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    const bikes = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM bikes", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Cache iniziale
    apiCache.set('settings', settings);
    apiCache.set('bikes', bikes);
    
    console.log('✅ Critical data preloaded');
  } catch (error) {
    console.warn('⚠️ Preload failed:', error.message);
  }
};

// === MONITORING LEGGERO ===
// 8. Health monitoring ottimizzato per negozi
class LightweightMonitor {
  constructor() {
    this.stats = {
      requests: 0,
      errors: 0,
      lastReset: Date.now()
    };
    
    // Reset stats ogni ora
    setInterval(() => {
      this.stats = {
        requests: 0,
        errors: 0,
        lastReset: Date.now()
      };
    }, 60 * 60 * 1000);
  }
  
  logRequest() {
    this.stats.requests++;
  }
  
  logError() {
    this.stats.errors++;
  }
  
  getStats() {
    const uptime = Date.now() - this.stats.lastReset;
    return {
      ...this.stats,
      uptime: Math.floor(uptime / 1000),
      requestsPerMinute: Math.round(this.stats.requests / (uptime / 60000))
    };
  }
}

// === EXPORT OTTIMIZZAZIONI ===
module.exports = {
  optimizedMiddleware,
  optimizedDB,
  optimizeDatabase,
  scheduleMemoryCleanup,
  SimpleCache,
  apiCache,
  compressFilter,
  preloadCriticalData,
  LightweightMonitor,
  compression // Export for optional use
};