import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Clock,
  Play,
  Flag,
  Plus,
  Copy,
  Check,
  UserCircle,
  Loader2,
  Crown,
  Lock,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { roomAPI, authAPI } from "@/services/api";

const leagueNames = {
  brasil: "🇧🇷 Brasileirão",
  espanha: "🇪🇸 La Liga",
  inglaterra: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League",
  alemanha: "🇩🇪 Bundesliga",
  italia: "🇮🇹 Serie A",
  franca: "🇫🇷 Ligue 1",
};

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Room {
  _id: string;
  name: string;
  league: keyof typeof leagueNames;
  status: "waiting" | "active" | "finished";
  currentRound: number;
  totalRounds: number;
  minPlayers: number;
  entryPrice: number;
  prizePool: number;
  isPrivate: boolean;
  createdBy: User | string;
  players: Array<{
    _id: string;
    name: string;
    isEliminated: boolean;
  }>;
  createdAt: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"waiting" | "active" | "finished">(
    "waiting"
  );
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Buscar userId ao carregar
  useEffect(() => {
    const userId = authAPI.getCurrentUserId();
    setCurrentUserId(userId);
  }, []);

  // Buscar salas ao carregar
  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      try {
        const response = await roomAPI.getAll();
        if (response.success) {
          setRooms(response.data);
        }
      } catch (error) {
        console.error("Erro ao buscar salas:", error);
        toast({
          title: "Erro ao carregar salas",
          description: "Não foi possível carregar as salas. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, [toast]);

  const openRooms = rooms.filter((r) => r.status === "waiting");
  const activeRooms = rooms.filter((r) => r.status === "active");
  const finishedRooms = rooms.filter((r) => r.status === "finished");

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;

    setIsDeleting(true);
    try {
      const response = await roomAPI.delete(roomToDelete);

      if (response.success) {
        toast({
          title: "Sala excluída!",
          description: "A sala foi removida com sucesso.",
        });

        // Atualizar lista de salas
        setRooms(rooms.filter((r) => r._id !== roomToDelete));
        setRoomToDelete(null);
      }
    } catch (error: any) {
      console.error("Erro ao excluir sala:", error);
      toast({
        title: "Erro ao excluir sala",
        description:
          error.response?.data?.message || "Não foi possível excluir a sala.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isRoomCreator = (room: Room) => {
    if (!currentUserId) return false;
    const creatorId =
      typeof room.createdBy === "string" ? room.createdBy : room.createdBy._id;
    return creatorId === currentUserId;
  };

  const RoomCard = ({ room }: { room: Room }) => {
    const statusConfig = {
      waiting: { label: "Aguardando", color: "bg-yellow-500", icon: Clock },
      active: { label: "Em Andamento", color: "bg-green-500", icon: Play },
      finished: { label: "Finalizada", color: "bg-gray-500", icon: Flag },
    };

    const config = statusConfig[room.status];
    const Icon = config.icon;
    const shareLink = `${window.location.origin}/join-room/${room._id}`;

    // Extrair nome do criador
    const creatorName =
      typeof room.createdBy === "string" ? "Admin" : room.createdBy.name;

    const handleCopyLink = () => {
      navigator.clipboard.writeText(shareLink);
      setCopiedRoomId(room._id);
      toast({
        title: "Link copiado!",
        description: "O link da sala foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopiedRoomId(null), 2000);
    };

    const handleRoomClick = () => {
      if (room.status === "waiting") {
        navigate(`/join-room/${room._id}`);
      } else if (room.status === "active") {
        navigate(`/survival-room/${room._id}`);
      } else {
        navigate(`/survival-room/${room._id}`);
      }
    };

    return (
      <Card className="hover:border-primary/50 transition-all hover:scale-[1.02] cursor-pointer border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl">{room.name}</CardTitle>
                {room.isPrivate && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/20 text-amber-700 border-amber-500/30"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Privada
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {leagueNames[room.league]}
              </p>
              {/* Nome do Administrador */}
              <div className="flex items-center gap-1.5 mt-2">
                <Crown className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Admin:{" "}
                  <span className="text-primary font-medium">
                    {creatorName}
                  </span>
                </span>
              </div>
            </div>
            <Badge className={`${config.color} text-white border-0 shrink-0`}>
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Prêmio:</span>
              <span className="font-semibold">
                R$ {room.prizePool.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Jogadores:</span>
              <span className="font-semibold">
                {room.players.length}/{room.minPlayers}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
            <span className="text-muted-foreground">
              Rodada {room.currentRound} de {room.totalRounds}
            </span>
            <span className="text-muted-foreground">
              R$ {room.entryPrice}/entrada
            </span>
          </div>

          {/* Sala pública aguardando - mostrar link */}
          {room.status === "waiting" && !room.isPrivate && (
            <div className="mt-3 p-2 bg-muted/50 rounded-md border border-border/50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    Link de compartilhamento:
                  </p>
                  <p className="text-xs font-mono truncate">{shareLink}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copiedRoomId === room._id ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Sala privada aguardando - aviso para admin */}
          {room.isPrivate && room.status === "waiting" && (
            <div className="mt-3 p-3 bg-amber-500/10 rounded-md border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-semibold text-amber-700">
                  Sala Privada
                </p>
              </div>
              <p className="text-xs text-amber-700">
                Compartilhe o link apenas com jogadores convidados
              </p>
            </div>
          )}

          {/* Sala privada ativa/finalizada - aviso de convite necessário */}
          {room.isPrivate &&
            (room.status === "active" || room.status === "finished") && (
              <div className="mt-3 p-3 bg-primary/10 rounded-md border border-primary/30">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <p className="text-xs text-primary font-medium">
                    Sala Privada - Convite necessário
                  </p>
                </div>
              </div>
            )}

          <Button
            className="w-full mt-2"
            onClick={handleRoomClick}
            variant={room.status === "waiting" ? "default" : "outline"}
          >
            {room.status === "waiting"
              ? room.isPrivate
                ? "Entrar com Convite"
                : "Entrar na Sala"
              : room.status === "active"
              ? "Ver Sala Ativa"
              : "Ver Resultados"}
          </Button>

          {/* Botão de Excluir (apenas para criador) */}
          {isRoomCreator(room) && room.status !== "active" && (
            <Button
              className="w-full mt-2"
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setRoomToDelete(room._id);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Sala
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <Card className="border-dashed border-2 border-border/50 bg-card/30">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Trophy className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground text-center">{message}</p>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-20">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Carregando salas...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <Navbar />

      <div className="container mx-auto px-4 py-8 mt-20">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link to="/admin/create-room">
            <Card className="hover:border-primary/50 transition-all hover:scale-[1.02] cursor-pointer border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="p-3 rounded-full bg-primary/20">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Criar Nova Sala</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure uma nova competição
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-3xl font-bold">{openRooms.length}</p>
              <p className="text-sm text-muted-foreground">Salas Abertas</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-6 text-center">
              <Play className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-3xl font-bold">{activeRooms.length}</p>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-6 text-center">
              <Flag className="w-8 h-8 mx-auto mb-2 text-gray-500" />
              <p className="text-3xl font-bold">{finishedRooms.length}</p>
              <p className="text-sm text-muted-foreground">Finalizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Rooms List */}
        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as "waiting" | "active" | "finished")
          }
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="waiting">
              Abertas ({openRooms.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Em Andamento ({activeRooms.length})
            </TabsTrigger>
            <TabsTrigger value="finished">
              Finalizadas ({finishedRooms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waiting" className="space-y-4">
            {openRooms.length === 0 ? (
              <EmptyState message="Nenhuma sala aguardando jogadores no momento" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {openRooms.map((room) => (
                  <RoomCard key={room._id} room={room} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeRooms.length === 0 ? (
              <EmptyState message="Nenhuma sala em andamento no momento" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeRooms.map((room) => (
                  <RoomCard key={room._id} room={room} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="finished" className="space-y-4">
            {finishedRooms.length === 0 ? (
              <EmptyState message="Nenhuma sala finalizada ainda" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {finishedRooms.map((room) => (
                  <RoomCard key={room._id} room={room} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Alert Dialog para confirmar exclusão */}
      <AlertDialog
        open={!!roomToDelete}
        onOpenChange={() => setRoomToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sala?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A sala e todos os dados dos
              jogadores serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
