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
} from "lucide-react";
import { Link } from "react-router-dom";
import { roomAPI, authAPI } from "@/services/api";

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

  // Buscar dados da sala
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
          // Verificar se precisa de convite (sala privada onde não é membro)
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
          setRoomData(room);
          console.log("📦 Dados da sala carregados:", room);

          // Verificar se o usuário já está na sala
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

            // 🔥 Se a sala foi iniciada, redirecionar para seleção de time
            if (room.status === "active" && previousStatus === "waiting") {
              console.log(
                "🚀 Sala iniciada! Redirecionando para seleção de time..."
              );
              toast({
                title: "Sala iniciada!",
                description: "Todos estão prontos. Escolha seu time!",
              });
              setTimeout(() => {
                navigate(`/room/select-team/${roomId}`);
              }, 1500);
            }
          }
        } else {
          console.error("❌ Resposta inválida:", response);
          setError("Dados da sala inválidos");
        }
      } catch (err) {
        const error = err as APIError;
        console.error("❌ Erro ao buscar sala:", error);
        console.error("📋 Detalhes:", error.response?.data);

        const errorMessage =
          error.response?.data?.message || error.message || "Erro desconhecido";
        setError(errorMessage);

        toast({
          title: "Erro ao carregar sala",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Buscar sala inicialmente
    fetchRoom();

    // Polling para atualizar a lista de jogadores a cada 3 segundos
    const interval = setInterval(() => {
      console.log("🔄 Atualizando dados da sala...");
      fetchRoom();
    }, 3000);

    return () => clearInterval(interval);
  }, [roomId]);

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

        // Atualizar dados da sala
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

        // Atualizar sala
        if (response.data.room) {
          setRoomData(response.data.room as RoomData);
        }

        // Se todos estão prontos, a sala será iniciada automaticamente
        if (response.data.allReady) {
          console.log("🎉 TODOS PRONTOS! A sala será iniciada...");
          toast({
            title: "🎉 Todos prontos!",
            description: "A competição está começando!",
          });
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando sala...</p>
            <p className="text-xs text-muted-foreground mt-2">ID: {roomId}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
        <div className="container mx-auto px-4 py-8">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>

          <Card className="max-w-md mx-auto border-destructive/50">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {error?.includes("privada")
                    ? "🔒 Sala Privada"
                    : "Sala não encontrada"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {error || "A sala não existe ou foi removida."}
                </p>
                {error?.includes("privada") && (
                  <div className="mt-4 p-3 bg-amber-500/10 rounded-md border border-amber-500/30">
                    <p className="text-xs text-amber-700">
                      💡 <strong>Dica:</strong> Se você tem um link de convite,
                      verifique se está logado com a conta correta ou entre em
                      contato com o criador da sala.
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  ID: {roomId}
                </p>
              </div>
              <Link to="/dashboard">
                <Button>Voltar ao Dashboard</Button>
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
      <div className="container mx-auto px-4 py-8">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header da Sala */}
          <Card className="border-primary/30 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    {roomData.name}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      {roomData.status === "waiting"
                        ? "Aguardando Jogadores"
                        : "Em Andamento"}
                    </Badge>
                    {currentPlayer?.isReady && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Pronto
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Prêmio Total
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    R$ {roomData.prizePool.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Informações da Sala */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">
                      {totalPlayers}/{roomData.minPlayers}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Jogadores
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-500">
                      {readyPlayers}/{totalPlayers}
                    </div>
                    <div className="text-sm text-muted-foreground">Prontos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Play className="h-8 w-8 text-glow" />
                  <div>
                    <div className="text-2xl font-bold">
                      {roomData.totalRounds}
                    </div>
                    <div className="text-sm text-muted-foreground">Rodadas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Link de Compartilhamento */}
          {hasJoined && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <Label className="mb-2 block">Link de Compartilhamento</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleCopyLink} variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Compartilhe este link com os jogadores
                </p>
              </CardContent>
            </Card>
          )}

          {/* Formulário de Entrada ou Status */}
          {!hasJoined ? (
            // Jogador que ainda não entrou - mostrar formulário
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Entrar na Sala</CardTitle>
                <CardDescription>
                  Preencha seus dados para participar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showPayment ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Seu Nome</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Digite seu nome"
                        required
                      />
                    </div>

                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-accent" />
                          <span className="font-semibold">Total a Pagar</span>
                        </div>
                        <span className="text-2xl font-bold text-accent">
                          R$ {totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      <Users className="mr-2 h-5 w-5" />
                      Confirmar Entrada
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">
                        Pagamento via PIX
                      </h3>
                      <p className="text-muted-foreground">
                        Escaneie o QR Code ou copie o código PIX
                      </p>
                    </div>

                    <div className="p-6 rounded-lg bg-accent/10 border border-accent/20 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-48 h-48 bg-white p-4 rounded-lg flex items-center justify-center">
                          <QrCode className="w-full h-full text-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold">
                          Valor: R$ {totalPrice.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Nome: {formData.name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Código PIX Copia e Cola</Label>
                      <div className="flex gap-2">
                        <Input
                          value={pixCode}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button onClick={handleCopyPix} variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowPayment(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handlePaymentConfirm}
                        className="flex-1"
                        size="lg"
                        disabled={isJoining}
                      >
                        {isJoining ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Confirmando...
                          </>
                        ) : (
                          "Confirmar Pagamento"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : roomData.status === "waiting" ? (
            // Jogador já entrou e sala ainda aguardando
            <Card
              className={`border-2 ${
                allReady
                  ? "border-green-500 bg-green-500/5"
                  : "border-accent/50 bg-accent/5"
              }`}
            >
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  {!canStart ? (
                    <>
                      <p className="text-muted-foreground text-lg">
                        Aguardando mais {roomData.minPlayers - totalPlayers}{" "}
                        jogador(es)...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Compartilhe o link da sala para convidar amigos!
                      </p>
                    </>
                  ) : allReady ? (
                    <>
                      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto animate-pulse" />
                      <h3 className="text-2xl font-bold text-green-500">
                        🎉 Todos Prontos!
                      </h3>
                      <p className="text-muted-foreground">
                        A competição está começando...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            currentPlayer?.isReady
                              ? "bg-green-500"
                              : "bg-amber-500"
                          }`}
                        >
                          {currentPlayer?.isReady ? (
                            <CheckCircle2 className="h-8 w-8 text-white" />
                          ) : (
                            <XCircle className="h-8 w-8 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-lg font-semibold mb-2">
                        {currentPlayer?.isReady
                          ? "Você está pronto!"
                          : "Clique no botão quando estiver pronto"}
                      </p>
                      <p className="text-muted-foreground mb-4">
                        {readyPlayers}/{totalPlayers} jogadores prontos
                      </p>
                      <Button
                        onClick={handleToggleReady}
                        disabled={isTogglingReady}
                        size="lg"
                        className="w-full md:w-auto"
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
                            Cancelar Ready
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Estou Pronto!
                          </>
                        )}
                      </Button>
                      {canStart && (
                        <p className="text-sm text-primary mt-4">
                          ⏳ Aguardando todos os jogadores ficarem prontos para
                          iniciar...
                        </p>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Lista de Jogadores */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Jogadores na Sala</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roomData.players.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum jogador inscrito ainda
                  </p>
                ) : (
                  roomData.players.map((player: Player, index: number) => (
                    <div
                      key={player._id}
                      className="flex justify-between items-center p-3 rounded-lg bg-background/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <span>{player.name}</span>
                      </div>
                      {roomData.status === "waiting" && (
                        <Badge
                          variant={player.isReady ? "default" : "secondary"}
                          className={player.isReady ? "bg-green-500" : ""}
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
    </div>
  );
}
