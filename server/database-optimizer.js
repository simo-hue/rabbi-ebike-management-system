// 🗄️ OTTIMIZZAZIONI DATABASE PER USO LOCALE NEGOZIO
// Ottimizzazioni SQLite specifiche per computer fisso

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseOptimizer {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  // === CONFIGURAZIONE OTTIMIZZATA ===
  async optimize() {
    console.log('🚀 Ottimizzando database per uso locale...');
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.db.serialize(() => {
          // === PRAGMA OTTIMIZZAZIONI ===
          this.db.exec(`
            -- Performance ottimizzata per uso locale
            PRAGMA journal_mode = WAL;              -- Write-Ahead Logging per concorrenza
            PRAGMA synchronous = NORMAL;            -- Bilanciamento performance/sicurezza
            PRAGMA cache_size = 10000;              -- 40MB cache (adatto a computer locali)
            PRAGMA temp_store = memory;             -- Tabelle temp in RAM
            PRAGMA mmap_size = 268435456;           -- 256MB memory mapping
            PRAGMA optimize;                        -- Auto-ottimizzazione
            
            -- Ottimizzazioni query
            PRAGMA query_planner = 1;               -- Usa query planner ottimizzato
            PRAGMA automatic_index = 1;             -- Crea indici automatici quando utili
            
            -- Gestione errori migliorata
            PRAGMA foreign_keys = ON;               -- Integrità referenziale
            PRAGMA secure_delete = 0;               -- Velocizza DELETE (non critico per negozi)
          `);
          
          console.log('✅ PRAGMA configuration applied');
          
          // === INDICI OTTIMIZZATI PER NEGOZI ===
          this.createOptimizedIndexes();
          
          // === VIEWS PER QUERY FREQUENTI ===
          this.createPerformanceViews();
          
          // === TRIGGERS PER MANUTENZIONE ===
          this.createMaintenanceTriggers();
          
          console.log('🏃‍♂️ Database optimization completed');
          resolve(this.db);
        });
      });
    });
  }

  // === INDICI SPECIFICI PER CASO D'USO NEGOZIO ===
  createOptimizedIndexes() {
    const indexes = [
      // Prenotazioni - query più frequenti nei negozi
      'CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(booking_date, status)',
      'CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(booking_date, start_time)',
      'CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_name COLLATE NOCASE)',
      'CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone)',
      
      // Booking bikes - per disponibilità veloce
      'CREATE INDEX IF NOT EXISTS idx_booking_bikes_composite ON booking_bikes(booking_id, bike_type, bike_size)',
      'CREATE INDEX IF NOT EXISTS idx_booking_bikes_type ON booking_bikes(bike_type)',
      
      // Bici individuali - per garage management
      'CREATE INDEX IF NOT EXISTS idx_individual_bikes_active ON individual_bikes(is_active, type)',
      'CREATE INDEX IF NOT EXISTS idx_individual_bikes_maintenance ON individual_bikes(last_maintenance_date) WHERE is_active = 1',
      
      // Fixed costs - per analytics veloci
      'CREATE INDEX IF NOT EXISTS idx_fixed_costs_active_category ON fixed_costs(is_active, category)',
      'CREATE INDEX IF NOT EXISTS idx_fixed_costs_date ON fixed_costs(start_date) WHERE is_active = 1',
      
      // Analytics - per dashboard performance
      'CREATE INDEX IF NOT EXISTS idx_bike_usage_date_type ON bike_usage_analytics(usage_date, bike_type)',
      'CREATE INDEX IF NOT EXISTS idx_revenue_analytics_date ON revenue_analytics(date DESC)',
      
      // Full-text search per clienti (se supportato)
      'CREATE INDEX IF NOT EXISTS idx_bookings_customer_fts ON bookings(customer_name) WHERE customer_name IS NOT NULL'
    ];

    indexes.forEach(sql => {
      this.db.run(sql, (err) => {
        if (err && !err.message.includes('already exists')) {
          console.warn('Index creation warning:', err.message);
        }
      });
    });
    
    console.log('📊 Performance indexes created');
  }

  // === VIEWS PER QUERY COMPLESSE FREQUENTI ===
  createPerformanceViews() {
    const views = [
      // Vista prenotazioni oggi con dettagli bici
      `CREATE VIEW IF NOT EXISTS v_today_bookings AS
       SELECT 
         b.*,
         GROUP_CONCAT(bb.bike_type || ' ' || COALESCE(bb.bike_size, '') || ' (' || bb.bike_count || ')', ', ') as bikes_summary,
         SUM(bb.bike_count) as total_bikes
       FROM bookings b
       LEFT JOIN booking_bikes bb ON b.id = bb.booking_id
       WHERE b.booking_date = date('now')
       GROUP BY b.id
       ORDER BY b.start_time`,
      
      // Vista disponibilità bici per oggi
      `CREATE VIEW IF NOT EXISTS v_bike_availability_today AS
       SELECT 
         bikes.type,
         bikes.size,
         bikes.suspension,
         bikes.count as total_available,
         COALESCE(booked.booked_count, 0) as currently_booked,
         (bikes.count - COALESCE(booked.booked_count, 0)) as available_now
       FROM bikes
       LEFT JOIN (
         SELECT 
           bb.bike_type,
           bb.bike_size,
           bb.bike_suspension,
           SUM(bb.bike_count) as booked_count
         FROM booking_bikes bb
         JOIN bookings b ON bb.booking_id = b.id
         WHERE b.booking_date = date('now')
           AND b.status = 'confirmed'
           AND time('now') BETWEEN b.start_time AND b.end_time
         GROUP BY bb.bike_type, bb.bike_size, bb.bike_suspension
       ) booked ON bikes.type = booked.bike_type 
                AND bikes.size = booked.bike_size 
                AND bikes.suspension = booked.bike_suspension`,
      
      // Vista statistiche veloci
      `CREATE VIEW IF NOT EXISTS v_quick_stats AS
       SELECT 
         (SELECT COUNT(*) FROM bookings WHERE booking_date = date('now')) as bookings_today,
         (SELECT COUNT(*) FROM bookings WHERE booking_date = date('now') AND status = 'confirmed') as confirmed_today,
         (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE booking_date = date('now') AND status = 'confirmed') as revenue_today,
         (SELECT COUNT(*) FROM individual_bikes WHERE is_active = 1) as active_bikes,
         (SELECT COUNT(*) FROM bookings WHERE booking_date > date('now')) as future_bookings`,
      
      // Vista costi mensili
      `CREATE VIEW IF NOT EXISTS v_monthly_costs AS
       SELECT 
         category,
         SUM(CASE 
           WHEN frequency = 'monthly' THEN amount
           WHEN frequency = 'yearly' THEN amount / 12.0
           WHEN frequency = 'one-time' THEN amount / 12.0
           ELSE amount
         END) as monthly_cost
       FROM fixed_costs 
       WHERE is_active = 1
       GROUP BY category`
    ];

    views.forEach(sql => {
      this.db.run(sql, (err) => {
        if (err && !err.message.includes('already exists')) {
          console.warn('View creation warning:', err.message);
        }
      });
    });
    
    console.log('👁️ Performance views created');
  }

  // === TRIGGERS PER MANUTENZIONE AUTOMATICA ===
  createMaintenanceTriggers() {
    const triggers = [
      // Auto-update maintenance cost quando si aggiunge manutenzione
      `CREATE TRIGGER IF NOT EXISTS update_maintenance_cost
       AFTER UPDATE OF maintenance_history ON individual_bikes
       FOR EACH ROW
       BEGIN
         UPDATE individual_bikes 
         SET total_maintenance_cost = (
           SELECT COALESCE(SUM(json_extract(value, '$.cost')), 0)
           FROM json_each(NEW.maintenance_history)
         ),
         last_maintenance_date = (
           SELECT MAX(json_extract(value, '$.date'))
           FROM json_each(NEW.maintenance_history)
         )
         WHERE id = NEW.id;
       END`,
      
      // Auto-update analytics quando si crea prenotazione
      `CREATE TRIGGER IF NOT EXISTS update_bike_usage_analytics
       AFTER INSERT ON booking_bikes
       FOR EACH ROW
       BEGIN
         INSERT OR REPLACE INTO bike_usage_analytics (
           bike_type, bike_size, bike_suspension, has_trailer_hook, usage_date,
           total_bookings, total_hours, total_revenue
         )
         SELECT 
           NEW.bike_type,
           NEW.bike_size, 
           NEW.bike_suspension,
           NEW.has_trailer_hook,
           (SELECT booking_date FROM bookings WHERE id = NEW.booking_id),
           COALESCE(existing.total_bookings, 0) + 1,
           COALESCE(existing.total_hours, 0) + (
             CASE 
               WHEN (SELECT category FROM bookings WHERE id = NEW.booking_id) = 'full-day' THEN 8 * NEW.bike_count
               WHEN (SELECT category FROM bookings WHERE id = NEW.booking_id) = 'half-day' THEN 4 * NEW.bike_count
               ELSE 1 * NEW.bike_count
             END
           ),
           COALESCE(existing.total_revenue, 0) + (
             SELECT total_price * (NEW.bike_count / (
               SELECT SUM(bike_count) FROM booking_bikes WHERE booking_id = NEW.booking_id
             )) FROM bookings WHERE id = NEW.booking_id
           )
         FROM (
           SELECT * FROM bike_usage_analytics 
           WHERE bike_type = NEW.bike_type 
             AND bike_size = NEW.bike_size 
             AND bike_suspension = NEW.bike_suspension
             AND usage_date = (SELECT booking_date FROM bookings WHERE id = NEW.booking_id)
         ) existing;
       END`
    ];

    triggers.forEach(sql => {
      this.db.run(sql, (err) => {
        if (err && !err.message.includes('already exists')) {
          console.warn('Trigger creation warning:', err.message);
        }
      });
    });
    
    console.log('🔄 Maintenance triggers created');
  }

  // === PULIZIA E MANUTENZIONE ===
  async performMaintenance() {
    return new Promise((resolve, reject) => {
      console.log('🧹 Performing database maintenance...');
      
      this.db.serialize(() => {
        // VACUUM per compattare DB
        this.db.run('VACUUM', (err) => {
          if (err) {
            console.warn('VACUUM warning:', err.message);
          } else {
            console.log('✅ Database compacted');
          }
        });
        
        // ANALYZE per ottimizzare query planner
        this.db.run('ANALYZE', (err) => {
          if (err) {
            console.warn('ANALYZE warning:', err.message);
          } else {
            console.log('✅ Query planner updated');
          }
        });
        
        // Pulizia dati vecchi (opzionale)
        const oldDataCleanup = `
          -- Rimuovi analytics più vecchi di 2 anni
          DELETE FROM bike_usage_analytics 
          WHERE usage_date < date('now', '-2 years');
          
          -- Rimuovi revenue analytics più vecchi di 2 anni
          DELETE FROM revenue_analytics 
          WHERE date < date('now', '-2 years');
        `;
        
        this.db.exec(oldDataCleanup, (err) => {
          if (err) {
            console.warn('Cleanup warning:', err.message);
          } else {
            console.log('🗑️ Old data cleaned');
          }
          resolve();
        });
      });
    });
  }

  // === STATISTICHE DATABASE ===
  async getStats() {
    return new Promise((resolve, reject) => {
      const stats = {};
      
      // Dimensione database
      const fs = require('fs');
      try {
        const size = fs.statSync(this.dbPath).size;
        stats.fileSize = `${Math.round(size / 1024 / 1024 * 100) / 100} MB`;
      } catch (e) {
        stats.fileSize = 'Unknown';
      }
      
      // Conteggi tabelle
      const queries = [
        'SELECT COUNT(*) as bookings FROM bookings',
        'SELECT COUNT(*) as bikes FROM bikes', 
        'SELECT COUNT(*) as individual_bikes FROM individual_bikes',
        'SELECT COUNT(*) as fixed_costs FROM fixed_costs',
        'SELECT COUNT(*) as analytics FROM bike_usage_analytics'
      ];
      
      let completed = 0;
      queries.forEach(query => {
        this.db.get(query, (err, row) => {
          if (!err && row) {
            Object.assign(stats, row);
          }
          completed++;
          if (completed === queries.length) {
            resolve(stats);
          }
        });
      });
    });
  }

  // === CHIUSURA ===
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.warn('Database close warning:', err.message);
        } else {
          console.log('📦 Database connection closed');
        }
      });
    }
  }
}

// === SCHEDULER MANUTENZIONE ===
class MaintenanceScheduler {
  constructor(dbOptimizer) {
    this.optimizer = dbOptimizer;
    this.lastMaintenance = null;
  }

  // Avvia manutenzione schedulata
  start() {
    // Manutenzione ogni notte alle 3:00
    const scheduleDaily = () => {
      const now = new Date();
      const next3AM = new Date();
      next3AM.setHours(3, 0, 0, 0);
      
      if (next3AM <= now) {
        next3AM.setDate(next3AM.getDate() + 1);
      }
      
      const msUntil3AM = next3AM.getTime() - now.getTime();
      
      setTimeout(async () => {
        console.log('🌙 Starting nightly maintenance...');
        try {
          await this.optimizer.performMaintenance();
          this.lastMaintenance = new Date();
          console.log('✅ Nightly maintenance completed');
        } catch (error) {
          console.error('❌ Maintenance failed:', error);
        }
        
        // Schedule next maintenance
        scheduleDaily();
      }, msUntil3AM);
      
      console.log(`⏰ Next maintenance scheduled for ${next3AM.toLocaleString()}`);
    };
    
    scheduleDaily();
  }
  
  // Manutenzione manuale
  async runNow() {
    console.log('🔧 Running manual maintenance...');
    try {
      await this.optimizer.performMaintenance();
      this.lastMaintenance = new Date();
      return { success: true, timestamp: this.lastMaintenance };
    } catch (error) {
      console.error('❌ Manual maintenance failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = {
  DatabaseOptimizer,
  MaintenanceScheduler
};