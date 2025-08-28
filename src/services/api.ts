export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

class ApiService {
  private config: ApiConfig = {
    baseUrl: 'http://localhost:3001/api',
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

  async updateSettings(settings: any) {
    return this.fetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Bookings
  async getBookings() {
    return this.fetch('/bookings');
  }

  async createBooking(booking: any) {
    return this.fetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  async updateBooking(id: string, booking: any) {
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

  async updateServerConfig(config: any) {
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

  // Data management
  async exportAllData() {
    return this.fetch('/data/export');
  }

  async importAllData(data: any) {
    return this.fetch('/data/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();