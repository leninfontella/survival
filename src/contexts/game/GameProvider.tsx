import { useState, ReactNode } from "react";
import { GameContext } from "./GameContext";
import {
  Room,
  Player,
  Team,
  Round,
  PlayerSelection,
  League,
} from "@/types/game";

// Mock teams for all leagues with badge URLs
const allTeams: Team[] = [
  // Brasil
  {
    id: "br1",
    name: "Flamengo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Flamengo-RJ_%28BRA%29.png",
    league: "brasil",
  },
  {
    id: "br2",
    name: "Palmeiras",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg",
    league: "brasil",
  },
  {
    id: "br3",
    name: "São Paulo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg",
    league: "brasil",
  },
  {
    id: "br4",
    name: "Corinthians",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Corinthians_oficial_symbol.png",
    league: "brasil",
  },
  {
    id: "br5",
    name: "Atlético-MG",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Atletico_mineiro_galo.png",
    league: "brasil",
  },
  {
    id: "br6",
    name: "Fluminense",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Fluminense_FC_escudo.png",
    league: "brasil",
  },
  {
    id: "br7",
    name: "Botafogo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Botafogo_de_Futebol_e_Regatas_logo.svg",
    league: "brasil",
  },
  {
    id: "br8",
    name: "Internacional",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg",
    league: "brasil",
  },
  {
    id: "br9",
    name: "Grêmio",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Gremio.svg",
    league: "brasil",
  },
  {
    id: "br10",
    name: "Santos",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/35/Santos_logo.svg",
    league: "brasil",
  },

  // Espanha (La Liga)
  {
    id: "es1",
    name: "Real Madrid",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
    league: "espanha",
  },
  {
    id: "es2",
    name: "Barcelona",
    logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
    league: "espanha",
  },
  {
    id: "es3",
    name: "Atlético Madrid",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg",
    league: "espanha",
  },
  {
    id: "es4",
    name: "Sevilla",
    logo: "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg",
    league: "espanha",
  },
  {
    id: "es5",
    name: "Real Betis",
    logo: "https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg",
    league: "espanha",
  },
  {
    id: "es6",
    name: "Valencia",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg",
    league: "espanha",
  },
  {
    id: "es7",
    name: "Villarreal",
    logo: "https://upload.wikimedia.org/wikipedia/en/b/b9/Villarreal_CF_logo-en.svg",
    league: "espanha",
  },
  {
    id: "es8",
    name: "Real Sociedad",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg",
    league: "espanha",
  },
  {
    id: "es9",
    name: "Athletic Bilbao",
    logo: "https://upload.wikimedia.org/wikipedia/en/9/98/Club_Athletic_Bilbao_logo.svg",
    league: "espanha",
  },
  {
    id: "es10",
    name: "Girona",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/79/Girona_FC_logo.svg",
    league: "espanha",
  },

  // Inglaterra (Premier League)
  {
    id: "en1",
    name: "Manchester City",
    logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
    league: "inglaterra",
  },
  {
    id: "en2",
    name: "Arsenal",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
    league: "inglaterra",
  },
  {
    id: "en3",
    name: "Liverpool",
    logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
    league: "inglaterra",
  },
  {
    id: "en4",
    name: "Manchester United",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
    league: "inglaterra",
  },
  {
    id: "en5",
    name: "Chelsea",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
    league: "inglaterra",
  },
  {
    id: "en6",
    name: "Tottenham",
    logo: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
    league: "inglaterra",
  },
  {
    id: "en7",
    name: "Newcastle",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg",
    league: "inglaterra",
  },
  {
    id: "en8",
    name: "Aston Villa",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg",
    league: "inglaterra",
  },
  {
    id: "en9",
    name: "Brighton",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg",
    league: "inglaterra",
  },
  {
    id: "en10",
    name: "West Ham",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg",
    league: "inglaterra",
  },

  // Alemanha (Bundesliga)
  {
    id: "de1",
    name: "Bayern München",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
    league: "alemanha",
  },
  {
    id: "de2",
    name: "Borussia Dortmund",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
    league: "alemanha",
  },
  {
    id: "de3",
    name: "RB Leipzig",
    logo: "https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg",
    league: "alemanha",
  },
  {
    id: "de4",
    name: "Bayer Leverkusen",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg",
    league: "alemanha",
  },
  {
    id: "de5",
    name: "Union Berlin",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/1._FC_Union_Berlin_Logo.svg",
    league: "alemanha",
  },
  {
    id: "de6",
    name: "Eintracht Frankfurt",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/Eintracht_Frankfurt_Logo.svg",
    league: "alemanha",
  },
  {
    id: "de7",
    name: "Wolfsburg",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Logo-VfL-Wolfsburg.svg",
    league: "alemanha",
  },
  {
    id: "de8",
    name: "Borussia M'gladbach",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/81/Borussia_M%C3%B6nchengladbach_logo.svg",
    league: "alemanha",
  },
  {
    id: "de9",
    name: "Stuttgart",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/VfB_Stuttgart_1893_Logo.svg",
    league: "alemanha",
  },
  {
    id: "de10",
    name: "Freiburg",
    logo: "https://upload.wikimedia.org/wikipedia/en/1/11/SC_Freiburg_logo.svg",
    league: "alemanha",
  },

  // Itália (Serie A)
  {
    id: "it1",
    name: "Inter Milan",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg",
    league: "italia",
  },
  {
    id: "it2",
    name: "AC Milan",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg",
    league: "italia",
  },
  {
    id: "it3",
    name: "Juventus",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_logo.svg",
    league: "italia",
  },
  {
    id: "it4",
    name: "Napoli",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Neapel.svg",
    league: "italia",
  },
  {
    id: "it5",
    name: "Roma",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg",
    league: "italia",
  },
  {
    id: "it6",
    name: "Lazio",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/ce/S.S._Lazio_badge.svg",
    league: "italia",
  },
  {
    id: "it7",
    name: "Atalanta",
    logo: "https://upload.wikimedia.org/wikipedia/en/6/66/Atalanta_BC_logo.svg",
    league: "italia",
  },
  {
    id: "it8",
    name: "Fiorentina",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Logo_Fiorentina.svg",
    league: "italia",
  },
  {
    id: "it9",
    name: "Torino",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/2e/Torino_FC_Logo.svg",
    league: "italia",
  },
  {
    id: "it10",
    name: "Bologna",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Bologna_FC_1909_logo.svg",
    league: "italia",
  },

  // França (Ligue 1)
  {
    id: "fr1",
    name: "Paris Saint-Germain",
    logo: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg",
    league: "franca",
  },
  {
    id: "fr2",
    name: "Marseille",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg",
    league: "franca",
  },
  {
    id: "fr3",
    name: "Monaco",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Logo_AS_Monaco_FC_%282013%29.svg",
    league: "franca",
  },
  {
    id: "fr4",
    name: "Lyon",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Olympique_lyonnais_%28logo%29.svg",
    league: "franca",
  },
  {
    id: "fr5",
    name: "Lille",
    logo: "https://upload.wikimedia.org/wikipedia/en/6/61/Lille_OSC_%28logo%29.svg",
    league: "franca",
  },
  {
    id: "fr6",
    name: "Nice",
    logo: "https://upload.wikimedia.org/wikipedia/en/a/a4/OGC_Nice_logo.svg",
    league: "franca",
  },
  {
    id: "fr7",
    name: "Lens",
    logo: "https://upload.wikimedia.org/wikipedia/en/b/b9/RC_Lens_logo.svg",
    league: "franca",
  },
  {
    id: "fr8",
    name: "Rennes",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/22/Stade_Rennais_FC.svg",
    league: "franca",
  },
  {
    id: "fr9",
    name: "Strasbourg",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/74/Racing_Club_de_Strasbourg_Alsace_logo.svg",
    league: "franca",
  },
  {
    id: "fr10",
    name: "Montpellier",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_Montpellier_HSC_-_2000.svg",
    league: "franca",
  },
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

    const updatedPlayer = {
      ...currentPlayer,
      selectedTeams: [...currentPlayer.selectedTeams, teamId],
    };

    setCurrentPlayer(updatedPlayer);
    setPlayers((prev) =>
      prev.map((p) => (p.id === currentPlayer.id ? updatedPlayer : p))
    );
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

  const processRoundResults = (
    results: { playerId: string; won: boolean }[]
  ) => {
    // Eliminate players who didn't win
    setPlayers((prev) =>
      prev.map((player) => {
        const result = results.find((r) => r.playerId === player.id);
        if (result && !result.won) {
          return { ...player, isEliminated: true };
        }
        return player;
      })
    );

    // Update current player if eliminated
    if (currentPlayer) {
      const playerResult = results.find((r) => r.playerId === currentPlayer.id);
      if (playerResult && !playerResult.won) {
        setCurrentPlayer({ ...currentPlayer, isEliminated: true });
      }
    }
  };

  const nextRound = () => {
    if (!currentRoom) return;

    const nextRoundNumber = currentRoom.currentRound + 1;

    // Mark current round as finished
    setRounds((prev) =>
      prev.map((round) => {
        if (round.number === currentRoom.currentRound) {
          return { ...round, status: "finished" as const };
        }
        return round;
      })
    );

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
        processRoundResults,
        getTeamsByLeague,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
