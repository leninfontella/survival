export type League =
  | "brasil"
  | "espanha"
  | "inglaterra"
  | "alemanha"
  | "italia"
  | "franca";

// 🆕 ATUALIZADO: Interface Match expandida
export interface Match {
  _id: string;
  id: string;
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
  date: string | Date;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  statusDetail?: {
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
  lastUpdated?: string;
}

// 🆕 ATUALIZADO: Interface Room expandida
export interface Room {
  _id?: string;
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
  createdAt: Date | string;
  startedAt?: Date | string;
  finishedAt?: Date | string;
  isPrivate?: boolean;
  winner?: string;
  players?: Player[];
  // 🆕 NOVO: Rodadas com partidas
  rounds?: Array<{
    roundNumber: number;
    status: "upcoming" | "selecting" | "playing" | "finished";
    matches: Match[];
    selectionDeadline?: string | Date;
    startDate?: string | Date;
    endDate?: string | Date;
    processed?: boolean;
    processedAt?: string | Date;
  }>;
}

// 🆕 ATUALIZADO: Interface Player expandida
export interface Player {
  _id?: string;
  id: string;
  roomId: string;
  name: string;
  isEliminated: boolean;
  isReady?: boolean;
  eliminatedAt?: Date | string;
  eliminatedRound?: number;
  user?:
    | {
        _id: string;
        id?: string;
        name?: string;
        email?: string;
      }
    | string;
  // 🆕 ATUALIZADO: selectedTeams expandido
  selectedTeams: Array<{
    teamId: string;
    teamName: string;
    apiTeamId?: number;
    round: number;
    match?: string; // ID da partida
    matchInfo?: {
      opponent: string;
      isHome: boolean;
      date: string | Date;
    };
    won: boolean | null;
    result?: {
      yourTeamGoals: number | null;
      opponentGoals: number | null;
      matchStatus: string;
    };
    selectedAt?: Date | string;
  }>;
  paymentStatus?: "pending" | "paid" | "refunded";
  joinedAt?: Date | string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  league: League;
  apiTeamId?: number;
}

// 🆕 ATUALIZADO: Interface Round expandida
export interface Round {
  number: number;
  status: "upcoming" | "selecting" | "playing" | "finished";
  deadline: Date | string;
  matches: Match[];
  selectionDeadline?: Date | string;
  startDate?: Date | string;
  endDate?: Date | string;
  processed?: boolean;
}

export interface PlayerSelection {
  playerId: string;
  teamId: string;
  teamName: string;
  round: number;
  matchId?: string;
  apiTeamId?: number;
  won?: boolean | null;
}

// 🆕 NOVO: Interfaces para respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface MatchWithAvailability extends Match {
  homeTeam: Match["homeTeam"] & {
    canSelect?: boolean;
    used?: boolean;
  };
  awayTeam: Match["awayTeam"] & {
    canSelect?: boolean;
    used?: boolean;
  };
  hasAvailableTeam?: boolean;
}

export interface RoomWithMatches extends Room {
  rounds: Array<{
    roundNumber: number;
    status: "upcoming" | "selecting" | "playing" | "finished";
    matches: Match[];
    selectionDeadline?: string | Date;
    startDate?: string | Date;
    endDate?: string | Date;
    processed?: boolean;
  }>;
}

// 🆕 NOVO: Stats da API-Football
export interface MatchStats {
  total: number;
  live: number;
  finished: number;
  scheduled: number;
  postponed: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  progress: number;
}
