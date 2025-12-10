// src/services/api.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Criar instância do axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado - redirecionar para login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ============= AUTH ENDPOINTS =============

export const authAPI = {
  // Cadastro
  signup: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post("/auth/signup", data);
    if (response.data.success) {
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
      localStorage.setItem(
        "userId",
        response.data.data.user._id || response.data.data.user.id
      );
    }
    return response.data;
  },

  // Login
  login: async (data: { email: string; password: string }) => {
    const response = await api.post("/auth/login", data);
    if (response.data.success) {
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
      localStorage.setItem(
        "userId",
        response.data.data.user._id || response.data.data.user.id
      );
    }
    return response.data;
  },

  // Obter dados do usuário
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  },

  // Verificar se está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  // Obter usuário do localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Obter ID do usuário atual
  getCurrentUserId: () => {
    return localStorage.getItem("userId");
  },
};

// ============= ROOM ENDPOINTS =============

export const roomAPI = {
  // Criar sala
  create: async (data: {
    name: string;
    league: string;
    minPlayers: number;
    entryPrice: number;
    totalRounds: number;
    isPrivate?: boolean;
  }) => {
    const response = await api.post("/rooms", data);
    return response.data;
  },

  // Listar salas
  getAll: async (filters?: { status?: string; league?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.league) params.append("league", filters.league);

    const response = await api.get(`/rooms?${params.toString()}`);
    return response.data;
  },

  // Obter sala por ID
  getById: async (id: string) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  // Entrar em sala
  join: async (roomId: string, name: string) => {
    const response = await api.post(`/rooms/${roomId}/join`, { name });
    return response.data;
  },

  // Toggle Ready Status
  toggleReady: async (roomId: string) => {
    const response = await api.put(`/rooms/${roomId}/toggle-ready`);
    return response.data;
  },

  // Iniciar sala (apenas admin)
  start: async (roomId: string) => {
    const response = await api.put(`/rooms/${roomId}/start`);
    return response.data;
  },

  // Selecionar time para uma rodada
  selectTeam: async (roomId: string, teamId: string, teamName: string) => {
    const response = await api.post(`/rooms/${roomId}/select-team`, {
      teamId,
      teamName,
    });
    return response.data;
  },

  // Obter times já usados pelo jogador
  getUsedTeams: async (roomId: string) => {
    const response = await api.get(`/rooms/${roomId}/used-teams`);
    return response.data;
  },

  // Processar resultado da rodada (apenas admin)
  processRound: async (
    roomId: string,
    results: { teamId: string; won: boolean }[]
  ) => {
    const response = await api.post(`/rooms/${roomId}/process-round`, {
      results,
    });
    return response.data;
  },

  // Finalizar sala
  finish: async (roomId: string) => {
    const response = await api.put(`/rooms/${roomId}/finish`);
    return response.data;
  },

  // Excluir sala
  delete: async (roomId: string) => {
    const response = await api.delete(`/rooms/${roomId}`);
    return response.data;
  },
};

// ============= PLAYER ENDPOINTS =============

export const playerAPI = {
  // Obter jogador por ID
  getById: async (playerId: string) => {
    const response = await api.get(`/players/${playerId}`);
    return response.data;
  },

  // Obter jogadores de uma sala
  getByRoom: async (roomId: string) => {
    const response = await api.get(`/players/room/${roomId}`);
    return response.data;
  },

  // Atualizar status do jogador
  updateStatus: async (playerId: string, isEliminated: boolean) => {
    const response = await api.put(`/players/${playerId}/status`, {
      isEliminated,
    });
    return response.data;
  },
};

// ============= TEAM ENDPOINTS =============

export const teamAPI = {
  // Obter times por liga
  getByLeague: async (league: string) => {
    const response = await api.get(`/teams/league/${league}`);
    return response.data;
  },

  // Obter todos os times
  getAll: async () => {
    const response = await api.get("/teams");
    return response.data;
  },
};

// ============= STATS ENDPOINTS =============

export interface StatsData {
  activePlayers: number;
  totalPrize: number;
  currentRound: number;
  activeRooms: number;
  finishedRooms: number;
}

export const statsAPI = {
  // Obter estatísticas gerais da plataforma
  getStats: async (): Promise<StatsData> => {
    try {
      const response = await api.get("/stats");

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao buscar estatísticas");
      }

      return response.data.data;
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      // Retornar valores padrão em caso de erro
      return {
        activePlayers: 0,
        totalPrize: 0,
        currentRound: 0,
        activeRooms: 0,
        finishedRooms: 0,
      };
    }
  },
};

// ============= MATCH RESULTS ENDPOINTS (NOVO) =============

export interface MatchData {
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

export interface TeamData {
  id: string;
  name: string;
  alternateNames: string[];
  badge: string;
  stadium: string;
}

export interface MatchResultData {
  won: boolean;
  draw: boolean;
  finished: boolean;
  homeScore?: number;
  awayScore?: number;
  message: string;
}

export interface CheckerStatusData {
  isActive: boolean;
  checkInterval: string;
  activeRooms: number;
  lastCheck: string;
}

export interface RoundStatsData {
  total: number;
  finished: number;
  pending: number;
  percentComplete: number;
}

export interface ForceCheckRoomResponse {
  success: boolean;
  message: string;
  data?: {
    room?: {
      _id: string;
      name: string;
      status: string;
      currentRound: number;
    };
    processedPlayers?: number;
    eliminatedPlayers?: number;
  };
}

export const matchResultsAPI = {
  // Buscar partidas de uma rodada
  getMatchesByRound: async (
    league: string,
    round: number
  ): Promise<MatchData[]> => {
    try {
      const response = await api.get(
        `/match-results/matches/${league}/${round}`
      );
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error("Erro ao buscar partidas:", error);
      return [];
    }
  },

  // Buscar detalhes de uma partida
  getMatchDetails: async (matchId: string): Promise<MatchData | null> => {
    try {
      const response = await api.get(`/match-results/match/${matchId}`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error("Erro ao buscar detalhes da partida:", error);
      return null;
    }
  },

  // Buscar times de uma liga
  getTeamsByLeague: async (league: string): Promise<TeamData[]> => {
    try {
      const response = await api.get(`/match-results/teams/${league}`);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error("Erro ao buscar times:", error);
      return [];
    }
  },

  // Verificar resultado de uma partida para um time
  checkMatchResult: async (
    matchId: string,
    teamId: string
  ): Promise<MatchResultData | null> => {
    try {
      const response = await api.get(
        `/match-results/check/${matchId}/${teamId}`
      );
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error("Erro ao verificar resultado:", error);
      return null;
    }
  },

  // Buscar próximas partidas de um time
  getNextMatches: async (
    teamId: string,
    limit: number = 5
  ): Promise<MatchData[]> => {
    try {
      const response = await api.get(
        `/match-results/next/${teamId}?limit=${limit}`
      );
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error("Erro ao buscar próximas partidas:", error);
      return [];
    }
  },

  // Buscar últimas partidas de um time
  getLastMatches: async (
    teamId: string,
    limit: number = 5
  ): Promise<MatchData[]> => {
    try {
      const response = await api.get(
        `/match-results/last/${teamId}?limit=${limit}`
      );
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error("Erro ao buscar últimas partidas:", error);
      return [];
    }
  },

  // Forçar verificação manual de uma sala
  forceCheckRoom: async (roomId: string): Promise<ForceCheckRoomResponse> => {
    try {
      const response = await api.post(`/match-results/check-room/${roomId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao forçar verificação:", error);
      throw error;
    }
  },

  // Buscar status do verificador automático
  getCheckerStatus: async (): Promise<CheckerStatusData | null> => {
    try {
      const response = await api.get("/match-results/checker-status");
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error("Erro ao buscar status do verificador:", error);
      return null;
    }
  },

  // Verificar se rodada está completa
  checkRoundCompleted: async (
    league: string,
    round: number
  ): Promise<boolean> => {
    try {
      const matches = await matchResultsAPI.getMatchesByRound(league, round);

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
  },

  // Buscar partida de um time em uma rodada
  getTeamMatchInRound: async (
    league: string,
    round: number,
    teamId: string
  ): Promise<MatchData | null> => {
    try {
      const matches = await matchResultsAPI.getMatchesByRound(league, round);

      const teamMatch = matches.find(
        (match) => match.homeTeamId === teamId || match.awayTeamId === teamId
      );

      return teamMatch || null;
    } catch (error) {
      console.error("Erro ao buscar partida do time:", error);
      return null;
    }
  },

  // Calcular estatísticas de uma rodada
  getRoundStats: async (
    league: string,
    round: number
  ): Promise<RoundStatsData> => {
    try {
      const matches = await matchResultsAPI.getMatchesByRound(league, round);

      const total = matches.length;
      const finished = matches.filter(
        (match) =>
          match.status === "Match Finished" ||
          (match.homeScore !== null && match.awayScore !== null)
      ).length;
      const pending = total - finished;
      const percentComplete =
        total > 0 ? Math.round((finished / total) * 100) : 0;

      return {
        total,
        finished,
        pending,
        percentComplete,
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
  },

  // Verificar se um time venceu uma partida
  didTeamWin: (match: MatchData, teamId: string): boolean | null => {
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
  },

  // Formatar resultado de uma partida
  formatMatchResult: (match: MatchData): string => {
    if (match.homeScore === null || match.awayScore === null) {
      return "Partida não iniciada";
    }

    return `${match.homeTeamName} ${match.homeScore} x ${match.awayScore} ${match.awayTeamName}`;
  },
};

export default api;
