import { createContext, useContext, useState, ReactNode } from 'react';
import { Room, Player, Team, Round, PlayerSelection } from '@/types/game';

interface GameContextType {
  currentRoom: Room | null;
  players: Player[];
  currentPlayer: Player | null;
  rounds: Round[];
  teams: Team[];
  createRoom: (room: Omit<Room, 'id' | 'createdAt' | 'prizePool'>) => void;
  joinRoom: (roomId: string, playerName: string, lines: number) => void;
  selectTeam: (teamId: string) => void;
  startRoom: () => void;
  nextRound: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Mock brasileirão teams
const mockTeams: Team[] = [
  { id: '1', name: 'Flamengo', logo: '🔴⚫' },
  { id: '2', name: 'Palmeiras', logo: '🟢' },
  { id: '3', name: 'São Paulo', logo: '🔴⚪⚫' },
  { id: '4', name: 'Corinthians', logo: '⚪⚫' },
  { id: '5', name: 'Atlético-MG', logo: '⚪⚫' },
  { id: '6', name: 'Fluminense', logo: '🟢🔴⚪' },
  { id: '7', name: 'Botafogo', logo: '⚪⚫' },
  { id: '8', name: 'Internacional', logo: '🔴' },
  { id: '9', name: 'Grêmio', logo: '🔵⚫' },
  { id: '10', name: 'Santos', logo: '⚪⚫' },
];

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selections, setSelections] = useState<PlayerSelection[]>([]);

  const createRoom = (roomData: Omit<Room, 'id' | 'createdAt' | 'prizePool'>) => {
    const room: Room = {
      ...roomData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      prizePool: 0,
    };
    setCurrentRoom(room);
    
    // Create initial rounds
    const initialRounds: Round[] = Array.from({ length: room.totalRounds }, (_, i) => ({
      number: i + 1,
      status: i === 0 ? 'upcoming' : 'upcoming',
      deadline: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
      matches: [],
    }));
    setRounds(initialRounds);
  };

  const joinRoom = (roomId: string, playerName: string, lines: number) => {
    const player: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: playerName,
      lines,
      isEliminated: false,
      selectedTeams: [],
    };
    
    setPlayers(prev => [...prev, player]);
    setCurrentPlayer(player);
    
    if (currentRoom) {
      setCurrentRoom({
        ...currentRoom,
        prizePool: currentRoom.prizePool + (lines * currentRoom.entryPrice),
      });
    }
  };

  const selectTeam = (teamId: string) => {
    if (!currentPlayer || !currentRoom) return;
    
    const selection: PlayerSelection = {
      playerId: currentPlayer.id,
      teamId,
      round: currentRoom.currentRound,
    };
    
    setSelections(prev => [...prev, selection]);
    setCurrentPlayer({
      ...currentPlayer,
      selectedTeams: [...currentPlayer.selectedTeams, teamId],
    });
  };

  const startRoom = () => {
    if (!currentRoom) return;
    
    setCurrentRoom({
      ...currentRoom,
      status: 'active',
      currentRound: 1,
    });
    
    setRounds(prev => prev.map((round, idx) => 
      idx === 0 ? { ...round, status: 'selecting' } : round
    ));
  };

  const nextRound = () => {
    if (!currentRoom) return;
    
    const nextRoundNumber = currentRoom.currentRound + 1;
    
    if (nextRoundNumber > currentRoom.totalRounds) {
      setCurrentRoom({ ...currentRoom, status: 'finished' });
      return;
    }
    
    setCurrentRoom({
      ...currentRoom,
      currentRound: nextRoundNumber,
    });
    
    setRounds(prev => prev.map(round => {
      if (round.number === nextRoundNumber) {
        return { ...round, status: 'selecting' };
      }
      if (round.number === currentRoom.currentRound) {
        return { ...round, status: 'finished' };
      }
      return round;
    }));
  };

  return (
    <GameContext.Provider
      value={{
        currentRoom,
        players,
        currentPlayer,
        rounds,
        teams: mockTeams,
        createRoom,
        joinRoom,
        selectTeam,
        startRoom,
        nextRound,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
