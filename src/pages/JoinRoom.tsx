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
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [showPayment, setShowPayment] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
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
          const room = response.data as RoomData;
          setRoomData(room);
          console.log("📦 Dados da sala carregados:", room);

          // Verificar se o usuário é o criador (admin)
          const userId = authAPI.getCurrentUserId();
          console.log("👤 UserId atual:", userId);
          console.log("👑 Criador da sala:", room.createdBy);

          // Verificar diferentes formatos de ID do criador
          let creatorId: string;
          if (typeof room.createdBy === "string") {
            creatorId = room.createdBy;
          } else {
            creatorId = room.createdBy._id || room.createdBy.id || "";
          }

          const isUserAdmin = creatorId === userId;
          setIsAdmin(isUserAdmin);
          console.log("🔐 É admin?", isUserAdmin);

          // Verificar se o usuário já está na sala
          if (userId && room.players) {
            const playerInRoom = room.players.some((p: Player) => {
              if (typeof p.user === "string") {
                return p.user === userId;
              } else if (p.user) {
                return p.user._id === userId || p.user.id === userId;
              }
              return false;
            });
            setHasJoined(playerInRoom || isUserAdmin);
            console.log("✓ Já entrou na sala?", playerInRoom || isUserAdmin);
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

    // Polling para atualizar a lista de jogadores a cada 5 segundos
    const interval = setInterval(() => {
      console.log("🔄 Atualizando dados da sala...");
      fetchRoom();
    }, 5000);

    return () => clearInterval(interval);
  }, [roomId]); // ⚠️ APENAS roomId como dependência

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
        toast({
          title: "Pagamento confirmado!",
          description: "Você entrou na sala. Aguardando outros jogadores...",
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

  const handleStartRoom = async () => {
    if (!roomId) return;

    console.log("🚀 Iniciando sala:", roomId);

    try {
      const response = await roomAPI.start(roomId);
      console.log("✅ Sala iniciada:", response);

      if (response.success) {
        toast({
          title: "Sala iniciada!",
          description: "Redirecionando para seleção de time...",
        });

        // Redirecionar ADMIN para seleção de time
        setTimeout(() => {
          console.log("🔀 Redirecionando para:", `/room/select-team/${roomId}`);
          navigate(`/room/select-team/${roomId}`);
        }, 1000);
      }
    } catch (err) {
      const error = err as APIError;
      console.error("❌ Erro ao iniciar sala:", error);
      toast({
        title: "Erro ao iniciar sala",
        description:
          error.response?.data?.message || "Não foi possível iniciar a sala.",
        variant: "destructive",
      });
    }
  };

  const handlePlayerStartSelection = () => {
    if (!roomId) {
      toast({
        title: "Erro",
        description: "ID da sala não encontrado.",
        variant: "destructive",
      });
      return;
    }

    // Jogador não-admin clica para selecionar time
    console.log("🎮 Jogador iniciando seleção");
    console.log("🔀 Redirecionando para:", `/room/select-team/${roomId}`);

    toast({
      title: "Vamos começar!",
      description: "Escolha seu time para a primeira rodada.",
    });

    navigate(`/room/select-team/${roomId}`);
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
                  Sala não encontrada
                </h3>
                <p className="text-muted-foreground text-sm">
                  {error || "A sala não existe ou foi removida."}
                </p>
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
  const canStart =
    roomData.players.length >= roomData.minPlayers &&
    roomData.status === "waiting";

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
                      Aguardando Jogadores
                    </Badge>
                    {isAdmin && (
                      <Badge variant="default">👑 Administrador</Badge>
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
                      {roomData.players.length}/{roomData.minPlayers}
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
                  <DollarSign className="h-8 w-8 text-accent" />
                  <div>
                    <div className="text-2xl font-bold">
                      R$ {roomData.entryPrice}
                    </div>
                    <div className="text-sm text-muted-foreground">Entrada</div>
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
          {(isAdmin || hasJoined) && (
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
          {!hasJoined && !isAdmin ? (
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
            // Sala ainda não iniciada - aguardando
            <Card className="border-accent/50 bg-accent/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    {roomData.players.length < roomData.minPlayers
                      ? `Aguardando mais ${
                          roomData.minPlayers - roomData.players.length
                        } jogador(es) para iniciar`
                      : "Número mínimo de jogadores atingido!"}
                  </p>
                  {isAdmin ? (
                    <Button
                      size="lg"
                      disabled={!canStart}
                      onClick={handleStartRoom}
                      className="w-full md:w-auto"
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Iniciar Competição
                    </Button>
                  ) : (
                    canStart && (
                      <p className="text-primary font-semibold">
                        Aguardando o administrador iniciar a competição...
                      </p>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            // Sala já iniciada - botão para selecionar time
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="h-6 w-6 text-primary animate-pulse" />
                    <h3 className="text-xl font-bold text-primary">
                      Competição Iniciada!
                    </h3>
                    <Trophy className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <p className="text-muted-foreground">
                    Rodada {roomData.currentRound} - É hora de escolher seu
                    time!
                  </p>
                  <Button
                    size="lg"
                    onClick={handlePlayerStartSelection}
                    className="w-full md:w-auto"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    INICIAR SOBREVIVÊNCIA
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                      <Badge variant="default">Ativo</Badge>
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
