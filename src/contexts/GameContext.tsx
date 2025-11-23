import { createContext, useContext, useState, ReactNode } from "react";
import {
  Room,
  Player,
  Team,
  Round,
  PlayerSelection,
  League,
} from "@/types/game";

interface GameContextType {
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
  getTeamsByLeague: (league: League) => Team[];
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Mock teams for all leagues
const allTeams: Team[] = [
  // Brasil
  { id: "br1", name: "Flamengo", logo: "🔴⚫", league: "brasil" },
  { id: "br2", name: "Palmeiras", logo: "🟢", league: "brasil" },
  { id: "br3", name: "São Paulo", logo: "🔴⚪⚫", league: "brasil" },
  { id: "br4", name: "Corinthians", logo: "⚪⚫", league: "brasil" },
  { id: "br5", name: "Atlético-MG", logo: "⚪⚫", league: "brasil" },
  { id: "br6", name: "Fluminense", logo: "🟢🔴⚪", league: "brasil" },
  { id: "br7", name: "Botafogo", logo: "⚪⚫", league: "brasil" },
  { id: "br8", name: "Internacional", logo: "🔴", league: "brasil" },
  { id: "br9", name: "Grêmio", logo: "🔵⚫", league: "brasil" },
  { id: "br10", name: "Santos", logo: "⚪⚫", league: "brasil" },

  // Espanha (La Liga)
  { id: "es1", name: "Real Madrid", logo: "⚪", league: "espanha" },
  { id: "es2", name: "Barcelona", logo: "🔵🔴", league: "espanha" },
  { id: "es3", name: "Atlético Madrid", logo: "🔴⚪", league: "espanha" },
  { id: "es4", name: "Sevilla", logo: "⚪🔴", league: "espanha" },
  { id: "es5", name: "Real Betis", logo: "🟢⚪", league: "espanha" },
  { id: "es6", name: "Valencia", logo: "⚪🟠", league: "espanha" },
  { id: "es7", name: "Villarreal", logo: "🟡", league: "espanha" },
  { id: "es8", name: "Real Sociedad", logo: "🔵⚪", league: "espanha" },
  { id: "es9", name: "Athletic Bilbao", logo: "🔴⚪", league: "espanha" },
  { id: "es10", name: "Girona", logo: "🔴⚪", league: "espanha" },

  // Inglaterra (Premier League)
  { id: "en1", name: "Manchester City", logo: "🔵", league: "inglaterra" },
  { id: "en2", name: "Arsenal", logo: "🔴⚪", league: "inglaterra" },
  { id: "en3", name: "Liverpool", logo: "🔴", league: "inglaterra" },
  { id: "en4", name: "Manchester United", logo: "🔴", league: "inglaterra" },
  { id: "en5", name: "Chelsea", logo: "🔵", league: "inglaterra" },
  { id: "en6", name: "Tottenham", logo: "⚪", league: "inglaterra" },
  { id: "en7", name: "Newcastle", logo: "⚪⚫", league: "inglaterra" },
  { id: "en8", name: "Aston Villa", logo: "🟣", league: "inglaterra" },
  { id: "en9", name: "Brighton", logo: "🔵⚪", league: "inglaterra" },
  { id: "en10", name: "West Ham", logo: "🟣", league: "inglaterra" },

  // Alemanha (Bundesliga)
  { id: "de1", name: "Bayern München", logo: "🔴⚪", league: "alemanha" },
  { id: "de2", name: "Borussia Dortmund", logo: "🟡⚫", league: "alemanha" },
  { id: "de3", name: "RB Leipzig", logo: "🔴⚪", league: "alemanha" },
  { id: "de4", name: "Bayer Leverkusen", logo: "🔴⚫", league: "alemanha" },
  { id: "de5", name: "Union Berlin", logo: "🔴⚪", league: "alemanha" },
  {
    id: "de6",
    name: "Eintracht Frankfurt",
    logo: "🔴⚫⚪",
    league: "alemanha",
  },
  { id: "de7", name: "Wolfsburg", logo: "🟢⚪", league: "alemanha" },
  {
    id: "de8",
    name: "Borussia M'gladbach",
    logo: "⚪⚫🟢",
    league: "alemanha",
  },
  { id: "de9", name: "Stuttgart", logo: "🔴⚪", league: "alemanha" },
  { id: "de10", name: "Freiburg", logo: "🔴⚫", league: "alemanha" },

  // Itália (Serie A)
  { id: "it1", name: "Inter Milan", logo: "🔵⚫", league: "italia" },
  { id: "it2", name: "AC Milan", logo: "🔴⚫", league: "italia" },
  { id: "it3", name: "Juventus", logo: "⚪⚫", league: "italia" },
  { id: "it4", name: "Napoli", logo: "🔵", league: "italia" },
  { id: "it5", name: "Roma", logo: "🔴🟡", league: "italia" },
  { id: "it6", name: "Lazio", logo: "🔵⚪", league: "italia" },
  { id: "it7", name: "Atalanta", logo: "🔵⚫", league: "italia" },
  { id: "it8", name: "Fiorentina", logo: "🟣", league: "italia" },
  { id: "it9", name: "Torino", logo: "🟤", league: "italia" },
  { id: "it10", name: "Bologna", logo: "🔴🔵", league: "italia" },

  // França (Ligue 1)
  { id: "fr1", name: "Paris Saint-Germain", logo: "🔴🔵", league: "franca" },
  { id: "fr2", name: "Marseille", logo: "🔵⚪", league: "franca" },
  { id: "fr3", name: "Monaco", logo: "🔴⚪", league: "franca" },
  { id: "fr4", name: "Lyon", logo: "🔴🔵⚪", league: "franca" },
  { id: "fr5", name: "Lille", logo: "🔴⚪", league: "franca" },
  { id: "fr6", name: "Nice", logo: "🔴⚫", league: "franca" },
  { id: "fr7", name: "Lens", logo: "🟡🔴", league: "franca" },
  { id: "fr8", name: "Rennes", logo: "🔴⚫", league: "franca" },
  { id: "fr9", name: "Strasbourg", logo: "🔵⚪", league: "franca" },
  { id: "fr10", name: "Montpellier", logo: "🔵🟠", league: "franca" },
];

export function GameProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selections, setSelections] = useState<PlayerSelection[]>([]);

  const getTeamsByLeague = (league: League) => {
    return allTeams.filter((team) => team.league === league);
  };

  const createRoom = (
    roomData: Omit<Room, "id" | "createdAt" | "prizePool">
  ) => {
    const room: Room = {
      ...roomData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      prizePool: roomData.minPlayers * roomData.entryPrice,
    };
    setRooms((prev) => [...prev, room]);
    setCurrentRoom(room);

    // Create initial rounds
    const initialRounds: Round[] = Array.from(
      { length: room.totalRounds },
      (_, i) => ({
        number: i + 1,
        status: i === 0 ? "upcoming" : "upcoming",
        deadline: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        matches: [],
      })
    );
    setRounds(initialRounds);

    return room;
  };

  const joinRoom = (roomId: string, playerName: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    const player: Player = {
      id: Math.random().toString(36).substr(2, 9),
      roomId: roomId,
      name: playerName,
      isEliminated: false,
      selectedTeams: [],
    };

    setPlayers((prev) => [...prev, player]);
    setCurrentPlayer(player);
    setCurrentRoom(room);
  };

  const selectTeam = (teamId: string) => {
    if (!currentPlayer || !currentRoom) return;

    const selection: PlayerSelection = {
      playerId: currentPlayer.id,
      teamId,
      round: currentRoom.currentRound,
    };

    setSelections((prev) => [...prev, selection]);
    setCurrentPlayer({
      ...currentPlayer,
      selectedTeams: [...currentPlayer.selectedTeams, teamId],
    });
  };

  const startRoom = () => {
    if (!currentRoom) return;

    const updatedRoom = {
      ...currentRoom,
      status: "active" as const,
      currentRound: 1,
    };
    setCurrentRoom(updatedRoom);
    setRooms((prev) =>
      prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
    );

    setRounds((prev) =>
      prev.map((round, idx) =>
        idx === 0 ? { ...round, status: "selecting" as const } : round
      )
    );
  };

  const nextRound = () => {
    if (!currentRoom) return;

    const nextRoundNumber = currentRoom.currentRound + 1;

    if (nextRoundNumber > currentRoom.totalRounds) {
      const finishedRoom = { ...currentRoom, status: "finished" as const };
      setCurrentRoom(finishedRoom);
      setRooms((prev) =>
        prev.map((r) => (r.id === finishedRoom.id ? finishedRoom : r))
      );
      return;
    }

    const updatedRoom = {
      ...currentRoom,
      currentRound: nextRoundNumber,
    };
    setCurrentRoom(updatedRoom);
    setRooms((prev) =>
      prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
    );

    setRounds((prev) =>
      prev.map((round) => {
        if (round.number === nextRoundNumber) {
          return { ...round, status: "selecting" as const };
        }
        if (round.number === currentRoom.currentRound) {
          return { ...round, status: "finished" as const };
        }
        return round;
      })
    );
  };

  return (
    <GameContext.Provider
      value={{
        rooms,
        currentRoom,
        players,
        currentPlayer,
        rounds,
        teams: allTeams,
        createRoom,
        joinRoom,
        selectTeam,
        startRoom,
        nextRound,
        getTeamsByLeague,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
};
