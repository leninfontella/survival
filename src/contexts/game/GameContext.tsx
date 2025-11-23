import { createContext } from "react";
import { Room, Player, Team, Round, League } from "@/types/game";

export interface GameContextType {
  rooms: Room[];
  currentRoom: Room | null;
  players: Player[];
  currentPlayer: Player | null;
  rounds: Round[];
  teams: Team[];
  createRoom: (room: Omit<Room, "id" | "createdAt" | "prizePool">) => Room;
  joinRoom: (roomId: string, playerName: string) => void;
  selectTeam: (teamId: string) => void;
  startRoom: () => void;
  nextRound: () => void;
  processRoundResults: (results: { playerId: string; won: boolean }[]) => void;
  getTeamsByLeague: (league: League) => Team[];
}

export const GameContext = createContext<GameContextType | undefined>(
  undefined
);
