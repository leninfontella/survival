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
import { AxiosError } from "axios";

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

  useEffect(() => {
    const userId = authAPI.getCurrentUserId();
    setCurrentUserId(userId);
  }, []);

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

        setRooms(rooms.filter((r) => r._id !== roomToDelete));
        setRoomToDelete(null);
      }
    } catch (error) {
      console.error("Erro ao excluir sala:", error);
      let message = "Não foi possível excluir a sala.";
      if (error instanceof AxiosError && error.response) {
        message = error.response.data.message;
      }
      toast({
        title: "Erro ao excluir sala",
        description: message,
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
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg sm:text-xl break-words">
                  {room.name}
                </CardTitle>
                {room.isPrivate && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/20 text-amber-700 border-amber-500/30 text-xs shrink-0"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Privada
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {leagueNames[room.league]}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  Admin:{" "}
                  <span className="text-primary font-medium">
                    {creatorName}
                  </span>
                </span>
              </div>
            </div>
            <Badge
              className={`${config.color} text-white border-0 shrink-0 text-xs`}
            >
              <Icon className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">{config.label}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Prêmio:</span>
              <span className="font-semibold">
                R$ {room.prizePool.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Jogadores:</span>
              <span className="font-semibold">
                {room.players.length}/{room.minPlayers}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm pt-2 border-t border-border/50">
            <span className="text-muted-foreground">
              Rodada {room.currentRound} de {room.totalRounds}
            </span>
            <span className="text-muted-foreground">
              R$ {room.entryPrice}/entrada
            </span>
          </div>

          {room.status === "waiting" && !room.isPrivate && (
            <div className="mt-3 p-2 sm:p-3 bg-muted/50 rounded-md border border-border/50">
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
                  className="shrink-0 h-8 w-8 p-0"
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

          {room.isPrivate && room.status === "waiting" && (
            <div className="mt-3 p-2.5 sm:p-3 bg-amber-500/10 rounded-md border border-amber-500/30">
              <div className="flex items-center gap-2 mb-1.5">
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                <p className="text-xs font-semibold text-amber-700">
                  Sala Privada
                </p>
              </div>
              <p className="text-xs text-amber-700">
                Compartilhe o link apenas com jogadores convidados
              </p>
            </div>
          )}

          {room.isPrivate &&
            (room.status === "active" || room.status === "finished") && (
              <div className="mt-3 p-2.5 sm:p-3 bg-primary/10 rounded-md border border-primary/30">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                  <p className="text-xs text-primary font-medium">
                    Sala Privada - Convite necessário
                  </p>
                </div>
              </div>
            )}

          <Button
            className="w-full mt-2 text-sm"
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

          {isRoomCreator(room) && room.status !== "active" && (
            <Button
              className="w-full mt-2 text-sm"
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
      <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
        <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mb-3 sm:mb-4" />
        <p className="text-sm sm:text-base text-muted-foreground text-center">
          {message}
        </p>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
        <Navbar />
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 mt-16 sm:mt-20">
          <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
            <div className="text-center space-y-3 sm:space-y-4">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-primary mx-auto" />
              <p className="text-sm sm:text-base text-muted-foreground">
                Carregando salas...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 mt-16 sm:mt-20">
        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <Link to="/admin/create-room">
            <Card className="hover:border-primary/50 transition-all hover:scale-[1.02] cursor-pointer border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="flex items-center gap-3 sm:gap-4 py-4 sm:py-6 px-4">
                <div className="p-2.5 sm:p-3 rounded-full bg-primary/20 shrink-0">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg">
                    Criar Nova Sala
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Configure uma nova competição
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-4 sm:pt-6 pb-4 px-2 sm:px-4 text-center">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 text-yellow-500" />
              <p className="text-xl sm:text-3xl font-bold">
                {openRooms.length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Abertas
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-4 sm:pt-6 pb-4 px-2 sm:px-4 text-center">
              <Play className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 text-green-500" />
              <p className="text-xl sm:text-3xl font-bold">
                {activeRooms.length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Ativas
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-4 sm:pt-6 pb-4 px-2 sm:px-4 text-center">
              <Flag className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 text-gray-500" />
              <p className="text-xl sm:text-3xl font-bold">
                {finishedRooms.length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Finalizadas
              </p>
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
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="waiting" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Abertas</span>
              <span className="sm:hidden">Abertas</span>
              <span className="ml-1">({openRooms.length})</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Em Andamento</span>
              <span className="sm:hidden">Ativas</span>
              <span className="ml-1">({activeRooms.length})</span>
            </TabsTrigger>
            <TabsTrigger value="finished" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Finalizadas</span>
              <span className="sm:hidden">Finalizadas</span>
              <span className="ml-1">({finishedRooms.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waiting" className="space-y-3 sm:space-y-4">
            {openRooms.length === 0 ? (
              <EmptyState message="Nenhuma sala aguardando jogadores no momento" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {openRooms.map((room) => (
                  <RoomCard key={room._id} room={room} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-3 sm:space-y-4">
            {activeRooms.length === 0 ? (
              <EmptyState message="Nenhuma sala em andamento no momento" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {activeRooms.map((room) => (
                  <RoomCard key={room._id} room={room} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="finished" className="space-y-3 sm:space-y-4">
            {finishedRooms.length === 0 ? (
              <EmptyState message="Nenhuma sala finalizada ainda" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Excluir Sala?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Esta ação não pode ser desfeita. A sala e todos os dados dos
              jogadores serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
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
