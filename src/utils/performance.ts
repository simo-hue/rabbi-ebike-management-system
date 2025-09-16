// Versione semplificata per debug - performance utilities per Rabbi E-Bike
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// === DEBOUNCING ===
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
};

// === MEMOIZATION SEMPLICE ===
export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

// === STORAGE SEMPLICE ===
class SimpleStorage {
  set(key: string, value: any, ttl = 24 * 60 * 60 * 1000) {
    try {
      const item = {
        value,
        expiry: Date.now() + ttl
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Storage set failed:', error);
    }
  }

  get(key: string) {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch (error) {
      console.warn('Storage get failed:', error);
      return null;
    }
  }

  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Storage remove failed:', error);
    }
  }
}

export const storage = new SimpleStorage();

// === API CACHE SEMPLICE ===
class SimpleApiCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  async get<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl = 30000
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, expiry: Date.now() + ttl });
    return data;
  }

  invalidate(pattern?: string) {
    if (pattern) {
      for (const [key] of this.cache.entries()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

export const apiCache = new SimpleApiCache();

// === HOOKS SEMPLICI ===
export const usePerformanceMonitor = (componentName: string) => {
  // Versione semplificata - solo log
  useEffect(() => {
    console.log(`Component mounted: ${componentName}`);
  }, [componentName]);
};

export const usePreloadComponents = () => {
  // Versione semplificata - non fa preload
  useEffect(() => {
    console.log('Preload components disabled for debug');
  }, []);
};

// === ERROR BOUNDARY SEMPLICE ===
export class SimpleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', { style: { padding: '20px', textAlign: 'center' } }, [
        React.createElement('h2', { key: 'title' }, 'Qualcosa è andato storto'),
        React.createElement('p', { key: 'desc' }, 'Si è verificato un errore. Ricarica la pagina.'),
        React.createElement('button', { 
          key: 'btn', 
          onClick: () => window.location.reload(),
          style: { padding: '10px 20px', marginTop: '10px' }
        }, 'Ricarica')
      ]);
    }

    return this.props.children;
  }
}

export const OptimizedErrorBoundary = SimpleErrorBoundary;