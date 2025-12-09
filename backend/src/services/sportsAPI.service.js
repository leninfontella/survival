const axios = require("axios");

// TheSportsDB API (versão gratuita)
const THESPORTSDB_API_KEY = process.env.THESPORTSDB_API_KEY || "3"; // "3" é a chave de teste
const BASE_URL = "https://www.thesportsdb.com/api/v1/json";

// IDs das ligas no TheSportsDB
const LEAGUE_IDS = {
  brasil: "4351", // Brasileirão Série A
  espanha: "4335", // La Liga
  inglaterra: "4328", // Premier League
  alemanha: "4331", // Bundesliga
  italia: "4332", // Serie A
  franca: "4334", // Ligue 1
};

class SportsAPIService {
  /**
   * Busca partidas de uma liga em uma temporada específica
   * @param {string} league - Nome da liga (brasil, espanha, etc)
   * @param {number} round - Número da rodada
   * @returns {Promise<Array>} - Array de partidas
   */
  async getMatchesByRound(league, round) {
    try {
      const leagueId = LEAGUE_IDS[league];
      if (!leagueId) {
        throw new Error(`Liga não encontrada: ${league}`);
      }

      const season = new Date().getFullYear(); // Ano atual
      const url = `${BASE_URL}/${THESPORTSDB_API_KEY}/eventsround.php?id=${leagueId}&r=${round}&s=${season}`;

      console.log(`🔍 Buscando partidas: Liga ${league}, Rodada ${round}`);
      console.log(`📡 URL: ${url}`);

      const response = await axios.get(url);

      if (!response.data || !response.data.events) {
        console.log("⚠️ Nenhuma partida encontrada");
        return [];
      }

      const matches = response.data.events.map((event) => ({
        id: event.idEvent,
        homeTeamId: event.idHomeTeam,
        homeTeamName: event.strHomeTeam,
        awayTeamId: event.idAwayTeam,
        awayTeamName: event.strAwayTeam,
        homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : null,
        awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : null,
        status: event.strStatus, // "Match Finished", "Not Started", etc
        date: event.dateEvent,
        time: event.strTime,
        round: event.intRound,
        season: event.strSeason,
      }));

      console.log(`✅ ${matches.length} partidas encontradas`);
      return matches;
    } catch (error) {
      console.error("❌ Erro ao buscar partidas:", error.message);
      throw error;
    }
  }

  /**
   * Busca detalhes de uma partida específica
   * @param {string} matchId - ID da partida
   * @returns {Promise<Object>} - Detalhes da partida
   */
  async getMatchDetails(matchId) {
    try {
      const url = `${BASE_URL}/${THESPORTSDB_API_KEY}/lookupevent.php?id=${matchId}`;

      const response = await axios.get(url);

      if (!response.data || !response.data.events || !response.data.events[0]) {
        throw new Error("Partida não encontrada");
      }

      const event = response.data.events[0];

      return {
        id: event.idEvent,
        homeTeamId: event.idHomeTeam,
        homeTeamName: event.strHomeTeam,
        awayTeamId: event.idAwayTeam,
        awayTeamName: event.strAwayTeam,
        homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : null,
        awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : null,
        status: event.strStatus,
        date: event.dateEvent,
        time: event.strTime,
        round: event.intRound,
        season: event.strSeason,
      };
    } catch (error) {
      console.error("❌ Erro ao buscar detalhes da partida:", error.message);
      throw error;
    }
  }

  /**
   * Busca todos os times de uma liga
   * @param {string} league - Nome da liga
   * @returns {Promise<Array>} - Array de times
   */
  async getTeamsByLeague(league) {
    try {
      const leagueId = LEAGUE_IDS[league];
      if (!leagueId) {
        throw new Error(`Liga não encontrada: ${league}`);
      }

      const url = `${BASE_URL}/${THESPORTSDB_API_KEY}/lookup_all_teams.php?id=${leagueId}`;

      console.log(`🔍 Buscando times da liga ${league}`);

      const response = await axios.get(url);

      if (!response.data || !response.data.teams) {
        console.log("⚠️ Nenhum time encontrado");
        return [];
      }

      const teams = response.data.teams.map((team) => ({
        id: team.idTeam,
        name: team.strTeam,
        alternateNames: team.strAlternate ? team.strAlternate.split(",") : [],
        badge: team.strTeamBadge,
        stadium: team.strStadium,
      }));

      console.log(`✅ ${teams.length} times encontrados`);
      return teams;
    } catch (error) {
      console.error("❌ Erro ao buscar times:", error.message);
      throw error;
    }
  }

  /**
   * Verifica se uma partida foi vencida por um time específico
   * @param {string} matchId - ID da partida
   * @param {string} teamId - ID do time (TheSportsDB)
   * @returns {Promise<Object>} - { won: boolean, draw: boolean, finished: boolean }
   */
  async checkMatchResult(matchId, teamId) {
    try {
      const match = await this.getMatchDetails(matchId);

      // Verificar se a partida foi finalizada
      const finished =
        match.status === "Match Finished" ||
        (match.homeScore !== null && match.awayScore !== null);

      if (!finished) {
        return {
          won: false,
          draw: false,
          finished: false,
          message: "Partida ainda não finalizada",
        };
      }

      // Verificar se foi empate
      if (match.homeScore === match.awayScore) {
        return {
          won: false,
          draw: true,
          finished: true,
          message: "Partida empatada",
        };
      }

      // Verificar vitória
      let won = false;
      if (match.homeTeamId === teamId && match.homeScore > match.awayScore) {
        won = true;
      } else if (
        match.awayTeamId === teamId &&
        match.awayScore > match.homeScore
      ) {
        won = true;
      }

      return {
        won,
        draw: false,
        finished: true,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        message: won ? "Time venceu!" : "Time perdeu",
      };
    } catch (error) {
      console.error("❌ Erro ao verificar resultado:", error.message);
      throw error;
    }
  }

  /**
   * Busca próximas partidas de um time
   * @param {string} teamId - ID do time
   * @param {number} limit - Número de partidas a retornar
   * @returns {Promise<Array>} - Array de próximas partidas
   */
  async getNextMatches(teamId, limit = 5) {
    try {
      const url = `${BASE_URL}/${THESPORTSDB_API_KEY}/eventsnext.php?id=${teamId}`;

      const response = await axios.get(url);

      if (!response.data || !response.data.events) {
        return [];
      }

      return response.data.events.slice(0, limit).map((event) => ({
        id: event.idEvent,
        homeTeamId: event.idHomeTeam,
        homeTeamName: event.strHomeTeam,
        awayTeamId: event.idAwayTeam,
        awayTeamName: event.strAwayTeam,
        date: event.dateEvent,
        time: event.strTime,
        round: event.intRound,
      }));
    } catch (error) {
      console.error("❌ Erro ao buscar próximas partidas:", error.message);
      throw error;
    }
  }

  /**
   * Busca últimas partidas de um time
   * @param {string} teamId - ID do time
   * @param {number} limit - Número de partidas a retornar
   * @returns {Promise<Array>} - Array de últimas partidas
   */
  async getLastMatches(teamId, limit = 5) {
    try {
      const url = `${BASE_URL}/${THESPORTSDB_API_KEY}/eventslast.php?id=${teamId}`;

      const response = await axios.get(url);

      if (!response.data || !response.data.results) {
        return [];
      }

      return response.data.results.slice(0, limit).map((event) => ({
        id: event.idEvent,
        homeTeamId: event.idHomeTeam,
        homeTeamName: event.strHomeTeam,
        awayTeamId: event.idAwayTeam,
        awayTeamName: event.strAwayTeam,
        homeScore: parseInt(event.intHomeScore),
        awayScore: parseInt(event.intAwayScore),
        date: event.dateEvent,
        time: event.strTime,
        round: event.intRound,
      }));
    } catch (error) {
      console.error("❌ Erro ao buscar últimas partidas:", error.message);
      throw error;
    }
  }
}

module.exports = new SportsAPIService();
