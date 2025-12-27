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
  RefreshCw,
  Share2,
  MoreVertical,
  BookOpen,
  Settings,
  LogOut,
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
import { useSwipeable } from "react-swipeable";
import { useNetworkState } from "react-use";

// ========== HAPTIC FEEDBACK UTILITY ========== //
const vibrate = (pattern: number | number[] = 50): void => {
  if (!("vibrate" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost")
    return;

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.error("Haptic feedback error:", error);
  }
};

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
  const { online } = useNetworkState();

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const isMountedRef = useRef(true);
  const [showWinnerConfetti, setShowWinnerConfetti] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // ========== PULL-TO-REFRESH STATES ========== //
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [canPull, setCanPull] = useState(false);

  // ========== BOTTOM NAV STATES ========== //
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  // ========== SWIPE STATES ========== //
  const [activePlayerTab, setActivePlayerTab] = useState<
    "selected" | "waiting"
  >("selected");
  const [swipeIndicator, setSwipeIndicator] = useState<"left" | "right" | null>(
    null
  );

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

  // Buscar userId ao montar
  useEffect(() => {
    const userId = authAPI.getCurrentUserId();
    setCurrentUserId(userId);
  }, []);

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

  // ========== SWIPE HANDLERS ========== //

  // 1. Swipe para fechar modal de histórico
  const historySwipeHandlers = useSwipeable({
    onSwipedDown: (eventData) => {
      if (eventData.velocity > 0.5) {
        setShowHistory(false);
        vibrate(50);
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: false,
    delta: 10,
  });

  // 2. Swipe para alternar entre abas de jogadores
  const playerTabSwipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      setActivePlayerTab("waiting");
      setSwipeIndicator("left");
      setTimeout(() => setSwipeIndicator(null), 300);
      vibrate(30);
    },
    onSwipedRight: () => {
      setActivePlayerTab("selected");
      setSwipeIndicator("right");
      setTimeout(() => setSwipeIndicator(null), 300);
      vibrate(30);
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: false,
    delta: 50,
  });

  // ========== PULL-TO-REFRESH HANDLERS ========== //

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setCanPull(true);
      setStartY(e.touches[0].clientY);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!canPull || startY === 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      if (distance > 0 && window.scrollY === 0) {
        const resistanceFactor = Math.min(distance / 3, 80);
        setPullDistance(resistanceFactor);

        if (distance > 10) {
          e.preventDefault();
        }
      }
    },
    [canPull, startY]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!canPull) return;

    if (pullDistance > 60) {
      setIsRefreshing(true);
      vibrate([50, 30, 50]);

      try {
        if (roomId) {
          const response = await roomAPI.getById(roomId);
          if (response.success && isMountedRef.current) {
            setRoomData(response.data);

            toast({
              title: "Atualizado!",
              description: "Dados da sala foram atualizados",
              duration: 2000,
            });
            vibrate(30);
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar:", error);
        toast({
          title: "Erro ao atualizar",
          description: "Tente novamente em alguns instantes",
          variant: "destructive",
          duration: 2000,
        });
        vibrate([100, 50, 100]);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setStartY(0);
          setCanPull(false);
        }, 500);
      }
    } else {
      setPullDistance(0);
      setStartY(0);
      setCanPull(false);
    }
  }, [canPull, pullDistance, roomId]);

  // Handler para navegar para seleção de time
  const handleSelectTeam = useCallback(() => {
    if (!roomId) return;

    vibrate(50);

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

    fetchRoom();

    // Polling ajustado baseado em conexão
    const pollInterval = online ? 5000 : 10000;
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        fetchRoom();
      }
    }, pollInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [roomId, navigate, online]);

  // ========== AUTO-HIDE BOTTOM NAV ON SCROLL ========== //
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowBottomNav(false);
      } else if (currentScrollY < lastScrollY) {
        setShowBottomNav(true);
      }

      if (currentScrollY < 50) {
        setShowBottomNav(true);
      }

      setLastScrollY(currentScrollY);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setShowBottomNav(true);
      }, 2000);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [lastScrollY]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Vibração ao terminar jogo
  useEffect(() => {
    if (roomData?.status === "finished" && showWinnerConfetti) {
      vibrate([100, 50, 100, 50, 200, 100, 300]);
    }
  }, [roomData?.status, showWinnerConfetti]);

  const getTeamById = useCallback(
    (teamId: string) => teams.find((t) => t.id === teamId),
    [teams]
  );

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

  // ========== BOTTOM NAVIGATION COMPONENT ========== //
  const BottomNavigation = () => (
    <AnimatePresence>
      {showBottomNav && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)",
            paddingTop: "0.75rem",
          }}
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-4 gap-2">
              {currentUserNeedsSelection ? (
                <Button
                  onClick={() => {
                    vibrate(50);
                    handleSelectTeam();
                  }}
                  size="sm"
                  className="flex-col h-auto py-2 gap-1 bg-amber-500 hover:bg-amber-600 col-span-2 touch-manipulation"
                >
                  <Target className="h-5 w-5" />
                  <span className="text-xs font-semibold">Selecionar</span>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      vibrate(30);
                      setShowHistory(true);
                    }}
                    variant="ghost"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 touch-manipulation"
                  >
                    <History className="h-5 w-5" />
                    <span className="text-xs">Histórico</span>
                  </Button>

                  <Button
                    onClick={async () => {
                      vibrate(30);

                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: roomData?.name || "Sala de Sobrevivência",
                            text: `Participe da sala ${roomData?.name}! Prêmio: R$ ${roomData?.prizePool}`,
                            url: window.location.href,
                          });
                          vibrate([50, 30, 50]);
                        } catch (err) {
                          console.log("Share cancelled");
                        }
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast({
                          title: "Link copiado!",
                          duration: 2000,
                        });
                        vibrate(50);
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 touch-manipulation"
                  >
                    <Share2 className="h-5 w-5" />
                    <span className="text-xs">Compartilhar</span>
                  </Button>
                </>
              )}

              <Button
                onClick={async () => {
                  vibrate(30);
                  setIsRefreshing(true);

                  try {
                    if (roomId) {
                      const response = await roomAPI.getById(roomId);
                      if (response.success) {
                        setRoomData(response.data);
                        toast({ title: "Atualizado!", duration: 2000 });
                        vibrate(50);
                      }
                    }
                  } catch (error) {
                    console.error(error);
                    vibrate([100, 50, 100]);
                  } finally {
                    setTimeout(() => setIsRefreshing(false), 500);
                  }
                }}
                variant="ghost"
                size="sm"
                disabled={isRefreshing}
                className="flex-col h-auto py-2 gap-1 touch-manipulation"
              >
                <RefreshCw
                  className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="text-xs">Atualizar</span>
              </Button>

              <Button
                onClick={() => {
                  vibrate(30);
                  setShowMenu(true);
                }}
                variant="ghost"
                size="sm"
                className="flex-col h-auto py-2 gap-1 touch-manipulation"
              >
                <MoreVertical className="h-5 w-5" />
                <span className="text-xs">Mais</span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ========== MENU MODAL ========== //
  const MenuModal = () => (
    <AnimatePresence>
      {showMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setShowMenu(false)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-card rounded-t-2xl overflow-hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-4" />

            <div className="px-4 pb-6">
              <h3 className="text-lg font-bold mb-4">Menu</h3>

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start touch-manipulation"
                  onClick={() => {
                    vibrate(30);
                    setShowMenu(false);
                  }}
                >
                  <BookOpen className="mr-3 h-5 w-5" />
                  Ver Regras
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start touch-manipulation"
                  onClick={() => {
                    vibrate(30);
                    setShowMenu(false);
                    setShowHistory(true);
                  }}
                >
                  <History className="mr-3 h-5 w-5" />
                  Ver Histórico
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start touch-manipulation"
                  onClick={() => {
                    vibrate(30);
                    setShowMenu(false);
                  }}
                >
                  <Settings className="mr-3 h-5 w-5" />
                  Configurações
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
                  onClick={() => {
                    vibrate([50, 30, 50]);
                    setShowMenu(false);
                    navigate("/dashboard");
                  }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sair da Sala
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ========== LOADING STATE ========== //
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

  // ========== ROOM NOT FOUND ========== //
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

      {/* Offline Banner */}
      <AnimatePresence>
        {!online && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground p-3 text-center text-sm font-medium"
          >
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Você está offline. Algumas funcionalidades podem estar limitadas.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="min-h-screen relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ overscrollBehavior: "none" }}
      >
        {/* Pull-to-Refresh Indicator */}
        <AnimatePresence>
          {(pullDistance > 0 || isRefreshing) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: Math.min(pullDistance, 80),
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none"
            >
              <div className="bg-card/95 backdrop-blur-lg rounded-full px-6 py-3 shadow-2xl border border-primary/30 flex items-center gap-3">
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Atualizando...
                    </span>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{
                        rotate: pullDistance * 3.6,
                        scale: pullDistance > 60 ? 1.2 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="text-primary"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </motion.div>
                    <span className="text-sm font-medium text-foreground">
                      {pullDistance > 60
                        ? "Solte para atualizar"
                        : "Puxe para atualizar"}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Modal de Histórico - MOBILE OPTIMIZED */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setShowHistory(false)}
            >
              <motion.div
                {...historySwipeHandlers}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-xl"
              >
                {/* Swipe Indicator */}
                <div className="sm:hidden bg-card/95 backdrop-blur-xl pt-3 pb-1 flex justify-center sticky top-0 z-10">
                  <motion.div
                    animate={{
                      scaleX: swipeIndicator ? 1.2 : 1,
                      backgroundColor: swipeIndicator
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground) / 0.3)",
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-12 h-1 rounded-full"
                  />
                </div>

                <Card className="border-primary/30 bg-gradient-to-br from-card via-card/95 to-background shadow-2xl h-full flex flex-col">
                  <CardHeader className="border-b border-border/50 p-4 sm:p-6 flex-shrink-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <History className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                        <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold truncate">
                          Histórico de Rodadas
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          vibrate(30);
                          setShowHistory(false);
                        }}
                        className="hover:bg-destructive/10 h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 touch-manipulation"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
                    <div className="space-y-3 sm:space-y-4 md:space-y-6">
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
                            <CardHeader className="p-3 sm:p-4 sm:pb-4">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0 ${
                                      round.isActive
                                        ? "bg-primary text-primary-foreground"
                                        : round.isPast
                                        ? "bg-muted text-muted-foreground"
                                        : "bg-muted/50 text-muted-foreground/50"
                                    }`}
                                  >
                                    {round.round}
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg md:text-xl font-bold truncate">
                                      Rodada {round.round}/
                                      {roomData.totalRounds}
                                    </h3>
                                    {round.isActive && (
                                      <Badge
                                        variant="default"
                                        className="mt-1 bg-primary text-xs"
                                      >
                                        Atual
                                      </Badge>
                                    )}
                                    {round.isPast && (
                                      <Badge
                                        variant="outline"
                                        className="mt-1 border-green-500 text-green-500 text-xs"
                                      >
                                        Concluída
                                      </Badge>
                                    )}
                                    {round.isFuture && (
                                      <Badge
                                        variant="outline"
                                        className="mt-1 border-muted-foreground/50 text-muted-foreground/50 text-xs"
                                      >
                                        Aguardando
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4 pt-0">
                              {round.isFuture ? (
                                <div className="text-center py-6 sm:py-8">
                                  <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mx-auto mb-2 sm:mb-3" />
                                  <p className="text-sm sm:text-base text-muted-foreground">
                                    Aguardando rodada
                                  </p>
                                </div>
                              ) : round.players.length === 0 ? (
                                <div className="text-center py-6 sm:py-8">
                                  <p className="text-sm text-muted-foreground">
                                    Nenhum jogador selecionou
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2 sm:space-y-3">
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
                                        className={`flex items-center justify-between gap-2 p-3 sm:p-4 rounded-lg border ${
                                          won === true
                                            ? "bg-green-500/10 border-green-500/30"
                                            : won === false
                                            ? "bg-red-500/10 border-red-500/30"
                                            : "bg-muted/30 border-border/30"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                          {team ? (
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background border border-border flex items-center justify-center p-1 sm:p-1.5 shadow overflow-hidden flex-shrink-0">
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
                                                    parent.innerHTML = `<span class="text-primary font-bold text-xs sm:text-sm">${team.name
                                                      .charAt(0)
                                                      .toUpperCase()}</span>`;
                                                  }
                                                }}
                                              />
                                            </div>
                                          ) : (
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                                              {player.playerName
                                                .charAt(0)
                                                .toUpperCase()}
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                                              {player.playerName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                              {player.selection!.teamName}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                          {won === true && (
                                            <Badge
                                              variant="default"
                                              className="bg-green-500 hover:bg-green-600 text-xs"
                                            >
                                              <CheckCircle className="w-3 h-3 mr-0.5 sm:mr-1" />
                                              <span className="hidden xs:inline">
                                                Venceu
                                              </span>
                                              <span className="xs:hidden">
                                                V
                                              </span>
                                            </Badge>
                                          )}
                                          {won === false && (
                                            <Badge
                                              variant="destructive"
                                              className="bg-red-500 hover:bg-red-600 text-xs"
                                            >
                                              <XCircle className="w-3 h-3 mr-0.5 sm:mr-1" />
                                              <span className="hidden xs:inline">
                                                Perdeu
                                              </span>
                                              <span className="xs:hidden">
                                                P
                                              </span>
                                            </Badge>
                                          )}
                                          {won === null && (
                                            <Badge
                                              variant="outline"
                                              className="border-muted-foreground/50 text-muted-foreground text-xs"
                                            >
                                              <Clock className="w-3 h-3 mr-0.5 sm:mr-1" />
                                              <span className="hidden xs:inline">
                                                Aguardando
                                              </span>
                                              <span className="xs:hidden">
                                                ...
                                              </span>
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

        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 relative z-10">
          {/* Botão voltar - sticky em mobile */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 md:mb-8 sticky top-0 z-20 bg-background/80 backdrop-blur-sm py-2 sm:py-0 sm:bg-transparent sm:backdrop-blur-none"
          >
            <Link to="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-primary/10 touch-manipulation"
                onClick={() => vibrate(30)}
              >
                <Home className="mr-1.5 sm:mr-2 h-4 w-4" />
                <span className="text-sm">Início</span>
              </Button>
            </Link>
          </motion.div>

          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
            {/* Game Header - MOBILE OPTIMIZED */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary/30 bg-gradient-to-br from-card/90 via-card/50 to-card/90 backdrop-blur-xl shadow-2xl shadow-primary/10">
                <CardHeader className="pb-4">
                  <div className="space-y-4">
                    {/* Linha 1: Título + Trophy */}
                    <div className="flex items-start gap-3">
                      <Trophy className="h-8 w-8 md:h-10 md:w-10 text-primary animate-pulse flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent truncate">
                          {roomData.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sala de Sobrevivência
                        </p>
                      </div>
                    </div>

                    {/* Linha 2: Stats em Grid Responsivo */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-background/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          Rodada
                        </p>
                        <StateTransition state={roomData.currentRound}>
                          <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                            {roomData.currentRound}/{roomData.totalRounds}
                          </p>
                        </StateTransition>
                      </div>
                      <div className="bg-background/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          Prêmio
                        </p>
                        <StateTransition state={roomData.prizePool}>
                          <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                            R$ {roomData.prizePool.toFixed(2)}
                          </p>
                        </StateTransition>
                      </div>
                    </div>

                    {/* Linha 3: Botões de Ação */}
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                      <Button
                        onClick={() => {
                          vibrate(30);
                          setShowHistory(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="border-primary/30 hover:bg-primary/10 whitespace-nowrap flex-shrink-0 touch-manipulation"
                      >
                        <History className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline">Histórico</span>
                        <span className="sm:hidden">Ver</span>
                      </Button>
                      <div className="flex-shrink-0">
                        <ShareButton
                          roomId={roomData._id}
                          roomName={roomData.name}
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <ThemeSelector />
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>

            {/* Call to Action - MOBILE OPTIMIZED */}
            <AnimatePresence>
              {currentUserNeedsSelection && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-2 border-amber-500 bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-amber-500/5 shadow-lg">
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
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
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500 flex items-center justify-center shadow-lg flex-shrink-0"
                          >
                            <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-amber-600 mb-1">
                              ⚠️ Time não selecionado!
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Rodada {roomData.currentRound} - Selecione agora
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={handleSelectTeam}
                          size="lg"
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-xl hover:shadow-2xl transition-all touch-manipulation"
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

            {/* Winner Card - MOBILE OPTIMIZED */}
            <AnimatePresence>
              {isGameFinished && winner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onAnimationComplete={() => setShowWinnerConfetti(true)}
                >
                  <ConfettiEffect
                    trigger={showWinnerConfetti}
                    type="realistic"
                    duration={5000}
                  />

                  <Fireworks
                    active={showWinnerConfetti}
                    count={8}
                    duration={6000}
                  />

                  <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 backdrop-blur-xl shadow-2xl shadow-primary/40 relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 opacity-20 sm:opacity-30"
                      animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                      style={{
                        backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
                        backgroundSize: "30px 30px",
                      }}
                    />

                    <CardHeader className="text-center space-y-3 sm:space-y-4 py-8 sm:py-10 md:py-12 px-4 relative z-10">
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
                              "drop-shadow(0 0 15px hsl(var(--primary)))",
                              "drop-shadow(0 0 30px hsl(var(--primary)))",
                              "drop-shadow(0 0 15px hsl(var(--primary)))",
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Crown className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-primary mx-auto" />
                        </motion.div>
                      </motion.div>

                      <div className="space-y-2 sm:space-y-3">
                        <motion.h2
                          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-2 sm:mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent px-4"
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

                        <motion.p
                          className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground px-4 break-words"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          {winner.name}
                        </motion.p>

                        <motion.div
                          className="pt-2 sm:pt-4 px-4"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5, type: "spring" }}
                        >
                          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground">
                            Ganhou
                          </p>
                          <motion.p
                            className="text-xl sm:text-2xl md:text-3xl font-black text-primary mt-1"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            R$ {roomData.prizePool.toFixed(2)}
                          </motion.p>
                        </motion.div>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Grid - MOBILE OPTIMIZED */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-card to-background/50 border-border/50 shadow-md">
                  <CardContent className="p-4 sm:pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                          Jogadores
                        </p>
                        <StateTransition state={roomData.players.length}>
                          <p className="text-2xl sm:text-3xl font-black text-foreground">
                            {roomData.players.length}
                          </p>
                        </StateTransition>
                      </div>
                      <Users className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary opacity-50 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 shadow-md">
                  <CardContent className="p-4 sm:pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                          Selecionados
                        </p>
                        <StateTransition state={playersWithSelection.length}>
                          <p className="text-2xl sm:text-3xl font-black text-primary">
                            {playersWithSelection.length}
                          </p>
                        </StateTransition>
                      </div>
                      <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary opacity-70 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30 shadow-md">
                  <CardContent className="p-4 sm:pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                          Eliminados
                        </p>
                        <StateTransition state={eliminatedPlayers.length}>
                          <p className="text-2xl sm:text-3xl font-bold text-destructive">
                            {eliminatedPlayers.length}
                          </p>
                        </StateTransition>
                      </div>
                      <Skull className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-destructive opacity-70 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Players Lists - MOBILE OPTIMIZED WITH TABS */}
            <div className="space-y-4">
              {/* TABS MOBILE (Apenas em telas pequenas) */}
              <div className="md:hidden">
                <Card className="bg-card/50 border-border/30">
                  <CardContent className="p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={
                          activePlayerTab === "selected" ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => {
                          vibrate(30);
                          setActivePlayerTab("selected");
                        }}
                        className="w-full touch-manipulation"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        <span className="text-xs">Selecionados</span>
                        <Badge
                          variant={
                            activePlayerTab === "selected"
                              ? "secondary"
                              : "outline"
                          }
                          className="ml-2 text-xs"
                        >
                          {playersWithSelection.length}
                        </Badge>
                      </Button>

                      <Button
                        variant={
                          activePlayerTab === "waiting" ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => {
                          vibrate(30);
                          setActivePlayerTab("waiting");
                        }}
                        className="w-full touch-manipulation"
                      >
                        <Clock className="w-4 h-4 mr-1.5" />
                        <span className="text-xs">Aguardando</span>
                        <Badge
                          variant={
                            activePlayerTab === "waiting"
                              ? "secondary"
                              : "outline"
                          }
                          className="ml-2 text-xs"
                        >
                          {playersWithoutSelection.length}
                        </Badge>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Indicador de Swipe */}
                <div className="flex justify-center gap-1 mt-2">
                  <motion.div
                    animate={{
                      scale: activePlayerTab === "selected" ? 1.5 : 1,
                      backgroundColor:
                        activePlayerTab === "selected"
                          ? "hsl(var(--primary))"
                          : "hsl(var(--muted-foreground) / 0.3)",
                    }}
                    className="w-2 h-2 rounded-full"
                  />
                  <motion.div
                    animate={{
                      scale: activePlayerTab === "waiting" ? 1.5 : 1,
                      backgroundColor:
                        activePlayerTab === "waiting"
                          ? "hsl(var(--primary))"
                          : "hsl(var(--muted-foreground) / 0.3)",
                    }}
                    className="w-2 h-2 rounded-full"
                  />
                </div>

                {/* Dica de Swipe */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1"
                >
                  <span>←</span> Deslize para navegar <span>→</span>
                </motion.p>
              </div>

              {/* Container com Swipe Handlers */}
              <div
                {...playerTabSwipeHandlers}
                className="md:grid md:grid-cols-2 md:gap-6 space-y-4 md:space-y-0"
              >
                {/* Card 1: Jogadores com Time - MOBILE OPTIMIZED */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity:
                      activePlayerTab === "selected" || window.innerWidth >= 768
                        ? 1
                        : 0,
                    x: 0,
                    display:
                      activePlayerTab === "selected" || window.innerWidth >= 768
                        ? "block"
                        : "none",
                  }}
                  transition={{ delay: 0.4 }}
                  className={`${
                    activePlayerTab === "waiting" ? "md:block hidden" : ""
                  }`}
                >
                  <Card className="bg-gradient-to-br from-card to-background/50 border-primary/30 shadow-xl">
                    <CardHeader className="border-b border-border/50 p-4 sm:p-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <CardTitle className="text-base sm:text-lg md:text-xl truncate">
                          <span className="hidden md:inline">
                            Jogadores com Time Selecionado
                          </span>
                          <span className="md:hidden">Selecionados</span>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:pt-6">
                      <div className="space-y-2 sm:space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto overscroll-contain scrollbar-hide">
                        {playersWithSelection.length === 0 ? (
                          <p className="text-center text-sm text-muted-foreground py-6 sm:py-8">
                            Nenhum jogador selecionou ainda
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
                                className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 active:scale-[0.98] transition-transform touch-manipulation space-y-2 sm:space-y-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    {currentTeam ? (
                                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center p-1 sm:p-1.5 shadow-lg overflow-hidden flex-shrink-0">
                                        <img
                                          src={currentTeam.logo}
                                          alt={currentTeam.name}
                                          className="w-full h-full object-contain"
                                          onError={(e) => {
                                            const target = e.currentTarget;
                                            target.style.display = "none";
                                            const parent = target.parentElement;
                                            if (parent) {
                                              parent.innerHTML = `<span class="text-primary font-bold text-sm sm:text-base">${currentTeam.name
                                                .charAt(0)
                                                .toUpperCase()}</span>`;
                                            }
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm sm:text-base flex-shrink-0">
                                        {player.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                                        {player.name}
                                      </p>
                                      {currentRoundSelection && (
                                        <p className="text-xs sm:text-sm text-primary font-medium truncate">
                                          {currentRoundSelection.teamName}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Badge
                                    variant="default"
                                    className="bg-green-500 text-xs flex-shrink-0"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">
                                      Confirmado
                                    </span>
                                    <span className="sm:hidden">OK</span>
                                  </Badge>
                                </div>

                                {/* Reações - Ocultas em mobile muito pequeno */}
                                <div className="hidden xs:block sm:block pl-0 sm:pl-12">
                                  <EmojiReactions
                                    targetId={player._id}
                                    currentUserId={currentUserId || ""}
                                    reactions={
                                      playerReactions[player._id] || []
                                    }
                                    onReact={(emoji) => {
                                      vibrate(30);
                                      console.log(
                                        `Reação ${emoji} para ${player.name}`
                                      );
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

                {/* Card 2: Aguardando Seleção - MOBILE OPTIMIZED */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{
                    opacity:
                      activePlayerTab === "waiting" || window.innerWidth >= 768
                        ? 1
                        : 0,
                    x: 0,
                    display:
                      activePlayerTab === "waiting" || window.innerWidth >= 768
                        ? "block"
                        : "none",
                  }}
                  transition={{ delay: 0.5 }}
                  className={`${
                    activePlayerTab === "selected" ? "md:block hidden" : ""
                  }`}
                >
                  <Card className="bg-gradient-to-br from-card to-background/50 border-amber-500/30 shadow-xl">
                    <CardHeader className="border-b border-border/50 p-4 sm:p-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
                        <CardTitle className="text-base sm:text-lg md:text-xl truncate">
                          Aguardando Seleção
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:pt-6">
                      {playersWithoutSelection.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-6 sm:py-8">
                          Todos já selecionaram
                        </p>
                      ) : (
                        <div className="space-y-2 sm:space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto overscroll-contain">
                          {playersWithoutSelection.map((player, index) => {
                            const isThisUser = isCurrentUser(player);

                            return (
                              <motion.div
                                key={player._id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex items-center justify-between gap-2 p-3 sm:p-4 rounded-lg border active:scale-[0.98] transition-transform touch-manipulation ${
                                  isThisUser
                                    ? "bg-gradient-to-r from-amber-500/20 to-amber-500/10 border-amber-500/40"
                                    : "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20"
                                }`}
                              >
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-500 text-sm sm:text-base flex-shrink-0">
                                    {player.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                      <span className="font-semibold text-sm sm:text-base text-foreground truncate">
                                        {player.name}
                                      </span>
                                      {isThisUser && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-primary text-primary flex-shrink-0"
                                        >
                                          Você
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-amber-600 truncate">
                                      Aguardando...
                                    </p>
                                  </div>
                                </div>

                                {isThisUser ? (
                                  <Button
                                    onClick={handleSelectTeam}
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm flex-shrink-0 touch-manipulation"
                                  >
                                    <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="hidden xs:inline">
                                      Selecionar
                                    </span>
                                    <span className="xs:hidden">OK</span>
                                  </Button>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-500 text-amber-500 text-xs flex-shrink-0"
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
            </div>

            {/* Eliminated Players - MOBILE OPTIMIZED */}
            {eliminatedPlayers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6"
              >
                <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30 backdrop-blur-xl shadow-lg">
                  <CardHeader className="border-b border-destructive/20 p-4 sm:p-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Skull className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
                      <CardTitle className="text-base sm:text-lg md:text-xl flex-1">
                        Jogadores Eliminados
                      </CardTitle>
                      <Badge
                        variant="destructive"
                        className="text-xs sm:text-sm"
                      >
                        {eliminatedPlayers.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:pt-6">
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                      {eliminatedPlayers.map((player, index) => (
                        <motion.div
                          key={player._id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-destructive/20 to-destructive/5 border border-destructive/30 opacity-60 grayscale">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                              <Skull className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs sm:text-sm text-foreground line-through truncate">
                                {player.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                R. {player.selectedTeams.length}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-destructive/50 text-destructive text-xs flex-shrink-0 hidden xs:flex"
                            >
                              Out
                            </Badge>
                          </div>

                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{
                              delay: index * 0.1 + 0.3,
                              duration: 0.5,
                            }}
                            className="absolute top-1/2 left-0 right-0 h-0.5 bg-destructive origin-left pointer-events-none"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Motivational Banner - MOBILE OPTIMIZED */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8"
            >
              <Card className="bg-gradient-to-r from-primary/20 via-accent/30 to-primary/20 border-primary/40 shadow-lg sm:shadow-2xl shadow-primary/20 overflow-hidden relative">
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
                <CardContent className="py-6 sm:py-8 px-4 relative z-10">
                  <motion.div
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
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
                      className="hidden xs:block"
                    >
                      <Zap className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
                    </motion.div>

                    <h3 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent text-center">
                      Sobreviva e Conquiste
                    </h3>

                    <motion.div
                      animate={{ rotate: [0, -360] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="hidden xs:block"
                    >
                      <Zap className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
                    </motion.div>
                  </motion.div>

                  <motion.p
                    className="text-center text-muted-foreground mt-3 sm:mt-4 text-sm sm:text-base md:text-lg px-4"
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

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Menu Modal */}
      <MenuModal />
    </>
  );
}
