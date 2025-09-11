import type { Booking, ShopSettings } from "../components/Dashboard";

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
    baseUrl: 'http://localhost:9273/api',
    timeout: 10000
  };

  public updateConfig(newConfig: Partial<ApiConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): ApiConfig {
    return { ...this.config };
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

  // Health check
  async healthCheck() {
    return this.fetch('/health');
  }

  // Settings
  async getSettings() {
    return this.fetch('/settings');
  }

  async updateSettings(settings: Partial<ShopSettings>) {
    return this.fetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Bookings
  async getBookings() {
    return this.fetch('/bookings');
  }

  async createBooking(booking: Omit<Booking, 'id' | 'totalPrice'>) {
    return this.fetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  async updateBooking(id: string, booking: Partial<Booking>) {
    return this.fetch(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(booking),
    });
  }

  async deleteBooking(id: string) {
    return this.fetch(`/bookings/${id}`, {
      method: 'DELETE',
    });
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

  // Fixed costs management
  async getFixedCosts() {
    return this.fetch('/fixed-costs');
  }

  async createFixedCost(cost: Omit<FixedCost, 'id'>) {
    return this.fetch('/fixed-costs', {
      method: 'POST',
      body: JSON.stringify(cost),
    });
  }

  async updateFixedCost(id: string, cost: Partial<FixedCost>) {
    return this.fetch(`/fixed-costs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cost),
    });
  }

  async deleteFixedCost(id: string) {
    return this.fetch(`/fixed-costs/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getBikePerformance(period = 'month') {
    return this.fetch(`/analytics/bike-performance?period=${period}`);
  }

  async getRevenueBreakdown(period = 'month') {
    return this.fetch(`/analytics/revenue-breakdown?period=${period}`);
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
    const response = await fetch(`${this.baseUrl}/logs/download/${filename}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  }

  // Individual Bikes management
  async getIndividualBikes() {
    return this.fetch('/individual-bikes');
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
}

export const apiService = new ApiService();