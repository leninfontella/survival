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
}

export interface Player {
  id: string;
  name: string;
  lines: number;
  isEliminated: boolean;
  selectedTeams: string[];
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  league: League;
}

export interface Round {
  number: number;
  status: "upcoming" | "selecting" | "playing" | "finished";
  deadline: Date;
  matches: Match[];
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  result?: "home" | "away" | "draw";
  date: Date;
}

export interface PlayerSelection {
  playerId: string;
  teamId: string;
  round: number;
}
