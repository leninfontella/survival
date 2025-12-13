// config/footballAPI.js
// Configuração CORRIGIDA da API-Football

module.exports = {
  // API Key - deve estar no .env como RAPIDAPI_KEY
  apiKey: process.env.RAPIDAPI_KEY,
  apiHost: "api-football-v1.p.rapidapi.com",

  // ✅ CORRIGIDO: baseURL sem parâmetros de query
  baseURL: "https://api-football-v1.p.rapidapi.com/v3",

  // ✅ CORRIGIDO: Seasons atualizadas para 2024 (temporada atual)
  leagueIds: {
    brasil: {
      id: 71, // Brasileirão Série A
      name: "Campeonato Brasileiro Série A",
      season: 2024, // Temporada 2024 (termina em dezembro)
    },
    espanha: {
      id: 140, // La Liga
      name: "La Liga",
      season: 2024, // Temporada 2024/25 (agosto 2024 - maio 2025)
    },
    inglaterra: {
      id: 39, // Premier League
      name: "Premier League",
      season: 2024, // Temporada 2024/25 (agosto 2024 - maio 2025)
    },
    alemanha: {
      id: 78, // Bundesliga
      name: "Bundesliga",
      season: 2024, // Temporada 2024/25 (agosto 2024 - maio 2025)
    },
    italia: {
      id: 135, // Serie A
      name: "Serie A",
      season: 2024, // Temporada 2024/25 (agosto 2024 - maio 2025)
    },
    franca: {
      id: 61, // Ligue 1
      name: "Ligue 1",
      season: 2024, // Temporada 2024/25 (agosto 2024 - maio 2025)
    },
  },

  // Headers padrão para requisições
  getHeaders() {
    if (!this.apiKey) {
      console.error("❌ RAPIDAPI_KEY não configurada no .env!");
      return {};
    }

    return {
      "x-rapidapi-key": this.apiKey, // ✅ Lowercase (ambos funcionam, mas lowercase é padrão)
      "x-rapidapi-host": this.apiHost,
    };
  },

  // Obter configuração de uma liga
  getLeagueConfig(league) {
    const config = this.leagueIds[league];

    if (!config) {
      console.error(`❌ Liga não encontrada: ${league}`);
      console.log(
        `Ligas disponíveis: ${Object.keys(this.leagueIds).join(", ")}`
      );
      return null;
    }

    return config;
  },

  // Validar se a API Key está configurada
  isConfigured() {
    const configured = !!this.apiKey;

    if (!configured) {
      console.warn("\n" + "=".repeat(70));
      console.warn("⚠️  RAPIDAPI_KEY NÃO CONFIGURADA");
      console.warn("=".repeat(70));
      console.warn("Adicione no arquivo .env:");
      console.warn("RAPIDAPI_KEY=sua_chave_aqui");
      console.warn("=".repeat(70) + "\n");
    } else {
      // Mascarar a chave nos logs (segurança)
      const maskedKey =
        this.apiKey.substring(0, 8) +
        "..." +
        this.apiKey.substring(this.apiKey.length - 4);
      console.log(`✅ API-Football configurada com key: ${maskedKey}`);
    }

    return configured;
  },

  // Endpoints da API
  endpoints: {
    fixtures: "/fixtures",
    teams: "/teams",
    standings: "/standings",
    leagues: "/leagues",
  },

  // Configurações de cache e rate limiting
  cache: {
    // Tempo de cache para partidas finalizadas (24 horas)
    finishedMatches: 24 * 60 * 60 * 1000,
    // Tempo de cache para partidas ao vivo (30 segundos)
    liveMatches: 30 * 1000,
    // Tempo de cache para partidas futuras (1 hora)
    scheduledMatches: 60 * 60 * 1000,
  },

  // Rate limiting - API-Football via RapidAPI: 100 req/dia no plano Basic
  rateLimit: {
    maxRequests: 100,
    perDay: true,
    // Contador interno (resetar a cada 24h)
    _counter: 0,
    _lastReset: new Date().toDateString(),
  },

  // ✅ NOVO: Método para verificar rate limit
  canMakeRequest() {
    const today = new Date().toDateString();

    // Resetar contador se mudou o dia
    if (this.rateLimit._lastReset !== today) {
      this.rateLimit._counter = 0;
      this.rateLimit._lastReset = today;
      console.log("🔄 Rate limit resetado para novo dia");
    }

    // Verificar se atingiu o limite
    if (this.rateLimit._counter >= this.rateLimit.maxRequests) {
      console.error(
        `❌ Rate limit atingido: ${this.rateLimit._counter}/${this.rateLimit.maxRequests} requests`
      );
      return false;
    }

    return true;
  },

  // ✅ NOVO: Incrementar contador de requests
  incrementRequestCount() {
    this.rateLimit._counter++;

    const remaining = this.rateLimit.maxRequests - this.rateLimit._counter;
    const percentUsed = Math.round(
      (this.rateLimit._counter / this.rateLimit.maxRequests) * 100
    );

    console.log(
      `📊 API Requests: ${this.rateLimit._counter}/${this.rateLimit.maxRequests} (${percentUsed}% usado, ${remaining} restantes)`
    );

    // Aviso quando chegar perto do limite
    if (remaining <= 10 && remaining > 0) {
      console.warn(`⚠️ ATENÇÃO: Apenas ${remaining} requests restantes hoje!`);
    }
  },

  // ✅ NOVO: Obter status do rate limit
  getRateLimitStatus() {
    return {
      used: this.rateLimit._counter,
      limit: this.rateLimit.maxRequests,
      remaining: this.rateLimit.maxRequests - this.rateLimit._counter,
      resetDate: this.rateLimit._lastReset,
    };
  },
};
