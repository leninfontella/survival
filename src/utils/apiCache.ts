// Tipo genérico para dados cacheados
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Cache simples para requests do frontend
class FrontendCache {
  private cache: Map<string, CacheEntry<unknown>>;

  constructor() {
    this.cache = new Map();
  }

  generateKey(endpoint: string, params: Record<string, unknown>): string {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  get<T = unknown>(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache HIT (frontend): ${key}`);
    return cached.data as T;
  }

  set<T = unknown>(key: string, data: T, ttl: number = 600000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    console.log(`💾 Cache SET (frontend): ${key}`);
  }

  clear(key: string): void {
    this.cache.delete(key);
  }

  clearAll(): void {
    this.cache.clear();
  }

  // 🆕 Método auxiliar para obter estatísticas
  getStats(): { total: number; keys: string[] } {
    return {
      total: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // 🆕 Limpar cache expirado
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🗑️ Cache limpo: ${cleared} entradas expiradas`);
    }

    return cleared;
  }
}

export const frontendCache = new FrontendCache();

// 🆕 Limpar cache expirado a cada 5 minutos
setInterval(() => {
  frontendCache.clearExpired();
}, 300000);
