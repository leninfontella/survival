import { useState, useEffect } from "react";
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

// Mock de times - você deve substituir isso pela chamada da API real
const mockTeamsByLeague = {
  espanha: [
    {
      id: "1",
      name: "Real Madrid",
      logo: "https://via.placeholder.com/56x56?text=RM",
      league: "espanha" as const,
    },
    {
      id: "2",
      name: "Barcelona",
      logo: "https://via.placeholder.com/56x56?text=BAR",
      league: "espanha" as const,
    },
    {
      id: "3",
      name: "Atlético Madrid",
      logo: "https://via.placeholder.com/56x56?text=ATM",
      league: "espanha" as const,
    },
    // ... adicione mais times
  ],
  brasil: [
    {
      id: "10",
      name: "Flamengo",
      logo: "https://via.placeholder.com/56x56?text=FLA",
      league: "brasil" as const,
    },
    {
      id: "11",
      name: "Palmeiras",
      logo: "https://via.placeholder.com/56x56?text=PAL",
      league: "brasil" as const,
    },
    // ... adicione mais times
  ],
  // ... outras ligas
};

interface Team {
  id: string;
  name: string;
  logo: string;
  league:
    | "brasil"
    | "espanha"
    | "inglaterra"
    | "alemanha"
    | "italia"
    | "franca";
}

interface RoomData {
  _id: string;
  name: string;
  league: string;
  status: string;
  currentRound: number;
  totalRounds: number;
  prizePool: number;
}

export default function SelectTeam() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showTransition, setShowTransition] = useState(false);
  const [usedTeams, setUsedTeams] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Debug: Verificar roomId
  useEffect(() => {
    console.log("🔍 SelectTeam carregado");
    console.log("📍 RoomId da URL:", roomId);
    console.log("📍 URL completa:", window.location.href);
  }, [roomId]);

  // Buscar dados da sala
  useEffect(() => {
    const fetchRoom = async () => {
      // Verificação mais robusta do roomId
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

        // Buscar dados da sala
        const roomResponse = await roomAPI.getById(roomId);
        console.log("📦 Resposta da sala:", roomResponse);

        if (roomResponse.success) {
          setRoomData(roomResponse.data);
        }

        // Buscar times já usados
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

      // Chamar API para salvar a seleção do time
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

  // Pegar times disponíveis baseado na liga da sala
  const availableTeams: Team[] = roomData
    ? mockTeamsByLeague[roomData.league as keyof typeof mockTeamsByLeague] || []
    : [];

  const selectedTeam = selectedTeamId
    ? availableTeams.find((t) => t.id === selectedTeamId)
    : null;

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
            <Link to={`/join-room/${roomId}`}>
              <Button variant="ghost" className="mb-6 hover:bg-primary/10">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
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
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <Badge variant="outline">Sala: {roomData.name}</Badge>
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
                    <CardTitle className="text-xl">Times Disponíveis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableTeams.map((team, index) => {
                      const used = isTeamUsed(team.id);
                      const selected = selectedTeamId === team.id;

                      return (
                        <motion.button
                          key={team.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={!used ? { scale: 1.05, y: -5 } : {}}
                          whileTap={!used ? { scale: 0.98 } : {}}
                          onClick={() => !used && setSelectedTeamId(team.id)}
                          disabled={used}
                          className={`
                          relative p-5 rounded-xl border-2 transition-all duration-300 group overflow-hidden
                          ${
                            used
                              ? "opacity-40 cursor-not-allowed bg-muted/50"
                              : "cursor-pointer hover:shadow-xl hover:shadow-primary/20"
                          }
                          ${
                            selected
                              ? "border-primary bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-lg shadow-primary/30"
                              : "border-border/50 bg-gradient-to-br from-card to-background/50 hover:border-primary/50"
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

                          <div className="relative flex flex-col items-center gap-4">
                            <div
                              className={`
                            w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
                            ${
                              selected
                                ? "bg-primary/20 ring-4 ring-primary/30"
                                : "bg-background/50 group-hover:bg-primary/10"
                            }
                          `}
                            >
                              <img
                                src={team.logo}
                                alt={team.name}
                                className="w-14 h-14 object-contain"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/56x56?text=" +
                                    team.name.charAt(0);
                                }}
                              />
                            </div>

                            <span
                              className={`
                            font-bold text-center text-sm transition-colors
                            ${
                              selected
                                ? "text-primary"
                                : "text-foreground group-hover:text-primary"
                            }
                          `}
                            >
                              {team.name}
                            </span>

                            {used && (
                              <Badge
                                variant="destructive"
                                className="absolute -top-2 -right-2 flex items-center gap-1 shadow-lg"
                              >
                                <X className="h-3 w-3" />
                                Usado
                              </Badge>
                            )}

                            {selected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 flex items-center justify-center w-8 h-8 rounded-full bg-primary shadow-lg shadow-primary/50"
                              >
                                <Check className="h-5 w-5 text-primary-foreground" />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Rules Card */}
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
                        </ul>
                      </div>
                    </div>
                  </motion.div>

                  {/* Confirm Button */}
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
                      ) : (
                        <>
                          <Check className="mr-2 h-6 w-6" />
                          Confirmar Escolha
                        </>
                      )}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Used Teams Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-xl">
                    Seus Times Já Usados
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {usedTeams.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum time usado ainda
                    </p>
                  ) : (
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
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
