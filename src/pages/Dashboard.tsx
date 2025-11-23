import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useGame } from "@/contexts/GameContext";
import {
  Trophy,
  Users,
  Clock,
  Play,
  Flag,
  Plus,
  LogOut,
  Copy,
  Check,
  UserCircle,
} from "lucide-react";
import { Room } from "@/types/game";
import { useToast } from "@/hooks/use-toast";

const leagueNames = {
  brasil: "🇧🇷 Brasileirão",
  espanha: "🇪🇸 La Liga",
  inglaterra: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League",
  alemanha: "🇩🇪 Bundesliga",
  italia: "🇮🇹 Serie A",
  franca: "🇫🇷 Ligue 1",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { rooms, players } = useGame();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"waiting" | "active" | "finished">(
    "waiting"
  );
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  const openRooms = rooms.filter((r) => r.status === "waiting");
  const activeRooms = rooms.filter((r) => r.status === "active");
  const finishedRooms = rooms.filter((r) => r.status === "finished");

  const RoomCard = ({ room }: { room: Room }) => {
    const statusConfig = {
      waiting: { label: "Aguardando", color: "bg-yellow-500", icon: Clock },
      active: { label: "Em Andamento", color: "bg-green-500", icon: Play },
      finished: { label: "Finalizada", color: "bg-gray-500", icon: Flag },
    };

    const config = statusConfig[room.status];
    const Icon = config.icon;
    const shareLink = `${window.location.origin}/join-room/${room.id}`;
    const roomPlayers = players.filter((p) => p.roomId === room.id);

    const handleCopyLink = () => {
      navigator.clipboard.writeText(shareLink);
      setCopiedRoomId(room.id);
      toast({
        title: "Link copiado!",
        description: "O link da sala foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopiedRoomId(null), 2000);
    };

    return (
      <Card className="hover:border-primary/50 transition-all hover:scale-[1.02] cursor-pointer border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-xl">{room.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {leagueNames[room.league]}
              </p>
            </div>
            <Badge className={`${config.color} text-white border-0`}>
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
                {roomPlayers.length}/{room.minPlayers}
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

          {room.status === "waiting" && (
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
                  {copiedRoomId === room.id ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <Button
            className="w-full mt-2"
            onClick={() => {
              if (room.status === "waiting") {
                navigate(`/join-room/${room.id}`);
              } else {
                navigate("/room");
              }
            }}
            variant={room.status === "waiting" ? "default" : "outline"}
          >
            {room.status === "waiting" ? "Entrar na Sala" : "Ver Detalhes"}
          </Button>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas competições
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
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
                  <RoomCard key={room.id} room={room} />
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
                  <RoomCard key={room.id} room={room} />
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
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
