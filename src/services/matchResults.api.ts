import axios from "axios";
import { frontendCache } from "@/utils/apiCache";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Tipos
export interface Match {
  id: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  date: string;
  time: string;
  round: number;
  season: string;
}

export interface Team {
  id: string;
  name: string;
  alternateNames: string[];
  badge: string;
  stadium: string;
}

export interface MatchResult {
  won: boolean;
  draw: boolean;
  finished: boolean;
  homeScore?: number;
  awayScore?: number;
  message: string;
}

export interface CheckerStatus {
  isActive: boolean;
  checkInterval: string;
  activeRooms: number;
  lastCheck: string;
}

/**
 * Busca partidas de uma rodada específica
 */
export const getMatchesByRound = async (
  league: string,
  round: number
): Promise<Match[]> => {
  try {
    // 🆕 Verificar cache primeiro
    const cacheKey = frontendCache.generateKey("matches", { league, round });
    const cachedData = frontendCache.get(cacheKey);

    if (cachedData !== null) {
      return cachedData;
    }

    const response = await axios.get(
      `${API_URL}/match-results/matches/${league}/${round}`
    );

    if (response.data.success) {
      const matches = response.data.data;

      // 🆕 Cachear por 2 minutos
      frontendCache.set(cacheKey, matches, 120000);

      return matches;
    }

    throw new Error("Erro ao buscar partidas");
  } catch (error) {
    console.error("Erro ao buscar partidas:", error);

    // 🆕 Se for 429, retornar array vazio ao invés de erro
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      console.warn("⚠️ Rate limit atingido - retornando cache vazio");
      return [];
    }

    throw error;
  }
};

/**
 * Busca detalhes de uma partida específica
 */
export const getMatchDetails = async (matchId: string): Promise<Match> => {
  try {
    const response = await axios.get(
      `${API_URL}/match-results/match/${matchId}`
    );

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error("Erro ao buscar detalhes da partida");
  } catch (error) {
    console.error("Erro ao buscar detalhes da partida:", error);
    throw error;
  }
};

/**
 * Busca todos os times de uma liga
 */
export const getTeamsByLeague = async (league: string): Promise<Team[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/match-results/teams/${league}`
    );

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error("Erro ao buscar times");
  } catch (error) {
    console.error("Erro ao buscar times:", error);
    throw error;
  }
};

/**
 * Verifica resultado de uma partida para um time específico
 */
export const checkMatchResult = async (
  matchId: string,
  teamId: string
): Promise<MatchResult> => {
  try {
    const response = await axios.get(
      `${API_URL}/match-results/check/${matchId}/${teamId}`
    );

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error("Erro ao verificar resultado");
  } catch (error) {
    console.error("Erro ao verificar resultado:", error);
    throw error;
  }
};

/**
 * Busca próximas partidas de um time
 */
export const getNextMatches = async (
  teamId: string,
  limit: number = 5
): Promise<Match[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/match-results/next/${teamId}?limit=${limit}`
    );

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error("Erro ao buscar próximas partidas");
  } catch (error) {
    console.error("Erro ao buscar próximas partidas:", error);
    throw error;
  }
};

/**
 * Busca últimas partidas de um time
 */
export const getLastMatches = async (
  teamId: string,
  limit: number = 5
): Promise<Match[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/match-results/last/${teamId}?limit=${limit}`
    );

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error("Erro ao buscar últimas partidas");
  } catch (error) {
    console.error("Erro ao buscar últimas partidas:", error);
    throw error;
  }
};

/**
 * Força verificação manual de uma sala
 */
export const forceCheckRoom = async (
  roomId: string,
  token: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post(
      `${API_URL}/match-results/check-room/${roomId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      return response.data;
    }

    throw new Error("Erro ao forçar verificação");
  } catch (error) {
    console.error("Erro ao forçar verificação:", error);
    throw error;
  }
};

/**
 * Busca status do verificador automático
 */
export const getCheckerStatus = async (): Promise<CheckerStatus> => {
  try {
    const response = await axios.get(`${API_URL}/match-results/checker-status`);

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error("Erro ao buscar status do verificador");
  } catch (error) {
    console.error("Erro ao buscar status do verificador:", error);
    throw error;
  }
};

/**
 * Verifica se todas as partidas de uma rodada foram finalizadas
 */
export const checkRoundCompleted = async (
  league: string,
  round: number
): Promise<boolean> => {
  try {
    const matches = await getMatchesByRound(league, round);

    if (matches.length === 0) {
      return false;
    }

    return matches.every(
      (match) =>
        match.status === "Match Finished" ||
        (match.homeScore !== null && match.awayScore !== null)
    );
  } catch (error) {
    console.error("Erro ao verificar rodada completa:", error);
    return false;
  }
};

/**
 * Busca partida de um time específico em uma rodada
 */
export const getTeamMatchInRound = async (
  league: string,
  round: number,
  teamId: string
): Promise<Match | null> => {
  try {
    const matches = await getMatchesByRound(league, round);

    const teamMatch = matches.find(
      (match) => match.homeTeamId === teamId || match.awayTeamId === teamId
    );

    return teamMatch || null;
  } catch (error) {
    console.error("Erro ao buscar partida do time:", error);
    return null;
  }
};

/**
 * Formata o resultado de uma partida
 */
export const formatMatchResult = (match: Match): string => {
  if (match.homeScore === null || match.awayScore === null) {
    return "Partida não iniciada";
  }

  return `${match.homeTeamName} ${match.homeScore} x ${match.awayScore} ${match.awayTeamName}`;
};

/**
 * Verifica se um time venceu uma partida
 */
export const didTeamWin = (match: Match, teamId: string): boolean | null => {
  if (match.homeScore === null || match.awayScore === null) {
    return null; // Partida não finalizada
  }

  // Empate = perda
  if (match.homeScore === match.awayScore) {
    return false;
  }

  // Time mandante
  if (match.homeTeamId === teamId) {
    return match.homeScore > match.awayScore;
  }

  // Time visitante
  if (match.awayTeamId === teamId) {
    return match.awayScore > match.homeScore;
  }

  return null;
};

/**
 * Calcula estatísticas de uma rodada
 */
export const getRoundStats = async (
  league: string,
  round: number
): Promise<{
  total: number;
  finished: number;
  pending: number;
  percentComplete: number;
}> => {
  try {
    const matches = await getMatchesByRound(league, round);

    const total = matches.length;
    const finished = matches.filter(
      (match) =>
        match.status === "Match Finished" ||
        (match.homeScore !== null && match.awayScore !== null)
    ).length;
    const pending = total - finished;
    const percentComplete = total > 0 ? (finished / total) * 100 : 0;

    return {
      total,
      finished,
      pending,
      percentComplete: Math.round(percentComplete),
    };
  } catch (error) {
    console.error("Erro ao calcular estatísticas da rodada:", error);
    return {
      total: 0,
      finished: 0,
      pending: 0,
      percentComplete: 0,
    };
  }
};

export default {
  getMatchesByRound,
  getMatchDetails,
  getTeamsByLeague,
  checkMatchResult,
  getNextMatches,
  getLastMatches,
  forceCheckRoom,
  getCheckerStatus,
  checkRoundCompleted,
  getTeamMatchInRound,
  formatMatchResult,
  didTeamWin,
  getRoundStats,
};
