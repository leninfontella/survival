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

// Teams for all leagues with badge URLs from Wikipedia
const allTeams: Team[] = [
  // 🇧🇷 Brasileirão – Série A (2025)
  {
    id: "br1",
    name: "Atlético-MG",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Atletico_mineiro_galo.png",
    league: "brasil",
  },
  {
    id: "br2",
    name: "Bahia",
    logo: "https://upload.wikimedia.org/wikipedia/en/b/b6/EsporteClubeBahiaLogo.svg",
    league: "brasil",
  },
  {
    id: "br3",
    name: "Botafogo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Botafogo_de_Futebol_e_Regatas_logo.svg",
    league: "brasil",
  },
  {
    id: "br4",
    name: "Red Bull Bragantino",
    logo: "https://upload.wikimedia.org/wikipedia/en/9/98/RedBullBragantino.svg",
    league: "brasil",
  },
  {
    id: "br5",
    name: "Ceará",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/35/Cear%C3%A1_Sporting_Club_%28Logo%29.png",
    league: "brasil",
  },
  {
    id: "br6",
    name: "Corinthians",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Corinthians_oficial_symbol.png",
    league: "brasil",
  },
  {
    id: "br7",
    name: "Cruzeiro",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/90/Cruzeiro_Esporte_Clube_%28Logo%29.png",
    league: "brasil",
  },
  {
    id: "br8",
    name: "Flamengo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Flamengo-RJ_%28BRA%29.png",
    league: "brasil",
  },
  {
    id: "br9",
    name: "Fluminense",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Fluminense_FC_escudo.png",
    league: "brasil",
  },
  {
    id: "br10",
    name: "Fortaleza",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/40/FortalezaEsporteClube.svg",
    league: "brasil",
  },
  {
    id: "br11",
    name: "Grêmio",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Gremio.svg",
    league: "brasil",
  },
  {
    id: "br12",
    name: "Internacional",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg",
    league: "brasil",
  },
  {
    id: "br13",
    name: "Juventude",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/95/EsporteJuventude.svg",
    league: "brasil",
  },
  {
    id: "br14",
    name: "Mirassol",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Mirassol_FC.png",
    league: "brasil",
  },
  {
    id: "br15",
    name: "Palmeiras",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg",
    league: "brasil",
  },
  {
    id: "br16",
    name: "Santos",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/35/Santos_logo.svg",
    league: "brasil",
  },
  {
    id: "br17",
    name: "São Paulo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg",
    league: "brasil",
  },
  {
    id: "br18",
    name: "Sport",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/17/Sport_Club_do_Recife_-_PE_-_Brasil.png",
    league: "brasil",
  },
  {
    id: "br19",
    name: "Vasco da Gama",
    logo: "https://upload.wikimedia.org/wikipedia/de/a/ac/Vasco_da_Gama_Logo.svg",
    league: "brasil",
  },
  {
    id: "br20",
    name: "Vitória",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/EClubevitoria.png",
    league: "brasil",
  },

  // 🇪🇸 La Liga (Espanha – 2024/25)
  {
    id: "es1",
    name: "Alavés",
    logo: "https://upload.wikimedia.org/wikipedia/en/6/69/Deportivo_Alaves_logo.svg",
    league: "espanha",
  },
  {
    id: "es2",
    name: "Athletic Bilbao",
    logo: "https://upload.wikimedia.org/wikipedia/en/9/98/Club_Athletic_Bilbao_logo.svg",
    league: "espanha",
  },
  {
    id: "es3",
    name: "Atlético de Madrid",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg",
    league: "espanha",
  },
  {
    id: "es4",
    name: "Barcelona",
    logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
    league: "espanha",
  },
  {
    id: "es5",
    name: "Celta de Vigo",
    logo: "https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg",
    league: "espanha",
  },
  {
    id: "es6",
    name: "Espanyol",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f8/RCD_Espanyol_logo.svg",
    league: "espanha",
  },
  {
    id: "es7",
    name: "Getafe",
    logo: "https://upload.wikimedia.org/wikipedia/en/4/46/Getafe_logo.svg",
    league: "espanha",
  },
  {
    id: "es8",
    name: "Girona",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/79/Girona_FC_logo.svg",
    league: "espanha",
  },
  {
    id: "es9",
    name: "Las Palmas",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/20/UD_Las_Palmas_logo.svg",
    league: "espanha",
  },
  {
    id: "es10",
    name: "Leganés",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f8/CD_Legan%C3%A9s_logo.svg",
    league: "espanha",
  },
  {
    id: "es11",
    name: "Mallorca",
    logo: "https://upload.wikimedia.org/wikipedia/en/e/e0/RCD_Mallorca.svg",
    league: "espanha",
  },
  {
    id: "es12",
    name: "Osasuna",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/c3/Club_Atletico_Osasuna_logo.svg",
    league: "espanha",
  },
  {
    id: "es13",
    name: "Rayo Vallecano",
    logo: "https://upload.wikimedia.org/wikipedia/en/6/6b/Rayo_Vallecano_logo.svg",
    league: "espanha",
  },
  {
    id: "es14",
    name: "Real Betis",
    logo: "https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg",
    league: "espanha",
  },
  {
    id: "es15",
    name: "Real Madrid",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
    league: "espanha",
  },
  {
    id: "es16",
    name: "Real Sociedad",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg",
    league: "espanha",
  },
  {
    id: "es17",
    name: "Sevilla",
    logo: "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg",
    league: "espanha",
  },
  {
    id: "es18",
    name: "Valencia",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg",
    league: "espanha",
  },
  {
    id: "es19",
    name: "Valladolid",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/Real_Valladolid_Logo.svg",
    league: "espanha",
  },
  {
    id: "es20",
    name: "Villarreal",
    logo: "https://upload.wikimedia.org/wikipedia/en/b/b9/Villarreal_CF_logo-en.svg",
    league: "espanha",
  },

  // 🏴 Premier League (Inglaterra)
  {
    id: "en1",
    name: "Arsenal",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
    league: "inglaterra",
  },
  {
    id: "en2",
    name: "Chelsea",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
    league: "inglaterra",
  },
  {
    id: "en3",
    name: "Manchester City",
    logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
    league: "inglaterra",
  },
  {
    id: "en4",
    name: "Crystal Palace",
    logo: "https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg",
    league: "inglaterra",
  },
  {
    id: "en5",
    name: "Brighton & Hove Albion",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg",
    league: "inglaterra",
  },
  {
    id: "en6",
    name: "Sunderland",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/77/Logo_Sunderland.svg",
    league: "inglaterra",
  },
  {
    id: "en7",
    name: "Bournemouth",
    logo: "https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg",
    league: "inglaterra",
  },
  {
    id: "en8",
    name: "Tottenham",
    logo: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
    league: "inglaterra",
  },
  {
    id: "en9",
    name: "Aston Villa",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg",
    league: "inglaterra",
  },
  {
    id: "en10",
    name: "Manchester United",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
    league: "inglaterra",
  },
  {
    id: "en11",
    name: "Liverpool",
    logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
    league: "inglaterra",
  },
  {
    id: "en12",
    name: "Brentford",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg",
    league: "inglaterra",
  },
  {
    id: "en13",
    name: "Everton",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg",
    league: "inglaterra",
  },
  {
    id: "en14",
    name: "Fulham",
    logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg",
    league: "inglaterra",
  },
  {
    id: "en15",
    name: "Newcastle",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg",
    league: "inglaterra",
  },
  {
    id: "en16",
    name: "Nottingham Forest",
    logo: "https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg",
    league: "inglaterra",
  },
  {
    id: "en17",
    name: "West Ham",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg",
    league: "inglaterra",
  },
  {
    id: "en18",
    name: "Leeds United",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/54/Leeds_United_F.C._logo.svg",
    league: "inglaterra",
  },
  {
    id: "en19",
    name: "Burnley",
    logo: "https://upload.wikimedia.org/wikipedia/en/6/62/Burnley_F.C._Logo.svg",
    league: "inglaterra",
  },
  {
    id: "en20",
    name: "Wolverhampton",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg",
    league: "inglaterra",
  },

  // 🇩🇪 Bundesliga (Alemanha)
  {
    id: "de1",
    name: "Bayern de Munique",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
    league: "alemanha",
  },
  {
    id: "de2",
    name: "Bayer Leverkusen",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg",
    league: "alemanha",
  },
  {
    id: "de3",
    name: "Borussia Dortmund",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
    league: "alemanha",
  },
  {
    id: "de4",
    name: "RB Leipzig",
    logo: "https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg",
    league: "alemanha",
  },
  {
    id: "de5",
    name: "Stuttgart",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/VfB_Stuttgart_1893_Logo.svg",
    league: "alemanha",
  },
  {
    id: "de6",
    name: "Hoffenheim",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e7/TSG_1899_Hoffenheim_logo.svg",
    league: "alemanha",
  },
  {
    id: "de7",
    name: "Eintracht Frankfurt",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/Eintracht_Frankfurt_Logo.svg",
    league: "alemanha",
  },
  {
    id: "de8",
    name: "Werder Bremen",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/be/SV-Werder-Bremen-Logo.svg",
    league: "alemanha",
  },
  {
    id: "de9",
    name: "Köln",
    logo: "https://upload.wikimedia.org/wikipedia/en/1/15/1_FC_Koln_logo.svg",
    league: "alemanha",
  },
  {
    id: "de10",
    name: "Freiburg",
    logo: "https://upload.wikimedia.org/wikipedia/en/1/11/SC_Freiburg_logo.svg",
    league: "alemanha",
  },
  {
    id: "de11",
    name: "Borussia Mönchengladbach",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/81/Borussia_M%C3%B6nchengladbach_logo.svg",
    league: "alemanha",
  },
  {
    id: "de12",
    name: "Union Berlin",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/1._FC_Union_Berlin_Logo.svg",
    league: "alemanha",
  },
  {
    id: "de13",
    name: "Augsburg",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/2a/FC_Augsburg_logo.svg",
    league: "alemanha",
  },
  {
    id: "de14",
    name: "Hamburgo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/66/HSV-Logo.svg",
    league: "alemanha",
  },
  {
    id: "de15",
    name: "Wolfsburg",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Logo-VfL-Wolfsburg.svg",
    league: "alemanha",
  },
  {
    id: "de16",
    name: "St. Pauli",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Logo_FC_St._Pauli.svg",
    league: "alemanha",
  },
  {
    id: "de17",
    name: "Mainz 05",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_Mainz_05.svg",
    league: "alemanha",
  },
  {
    id: "de18",
    name: "Heidenheim",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/02/1._FC_Heidenheim_1846_logo.svg",
    league: "alemanha",
  },

  // 🇮🇹 Serie A (Itália)
  {
    id: "it1",
    name: "Internazionale",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg",
    league: "italia",
  },
  {
    id: "it2",
    name: "Roma",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg",
    league: "italia",
  },
  {
    id: "it3",
    name: "Milan",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg",
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
    name: "Bologna",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Bologna_FC_1909_logo.svg",
    league: "italia",
  },
  {
    id: "it6",
    name: "Juventus",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_logo.svg",
    league: "italia",
  },
  {
    id: "it7",
    name: "Como",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Como_1907.svg",
    league: "italia",
  },
  {
    id: "it8",
    name: "Sassuolo",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/57/U.S._Sassuolo_Calcio_logo.svg",
    league: "italia",
  },
  {
    id: "it9",
    name: "Lazio",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/ce/S.S._Lazio_badge.svg",
    league: "italia",
  },
  {
    id: "it10",
    name: "Udinese",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/ce/Udinese_Calcio_logo.svg",
    league: "italia",
  },
  {
    id: "it11",
    name: "Cremonese",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/US_Cremonese_logo.svg",
    league: "italia",
  },
  {
    id: "it12",
    name: "Torino",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/2e/Torino_FC_Logo.svg",
    league: "italia",
  },
  {
    id: "it13",
    name: "Atalanta",
    logo: "https://upload.wikimedia.org/wikipedia/en/6/66/Atalanta_BC_logo.svg",
    league: "italia",
  },
  {
    id: "it14",
    name: "Cagliari",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/55/Cagliari_Calcio_1920.svg",
    league: "italia",
  },
  {
    id: "it15",
    name: "Lecce",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/70/US_Lecce.svg",
    league: "italia",
  },
  {
    id: "it16",
    name: "Pisa",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/84/Pisa_Sporting_Club_logo.svg",
    league: "italia",
  },
  {
    id: "it17",
    name: "Parma",
    logo: "https://upload.wikimedia.org/wikipedia/en/3/35/Parma_Calcio_1913_logo.svg",
    league: "italia",
  },
  {
    id: "it18",
    name: "Genoa",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Genoa_CFC_logo.svg",
    league: "italia",
  },
  {
    id: "it19",
    name: "Hellas Verona",
    logo: "https://upload.wikimedia.org/wikipedia/en/4/42/Hellas_Verona_FC_logo.svg",
    league: "italia",
  },
  {
    id: "it20",
    name: "Fiorentina",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Logo_Fiorentina.svg",
    league: "italia",
  },

  // 🇫🇷 Ligue 1 (França – 2025)
  {
    id: "fr1",
    name: "Paris Saint-Germain",
    logo: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg",
    league: "franca",
  },
  {
    id: "fr2",
    name: "Olympique de Marseille",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg",
    league: "franca",
  },
  {
    id: "fr3",
    name: "Lens",
    logo: "https://upload.wikimedia.org/wikipedia/en/b/b9/RC_Lens_logo.svg",
    league: "franca",
  },
  {
    id: "fr4",
    name: "Strasbourg",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/74/Racing_Club_de_Strasbourg_Alsace_logo.svg",
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
    name: "Monaco",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Logo_AS_Monaco_FC_%282013%29.svg",
    league: "franca",
  },
  {
    id: "fr7",
    name: "Lyon",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Olympique_lyonnais_%28logo%29.svg",
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
    name: "Nice",
    logo: "https://upload.wikimedia.org/wikipedia/en/a/a4/OGC_Nice_logo.svg",
    league: "franca",
  },
  {
    id: "fr10",
    name: "Toulouse",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/53/Logo_Toulouse_FC_2018.svg",
    league: "franca",
  },
  {
    id: "fr11",
    name: "Paris FC",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f6/Paris_FC_logo.svg",
    league: "franca",
  },
  {
    id: "fr12",
    name: "Le Havre",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/Le_Havre_AC_logo.svg",
    league: "franca",
  },
  {
    id: "fr13",
    name: "Angers",
    logo: "https://upload.wikimedia.org/wikipedia/en/3/30/Angers_SCO_logo.svg",
    league: "franca",
  },
  {
    id: "fr14",
    name: "Metz",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/54/FC_Metz_logo.svg",
    league: "franca",
  },
  {
    id: "fr15",
    name: "Brest",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/c9/Stade_Brestois_29_logo.svg",
    league: "franca",
  },
  {
    id: "fr16",
    name: "Nantes",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/66/FC_Nantes_logo.svg",
    league: "franca",
  },
  {
    id: "fr17",
    name: "Lorient",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/cf/FC_Lorient_logo.svg",
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
