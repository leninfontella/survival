export type League =
  | "brasil"
  | "espanha"
  | "inglaterra"
  | "alemanha"
  | "italia"
  | "franca";

export interface Room {
  id: string;
  name: string;
  league: League;
  status: "waiting" | "active" | "finished";
  currentRound: number;
  totalRounds: number;
  minPlayers: number;
  entryPrice: number;
  prizePool: number;
  createdBy: string;
  createdAt: Date;
  // 🆕 Novos campos para resultados
  lastResultsCheck?: Date;
  autoAdvanceEnabled?: boolean;
  roundsData?: RoundData[];
}

export interface Player {
  id: string;
  roomId: string;
  name: string;
  isEliminated: boolean;
  eliminatedAt?: Date;
  eliminationRound?: number;
  selectedTeams: PlayerSelection[];
  // 🆕 Métodos auxiliares
  isReady?: boolean;
}

export interface PlayerSelection {
  teamId: string;
  teamName: string;
  round: number;
  won: boolean | null; // null = aguardando resultado
  selectedAt: Date;
  // 🆕 Resultado da partida
  matchResult?: MatchResult;
}

export interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  verifiedAt?: Date;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  league: League;
  // 🆕 Dados adicionais da API
  alternateNames?: string[];
  badge?: string;
  stadium?: string;
}

export interface Round {
  number: number;
  status: "upcoming" | "selecting" | "playing" | "finished";
  deadline: Date;
  matches: Match[];
  // 🆕 Dados de controle
  startedAt?: Date;
  completedAt?: Date;
  matchesFinished?: boolean;
}

export interface RoundData {
  round: number;
  startedAt: Date;
  completedAt?: Date;
  matchesFinished: boolean;
  survivors: number;
  eliminated: number;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  result?: "home" | "away" | "draw";
  status?: string; // "Match Finished", "Not Started", etc
  date: Date;
  time?: string;
  round?: number;
  season?: string;
}

// 🆕 Interface expandida para API externa
export interface MatchAPI {
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

// 🆕 Estatísticas de rodada
export interface RoundStats {
  total: number;
  finished: number;
  pending: number;
  percentComplete: number;
}

// 🆕 Status do verificador
export interface CheckerStatus {
  isActive: boolean;
  checkInterval: string;
  activeRooms: number;
  lastCheck: string;
}

// 🆕 Resultado de verificação
export interface MatchCheckResult {
  won: boolean;
  draw: boolean;
  finished: boolean;
  homeScore?: number;
  awayScore?: number;
  message: string;
}

// 🆕 Tipos auxiliares para hooks
export interface UseMatchResultsOptions {
  roomId: string;
  league: string;
  currentRound: number;
  selectedTeamId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface MatchResultsState {
  matches: MatchAPI[];
  teamMatch: MatchAPI | null;
  isRoundComplete: boolean;
  teamResult: boolean | null;
  loading: boolean;
  error: string | null;
  stats: RoundStats;
}

// 🆕 ADICIONAR ESTAS INTERFACES NO FINAL DO ARQUIVO

// Interface para partida da API com disponibilidade
export interface AvailableMatch {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    canSelect: boolean;
    used: boolean;
  };
  awayTeam: {
    id: string;
    name: string;
    canSelect: boolean;
    used: boolean;
  };
  date: string;
  time: string;
  status: string;
  round: number;
  season: string;
  hasAvailableTeam: boolean; // Se pelo menos um time pode ser selecionado
}

// Resposta da API de partidas disponíveis
export interface AvailableMatchesResponse {
  success: boolean;
  data: {
    matches: AvailableMatch[];
    round: number;
    totalRounds: number;
    usedTeams: string[];
    league: string;
    roomName: string;
  };
}

// Interface para seleção com matchId
export interface TeamSelection {
  teamId: string;
  teamName: string;
  matchId?: string;
  round: number;
}

// Tipos existentes mantidos para compatibilidade
export type GameStatus = "waiting" | "active" | "finished";
export type RoundStatus = "upcoming" | "selecting" | "playing" | "finished";
export type MatchResultType = "home" | "away" | "draw";
