// Cache simples em memória com TTL customizado
class APICache {
  constructor() {
    this.cache = new Map();
    this.rateLimiter = new Map();
  }

  // Gerar chave única para cache
  generateKey(endpoint, params) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  // Verificar se está no cache e ainda é válido
  get(key, maxAge = null) {
    const cached = this.cache.get(key);

    if (!cached) return null;

    const now = Date.now();

    // Usar TTL armazenado ou maxAge fornecido ou padrão (5 minutos)
    const age = maxAge || cached.ttl || 300000;

    if (now - cached.timestamp > age) {
      this.cache.delete(key);
      console.log(`🗑️ Cache expirado: ${key}`);
      return null;
    }

    console.log(`✅ Cache HIT: ${key} (${cached.data?.length || 0} items)`);
    return cached.data;
  }

  // Armazenar no cache com TTL padrão
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: 600000, // 10 minutos padrão
    });

    const dataInfo = Array.isArray(data)
      ? `${data.length} items`
      : typeof data === "object"
      ? "object"
      : data;

    console.log(`💾 Cache SET: ${key} (${dataInfo}, TTL: 10min)`);
  }

  // 🆕 Armazenar no cache com TTL customizado
  setWithTTL(key, data, ttl = 600000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    const dataInfo = Array.isArray(data)
      ? `${data.length} items`
      : typeof data === "object"
      ? "object"
      : data;

    const ttlMinutes = Math.round(ttl / 60000);

    console.log(`💾 Cache SET: ${key} (${dataInfo}, TTL: ${ttlMinutes}min)`);
  }

  // 🆕 Verificar se existe no cache (sem retornar valor)
  has(key) {
    const cached = this.cache.get(key);

    if (!cached) return false;

    const now = Date.now();
    const age = cached.ttl || 300000;

    if (now - cached.timestamp > age) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Rate limiter - verificar se pode fazer request
  canMakeRequest(endpoint) {
    const lastRequest = this.rateLimiter.get(endpoint);
    const now = Date.now();
    const minInterval = 2000; // 2 segundos entre requests

    if (!lastRequest || now - lastRequest > minInterval) {
      this.rateLimiter.set(endpoint, now);
      return true;
    }

    console.log(
      `⏳ Rate limit: aguardando antes de fazer request para ${endpoint}`
    );
    return false;
  }

  // Aguardar antes de fazer request
  async waitForRateLimit(endpoint) {
    const lastRequest = this.rateLimiter.get(endpoint);
    const now = Date.now();
    const minInterval = 2000;

    if (lastRequest) {
      const timeSinceLastRequest = now - lastRequest;
      if (timeSinceLastRequest < minInterval) {
        const waitTime = minInterval - timeSinceLastRequest;
        console.log(`⏳ Aguardando ${waitTime}ms antes do próximo request...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    this.rateLimiter.set(endpoint, Date.now());
  }

  // 🆕 Limpar entrada específica do cache
  clear(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      console.log(`🗑️ Cache limpo: ${key}`);
      return true;
    }
    return false;
  }

  // 🆕 Limpar todo o cache
  clearAll() {
    const count = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Todo cache limpo (${count} entradas)`);
  }

  // Limpar cache antigo (opcional - executa automaticamente)
  clearOld(maxAge = 3600000) {
    // 1 hora
    const now = Date.now();
    let cleared = 0;

    for (const [key, value] of this.cache.entries()) {
      const age = value.ttl || 300000;
      if (now - value.timestamp > age) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🗑️ Limpeza automática: ${cleared} entradas removidas`);
    }
  }

  // 🆕 Obter estatísticas do cache
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const [key, value] of this.cache.entries()) {
      const age = value.ttl || 300000;
      if (now - value.timestamp > age) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      rateLimiters: this.rateLimiter.size,
    };
  }

  // 🆕 Log de estatísticas
  logStats() {
    const stats = this.getStats();
    console.log(
      `📊 Cache Stats: ${stats.valid} válidos | ${stats.expired} expirados | ${stats.total} total`
    );
  }
}

// Criar instância única
const cacheInstance = new APICache();

// 🆕 Limpar cache expirado a cada 30 minutos
setInterval(() => {
  cacheInstance.clearOld();
}, 1800000); // 30 minutos

// 🆕 Log de estatísticas a cada 10 minutos (apenas se houver cache)
setInterval(() => {
  if (cacheInstance.cache.size > 0) {
    cacheInstance.logStats();
  }
}, 600000); // 10 minutos

module.exports = cacheInstance;
