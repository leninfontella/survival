// Configurações da API-Football (RapidAPI)

module.exports = {
  // API Key - deve estar no .env como RAPIDAPI_KEY
  apiKey: process.env.RAPIDAPI_KEY,
  apiHost: "api-football-v1.p.rapidapi.com",
  baseURL: "https://api-football-v1.p.rapidapi.com/v3",

  // Mapeamento de ligas para IDs da API-Football
  leagueIds: {
    brasil: {
      id: 71, // Brasileirão Série A
      name: "Campeonato Brasileiro Série A",
      season: 2024,
    },
    espanha: {
      id: 140, // La Liga
      name: "La Liga",
      season: 2024,
    },
    inglaterra: {
      id: 39, // Premier League
      name: "Premier League",
      season: 2024,
    },
    alemanha: {
      id: 78, // Bundesliga
      name: "Bundesliga",
      season: 2024,
    },
    italia: {
      id: 135, // Serie A
      name: "Serie A",
      season: 2024,
    },
    franca: {
      id: 61, // Ligue 1
      name: "Ligue 1",
      season: 2024,
    },
  },

  // Headers padrão para requisições
  getHeaders() {
    return {
      "X-RapidAPI-Key": this.apiKey,
      "X-RapidAPI-Host": this.apiHost,
    };
  },

  // Obter configuração de uma liga
  getLeagueConfig(league) {
    return this.leagueIds[league] || null;
  },

  // Validar se a API Key está configurada
  isConfigured() {
    return !!this.apiKey;
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

  // Rate limiting - API-Football Free Tier: 100 req/dia
  rateLimit: {
    maxRequests: 100,
    perDay: true,
  },
};
