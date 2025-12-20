import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGame } from "@/hooks/useGame";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Skull,
  Users,
  Target,
  Crown,
  Home,
  Zap,
  Loader2,
  Clock,
  CheckCircle2,
  History,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { roomAPI, authAPI } from "@/services/api";
import heroBg from "@/assets/hero-bg.jpg";
import { ShareButton } from "@/components/ui/share-button";
import { ThemeSelector } from "@/components/ui/theme-selector";
import { EmojiReactions } from "@/components/ui/emoji-reactions";
import { ConfettiEffect } from "@/components/ui/confetti-effect";
import { Fireworks } from "@/components/ui/fireworks";
import { PageIntro } from "@/components/ui/page-intro";
import { StateTransition } from "@/components/ui/state-transition";

interface RoomData {
  _id: string;
  name: string;
  league: string;
  status: "waiting" | "active" | "finished";
  currentRound: number;
  totalRounds: number;
  prizePool: number;
  players: Array<{
    _id: string;
    name: string;
    isEliminated: boolean;
    user?:
      | {
          _id: string;
          id?: string;
        }
      | string;
    selectedTeams: Array<{
      teamId: string;
      teamName: string;
      round: number;
      won: boolean | null;
    }>;
  }>;
}

export default function SurvivalRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { teams } = useGame();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const isMountedRef = useRef(true);
  const [showWinnerConfetti, setShowWinnerConfetti] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Buscar userId ao montar
  useEffect(() => {
    const userId = authAPI.getCurrentUserId();
    setCurrentUserId(userId);
  }, []);

  // Estado para reações (em produção, vir do backend)
  const [playerReactions, setPlayerReactions] = useState<
    Record<
      string,
      Array<{
        emoji: string;
        count: number;
        users: string[];
      }>
    >
  >({});

  // Verificar se o usuário atual é um jogador específico
  const isCurrentUser = useCallback(
    (player: RoomData["players"][0]) => {
      if (!currentUserId) return false;

      if (typeof player.user === "string") {
        return player.user === currentUserId;
      } else if (player.user) {
        return (
          player.user._id === currentUserId || player.user.id === currentUserId
        );
      }
      return false;
    },
    [currentUserId]
  );

  // Handler para navegar para seleção de time
  const handleSelectTeam = useCallback(() => {
    if (!roomId) return;

    toast({
      title: "Selecione seu time",
      description: "Escolha sabiamente para continuar no jogo!",
    });

    navigate(`/room/select-team/${roomId}`);
  }, [roomId, navigate]);

  // Buscar dados da sala
  useEffect(() => {
    if (!roomId) {
      toast({
        title: "Erro",
        description: "ID da sala não encontrado.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    const fetchRoom = async () => {
      try {
        const response = await roomAPI.getById(roomId);
        if (response.success && isMountedRef.current) {
          // Verificar se precisa de convite
          if (response.needsInvite) {
            toast({
              title: "Sala Privada",
              description:
                response.message ||
                "Esta sala é privada. Entre em contato com o criador.",
              variant: "destructive",
            });
            navigate("/dashboard");
            return;
          }
          setRoomData(response.data);
        }
      } catch (error) {
        console.error("Erro ao buscar sala:", error);
        if (isMountedRef.current) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar a sala.",
            variant: "destructive",
          });
          navigate("/dashboard");
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Buscar inicialmente
    fetchRoom();

    // Polling para atualizar dados a cada 5 segundos
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        fetchRoom();
      }
    }, 5000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [roomId, navigate]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getTeamById = useCallback(
    (teamId: string) => teams.find((t) => t.id === teamId),
    [teams]
  );

  // Função para obter histórico de rodadas
  const getRoundHistory = useCallback(() => {
    if (!roomData) return [];

    const history = [];
    for (let round = 1; round <= roomData.totalRounds; round++) {
      const roundPlayers = roomData.players
        .map((player) => {
          const selection = player.selectedTeams.find((s) => s.round === round);
          return {
            playerName: player.name,
            playerId: player._id,
            selection,
            isEliminated: player.isEliminated,
          };
        })
        .filter((p) => p.selection);

      history.push({
        round,
        players: roundPlayers,
        isActive: round === roomData.currentRound,
        isPast: round < roomData.currentRound,
        isFuture: round > roomData.currentRound,
      });
    }

    return history;
  }, [roomData]);

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

  const activePlayers = roomData.players.filter((p) => !p.isEliminated);
  const eliminatedPlayers = roomData.players.filter((p) => p.isEliminated);

  // Filtrar jogadores com base na rodada atual
  const playersWithSelection = activePlayers.filter((p) => {
    if (!p.selectedTeams || p.selectedTeams.length === 0) return false;
    return p.selectedTeams.some((s) => s.round === roomData.currentRound);
  });

  const playersWithoutSelection = activePlayers.filter((p) => {
    if (!p.selectedTeams || p.selectedTeams.length === 0) return true;
    return !p.selectedTeams.some((s) => s.round === roomData.currentRound);
  });

  const isGameFinished =
    roomData.status === "finished" || activePlayers.length === 1;
  const winner = activePlayers.length === 1 ? activePlayers[0] : null;

  // Verificar se o usuário atual precisa selecionar time
  const currentUserPlayer = activePlayers.find((p) => isCurrentUser(p));
  const currentUserNeedsSelection =
    currentUserPlayer &&
    !currentUserPlayer.selectedTeams?.some(
      (s) => s.round === roomData.currentRound
    );

  const roundHistory = getRoundHistory();

  return (
    <>
      {/* Page Intro */}
      {showIntro && (
        <PageIntro
          title={roomData?.name || "Sala de Sobrevivência"}
          subtitle="Prepare-se para a batalha!"
          duration={2500}
        />
      )}

      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95" />
          <motion.div
            animate={{
              opacity: [0.03, 0.08, 0.03],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Modal de Histórico */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowHistory(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
              >
                <Card className="border-primary/30 bg-gradient-to-br from-card via-card/95 to-background shadow-2xl">
                  <CardHeader className="border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <History className="h-6 w-6 text-primary" />
                        <CardTitle className="text-2xl font-bold">
                          Histórico de Rodadas
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowHistory(false)}
                        className="hover:bg-destructive/10"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="space-y-6">
                      {roundHistory.map((round) => (
                        <motion.div
                          key={round.round}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: round.round * 0.1 }}
                        >
                          <Card
                            className={`${
                              round.isActive
                                ? "border-primary bg-primary/5"
                                : round.isPast
                                ? "border-border/50 bg-card/50"
                                : "border-dashed border-muted-foreground/30 bg-muted/20"
                            }`}
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                      round.isActive
                                        ? "bg-primary text-primary-foreground"
                                        : round.isPast
                                        ? "bg-muted text-muted-foreground"
                                        : "bg-muted/50 text-muted-foreground/50"
                                    }`}
                                  >
                                    {round.round}
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold">
                                      Rodada {round.round}/
                                      {roomData.totalRounds}
                                    </h3>
                                    {round.isActive && (
                                      <Badge
                                        variant="default"
                                        className="mt-1 bg-primary"
                                      >
                                        Rodada Atual
                                      </Badge>
                                    )}
                                    {round.isPast && (
                                      <Badge
                                        variant="outline"
                                        className="mt-1 border-green-500 text-green-500"
                                      >
                                        Concluída
                                      </Badge>
                                    )}
                                    {round.isFuture && (
                                      <Badge
                                        variant="outline"
                                        className="mt-1 border-muted-foreground/50 text-muted-foreground/50"
                                      >
                                        Aguardando
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {round.isFuture ? (
                                <div className="text-center py-8">
                                  <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                  <p className="text-muted-foreground text-lg">
                                    Aguardando rodada
                                  </p>
                                </div>
                              ) : round.players.length === 0 ? (
                                <div className="text-center py-8">
                                  <p className="text-muted-foreground">
                                    Nenhum jogador selecionou time nesta rodada
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {round.players.map((player, idx) => {
                                    const team = getTeamById(
                                      player.selection!.teamId
                                    );
                                    const won = player.selection!.won;

                                    return (
                                      <motion.div
                                        key={player.playerId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`flex items-center justify-between p-4 rounded-lg border ${
                                          won === true
                                            ? "bg-green-500/10 border-green-500/30"
                                            : won === false
                                            ? "bg-red-500/10 border-red-500/30"
                                            : "bg-muted/30 border-border/30"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 flex-1">
                                          {team ? (
                                            <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center p-1.5 shadow overflow-hidden">
                                              <img
                                                src={team.logo}
                                                alt={team.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                  const target =
                                                    e.currentTarget;
                                                  target.style.display = "none";
                                                  const parent =
                                                    target.parentElement;
                                                  if (parent) {
                                                    parent.innerHTML = `<span class="text-primary font-bold">${team.name
                                                      .charAt(0)
                                                      .toUpperCase()}</span>`;
                                                  }
                                                }}
                                              />
                                            </div>
                                          ) : (
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                                              {player.playerName
                                                .charAt(0)
                                                .toUpperCase()}
                                            </div>
                                          )}
                                          <div className="flex-1">
                                            <p className="font-semibold text-foreground">
                                              {player.playerName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              {player.selection!.teamName}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {won === true && (
                                            <Badge
                                              variant="default"
                                              className="bg-green-500 hover:bg-green-600"
                                            >
                                              <CheckCircle className="w-3 h-3 mr-1" />
                                              Venceu
                                            </Badge>
                                          )}
                                          {won === false && (
                                            <Badge
                                              variant="destructive"
                                              className="bg-red-500 hover:bg-red-600"
                                            >
                                              <XCircle className="w-3 h-3 mr-1" />
                                              Perdeu
                                            </Badge>
                                          )}
                                          {won === null && (
                                            <Badge
                                              variant="outline"
                                              className="border-muted-foreground/50 text-muted-foreground"
                                            >
                                              <Clock className="w-3 h-3 mr-1" />
                                              Aguardando
                                            </Badge>
                                          )}
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to="/dashboard">
              <Button variant="ghost" className="hover:bg-primary/10">
                <Home className="mr-2 h-4 w-4" />
                Início
              </Button>
            </Link>
          </motion.div>

          <div className="max-w-6xl mx-auto space-y-6">
            {/* Game Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary/30 bg-gradient-to-br from-card/90 via-card/50 to-card/90 backdrop-blur-xl shadow-2xl shadow-primary/10">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-10 w-10 text-primary animate-pulse" />
                      <div>
                        <CardTitle className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                          {roomData.name}
                        </CardTitle>
                        <p className="text-muted-foreground mt-1">
                          Sala de Sobrevivência
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center flex-wrap">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Rodada</p>
                        <StateTransition state={roomData.currentRound}>
                          <p className="text-2xl font-bold text-primary">
                            {roomData.currentRound}/{roomData.totalRounds}
                          </p>
                        </StateTransition>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Prêmio</p>
                        <StateTransition state={roomData.prizePool}>
                          <p className="text-2xl font-bold text-primary">
                            R$ {roomData.prizePool.toFixed(2)}
                          </p>
                        </StateTransition>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowHistory(true)}
                          variant="outline"
                          className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
                        >
                          <History className="mr-2 h-4 w-4" />
                          Histórico
                        </Button>
                        <ShareButton
                          roomId={roomData._id}
                          roomName={roomData.name}
                        />
                        <ThemeSelector />
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>

            {/* Call to Action - Se o usuário precisa selecionar */}
            <AnimatePresence>
              {currentUserNeedsSelection && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-2 border-amber-500 bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-amber-500/5 shadow-2xl shadow-amber-500/20">
                    <CardContent className="py-8">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
                          >
                            <Clock className="h-8 w-8 text-white" />
                          </motion.div>
                          <div>
                            <h3 className="text-2xl font-bold text-amber-600 mb-1">
                              ⚠️ Você ainda não selecionou seu time!
                            </h3>
                            <p className="text-muted-foreground">
                              Selecione seu time para a rodada{" "}
                              {roomData.currentRound} agora
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleSelectTeam}
                          size="lg"
                          className="bg-amber-500 hover:bg-amber-600 text-white shadow-xl hover:shadow-2xl transition-all"
                        >
                          <Target className="mr-2 h-5 w-5" />
                          Selecionar Time Agora
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Winner Card */}
            <AnimatePresence>
              {isGameFinished && winner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onAnimationComplete={() => setShowWinnerConfetti(true)}
                >
                  {/* Confetti Effect */}
                  <ConfettiEffect
                    trigger={showWinnerConfetti}
                    type="realistic"
                    duration={5000}
                  />

                  {/* Fireworks Effect */}
                  <Fireworks
                    active={showWinnerConfetti}
                    count={8}
                    duration={6000}
                  />

                  <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 backdrop-blur-xl shadow-2xl shadow-primary/40 relative overflow-hidden">
                    {/* Partículas brilhantes de fundo */}
                    <motion.div
                      className="absolute inset-0 opacity-30"
                      animate={{
                        backgroundPosition: ["0% 0%", "100% 100%"],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                      style={{
                        backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
                        backgroundSize: "50px 50px",
                      }}
                    />

                    <CardHeader className="text-center space-y-4 py-12 relative z-10">
                      {/* Crown com animação aprimorada */}
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1],
                          y: [0, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <motion.div
                          animate={{
                            filter: [
                              "drop-shadow(0 0 20px hsl(var(--primary)))",
                              "drop-shadow(0 0 40px hsl(var(--primary)))",
                              "drop-shadow(0 0 20px hsl(var(--primary)))",
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Crown className="h-24 w-24 text-primary mx-auto" />
                        </motion.div>
                      </motion.div>

                      <div>
                        {/* Título com animação de brilho */}
                        <motion.h2
                          className="text-5xl font-black mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
                          animate={{
                            backgroundPosition: [
                              "0% 50%",
                              "100% 50%",
                              "0% 50%",
                            ],
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          style={{ backgroundSize: "200% auto" }}
                        >
                          🎉 VENCEDOR! 🎉
                        </motion.h2>

                        {/* Nome do vencedor com entrada dramática */}
                        <motion.p
                          className="text-3xl font-bold text-foreground"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          {winner.name}
                        </motion.p>

                        {/* Prêmio com animação de contador */}
                        <motion.p
                          className="text-xl text-muted-foreground mt-4"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5, type: "spring" }}
                        >
                          Ganhou{" "}
                          <motion.span
                            className="text-2xl font-black text-primary"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            R$ {roomData.prizePool.toFixed(2)}
                          </motion.span>
                        </motion.p>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-card to-background/50 border-border/50 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total de Jogadores
                        </p>
                        <StateTransition state={roomData.players.length}>
                          <p className="text-3xl font-black text-foreground">
                            {roomData.players.length}
                          </p>
                        </StateTransition>
                      </div>
                      <Users className="h-12 w-12 text-primary opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Com Time Selecionado
                        </p>
                        <StateTransition state={playersWithSelection.length}>
                          <p className="text-3xl font-black text-primary">
                            {playersWithSelection.length}
                          </p>
                        </StateTransition>
                      </div>
                      <CheckCircle2 className="h-12 w-12 text-primary opacity-70" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Eliminados
                        </p>
                        <StateTransition state={eliminatedPlayers.length}>
                          <p className="text-3xl font-bold text-destructive">
                            {eliminatedPlayers.length}
                          </p>
                        </StateTransition>
                      </div>
                      <Skull className="h-12 w-12 text-destructive opacity-70" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Players Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Active Players */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gradient-to-br from-card to-background/50 border-primary/30 shadow-xl">
                  <CardHeader className="border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">
                        Jogadores com Time Selecionado
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {playersWithSelection.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum jogador selecionou time ainda
                        </p>
                      ) : (
                        playersWithSelection.map((player, index) => {
                          const currentRoundSelection =
                            player.selectedTeams.find(
                              (s) => s.round === roomData.currentRound
                            );
                          const currentTeam = currentRoundSelection
                            ? getTeamById(currentRoundSelection.teamId)
                            : null;

                          return (
                            <motion.div
                              key={player._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{
                                scale: 1.02,
                                x: 8,
                                transition: { duration: 0.3, ease: "easeOut" },
                              }}
                              className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 space-y-3"
                            >
                              {/* Linha 1: Info do Jogador */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {currentTeam ? (
                                    <div className="w-12 h-12 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center p-1.5 shadow-lg overflow-hidden">
                                      <img
                                        src={currentTeam.logo}
                                        alt={currentTeam.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          const target = e.currentTarget;
                                          target.style.display = "none";
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = `<span class="text-primary font-bold text-lg">${currentTeam.name
                                              .charAt(0)
                                              .toUpperCase()}</span>`;
                                          }
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                      {player.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-foreground">
                                      {player.name}
                                    </p>
                                    {currentRoundSelection && (
                                      <p className="text-sm text-primary font-medium mt-0.5">
                                        {currentRoundSelection.teamName}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant="default"
                                  className="bg-green-500"
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Confirmado
                                </Badge>
                              </div>

                              {/* Linha 2: Reações */}
                              <div className="pl-15">
                                <EmojiReactions
                                  targetId={player._id}
                                  currentUserId={currentUserId || ""}
                                  reactions={playerReactions[player._id] || []}
                                  onReact={(emoji) => {
                                    console.log(
                                      `Reação ${emoji} para jogador ${player.name}`
                                    );
                                    // Em produção: chamar API para salvar reação
                                  }}
                                />
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Players Aguardando Seleção */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-gradient-to-br from-card to-background/50 border-amber-500/30 shadow-xl">
                  <CardHeader className="border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <CardTitle className="text-xl">
                        Aguardando Seleção
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {playersWithoutSelection.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Todos os jogadores já selecionaram
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {playersWithoutSelection.map((player, index) => {
                          const isThisUser = isCurrentUser(player);

                          return (
                            <motion.div
                              key={player._id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex items-center justify-between p-4 rounded-lg border ${
                                isThisUser
                                  ? "bg-gradient-to-r from-amber-500/20 to-amber-500/10 border-amber-500/40"
                                  : "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20"
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-500">
                                  {player.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-foreground">
                                      {player.name}
                                    </span>
                                    {isThisUser && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-primary text-primary"
                                      >
                                        Você
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-amber-600 mt-1">
                                    Aguardando seleção de time...
                                  </p>
                                </div>
                              </div>

                              {isThisUser ? (
                                <Button
                                  onClick={handleSelectTeam}
                                  size="sm"
                                  className="bg-amber-500 hover:bg-amber-600 text-white ml-2"
                                >
                                  <Target className="w-4 h-4 mr-1" />
                                  Selecionar
                                </Button>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-amber-500 text-amber-500"
                                >
                                  Pendente
                                </Badge>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Eliminated Players */}
            {eliminatedPlayers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6"
              >
                <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30 backdrop-blur-xl shadow-xl">
                  <CardHeader className="border-b border-destructive/20">
                    <div className="flex items-center gap-2">
                      <Skull className="h-5 w-5 text-destructive" />
                      <CardTitle className="text-xl">
                        Jogadores Eliminados
                      </CardTitle>
                      <Badge variant="destructive" className="ml-auto">
                        {eliminatedPlayers.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {eliminatedPlayers.map((player, index) => (
                        <motion.div
                          key={player._id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative"
                        >
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-destructive/20 to-destructive/5 border border-destructive/30 opacity-60 grayscale">
                            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                              <Skull className="w-5 h-5 text-destructive" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-foreground line-through">
                                {player.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Eliminado na rodada{" "}
                                {player.selectedTeams.length}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-destructive/50 text-destructive"
                            >
                              Eliminado
                            </Badge>
                          </div>

                          {/* Linha riscada */}
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{
                              delay: index * 0.1 + 0.3,
                              duration: 0.5,
                            }}
                            className="absolute top-1/2 left-0 right-0 h-0.5 bg-destructive origin-left"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Motivational Banner */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8"
            >
              <Card className="bg-gradient-to-r from-primary/20 via-accent/30 to-primary/20 border-primary/40 shadow-2xl shadow-primary/20 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent">
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                </div>
                <CardContent className="py-8 relative z-10">
                  <motion.div
                    className="flex items-center justify-center gap-4 flex-wrap"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Zap className="h-10 w-10 text-primary" />
                    </motion.div>
                    <h3 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                      Sobreviva e Conquiste o Prêmio
                    </h3>
                    <motion.div
                      animate={{ rotate: [0, -360] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Zap className="h-10 w-10 text-primary" />
                    </motion.div>
                  </motion.div>
                  <motion.p
                    className="text-center text-muted-foreground mt-4 text-lg"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Apenas os melhores chegam ao fim 🏆
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
