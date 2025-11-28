import { useState, useEffect } from "react";
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
  ArrowRight,
  Home,
  Zap,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { roomAPI } from "@/services/api";
import heroBg from "@/assets/hero-bg.jpg";

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
  const [isProcessing, setIsProcessing] = useState(false);

  // Buscar dados da sala
  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) {
        toast({
          title: "Erro",
          description: "ID da sala não encontrado.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsLoading(true);
      try {
        const response = await roomAPI.getById(roomId);
        if (response.success) {
          setRoomData(response.data);
        }
      } catch (error) {
        console.error("Erro ao buscar sala:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a sala.",
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();

    // Polling para atualizar dados
    const interval = setInterval(() => {
      if (roomData) {
        fetchRoom();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [roomId, navigate]);

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

  const handleNextRound = () => {
    setIsProcessing(true);
    // TODO: Implementar lógica de próxima rodada
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Próxima rodada",
        description: "Funcionalidade em desenvolvimento.",
      });
    }, 2000);
  };

  const getTeamById = (teamId: string) => teams.find((t) => t.id === teamId);

  const isGameFinished =
    roomData.status === "finished" || activePlayers.length === 1;
  const winner = activePlayers.length === 1 ? activePlayers[0] : null;

  return (
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
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

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
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Rodada</p>
                      <p className="text-2xl font-bold text-primary">
                        {roomData.currentRound}/{roomData.totalRounds}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Prêmio</p>
                      <p className="text-2xl font-bold text-primary">
                        R$ {roomData.prizePool.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Winner Card */}
          <AnimatePresence>
            {isGameFinished && winner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="border-primary bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 shadow-2xl shadow-primary/30">
                  <CardHeader className="text-center space-y-4 py-12">
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Crown className="h-24 w-24 text-primary mx-auto" />
                    </motion.div>
                    <div>
                      <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                        🎉 VENCEDOR! 🎉
                      </h2>
                      <p className="text-3xl font-bold text-foreground">
                        {winner.name}
                      </p>
                      <p className="text-xl text-muted-foreground mt-4">
                        Ganhou R$ {roomData.prizePool.toFixed(2)}
                      </p>
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
                      <p className="text-3xl font-bold text-foreground">
                        {roomData.players.length}
                      </p>
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
                        Sobreviventes
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        {activePlayers.length}
                      </p>
                    </div>
                    <Target className="h-12 w-12 text-primary opacity-70" />
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
                      <p className="text-3xl font-bold text-destructive">
                        {eliminatedPlayers.length}
                      </p>
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
                    <Target className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Sobreviventes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {activePlayers.map((player, index) => {
                      const lastSelection =
                        player.selectedTeams[player.selectedTeams.length - 1];
                      const lastTeam = lastSelection
                        ? getTeamById(lastSelection.teamId)
                        : null;

                      return (
                        <motion.div
                          key={player._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 hover:border-primary/40 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            {lastTeam ? (
                              <div className="w-12 h-12 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center p-1.5 shadow-lg">
                                <img
                                  src={lastTeam.logo}
                                  alt={lastTeam.name}
                                  className="w-full h-full object-contain"
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
                              {lastSelection && (
                                <p className="text-sm text-primary font-medium mt-0.5">
                                  {lastSelection.teamName}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Eliminated Players */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-card to-background/50 border-destructive/30 shadow-xl">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Skull className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-xl">Eliminados</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {eliminatedPlayers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum eliminado ainda
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {eliminatedPlayers.map((player, index) => {
                        const lastSelection =
                          player.selectedTeams[player.selectedTeams.length - 1];
                        const lastTeam = lastSelection
                          ? getTeamById(lastSelection.teamId)
                          : null;

                        return (
                          <motion.div
                            key={player._id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-destructive/10 to-transparent border border-destructive/20 opacity-60"
                          >
                            <div className="flex items-center gap-3">
                              {lastTeam ? (
                                <div className="w-12 h-12 rounded-full bg-background border-2 border-destructive/30 flex items-center justify-center p-1.5 shadow-lg opacity-60 grayscale">
                                  <img
                                    src={lastTeam.logo}
                                    alt={lastTeam.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center font-bold text-destructive">
                                  {player.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold line-through">
                                  {player.name}
                                </p>
                                {lastSelection && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    {lastSelection.teamName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge variant="destructive">Eliminado</Badge>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

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
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
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
  );
}
