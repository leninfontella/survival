const axios = require("axios");
const config = require("../config/footballAPI");
const Match = require("../models/Match");

class FootballAPIService {
  constructor() {
    this.baseURL = config.baseURL;
    this.headers = config.getHeaders();
  }

  // ============= MÉTODOS PRINCIPAIS =============

  /**
   * Buscar partidas de uma rodada específica
   * @param {string} league - brasil, espanha, etc
   * @param {number} round - número da rodada
   * @returns {Promise<Array>} - Array de partidas
   */
  async getFixturesByRound(league, round) {
    try {
      const leagueConfig = config.getLeagueConfig(league);
      if (!leagueConfig) {
        throw new Error(`Liga não configurada: ${league}`);
      }

      const response = await axios.get(`${this.baseURL}/fixtures`, {
        headers: this.headers,
        params: {
          league: leagueConfig.id,
          season: leagueConfig.season,
          round: `Regular Season - ${round}`,
        },
      });

      if (
        response.data.errors &&
        Object.keys(response.data.errors).length > 0
      ) {
        throw new Error(`Erro na API: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.response || [];
    } catch (error) {
      console.error("Erro ao buscar partidas:", error.message);
      throw error;
    }
  }

  /**
   * Buscar detalhes de uma partida específica
   * @param {number} fixtureId - ID da partida na API
   * @returns {Promise<Object>} - Dados da partida
   */
  async getFixtureById(fixtureId) {
    try {
      const response = await axios.get(`${this.baseURL}/fixtures`, {
        headers: this.headers,
        params: {
          id: fixtureId,
        },
      });

      if (
        response.data.errors &&
        Object.keys(response.data.errors).length > 0
      ) {
        throw new Error(`Erro na API: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.response[0] || null;
    } catch (error) {
      console.error("Erro ao buscar partida:", error.message);
      throw error;
    }
  }

  /**
   * Buscar partidas ao vivo de uma liga
   * @param {string} league - brasil, espanha, etc
   * @returns {Promise<Array>} - Array de partidas ao vivo
   */
  async getLiveFixtures(league) {
    try {
      const leagueConfig = config.getLeagueConfig(league);
      if (!leagueConfig) {
        throw new Error(`Liga não configurada: ${league}`);
      }

      const response = await axios.get(`${this.baseURL}/fixtures`, {
        headers: this.headers,
        params: {
          league: leagueConfig.id,
          season: leagueConfig.season,
          live: "all",
        },
      });

      if (
        response.data.errors &&
        Object.keys(response.data.errors).length > 0
      ) {
        throw new Error(`Erro na API: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.response || [];
    } catch (error) {
      console.error("Erro ao buscar partidas ao vivo:", error.message);
      throw error;
    }
  }

  // ============= MÉTODOS DE SINCRONIZAÇÃO =============

  /**
   * Sincronizar partidas de uma rodada com o banco de dados
   * @param {string} league - brasil, espanha, etc
   * @param {number} round - número da rodada
   * @returns {Promise<Array>} - Array de partidas salvas
   */
  async syncRoundFixtures(league, round) {
    try {
      console.log(`📥 Sincronizando partidas: ${league} - Rodada ${round}`);

      const apiFixtures = await this.getFixturesByRound(league, round);
      const savedMatches = [];

      for (const fixture of apiFixtures) {
        const matchData = this.parseFixtureData(fixture, league, round);

        // Atualizar ou criar partida
        const match = await Match.findOneAndUpdate(
          { apiMatchId: matchData.apiMatchId },
          matchData,
          { upsert: true, new: true, runValidators: true }
        );

        savedMatches.push(match);
      }

      console.log(`✅ ${savedMatches.length} partidas sincronizadas`);
      return savedMatches;
    } catch (error) {
      console.error("Erro ao sincronizar partidas:", error.message);
      throw error;
    }
  }

  /**
   * Atualizar resultado de uma partida específica
   * @param {number} apiMatchId - ID da partida na API
   * @returns {Promise<Object>} - Partida atualizada
   */
  async updateMatchResult(apiMatchId) {
    try {
      const apiFixture = await this.getFixtureById(apiMatchId);
      if (!apiFixture) {
        throw new Error(`Partida não encontrada: ${apiMatchId}`);
      }

      const match = await Match.findOne({ apiMatchId });
      if (!match) {
        throw new Error(`Partida não existe no banco: ${apiMatchId}`);
      }

      // Atualizar dados da partida
      match.status = this.parseStatus(apiFixture.fixture.status.short);
      match.statusDetail = {
        short: apiFixture.fixture.status.short,
        long: apiFixture.fixture.status.long,
        elapsed: apiFixture.fixture.status.elapsed,
      };

      // Atualizar placar
      if (apiFixture.goals.home !== null) {
        match.result.home = apiFixture.goals.home;
      }
      if (apiFixture.goals.away !== null) {
        match.result.away = apiFixture.goals.away;
      }

      // Determinar vencedor
      match.updateWinner();
      match.lastUpdated = new Date();

      await match.save();
      console.log(
        `✅ Partida atualizada: ${match.homeTeam.name} vs ${match.awayTeam.name}`
      );

      return match;
    } catch (error) {
      console.error("Erro ao atualizar resultado:", error.message);
      throw error;
    }
  }

  /**
   * Atualizar todas as partidas ao vivo de uma liga
   * @param {string} league - brasil, espanha, etc
   * @returns {Promise<Array>} - Array de partidas atualizadas
   */
  async updateLiveMatches(league) {
    try {
      const liveFixtures = await this.getLiveFixtures(league);
      const updatedMatches = [];

      for (const fixture of liveFixtures) {
        const match = await this.updateMatchResult(fixture.fixture.id);
        updatedMatches.push(match);
      }

      return updatedMatches;
    } catch (error) {
      console.error("Erro ao atualizar partidas ao vivo:", error.message);
      throw error;
    }
  }

  // ============= MÉTODOS AUXILIARES =============

  /**
   * Converter dados da API para formato do banco
   * @param {Object} fixture - Dados da partida da API
   * @param {string} league - Liga
   * @param {number} round - Rodada
   * @returns {Object} - Dados formatados
   */
  parseFixtureData(fixture, league, round) {
    const status = this.parseStatus(fixture.fixture.status.short);

    return {
      apiMatchId: fixture.fixture.id,
      league: league,
      leagueInfo: {
        apiLeagueId: fixture.league.id,
        name: fixture.league.name,
        season: fixture.league.season,
      },
      round: round,
      homeTeam: {
        apiTeamId: fixture.teams.home.id,
        name: fixture.teams.home.name,
        logo: fixture.teams.home.logo,
      },
      awayTeam: {
        apiTeamId: fixture.teams.away.id,
        name: fixture.teams.away.name,
        logo: fixture.teams.away.logo,
      },
      date: new Date(fixture.fixture.date),
      status: status,
      statusDetail: {
        short: fixture.fixture.status.short,
        long: fixture.fixture.status.long,
        elapsed: fixture.fixture.status.elapsed,
      },
      result: {
        home: fixture.goals.home,
        away: fixture.goals.away,
        winner: this.determineWinner(fixture.goals.home, fixture.goals.away),
      },
      venue: {
        name: fixture.fixture.venue?.name || "N/A",
        city: fixture.fixture.venue?.city || "N/A",
      },
      lastUpdated: new Date(),
      apiResponse: fixture, // Cache da resposta completa
    };
  }

  /**
   * Converter status da API para formato simplificado
   * @param {string} apiStatus - Status da API (NS, 1H, HT, 2H, FT, etc)
   * @returns {string} - Status simplificado
   */
  parseStatus(apiStatus) {
    const statusMap = {
      TBD: "scheduled", // Time To Be Defined
      NS: "scheduled", // Not Started
      "1H": "live", // First Half
      HT: "live", // Halftime
      "2H": "live", // Second Half
      ET: "live", // Extra Time
      P: "live", // Penalty
      FT: "finished", // Full Time
      AET: "finished", // After Extra Time
      PEN: "finished", // Penalty Shootout
      PST: "postponed", // Postponed
      CANC: "cancelled", // Cancelled
      ABD: "cancelled", // Abandoned
      AWD: "finished", // Technical Loss
      WO: "finished", // WalkOver
    };

    return statusMap[apiStatus] || "scheduled";
  }

  /**
   * Determinar vencedor baseado no placar
   * @param {number} homeGoals - Gols do mandante
   * @param {number} awayGoals - Gols do visitante
   * @returns {string|null} - "home", "away", "draw" ou null
   */
  determineWinner(homeGoals, awayGoals) {
    if (homeGoals === null || awayGoals === null) {
      return null;
    }
    if (homeGoals > awayGoals) {
      return "home";
    }
    if (awayGoals > homeGoals) {
      return "away";
    }
    return "draw";
  }

  /**
   * Verificar se a API está configurada
   * @returns {boolean}
   */
  isConfigured() {
    return config.isConfigured();
  }
}

module.exports = new FootballAPIService();
