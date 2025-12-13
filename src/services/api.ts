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

// ============= TYPES =============

export interface AppConfig {
  version: string;
  leagues: { id: string; name: string; logo?: string }[];
  // Outras configurações relevantes da aplicação
}

export interface Match {
  _id: string;
  apiMatchId: number;
  league: string;
  round: number;
  homeTeam: {
    apiTeamId: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    apiTeamId: number;
    name: string;
    logo: string;
  };
  date: string;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  statusDetail: {
    short: string;
    long: string;
    elapsed?: number;
  };
  result: {
    home: number | null;
    away: number | null;
    winner: "home" | "away" | "draw" | null;
  };
  venue?: {
    name: string;
    city: string;
  };
  lastUpdated: string;
}

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

  // 🆕 ATUALIZADO: Selecionar time com dados da partida
  selectTeam: async (
    roomId: string,
    teamId: string,
    teamName: string,
    matchId?: string,
    apiTeamId?: number
  ) => {
    const response = await api.post(`/rooms/${roomId}/select-team`, {
      teamId,
      teamName,
      matchId,
      apiTeamId,
    });
    return response.data;
  },

  // Obter times já usados pelo jogador
  getUsedTeams: async (roomId: string) => {
    const response = await api.get(`/rooms/${roomId}/used-teams`);
    return response.data;
  },

  // Obter partidas disponíveis para seleção
  getAvailableMatches: async (roomId: string) => {
    const response = await api.get(`/rooms/${roomId}/available-matches`);
    return response.data;
  },

  // Forçar atualização das partidas da rodada
  updateMatches: async (roomId: string) => {
    const response = await api.put(`/rooms/${roomId}/update-matches`);
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

// ============= 🆕 MATCH ENDPOINTS =============

export const matchAPI = {
  /**
   * Buscar partidas de uma rodada específica
   */
  getByRound: async (league: string, round: number, forceSync = false) => {
    const params = new URLSearchParams();
    if (forceSync) params.append("forceSync", "true");

    const response = await api.get(
      `/matches/round/${round}/league/${league}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Buscar partidas ao vivo de uma liga
   */
  getLive: async (league: string) => {
    const response = await api.get(`/matches/live/${league}`);
    return response.data;
  },

  /**
   * Buscar uma partida específica por ID
   */
  getById: async (matchId: string) => {
    const response = await api.get(`/matches/${matchId}`);
    return response.data;
  },

  /**
   * Atualizar resultado de uma partida
   */
  updateResult: async (matchId: string) => {
    const response = await api.put(`/matches/${matchId}/update`);
    return response.data;
  },

  /**
   * Sincronizar partidas de uma rodada com a API
   */
  sync: async (league: string, round: number) => {
    const response = await api.post("/matches/sync", { league, round });
    return response.data;
  },

  /**
   * Buscar próximas partidas de uma liga
   */
  getUpcoming: async (league: string, limit = 10) => {
    const response = await api.get(
      `/matches/upcoming/${league}?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Buscar partidas de um time específico
   */
  getByTeam: async (teamId: number, league?: string, round?: number) => {
    const params = new URLSearchParams();
    if (league) params.append("league", league);
    if (round) params.append("round", round.toString());

    const response = await api.get(
      `/matches/team/${teamId}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obter estatísticas das partidas
   */
  getStats: async (league: string) => {
    const response = await api.get(`/matches/stats/${league}`);
    return response.data;
  },
};

// ============= CONFIG ENDPOINTS =============

export const configAPI = {
  /**
   * Obter configuração pública da aplicação
   */
  getConfig: async (): Promise<AppConfig> => {
    try {
      const response = await api.get("/config");

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Erro ao buscar configuração da aplicação"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Erro ao buscar configuração:", error);
      // Retornar valores padrão em caso de erro
      return {
        version: "0.0.0",
        leagues: [],
      };
    }
  },
};

export default api;