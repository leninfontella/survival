import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X, Trophy, Shield, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TeamTransition } from "@/components/TeamTransition";
import { roomAPI, authAPI } from "@/services/api";
import { useGame } from "@/hooks/useGame";
import { History } from "lucide-react";
import { MatchResultBadge } from "@/components/MatchResultIndicator";
import { AvailableMatch } from "@/types/game";

type League =
  | "brasil"
  | "espanha"
  | "inglaterra"
  | "alemanha"
  | "italia"
  | "franca";

interface Team {
  id: string;
  name: string;
  logo: string;
  league: League;
}

interface RoomData {
  _id: string;
  name: string;
  league: League;
  status: string;
  currentRound: number;
  totalRounds: number;
  prizePool: number;
}

interface Selection {
  teamId: string;
  teamName: string;
  round: number;
  won: boolean | null;
  matchResult?: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
  };
}

export default function SelectTeam() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { teams, getTeamsByLeague } = useGame();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showTransition, setShowTransition] = useState(false);
  const [usedTeams, setUsedTeams] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [playerSelections, setPlayerSelections] = useState<Selection[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [availableMatches, setAvailableMatches] = useState<AvailableMatch[]>(
    []
  );
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Debug: Verificar roomId
  useEffect(() => {
    console.log("🔍 SelectTeam carregado");
    console.log("🔍 RoomId da URL:", roomId);
    console.log("🔍 URL completa:", window.location.href);
    console.log("🎯 Total de times disponíveis:", teams.length);
  }, [roomId, teams]);

  // Buscar dados da sala E partidas disponíveis
  useEffect(() => {
    const fetchRoomAndMatches = async () => {
      if (!roomId || roomId === "undefined" || roomId.trim() === "") {
        console.error("❌ RoomId inválido:", roomId);
        toast({
          title: "Erro",
          description: "ID da sala não encontrado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => navigate("/dashboard"), 2000);
        return;
      }

      setIsLoading(true);
      try {
        console.log("🔍 Buscando sala com ID:", roomId);

        // 1️⃣ Buscar dados da sala
        const roomResponse = await roomAPI.getById(roomId);
        console.log("📦 Resposta da sala:", roomResponse);

        if (roomResponse.success) {
          setRoomData(roomResponse.data);
          console.log("✅ Liga da sala:", roomResponse.data.league);
        }

        // 2️⃣ 🆕 Buscar partidas disponíveis (ao invés de times usados)
        setIsLoadingMatches(true);
        try {
          const matchesResponse = await roomAPI.getAvailableMatches(roomId);
          console.log("⚽ Partidas disponíveis:", matchesResponse);

          if (matchesResponse.success) {
            setAvailableMatches(matchesResponse.data.matches);
            setUsedTeams(matchesResponse.data.usedTeams);
            console.log(
              `✅ ${matchesResponse.data.matches.length} partidas encontradas`
            );
          }
        } catch (matchError: any) {
          console.error("❌ Erro ao buscar partidas:", matchError);

          // Se já selecionou, apenas mostrar warning
          if (matchError.response?.data?.alreadySelected) {
            toast({
              title: "Time já selecionado",
              description: "Você já escolheu seu time para esta rodada.",
            });
            setTimeout(() => navigate(`/survival-room/${roomId}`), 2000);
            return;
          }

          // Fallback: buscar times usados (método antigo)
          console.log("⚠️ Fallback: usando método antigo de times");
          const usedTeamsResponse = await roomAPI.getUsedTeams(roomId);
          if (usedTeamsResponse.success) {
            setUsedTeams(usedTeamsResponse.data.usedTeams);
            if (usedTeamsResponse.data.selections) {
              setPlayerSelections(usedTeamsResponse.data.selections);
            }
          }
        } finally {
          setIsLoadingMatches(false);
        }
      } catch (error) {
        console.error("❌ Erro ao buscar sala:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a sala.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/dashboard"), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomAndMatches();
  }, [roomId, navigate]);

  const handleConfirm = async () => {
    if (!selectedTeamId) {
      toast({
        title: "Selecione um time",
        description: "Você precisa escolher um time para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!roomId) return;

    // 🆕 Buscar nome do time selecionado
    let selectedTeamName = "";

    // Se temos partidas disponíveis, buscar da partida
    if (availableMatches.length > 0) {
      const match = availableMatches.find((m) =>
        [m.homeTeam.id, m.awayTeam.id].includes(selectedTeamId)
      );

      if (match) {
        selectedTeamName =
          match.homeTeam.id === selectedTeamId
            ? match.homeTeam.name
            : match.awayTeam.name;
      }
    }

    // Fallback: buscar do contexto de times (método antigo)
    if (!selectedTeamName) {
      const selectedTeam = availableTeams.find((t) => t.id === selectedTeamId);
      if (!selectedTeam) {
        toast({
          title: "Erro",
          description: "Time não encontrado.",
          variant: "destructive",
        });
        return;
      }
      selectedTeamName = selectedTeam.name;
    }

    setIsSaving(true);
    try {
      console.log("💾 Salvando seleção:", {
        roomId,
        teamId: selectedTeamId,
        teamName: selectedTeamName,
        matchId: selectedMatchId, // 🆕 ADICIONAR matchId
      });

      // 🆕 Chamar API com matchId
      const response = await roomAPI.selectTeam(
        roomId,
        selectedTeamId,
        selectedTeamName,
        selectedMatchId || undefined // 🆕 Enviar matchId se disponível
      );

      if (response.success) {
        console.log("✅ Time salvo com sucesso");
        setShowTransition(true);
      }
    } catch (error) {
      console.error("Erro ao salvar time:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar sua escolha.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const handleTransitionComplete = () => {
    toast({
      title: "Time selecionado!",
      description: "Boa sorte nesta rodada!",
    });
    navigate(`/survival-room/${roomId}`);
  };

  const isTeamUsed = (teamId: string) => usedTeams.includes(teamId);

  // 🎯 CORREÇÃO: Usar times do contexto baseado na liga da sala com useMemo
  const availableTeams: Team[] = useMemo(() => {
    return roomData ? getTeamsByLeague(roomData.league) : [];
  }, [roomData, getTeamsByLeague]);

  useEffect(() => {
    if (roomData) {
      console.log(
        "🎯 Times disponíveis para a liga",
        roomData.league,
        ":",
        availableTeams.length
      );
    }
  }, [roomData, availableTeams]);

  const selectedTeam = selectedTeamId
    ? availableTeams.find((t) => t.id === selectedTeamId)
    : null;

  const renderMatchesGrid = () => {
    if (isLoadingMatches) {
      return (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando partidas...</p>
        </div>
      );
    }

    if (availableMatches.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhuma partida disponível para esta rodada ainda.
          </p>
          <p className="text-sm text-muted-foreground">
            Aguarde a divulgação dos jogos ou tente novamente mais tarde.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {availableMatches.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-300
              ${
                !match.hasAvailableTeam
                  ? "opacity-50 bg-muted/50"
                  : "hover:shadow-lg"
              }
              ${
                selectedMatchId === match.id
                  ? "border-primary bg-primary/5"
                  : "border-border/50"
              }
            `}
          >
            {/* Cabeçalho da partida */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{match.date}</span>
                <span>•</span>
                <span>{match.time}</span>
              </div>
              {!match.hasAvailableTeam && (
                <Badge variant="secondary">Ambos times já usados</Badge>
              )}
            </div>

            {/* Grid de times */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Time mandante */}
              <motion.button
                onClick={() => {
                  if (match.homeTeam.canSelect) {
                    setSelectedTeamId(match.homeTeam.id);
                    setSelectedMatchId(match.id);
                  }
                }}
                disabled={!match.homeTeam.canSelect}
                whileHover={
                  match.homeTeam.canSelect ? { scale: 1.02 } : undefined
                }
                whileTap={
                  match.homeTeam.canSelect ? { scale: 0.98 } : undefined
                }
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${
                    !match.homeTeam.canSelect
                      ? "opacity-40 cursor-not-allowed bg-muted/30"
                      : "cursor-pointer hover:border-primary/50"
                  }
                  ${
                    selectedTeamId === match.homeTeam.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border/30"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Casa
                  </div>
                  <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center p-2">
                    <span className="text-2xl font-bold text-primary">
                      {match.homeTeam.name.substring(0, 3).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-semibold text-center text-sm">
                    {match.homeTeam.name}
                  </span>
                  {match.homeTeam.used && (
                    <Badge variant="destructive" className="text-xs">
                      Usado
                    </Badge>
                  )}
                  {selectedTeamId === match.homeTeam.id && (
                    <Check className="absolute top-2 right-2 h-5 w-5 text-primary" />
                  )}
                </div>
              </motion.button>

              {/* VS */}
              <div className="text-center">
                <span className="text-2xl font-bold text-muted-foreground">
                  VS
                </span>
              </div>

              {/* Time visitante */}
              <motion.button
                onClick={() => {
                  if (match.awayTeam.canSelect) {
                    setSelectedTeamId(match.awayTeam.id);
                    setSelectedMatchId(match.id);
                  }
                }}
                disabled={!match.awayTeam.canSelect}
                whileHover={
                  match.awayTeam.canSelect ? { scale: 1.02 } : undefined
                }
                whileTap={
                  match.awayTeam.canSelect ? { scale: 0.98 } : undefined
                }
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${
                    !match.awayTeam.canSelect
                      ? "opacity-40 cursor-not-allowed bg-muted/30"
                      : "cursor-pointer hover:border-primary/50"
                  }
                  ${
                    selectedTeamId === match.awayTeam.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border/30"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Visitante
                  </div>
                  <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center p-2">
                    <span className="text-2xl font-bold text-primary">
                      {match.awayTeam.name.substring(0, 3).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-semibold text-center text-sm">
                    {match.awayTeam.name}
                  </span>
                  {match.awayTeam.used && (
                    <Badge variant="destructive" className="text-xs">
                      Usado
                    </Badge>
                  )}
                  {selectedTeamId === match.awayTeam.id && (
                    <Check className="absolute top-2 right-2 h-5 w-5 text-primary" />
                  )}
                </div>
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando sala...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Sala não encontrada</p>
            <Link to="/dashboard">
              <Button>Voltar ao Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (availableTeams.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum time disponível para a liga: {roomData.league}
            </p>
            <Link to="/dashboard">
              <Button>Voltar ao Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showTransition && selectedTeam && (
          <TeamTransition
            team={selectedTeam}
            onComplete={handleTransitionComplete}
          />
        )}
      </AnimatePresence>
      <div className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <Link to={`/survival-room/${roomId}`}>
                <Button variant="ghost" className="hover:bg-primary/10">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </Link>

              {playerSelections.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History className="mr-2 h-4 w-4" />
                  {showHistory ? "Ocultar" : "Ver"} Histórico
                </Button>
              )}
            </div>
          </motion.div>

          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Card */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-primary/30 bg-gradient-to-br from-card/90 via-card/50 to-card/90 backdrop-blur-xl shadow-2xl shadow-primary/10">
                <CardHeader className="text-center space-y-4 pb-8">
                  <div className="flex items-center justify-center gap-3">
                    <Trophy className="h-8 w-8 text-primary animate-pulse" />
                    <CardTitle className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
                      Rodada {roomData.currentRound}
                    </CardTitle>
                    <Trophy className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Escolha o time que você acredita que irá{" "}
                    <span className="text-primary font-bold">VENCER</span> nesta
                    rodada
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
                    <Badge variant="outline">Sala: {roomData.name}</Badge>
                    <Badge variant="outline">Liga: {roomData.league}</Badge>
                    <Badge variant="outline">
                      Prêmio: R$ {roomData.prizePool.toFixed(2)}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
            {/* Teams Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">
                      Partidas da Rodada ({availableMatches.length}){" "}
                      {/* ✅ MUDOU */}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* ✅ SÓ ISSO AQUI AGORA */}
                  {renderMatchesGrid()}

                  {/* Rules Card - MANTER COMO ESTÁ */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-2 border-primary/20 shadow-lg"
                  >
                    {/* ... regras ... */}
                  </motion.div>

                  {/* Confirm Button - MANTER COMO ESTÁ */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Button
                      onClick={handleConfirm}
                      disabled={!selectedTeamId || isSaving}
                      size="lg"
                      className="w-full mt-6 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
                    >
                      {/* ... botão ... */}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Used Teams Card */}
            {usedTeams.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="text-xl">
                      Seus Times Já Usados ({usedTeams.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3">
                      {usedTeams.map((teamId, index) => {
                        const team = availableTeams.find(
                          (t) => t.id === teamId
                        );
                        return team ? (
                          <motion.div
                            key={teamId}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <Badge
                              variant="secondary"
                              className="text-sm py-2 px-4 flex items-center gap-2"
                            >
                              <img
                                src={team.logo}
                                alt={team.name}
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/20x20?text=" +
                                    team.name.charAt(0);
                                }}
                              />
                              {team.name}
                            </Badge>
                          </motion.div>
                        ) : null;
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Previous Selections History - NOVO */}
            {showHistory && playerSelections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
                  <CardHeader className="border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">
                        Histórico de Seleções
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {playerSelections
                        .sort((a, b) => b.round - a.round)
                        .map((selection, index) => {
                          const team = availableTeams.find(
                            (t) => t.id === selection.teamId
                          );

                          return (
                            <motion.div
                              key={`${selection.round}-${selection.teamId}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`p-4 rounded-lg border ${
                                selection.won === true
                                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                  : selection.won === false
                                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {/* Badge da rodada */}
                                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary">
                                      R{selection.round}
                                    </span>
                                  </div>

                                  {/* Logo do time */}
                                  {team && (
                                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center p-1.5">
                                      <img
                                        src={team.logo}
                                        alt={team.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          e.currentTarget.src =
                                            "https://via.placeholder.com/40x40?text=" +
                                            team.name.charAt(0);
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* Info */}
                                  <div>
                                    <p className="font-semibold text-sm">
                                      {selection.teamName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Rodada {selection.round}
                                    </p>
                                  </div>
                                </div>

                                {/* Status badge */}
                                <MatchResultBadge
                                  won={selection.won}
                                  size="md"
                                />
                              </div>

                              {/* Resultado da partida */}
                              {selection.matchResult && (
                                <div className="mt-3 pt-3 border-t border-border/50">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="text-center flex-1">
                                      <p className="font-medium">
                                        {selection.matchResult.homeTeam}
                                      </p>
                                      <p className="text-lg font-bold mt-1">
                                        {selection.matchResult.homeScore}
                                      </p>
                                    </div>
                                    <div className="px-3 text-muted-foreground">
                                      ×
                                    </div>
                                    <div className="text-center flex-1">
                                      <p className="font-medium">
                                        {selection.matchResult.awayTeam}
                                      </p>
                                      <p className="text-lg font-bold mt-1">
                                        {selection.matchResult.awayScore}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
