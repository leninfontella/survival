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
    }
    return response.data;
  },

  // Login
  login: async (data: { email: string; password: string }) => {
    const response = await api.post("/auth/login", data);
    if (response.data.success) {
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
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

  // Iniciar sala
  start: async (roomId: string) => {
    const response = await api.put(`/rooms/${roomId}/start`);
    return response.data;
  },
};

export default api;
