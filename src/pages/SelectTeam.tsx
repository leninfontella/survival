import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Trophy, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TeamTransition } from "@/components/TeamTransition";
import { roomAPI } from "@/services/api";
import { MatchCard } from "@/components/MatchCard";
import { LiveMatchIndicator } from "@/components/LiveMatchIndicator";
import type { Match } from "@/services/api";
import type { Team } from "@/types/game";

interface RoomData {
  _id: string;
  name: string;
  league: string;
  status: string;
  currentRound: number;
  totalRounds: number;
  prizePool: number;
}

interface MatchWithAvailability extends Match {
  homeTeam: Match["homeTeam"] & {
    canSelect?: boolean;
    used?: boolean;
  };
  awayTeam: Match["awayTeam"] & {
    canSelect?: boolean;
    used?: boolean;
  };
  hasAvailableTeam?: boolean;
}

export default function SelectTeam() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

  // Estados
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [matches, setMatches] = useState<MatchWithAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Seleção
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string>("");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isHome, setIsHome] = useState<boolean>(false);
  const [showTransition, setShowTransition] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 🔥 BUSCAR DADOS DA SALA E PARTIDAS
  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!roomId) {
        toast({
          title: "Erro",
          description: "ID da sala não encontrado.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        // 1. Buscar dados da sala, times usados e partidas em paralelo
        const [roomResponse, usedTeamsResponse, matchesResponse] =
          await Promise.all([
            roomAPI.getById(roomId),
            roomAPI.getUsedTeams(roomId),
            roomAPI.getAvailableMatches(roomId),
          ]);

        if (!roomResponse.success) {
          throw new Error(roomResponse.message || "Erro ao buscar dados da sala.");
        }
        setRoomData(roomResponse.data);

        const usedIds =
          usedTeamsResponse.success && usedTeamsResponse.data.usedTeams
            ? usedTeamsResponse.data.usedTeams.map((id: string) => parseInt(id))
            : [];

        if (matchesResponse.success && matchesResponse.data.matches) {
          const formattedMatches = matchesResponse.data.matches.map(
            (match: Match) => {
              const homeUsed = usedIds.includes(match.homeTeam.apiTeamId);
              const awayUsed = usedIds.includes(match.awayTeam.apiTeamId);
              return {
                ...match,
                homeTeam: {
                  ...match.homeTeam,
                  canSelect: !homeUsed,
                  used: homeUsed,
                },
                awayTeam: {
                  ...match.awayTeam,
                  canSelect: !awayUsed,
                  used: awayUsed,
                },
                hasAvailableTeam: !homeUsed || !awayUsed,
              };
            }
          );
          setMatches(formattedMatches);
        } else {
          setMatches([]);
        }
      } catch (error: any) {
        console.error("❌ Erro ao buscar dados:", error);
        toast({
          title: "Erro",
          description:
            error.message || "Não foi possível carregar os dados da sala.",
          variant: "destructive",
        });
        // Se a sala não for encontrada, volta pro dashboard
        if (error.response?.status === 404) {
          navigate("/dashboard");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [roomId, navigate]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔥 ATUALIZAR PARTIDAS
  const handleRefresh = async () => {
    if (!roomId) return;

    setIsRefreshing(true);
    try {
      const data = await roomAPI.updateMatches(roomId);

      if (data.success) {
        toast({
          title: "Atualizado!",
          description: "Partidas atualizadas com sucesso.",
        });
        // Recarrega os dados sem dar refresh na página
        await fetchData(true);
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as partidas.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // 🔥 SELECIONAR TIME
  const handleSelectTeam = (
    teamId: number,
    teamName: string,
    matchId: string,
    isHomeTeam: boolean
  ) => {
    setSelectedTeamId(teamId);
    setSelectedTeamName(teamName);
    setSelectedMatchId(matchId);
    setIsHome(isHomeTeam);
  };

  // 🔥 CONFIRMAR SELEÇÃO
  const handleConfirm = async () => {
    if (!selectedTeamId || !selectedMatchId) {
      toast({
        title: "Selecione um time",
        description: "Você precisa escolher um time para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!roomId) return;

    setIsSaving(true);
    try {
      const response = await roomAPI.selectTeam(
        roomId,
        selectedTeamId.toString(), // teamId (legado, pode ser removido no futuro)
        selectedTeamName,
        selectedMatchId,
        selectedTeamId // apiTeamId
      );

      if (response.success) {
        setShowTransition(true);
      }
    } catch (error: any) {
      console.error("Erro ao salvar time:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.message ||
          "Não foi possível salvar sua escolha.",
        variant: "destructive",
      });
    } finally {
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

  // Contar partidas ao vivo
  const liveCount = matches.filter((m) => m.status === "live").length;

  // 🔥 LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando partidas...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🔥 ERROR STATES
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

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhuma partida disponível para a rodada {roomData.currentRound}
            </p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Atualizando..." : "Tentar Novamente"}
            </Button>
            <Link to="/dashboard" className="block mt-4">
              <Button variant="outline">Voltar ao Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedMatch = matches.find((m) => m._id === selectedMatchId);

  // 🔥 MAIN RENDER
  return (
    <>
      <AnimatePresence>
        {showTransition && selectedMatch && roomData && (
          <TeamTransition
            team={{
              id: selectedTeamId?.toString() || "",
              name: selectedTeamName,
              logo: isHome
                ? selectedMatch.homeTeam.logo
                : selectedMatch.awayTeam.logo,
              league: roomData.league as Team["league"],
            }}
            onComplete={handleTransitionComplete}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background relative overflow-hidden">
        {/* Background Pattern */}
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
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link to={`/survival-room/${roomId}`}>
              <Button variant="ghost" className="mb-6 hover:bg-primary/10">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </motion.div>

          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Card */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-primary/30 bg-gradient-to-br from-card/90 via-card/50 to-card/90 backdrop-blur-xl shadow-2xl shadow-primary/10">
                <CardHeader className="text-center space-y-4 pb-8">
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Trophy className="h-8 w-8 text-primary animate-pulse" />
                    <CardTitle className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                      Rodada {roomData.currentRound}
                    </CardTitle>
                    <Trophy className="h-8 w-8 text-primary animate-pulse" />
                    {liveCount > 0 && (
                      <LiveMatchIndicator count={liveCount} showCount />
                    )}
                  </div>

                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Escolha uma{" "}
                    <span className="text-primary font-bold">PARTIDA</span> e
                    selecione o time que você acredita que irá{" "}
                    <span className="text-primary font-bold">VENCER</span>
                  </p>

                  <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
                    <Badge variant="outline">Sala: {roomData.name}</Badge>
                    <Badge variant="outline">Liga: {roomData.league}</Badge>
                    <Badge variant="outline">
                      Prêmio: R$ {roomData.prizePool.toFixed(2)}
                    </Badge>
                    <Badge variant="outline">Partidas: {matches.length}</Badge>
                  </div>

                  {/* Botão Atualizar */}
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    disabled={isRefreshing}
                    className="mt-2"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    {isRefreshing ? "Atualizando..." : "Atualizar Partidas"}
                  </Button>
                </CardHeader>
              </Card>
            </motion.div>

            {/* Matches Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-2xl">
                    Partidas Disponíveis (
                    {matches.filter((m) => m.hasAvailableTeam).length})
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Clique em um time para selecioná-lo
                  </p>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Grid de Partidas */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {matches.map((match, index) => (
                      <motion.div
                        key={match._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <MatchCard
                          match={match}
                          onSelectTeam={handleSelectTeam}
                          selectedTeamId={selectedTeamId}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Regras */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-2 border-primary/20 shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-2xl">⚠️</div>
                      <div>
                        <h4 className="font-bold text-primary mb-3 text-lg">
                          Regras Importantes:
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">•</span>
                            <span>
                              Você só pode escolher cada time{" "}
                              <span className="text-primary font-bold">
                                UMA VEZ
                              </span>{" "}
                              durante todo o campeonato
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">•</span>
                            <span>
                              Se seu time{" "}
                              <span className="text-primary font-bold">
                                VENCER
                              </span>
                              , você avança para a próxima rodada
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-destructive font-bold">
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
                          <li className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>
                              Times marcados como{" "}
                              <Badge
                                variant="destructive"
                                className="inline-flex mx-1"
                              >
                                Usado
                              </Badge>{" "}
                              não podem ser selecionados
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>

                  {/* Botão Confirmar */}
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
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                          Salvando...
                        </>
                      ) : selectedTeamId ? (
                        <>
                          <Check className="mr-2 h-6 w-6" />
                          Confirmar {selectedTeamName}
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-6 w-6" />
                          Selecione um Time
                        </>
                      )}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

