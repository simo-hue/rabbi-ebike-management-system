const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logsDir = path.join(__dirname, 'logs');
        this.currentDate = '';
        this.currentLogFile = null;
        this.logStream = null;
        
        // Ensure logs directory exists
        this.ensureLogsDirectory();
        
        // Initialize log file for current date
        this.initializeLogFile();
        
        // Set up daily rotation check (every 10 minutes)
        setInterval(() => this.checkDateRotation(), 10 * 60 * 1000);
    }

    ensureLogsDirectory() {
        try {
            if (!fs.existsSync(this.logsDir)) {
                fs.mkdirSync(this.logsDir, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create logs directory:', error);
        }
    }

    getLogFileName() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `rabbi-ebike-${year}-${month}-${day}.log`;
    }

    getCurrentDateString() {
        const now = new Date();
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    initializeLogFile() {
        const dateString = this.getCurrentDateString();
        
        if (this.currentDate !== dateString) {
            // Close existing stream if it exists
            if (this.logStream) {
                this.logStream.end();
            }
            
            this.currentDate = dateString;
            this.currentLogFile = path.join(this.logsDir, this.getLogFileName());
            
            // Create write stream for append
            try {
                this.logStream = fs.createWriteStream(this.currentLogFile, { flags: 'a' });
                
                // Add session start marker
                this.writeToFile('SYSTEM', 'LOG_SESSION_START', 'New logging session started', {
                    pid: process.pid,
                    nodeVersion: process.version,
                    platform: process.platform
                });
                
            } catch (error) {
                console.error('Failed to initialize log file:', error);
            }
        }
    }

    checkDateRotation() {
        this.initializeLogFile();
    }

    formatTimestamp() {
        const now = new Date();
        return now.toISOString();
    }

    writeToFile(level, category, message, metadata = {}) {
        if (!this.logStream) return;
        
        const logEntry = {
            timestamp: this.formatTimestamp(),
            level,
            category,
            message,
            metadata,
            pid: process.pid
        };

        try {
            this.logStream.write(JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    // Main logging methods
    info(category, message, metadata = {}) {
        this.writeToFile('INFO', category, message, metadata);
        console.log(`[INFO] [${category}] ${message}`, metadata);
    }

    warn(category, message, metadata = {}) {
        this.writeToFile('WARN', category, message, metadata);
        console.warn(`[WARN] [${category}] ${message}`, metadata);
    }

    error(category, message, metadata = {}) {
        this.writeToFile('ERROR', category, message, metadata);
        console.error(`[ERROR] [${category}] ${message}`, metadata);
    }

    debug(category, message, metadata = {}) {
        this.writeToFile('DEBUG', category, message, metadata);
        console.log(`[DEBUG] [${category}] ${message}`, metadata);
    }

    // Specific logging methods for different operations
    logRequest(req, res, startTime) {
        const duration = Date.now() - startTime;
        const metadata = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress,
            contentLength: req.headers['content-length'] || 0
        };

        if (res.statusCode >= 400) {
            this.error('HTTP_REQUEST', `${req.method} ${req.url} - ${res.statusCode}`, metadata);
        } else {
            this.info('HTTP_REQUEST', `${req.method} ${req.url} - ${res.statusCode}`, metadata);
        }
    }

    logBooking(action, bookingData, userId = null) {
        const metadata = {
            action,
            bookingId: bookingData.id,
            customerName: bookingData.customerName,
            totalPrice: bookingData.totalPrice,
            date: bookingData.date,
            userId
        };

        this.info('BOOKING', `Booking ${action}`, metadata);
    }

    logBike(action, bikeData, userId = null) {
        const metadata = {
            action,
            bikeId: bikeData.id,
            bikeType: bikeData.type,
            size: bikeData.size,
            userId
        };

        this.info('BIKE_MANAGEMENT', `Bike ${action}`, metadata);
    }

    logSettings(action, changedSettings, userId = null) {
        const metadata = {
            action,
            changedFields: Object.keys(changedSettings),
            userId
        };

        this.info('SETTINGS', `Settings ${action}`, metadata);
    }

    logDatabase(action, details = {}) {
        this.info('DATABASE', `Database ${action}`, details);
    }

    logSecurity(event, details = {}) {
        this.warn('SECURITY', `Security event: ${event}`, details);
    }

    logPerformance(operation, duration, metadata = {}) {
        const level = duration > 1000 ? 'WARN' : 'INFO';
        this[level.toLowerCase()]('PERFORMANCE', `${operation} took ${duration}ms`, metadata);
    }

    // File management methods
    async getLogFiles() {
        try {
            const files = await fs.promises.readdir(this.logsDir);
            const logFiles = files
                .filter(file => file.endsWith('.log'))
                .map(file => {
                    const filePath = path.join(this.logsDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                })
                .sort((a, b) => b.modified - a.modified);
            
            return logFiles;
        } catch (error) {
            this.error('LOGGER', 'Failed to get log files', { error: error.message });
            return [];
        }
    }

    async getLogDirectorySize() {
        try {
            const files = await this.getLogFiles();
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            return {
                totalSize,
                totalSizeFormatted: this.formatFileSize(totalSize),
                fileCount: files.length
            };
        } catch (error) {
            this.error('LOGGER', 'Failed to calculate log directory size', { error: error.message });
            return { totalSize: 0, totalSizeFormatted: '0 B', fileCount: 0 };
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async cleanOldLogs(daysToKeep = 30) {
        try {
            const files = await this.getLogFiles();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            let deletedCount = 0;
            let deletedSize = 0;
            
            for (const file of files) {
                if (file.modified < cutoffDate) {
                    try {
                        await fs.promises.unlink(file.path);
                        deletedCount++;
                        deletedSize += file.size;
                        this.info('LOG_CLEANUP', `Deleted old log file: ${file.name}`, {
                            fileSize: this.formatFileSize(file.size),
                            fileDate: file.modified
                        });
                    } catch (error) {
                        this.error('LOG_CLEANUP', `Failed to delete log file: ${file.name}`, {
                            error: error.message
                        });
                    }
                }
            }
            
            const result = {
                deletedCount,
                deletedSize,
                deletedSizeFormatted: this.formatFileSize(deletedSize)
            };
            
            if (deletedCount > 0) {
                this.info('LOG_CLEANUP', `Cleanup completed`, result);
            }
            
            return result;
            
        } catch (error) {
            this.error('LOG_CLEANUP', 'Failed to clean old logs', { error: error.message });
            return { deletedCount: 0, deletedSize: 0, deletedSizeFormatted: '0 B' };
        }
    }

    async clearAllLogs() {
        try {
            const files = await this.getLogFiles();
            let deletedCount = 0;
            let deletedSize = 0;
            
            // Close current log stream to prevent write conflicts
            if (this.logStream) {
                this.logStream.end();
                this.logStream = null;
            }
            
            for (const file of files) {
                try {
                    await fs.promises.unlink(file.path);
                    deletedCount++;
                    deletedSize += file.size;
                } catch (error) {
                    console.error(`Failed to delete log file: ${file.name}`, error);
                }
            }
            
            // Reinitialize logging after cleanup
            this.currentDate = '';
            this.initializeLogFile();
            
            const result = {
                deletedCount,
                deletedSize,
                deletedSizeFormatted: this.formatFileSize(deletedSize)
            };
            
            this.info('LOG_CLEANUP', 'All logs cleared', result);
            return result;
            
        } catch (error) {
            this.error('LOG_CLEANUP', 'Failed to clear all logs', { error: error.message });
            return { deletedCount: 0, deletedSize: 0, deletedSizeFormatted: '0 B' };
        }
    }

    // Graceful shutdown
    close() {
        if (this.logStream) {
            this.writeToFile('SYSTEM', 'LOG_SESSION_END', 'Logging session ended gracefully');
            this.logStream.end();
        }
    }
}

// Create singleton instance
const logger = new Logger();

// Graceful shutdown handling
process.on('SIGTERM', () => logger.close());
process.on('SIGINT', () => logger.close());
process.on('exit', () => logger.close());

module.exports = logger;