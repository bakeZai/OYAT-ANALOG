// frontend/src/utils/debounce.ts

/**
 * Debounce function для предотвращения частых вызовов
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
  
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }
  
  /**
   * Создает уникальный ключ для кэширования запросов
   */
  export function createRequestKey(...parts: (string | null | undefined)[]): string {
    return parts.filter(Boolean).join('-');
  }
  
  /**
   * Простой кэш для запросов с TTL
   */
  export class RequestCache {
    private cache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>();
    private ttl: number;
  
    constructor(ttlMs: number = 5000) {
      this.ttl = ttlMs;
    }
  
    get(key: string): any | null {
      const cached = this.cache.get(key);
      if (!cached) return null;
  
      // Проверяем TTL
      if (Date.now() - cached.timestamp > this.ttl) {
        this.cache.delete(key);
        return null;
      }
  
      return cached.data;
    }
  
    set(key: string, data: any): void {
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
    }
  
    setPromise(key: string, promise: Promise<any>): Promise<any> {
      const cached = { data: null, timestamp: Date.now(), promise };
      this.cache.set(key, cached);
  
      promise.then(data => {
        this.cache.set(key, { data, timestamp: Date.now() });
      }).catch(() => {
        this.cache.delete(key);
      });
  
      return promise;
    }
  
    getPromise(key: string): Promise<any> | null {
      return this.cache.get(key)?.promise || null;
    }
  
    clear(): void {
      this.cache.clear();
    }
  
    delete(key: string): void {
      this.cache.delete(key);
    }
  }