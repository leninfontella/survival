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

  useEffect(() => {
    console.log("🔍 SelectTeam carregado");
    console.log("🔍 RoomId da URL:", roomId);
    console.log("🔍 URL completa:", window.location.href);
    console.log("🎯 Total de times disponíveis:", teams.length);
  }, [roomId, teams]);

  useEffect(() => {
    const fetchRoom = async () => {
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

        const roomResponse = await roomAPI.getById(roomId);
        console.log("📦 Resposta da sala:", roomResponse);

        if (roomResponse.success) {
          setRoomData(roomResponse.data);
          console.log("✅ Liga da sala:", roomResponse.data.league);
        }

        const usedTeamsResponse = await roomAPI.getUsedTeams(roomId);
        console.log("📦 Resposta times usados:", usedTeamsResponse);

        if (usedTeamsResponse.success) {
          setUsedTeams(usedTeamsResponse.data.usedTeams);
          console.log("✅ Times já usados:", usedTeamsResponse.data.usedTeams);
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

    fetchRoom();
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

    const selectedTeam = availableTeams.find((t) => t.id === selectedTeamId);
    if (!selectedTeam) return;

    setIsSaving(true);
    try {
      console.log("💾 Salvando seleção:", {
        roomId,
        teamId: selectedTeamId,
        teamName: selectedTeam.name,
      });

      const response = await roomAPI.selectTeam(
        roomId,
        selectedTeamId,
        selectedTeam.name
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Carregando sala...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Sala não encontrada
            </p>
            <Link to="/dashboard">
              <Button className="w-full">Voltar ao Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (availableTeams.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Nenhum time disponível para a liga: {roomData.league}
            </p>
            <Link to="/dashboard">
              <Button className="w-full">Voltar ao Dashboard</Button>
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

        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:py-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link to={`/survival-room/${roomId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="mb-3 sm:mb-4 md:mb-6 hover:bg-primary/10"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Voltar</span>
              </Button>
            </Link>
          </motion.div>

          <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
            {/* Header Card - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-primary/30 bg-gradient-to-br from-card/90 via-card/50 to-card/90 backdrop-blur-xl shadow-lg sm:shadow-2xl shadow-primary/10">
                <CardHeader className="text-center space-y-2 sm:space-y-3 md:space-y-4 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-6">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary animate-pulse" />
                    <CardTitle className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
                      Rodada {roomData.currentRound}
                    </CardTitle>
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary animate-pulse" />
                  </div>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                    Escolha o time que você acredita que irá{" "}
                    <span className="text-primary font-bold">VENCER</span> nesta
                    rodada
                  </p>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 text-xs flex-wrap px-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] sm:text-xs px-2 py-0.5"
                    >
                      Sala: {roomData.name}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] sm:text-xs px-2 py-0.5"
                    >
                      Liga: {roomData.league}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] sm:text-xs px-2 py-0.5"
                    >
                      R$ {roomData.prizePool.toFixed(2)}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>

            {/* Teams Grid - Mobile First */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-lg sm:shadow-xl">
                <CardHeader className="border-b border-border/50 px-3 py-3 sm:px-6 sm:py-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl">
                      Times Disponíveis ({availableTeams.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 md:pt-6 px-2 sm:px-4 md:px-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                    {availableTeams.map((team, index) => {
                      const used = isTeamUsed(team.id);
                      const selected = selectedTeamId === team.id;

                      return (
                        <motion.button
                          key={team.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.02 }}
                          whileHover={!used ? { scale: 1.03 } : {}}
                          whileTap={!used ? { scale: 0.97 } : {}}
                          onClick={() => !used && setSelectedTeamId(team.id)}
                          disabled={used}
                          className={`
                          relative p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 transition-all duration-300 group overflow-hidden
                          ${
                            used
                              ? "opacity-40 cursor-not-allowed bg-muted/50"
                              : "cursor-pointer active:scale-95 sm:hover:shadow-xl sm:hover:shadow-primary/20"
                          }
                          ${
                            selected
                              ? "border-primary bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-lg shadow-primary/30"
                              : "border-border/50 bg-gradient-to-br from-card to-background/50 active:border-primary/50 sm:hover:border-primary/50"
                          }
                        `}
                        >
                          {selected && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}

                          <div className="relative flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
                            <div
                              className={`
                            w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300
                            ${
                              selected
                                ? "bg-primary/20 ring-2 sm:ring-4 ring-primary/30"
                                : "bg-background/50 group-active:bg-primary/10 sm:group-hover:bg-primary/10"
                            }
                          `}
                            >
                              <img
                                src={team.logo}
                                alt={team.name}
                                className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 object-contain"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/56x56?text=" +
                                    team.name.charAt(0);
                                }}
                              />
                            </div>

                            <span
                              className={`
                            font-bold text-center text-[10px] leading-tight sm:text-xs md:text-sm transition-colors line-clamp-2
                            ${
                              selected
                                ? "text-primary"
                                : "text-foreground group-active:text-primary sm:group-hover:text-primary"
                            }
                          `}
                            >
                              {team.name}
                            </span>

                            {used && (
                              <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 flex items-center gap-0.5 sm:gap-1 shadow-lg text-[8px] sm:text-xs px-1 sm:px-2 py-0 sm:py-0.5"
                              >
                                <X className="h-2 w-2 sm:h-3 sm:w-3" />
                                <span className="hidden sm:inline">Usado</span>
                              </Badge>
                            )}

                            {selected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary shadow-lg shadow-primary/50"
                              >
                                <Check className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary-foreground" />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Rules Card - Mobile Optimized */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-4 sm:mt-6 md:mt-8 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-2 border-primary/20 shadow-lg"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 text-lg sm:text-xl md:text-2xl">
                        ⚠️
                      </div>
                      <div>
                        <h4 className="font-bold text-primary mb-2 sm:mb-3 text-xs sm:text-sm md:text-base lg:text-lg">
                          Regras Importantes:
                        </h4>
                        <ul className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm">
                          <li className="flex items-start gap-1.5 sm:gap-2">
                            <span className="text-primary font-bold flex-shrink-0">
                              •
                            </span>
                            <span>
                              Você só pode escolher cada time{" "}
                              <span className="text-primary font-bold">
                                UMA VEZ
                              </span>{" "}
                              durante todo o campeonato
                            </span>
                          </li>
                          <li className="flex items-start gap-1.5 sm:gap-2">
                            <span className="text-primary font-bold flex-shrink-0">
                              •
                            </span>
                            <span>
                              Se seu time{" "}
                              <span className="text-primary font-bold">
                                VENCER
                              </span>
                              , você avança para a próxima rodada
                            </span>
                          </li>
                          <li className="flex items-start gap-1.5 sm:gap-2">
                            <span className="text-destructive font-bold flex-shrink-0">
                              •
                            </span>
                            <span>
                              Se seu time{" "}
                              <span className="text-destructive font-bold">
                                EMPATAR ou PERDER
                              </span>
                              , você é eliminado
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>

                  {/* Confirm Button - Mobile Optimized */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Button
                      onClick={handleConfirm}
                      disabled={!selectedTeamId || isSaving}
                      size="lg"
                      className="w-full mt-4 sm:mt-5 md:mt-6 text-sm sm:text-base md:text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 h-11 sm:h-12 md:h-14"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 animate-spin" />
                          <span className="text-xs sm:text-sm md:text-base">
                            Salvando...
                          </span>
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                          <span className="text-xs sm:text-sm md:text-base">
                            Confirmar Escolha
                          </span>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Used Teams Card - Mobile Optimized */}
            {usedTeams.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-lg sm:shadow-xl">
                  <CardHeader className="border-b border-border/50 px-3 py-3 sm:px-6 sm:py-4">
                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl">
                      Seus Times Já Usados ({usedTeams.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
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
                              className="text-[10px] sm:text-xs md:text-sm py-1 sm:py-1.5 md:py-2 px-2 sm:px-3 md:px-4 flex items-center gap-1 sm:gap-1.5 md:gap-2"
                            >
                              <img
                                src={team.logo}
                                alt={team.name}
                                className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 object-contain"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/20x20?text=" +
                                    team.name.charAt(0);
                                }}
                              />
                              <span className="truncate max-w-[100px] sm:max-w-none">
                                {team.name}
                              </span>
                            </Badge>
                          </motion.div>
                        ) : null;
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
