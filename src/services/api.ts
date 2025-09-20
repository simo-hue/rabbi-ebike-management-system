import type { Booking, ShopSettings } from "../components/Dashboard";
import { apiCache, storage } from "@/utils/performance";

interface ServerConfigUpdate {
  serverPort?: number;
  autoBackup?: boolean;
  backupIntervalHours?: number;
  maxBackupFiles?: number;
  debugMode?: boolean;
  notificationEmail?: string;
  smsNotifications?: boolean;
  maintenanceReminderDays?: number;
  lowBatteryAlert?: boolean;
  autoPricingUpdates?: boolean;
  peakHourMultiplier?: number;
  seasonalDiscount?: number;
  minimumBookingHours?: number;
  maxBookingDays?: number;
  weatherIntegration?: boolean;
  gpsTracking?: boolean;
  insuranceRequired?: boolean;
}

interface FixedCost {
  id?: number;
  name: string;
  description: string;
  amount: number;
  category: string;
  frequency: 'monthly' | 'yearly' | 'one-time';
  start_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

class ApiService {
  private config: ApiConfig = {
    baseUrl: 'http://localhost:3001/api',
    timeout: 8000 // Reduced for faster shop experience
  };
  
  // Shop-specific cache keys
  private readonly CACHE_KEYS = {
    SETTINGS: 'rabbi-settings',
    BIKES: 'rabbi-bikes',
    FIXED_COSTS: 'rabbi-fixed-costs',
    INDIVIDUAL_BIKES: 'rabbi-individual-bikes'
  };

  public updateConfig(newConfig: Partial<ApiConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): ApiConfig {
    return { ...this.config };
  }

  // Cache management for shop operations
  public clearCache() {
    apiCache.invalidate();
    Object.values(this.CACHE_KEYS).forEach(key => storage.remove(key));
    console.log('🧹 API cache cleared for fresh shop data');
  }

  public preloadShopData() {
    // Preload critical shop data for immediate dashboard load
    Promise.allSettled([
      this.getSettings(),
      this.getBookings(),
      this.getIndividualBikes(),
      this.getFixedCosts()
    ]).then(() => {
      console.log('✅ Shop data preloaded for optimal performance');
    });
  }

  // Cache helper methods for shop performance
  private getCacheKey(endpoint: string, params?: Record<string, string>): string {
    const paramString = params ? new URLSearchParams(params).toString() : '';
    return `rabbi-api-${endpoint.replace(/\//g, '-')}${paramString ? '-' + paramString : ''}`;
  }

  private async cachedFetch<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    cacheTime = 30000, // 30 seconds default for shop data
    useCache = true
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint);
    
    // For GET requests, try cache first
    if (useCache && (!options.method || options.method === 'GET')) {
      return apiCache.get(cacheKey, () => this.fetch(endpoint, options), cacheTime);
    }
    
    // For mutations, invalidate related cache and fetch directly
    const result = await this.fetch(endpoint, options);
    
    // Invalidate cache for mutations
    if (options.method && options.method !== 'GET') {
      this.invalidateRelatedCache(endpoint);
    }
    
    return result;
  }

  private invalidateRelatedCache(endpoint: string) {
    // Smart cache invalidation based on endpoint
    if (endpoint.includes('bookings')) {
      apiCache.invalidate('bookings');
      apiCache.invalidate('analytics');
    } else if (endpoint.includes('settings')) {
      apiCache.invalidate('settings');
      storage.remove(this.CACHE_KEYS.SETTINGS);
    } else if (endpoint.includes('individual-bikes')) {
      apiCache.invalidate('individual-bikes');
      storage.remove(this.CACHE_KEYS.INDIVIDUAL_BIKES);
    } else if (endpoint.includes('fixed-costs')) {
      apiCache.invalidate('fixed-costs');
      storage.remove(this.CACHE_KEYS.FIXED_COSTS);
      apiCache.invalidate('analytics');
    }
  }

  // Offline fallback for shop resilience
  private async getWithOfflineFallback<T>(endpoint: string, cacheKey: string): Promise<T> {
    try {
      const result = await this.cachedFetch<T>(endpoint);
      // Store successful result for offline access
      storage.set(cacheKey, result, 24 * 60 * 60 * 1000); // 24h offline cache
      return result;
    } catch (error) {
      console.warn(`API request failed, trying offline fallback: ${endpoint}`);
      const offlineData = storage.get(cacheKey);
      if (offlineData) {
        console.log('Using offline data for shop continuity');
        return offlineData;
      }
      throw error;
    }
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Health check with enhanced monitoring
  async healthCheck() {
    try {
      const startTime = Date.now();
      const result = await this.cachedFetch('/health', {}, 5000); // 5 second cache for health
      const responseTime = Date.now() - startTime;

      // Log performance metrics for monitoring
      if (responseTime > 1000) {
        console.warn(`⚠️ Health check slow: ${responseTime}ms`);
      }

      return {
        ...result,
        responseTime,
        timestamp: new Date().toISOString(),
        status: 'healthy'
      };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Connection status monitoring
  async checkConnectionStatus(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  // Retry with exponential backoff for critical operations
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt === maxRetries) {
          console.error(`❌ Operation failed after ${maxRetries + 1} attempts:`, lastError);
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Settings - critical for shop operations
  async getSettings() {
    return this.getWithOfflineFallback('/settings', this.CACHE_KEYS.SETTINGS);
  }

  async updateSettings(settings: Partial<ShopSettings>) {
    return this.cachedFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }, 0, false);
  }

  // Bookings - frequently accessed in shops
  async getBookings() {
    return this.cachedFetch('/bookings', {}, 15000); // 15 second cache for bookings
  }

  async createBooking(booking: Omit<Booking, 'id' | 'totalPrice'>) {
    return this.cachedFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    }, 0, false);
  }

  async updateBooking(id: string, booking: Partial<Booking>) {
    return this.cachedFetch(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(booking),
    }, 0, false);
  }

  async deleteBooking(id: string) {
    return this.cachedFetch(`/bookings/${id}`, {
      method: 'DELETE',
    }, 0, false);
  }

  // Server configuration
  async getServerConfig() {
    return this.fetch('/server-config');
  }

  async updateServerConfig(config: ServerConfigUpdate) {
    return this.fetch('/server-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Database management
  async createBackup() {
    return this.fetch('/backup', {
      method: 'POST',
    });
  }

  async getDatabaseStats() {
    return this.fetch('/database/stats');
  }

  // Performance monitoring
  async getPerformanceMetrics() {
    return this.fetch('/monitoring/metrics');
  }

  async getLogs() {
    return this.fetch('/monitoring/logs');
  }

  // Fixed costs management - important for shop finances
  async getFixedCosts() {
    return this.getWithOfflineFallback('/fixed-costs', this.CACHE_KEYS.FIXED_COSTS);
  }

  async createFixedCost(cost: Omit<FixedCost, 'id'>) {
    return this.cachedFetch('/fixed-costs', {
      method: 'POST',
      body: JSON.stringify(cost),
    }, 0, false);
  }

  async updateFixedCost(id: string, cost: Partial<FixedCost>) {
    return this.cachedFetch(`/fixed-costs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cost),
    }, 0, false);
  }

  async deleteFixedCost(id: string) {
    return this.cachedFetch(`/fixed-costs/${id}`, {
      method: 'DELETE',
    }, 0, false);
  }

  // Analytics - cache for better shop dashboard performance
  async getBikePerformance(period = 'month') {
    return this.cachedFetch(`/analytics/bike-performance?period=${period}`, {}, 60000); // 1 minute cache
  }

  async getRevenueBreakdown(period = 'month') {
    return this.cachedFetch(`/analytics/revenue-breakdown?period=${period}`, {}, 60000); // 1 minute cache
  }

  // Log management
  async getLogInfo() {
    return this.fetch('/logs/info');
  }

  async cleanOldLogs(daysToKeep = 30) {
    return this.fetch('/logs/clean', {
      method: 'POST',
      body: JSON.stringify({ daysToKeep }),
    });
  }

  async clearAllLogs() {
    return this.fetch('/logs/clear', {
      method: 'DELETE',
    });
  }

  async downloadLogFile(filename: string) {
    const response = await fetch(`${this.config.baseUrl}/logs/download/${filename}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  }

  async deleteLogFile(filename: string) {
    return this.fetch(`/logs/delete/${filename}`, {
      method: 'DELETE',
    });
  }

  // Individual Bikes management - critical for garage operations
  async getIndividualBikes() {
    return this.getWithOfflineFallback('/individual-bikes', this.CACHE_KEYS.INDIVIDUAL_BIKES);
  }

  async createIndividualBike(bike: any) {
    return this.fetch('/individual-bikes', {
      method: 'POST',
      body: JSON.stringify(bike),
    });
  }

  async updateIndividualBike(id: string, bike: any) {
    return this.fetch(`/individual-bikes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bike),
    });
  }

  async deleteIndividualBike(id: string) {
    return this.fetch(`/individual-bikes/${id}`, {
      method: 'DELETE',
    });
  }

  // Data management
  async exportAllData() {
    return this.fetch('/data/export');
  }

  async importAllData(data: Record<string, unknown>) {
    return this.fetch('/data/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Complete application reset
  async resetApplication() {
    return this.cachedFetch('/data/reset', {
      method: 'POST',
    }, 0, false);
  }
}

export const apiService = new ApiService();

// Initialize shop optimizations
if (typeof window !== 'undefined') {
  // Preload critical shop data after a short delay
  setTimeout(() => {
    apiService.preloadShopData();
  }, 1000);
  
  // Clear cache on page refresh for fresh data
  window.addEventListener('beforeunload', () => {
    // Only clear volatile cache, keep offline fallbacks
    apiCache.invalidate();
  });
}