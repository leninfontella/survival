import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Users,
  DollarSign,
  QrCode,
  Copy,
  Play,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trophy,
  Zap,
  ArrowRight,
  RefreshCw,
  Lock,
  LogIn,
} from "lucide-react";
import { Link } from "react-router-dom";
import { roomAPI, authAPI } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

// Tipos
interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
}

interface Player {
  _id: string;
  name: string;
  isEliminated: boolean;
  isReady: boolean;
  selectedTeams?: string[];
  user?: User | string;
}

interface RoomData {
  _id: string;
  name: string;
  league: string;
  status: "waiting" | "active" | "finished";
  currentRound: number;
  totalRounds: number;
  minPlayers: number;
  entryPrice: number;
  prizePool: number;
  createdBy: User | string;
  players: Player[];
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

interface APIError {
  response?: {
    data?: {
      message?: string;
      requiresAuth?: boolean;
      isPrivate?: boolean;
      roomId?: string;
    };
  };
  message?: string;
}

export default function JoinRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isTogglingReady, setIsTogglingReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [showPayment, setShowPayment] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [pixCode] = useState(
    "00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Bolao Survivor6009SAO PAULO62070503***6304ABCD"
  );
  const [showStartingModal, setShowStartingModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);

  useEffect(() => {
    if (!roomId) {
      console.error("❌ RoomId não fornecido na URL");
      setError("ID da sala não fornecido");
      setIsLoading(false);
      return;
    }

    const fetchRoom = async () => {
      console.log("🔍 Buscando sala com ID:", roomId);
      setError(null);

      try {
        const response = await roomAPI.getById(roomId);
        console.log("✅ Resposta da API:", response);

        if (response.success && response.data) {
          if (response.needsInvite) {
            console.log("⚠️ Sala privada - precisa de convite");
            setError(
              response.message ||
                "Esta sala é privada. Você precisa de um convite para participar."
            );
            setIsLoading(false);
            return;
          }

          const room = response.data as RoomData;
          const previousStatus = roomData?.status;

          console.log("📦 Dados da sala carregados:", room);
          console.log(
            "📊 Status anterior:",
            previousStatus,
            "| Status atual:",
            room.status
          );

          const userId = authAPI.getCurrentUserId();
          console.log("👤 UserId atual:", userId);

          if (userId && room.players) {
            const playerInRoom = room.players.find((p: Player) => {
              if (typeof p.user === "string") {
                return p.user === userId;
              } else if (p.user) {
                return p.user._id === userId || p.user.id === userId;
              }
              return false;
            });

            if (playerInRoom) {
              setHasJoined(true);
              setCurrentPlayer(playerInRoom);
              console.log("✓ Jogador encontrado na sala:", playerInRoom);
              console.log("🎮 Status ready:", playerInRoom.isReady);
            }

            console.log("📊 Estado atual:", {
              hasJoined: !!playerInRoom,
              isReady: playerInRoom?.isReady,
              status: room.status,
              previousStatus,
              players: room.players.length,
            });

            if (room.status === "active") {
              if (
                (!previousStatus && !roomData) ||
                previousStatus === "waiting"
              ) {
                console.log("🚀 Sala ativa detectada! Mostrando modal...");
                setShowStartingModal(true);
                setRoomData(room);
                return;
              }
            }
          }

          setRoomData(room);
        } else {
          console.error("❌ Resposta inválida:", response);
          setError("Dados da sala inválidos");
        }
      } catch (err) {
        const error = err as APIError;
        console.error("❌ Erro ao buscar sala:", error);
        console.error("📋 Detalhes:", error.response?.data);

        const errorData = error.response?.data;

        if (errorData?.requiresAuth && errorData?.isPrivate) {
          console.log("🔒 SALA PRIVADA - AUTENTICAÇÃO OBRIGATÓRIA");
          setRequiresAuth(true);
          setError(
            errorData.message ||
              "Esta sala é privada. Você precisa fazer login para acessar."
          );

          toast({
            title: "🔒 Sala Privada",
            description: "Faça login para acessar esta sala.",
            variant: "destructive",
          });
        } else {
          const errorMessage =
            errorData?.message || error.message || "Erro desconhecido";
          setError(errorMessage);

          toast({
            title: "Erro ao carregar sala",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();
  }, [roomId, roomData]);

  const handleRefresh = async () => {
    if (!roomId || isRefreshing) return;

    setIsRefreshing(true);
    console.log("🔄 Atualizando dados da sala manualmente...");

    try {
      const response = await roomAPI.getById(roomId);

      if (response.success && response.data) {
        const room = response.data as RoomData;
        const previousStatus = roomData?.status;

        const userId = authAPI.getCurrentUserId();

        if (userId && room.players) {
          const playerInRoom = room.players.find((p: Player) => {
            if (typeof p.user === "string") {
              return p.user === userId;
            } else if (p.user) {
              return p.user._id === userId || p.user.id === userId;
            }
            return false;
          });

          if (playerInRoom) {
            setHasJoined(true);
            setCurrentPlayer(playerInRoom);
          }

          if (room.status === "active" && previousStatus === "waiting") {
            console.log("🚀 Sala ativa detectada! Mostrando modal...");
            setShowStartingModal(true);
          }
        }

        setRoomData(room);

        toast({
          title: "Atualizado!",
          description: "Dados da sala atualizados com sucesso.",
        });
      }
    } catch (err) {
      const error = err as APIError;
      toast({
        title: "Erro ao atualizar",
        description:
          error.response?.data?.message || "Não foi possível atualizar.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomData) {
      toast({
        title: "Erro",
        description: "Sala não encontrada.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, digite seu nome.",
        variant: "destructive",
      });
      return;
    }

    setShowPayment(true);
  };

  const handlePaymentConfirm = async () => {
    if (!roomData || !roomId) return;

    setIsJoining(true);
    console.log("💳 Confirmando pagamento para:", formData.name);

    try {
      const response = await roomAPI.join(roomId, formData.name);
      console.log("✅ Resposta do join:", response);

      if (response.success) {
        setHasJoined(true);
        setCurrentPlayer(response.data.player);
        toast({
          title: "Pagamento confirmado!",
          description:
            "Você entrou na sala. Clique em 'Estou Pronto' para iniciar!",
        });

        const updatedRoom = await roomAPI.getById(roomId);
        if (updatedRoom.success) {
          setRoomData(updatedRoom.data as RoomData);
        }

        setShowPayment(false);
      }
    } catch (err) {
      const error = err as APIError;
      console.error("❌ Erro ao entrar na sala:", error);
      toast({
        title: "Erro ao entrar na sala",
        description:
          error.response?.data?.message || "Não foi possível entrar na sala.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleToggleReady = async () => {
    if (!roomId || !currentPlayer) return;

    setIsTogglingReady(true);
    console.log("🎮 Alternando status ready...");

    try {
      const response = await roomAPI.toggleReady(roomId);
      console.log("✅ Toggle ready:", response);

      if (response.success) {
        setCurrentPlayer(response.data.player);

        toast({
          title: response.data.player.isReady
            ? "Você está pronto!"
            : "Você não está mais pronto",
          description: response.data.player.isReady
            ? `${response.data.readyCount}/${response.data.totalCount} jogadores prontos`
            : "Clique novamente quando estiver pronto",
        });

        if (response.data.room) {
          setRoomData(response.data.room as RoomData);
        }

        if (response.data.allReady) {
          console.log("🎉 TODOS PRONTOS! A sala será iniciada...");
          setShowStartingModal(true);
        }
      }
    } catch (err) {
      const error = err as APIError;
      console.error("❌ Erro ao alternar ready:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.message || "Não foi possível atualizar status.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingReady(false);
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    toast({
      title: "Código PIX copiado!",
      description: "Cole no seu aplicativo de pagamento.",
    });
  };

  const shareLink = `${window.location.origin}/join-room/${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copiado!",
      description: "Compartilhe com outros jogadores.",
    });
  };

  // Modal de Início - MOBILE FIRST
  const StartingGameModal = () => (
    <AnimatePresence>
      {showStartingModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{
              type: "spring",
              duration: 0.5,
              bounce: 0.3,
            }}
            className="fixed inset-0 flex items-center justify-center z-50 p-3"
          >
            <div className="relative w-full max-w-sm">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-2xl blur-2xl"
              />

              <motion.div
                className="relative bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30"
                animate={{
                  boxShadow: [
                    "0 0 30px rgba(168, 85, 247, 0.4)",
                    "0 0 50px rgba(236, 72, 153, 0.6)",
                    "0 0 30px rgba(168, 85, 247, 0.4)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(15)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full"
                      initial={{
                        x: Math.random() * 300,
                        y: Math.random() * 500,
                        opacity: 0,
                      }}
                      animate={{
                        y: [null, -80],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>

                <div className="relative p-6 text-center space-y-6">
                  <motion.div
                    className="relative mx-auto w-20 h-20 flex items-center justify-center"
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-purple-500/30"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    <motion.div
                      className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-full shadow-2xl"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Play className="w-10 h-10 text-white" />
                    </motion.div>

                    {[0, 90, 180, 270].map((angle, i) => (
                      <motion.div
                        key={angle}
                        className="absolute"
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: `rotate(${angle}deg) translateY(-50px)`,
                        }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: "easeOut",
                        }}
                      >
                        <Zap className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <motion.h2
                      className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent"
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{
                        backgroundSize: "200% 200%",
                      }}
                    >
                      🎉 INICIADO! 🎉
                    </motion.h2>

                    <motion.p
                      className="text-base text-purple-200 font-semibold px-2"
                      animate={{
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      A competição começou!
                    </motion.p>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-center gap-2 text-white/80 text-sm px-4">
                      <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <p>Entre na sala de sobrevivência</p>
                      <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.7,
                      type: "spring",
                      stiffness: 200,
                      damping: 10,
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-sm"
                  >
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-200 font-bold">
                      Boa sorte!
                    </span>
                    <Trophy className="w-4 h-4 text-yellow-400" />
                  </motion.div>

                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <motion.button
                      onClick={() => navigate(`/survival-room/${roomId}`)}
                      className="group relative w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-white shadow-2xl overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      animate={{
                        boxShadow: [
                          "0 0 15px rgba(168, 85, 247, 0.5)",
                          "0 0 30px rgba(236, 72, 153, 0.7)",
                          "0 0 15px rgba(168, 85, 247, 0.5)",
                        ],
                      }}
                      transition={{
                        boxShadow: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />

                      <span className="relative flex items-center justify-center gap-2 text-sm">
                        <Play className="w-5 h-5" />
                        Ir para Sala
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Loading state - MOBILE FIRST
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-3">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground text-sm">Carregando sala...</p>
            <p className="text-xs text-muted-foreground mt-2 break-all px-2">
              ID: {roomId}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de bloqueio - MOBILE FIRST
  if (requiresAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-3">
        <Card className="w-full max-w-sm border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" />
              <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 p-4 rounded-full shadow-2xl">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-amber-600 mb-2">
                🔒 Sala Privada
              </h2>
              <p className="text-sm text-muted-foreground px-2">{error}</p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>⚠️ Acesso Restrito</strong>
                <br />
                Faça login para acessar esta sala privada.
              </p>
            </div>

            {roomId && (
              <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded break-all">
                {roomId}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() =>
                  navigate("/login", {
                    state: {
                      from: `/join-room/${roomId}`,
                      message:
                        "Faça login para acessar esta sala privada e continuar.",
                    },
                  })
                }
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-sm"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Fazer Login
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate("/register")}
                className="text-sm"
              >
                Cadastre-se
              </Button>

              <Link to="/dashboard">
                <Button variant="ghost" className="w-full text-sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - MOBILE FIRST
  if (error || !roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-3">
        <div className="container mx-auto max-w-sm">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-4 text-sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>

          <Card className="border-destructive/50">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-base mb-2">
                  {error?.includes("privada")
                    ? "🔒 Sala Privada"
                    : "Sala não encontrada"}
                </h3>
                <p className="text-muted-foreground text-sm px-2">
                  {error || "A sala não existe ou foi removida."}
                </p>
                {error?.includes("privada") && (
                  <div className="mt-3 p-2 bg-amber-500/10 rounded-md border border-amber-500/30">
                    <p className="text-xs text-amber-700">
                      💡 Verifique se está logado com a conta correta.
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2 break-all">
                  {roomId}
                </p>
              </div>
              <Link to="/dashboard" className="block">
                <Button className="w-full text-sm">Voltar</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalPrice = roomData.entryPrice;
  const readyPlayers = roomData.players.filter((p) => p.isReady).length;
  const totalPlayers = roomData.players.length;
  const canStart = totalPlayers >= roomData.minPlayers;
  const allReady = canStart && readyPlayers === totalPlayers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <div className="container mx-auto px-3 py-4 max-w-2xl">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-4 text-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className="space-y-3">
          {/* Header Mobile */}
          <Card className="border-primary/30 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
                    {roomData.name}
                  </CardTitle>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all flex items-center justify-center disabled:opacity-50"
                    title="Atualizar"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-primary transition-transform ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {roomData.status === "waiting" ? "Aguardando" : "Ativo"}
                  </Badge>
                  {currentPlayer?.isReady && (
                    <Badge variant="default" className="bg-green-500 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Pronto
                    </Badge>
                  )}
                </div>

                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Prêmio Total
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    R$ {roomData.prizePool.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Mobile - Grid 3 colunas compactas */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-3">
                <div className="text-center space-y-1">
                  <Users className="h-6 w-6 text-primary mx-auto" />
                  <div className="text-lg font-bold">
                    {totalPlayers}/{roomData.minPlayers}
                  </div>
                  <div className="text-xs text-muted-foreground">Jogadores</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-3">
                <div className="text-center space-y-1">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto" />
                  <div className="text-lg font-bold text-green-500">
                    {readyPlayers}/{totalPlayers}
                  </div>
                  <div className="text-xs text-muted-foreground">Prontos</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-3">
                <div className="text-center space-y-1">
                  <Play className="h-6 w-6 text-glow mx-auto" />
                  <div className="text-lg font-bold">
                    {roomData.totalRounds}
                  </div>
                  <div className="text-xs text-muted-foreground">Rodadas</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Link Compartilhar */}
          {hasJoined && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-3 pb-3">
                <Label className="mb-2 block text-xs">Compartilhar</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="font-mono text-xs h-9"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulário ou Status - MOBILE */}
          {!hasJoined ? (
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Entrar na Sala</CardTitle>
                <CardDescription className="text-xs">
                  Preencha para participar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showPayment ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm">
                        Seu Nome
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Digite seu nome"
                        required
                        className="h-10"
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-accent" />
                          <span className="font-semibold text-sm">Total</span>
                        </div>
                        <span className="text-xl font-bold text-accent">
                          R$ {totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-11" size="lg">
                      <Users className="mr-2 h-5 w-5" />
                      Confirmar Entrada
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-bold mb-1">Pagamento PIX</h3>
                      <p className="text-muted-foreground text-xs">
                        Escaneie o QR Code ou copie
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="w-40 h-40 bg-white p-3 rounded-lg flex items-center justify-center">
                          <QrCode className="w-full h-full text-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">
                          R$ {totalPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formData.name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Código PIX</Label>
                      <div className="flex gap-2">
                        <Input
                          value={pixCode}
                          readOnly
                          className="font-mono text-xs h-9"
                        />
                        <Button
                          onClick={handleCopyPix}
                          variant="outline"
                          size="sm"
                          className="h-9 px-3"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowPayment(false)}
                        variant="outline"
                        className="flex-1 h-10"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handlePaymentConfirm}
                        className="flex-1 h-10"
                        disabled={isJoining}
                      >
                        {isJoining ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span className="text-sm">Confirmando...</span>
                          </>
                        ) : (
                          <span className="text-sm">Confirmar</span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : roomData.status === "waiting" ? (
            <Card
              className={`border-2 ${
                allReady
                  ? "border-green-500 bg-green-500/5"
                  : "border-accent/50 bg-accent/5"
              }`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="text-center space-y-3">
                  {!canStart ? (
                    <>
                      <p className="text-muted-foreground text-sm">
                        Aguardando mais {roomData.minPlayers - totalPlayers}{" "}
                        jogador(es)...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Compartilhe o link!
                      </p>
                    </>
                  ) : allReady ? (
                    <>
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto animate-pulse" />
                      <h3 className="text-xl font-bold text-green-500">
                        🎉 Todos Prontos!
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Começando...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center mb-3">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center ${
                            currentPlayer?.isReady
                              ? "bg-green-500"
                              : "bg-amber-500"
                          }`}
                        >
                          {currentPlayer?.isReady ? (
                            <CheckCircle2 className="h-7 w-7 text-white" />
                          ) : (
                            <XCircle className="h-7 w-7 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-base font-semibold">
                        {currentPlayer?.isReady
                          ? "Você está pronto!"
                          : "Pronto para começar?"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {readyPlayers}/{totalPlayers} prontos
                      </p>
                      <Button
                        onClick={handleToggleReady}
                        disabled={isTogglingReady}
                        size="lg"
                        className="w-full h-11"
                        variant={currentPlayer?.isReady ? "outline" : "default"}
                      >
                        {isTogglingReady ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processando...
                          </>
                        ) : currentPlayer?.isReady ? (
                          <>
                            <XCircle className="mr-2 h-5 w-5" />
                            Cancelar
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Estou Pronto!
                          </>
                        )}
                      </Button>
                      {canStart && (
                        <p className="text-xs text-primary mt-2">
                          ⏳ Aguardando todos ficarem prontos...
                        </p>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Lista de Jogadores - MOBILE */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Jogadores ({roomData.players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roomData.players.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">
                    Nenhum jogador ainda
                  </p>
                ) : (
                  roomData.players.map((player: Player, index: number) => (
                    <div
                      key={player._id}
                      className="flex justify-between items-center p-2 rounded-lg bg-background/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {player.name}
                        </span>
                      </div>
                      {roomData.status === "waiting" && (
                        <Badge
                          variant={player.isReady ? "default" : "secondary"}
                          className={`${
                            player.isReady ? "bg-green-500" : ""
                          } text-xs`}
                        >
                          {player.isReady ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Pronto
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Aguardando
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <StartingGameModal />
    </div>
  );
}
