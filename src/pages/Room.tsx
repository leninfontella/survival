import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGame } from "@/contexts/GameContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Trophy, Play, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Room() {
  const navigate = useNavigate();
  const { currentRoom, players, currentPlayer, startRoom } = useGame();

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma sala ativa</p>
            <Link to="/">
              <Button>Voltar ao Início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roomPlayers = players.filter((p) => p.roomId === currentRoom.id);
  const activePlayers = roomPlayers.filter((p) => !p.isEliminated);
  const canStart =
    roomPlayers.length >= currentRoom.minPlayers &&
    currentRoom.status === "waiting";
  const isAdmin = !currentPlayer; // Simplified: if no currentPlayer, assume admin view

  const handleStart = () => {
    startRoom();
  };

  const handleSelectTeam = () => {
    navigate("/room/select-team");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <div className="container mx-auto px-4 py-8">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    {currentRoom.name}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge
                      variant={
                        currentRoom.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {currentRoom.status === "waiting"
                        ? "Aguardando"
                        : currentRoom.status === "active"
                        ? "Em Andamento"
                        : "Finalizada"}
                    </Badge>
                    {currentRoom.status === "active" && (
                      <Badge variant="outline">
                        Rodada {currentRoom.currentRound}/
                        {currentRoom.totalRounds}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Prêmio Total
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    R$ {currentRoom.prizePool.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">
                      {roomPlayers.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Jogadores Inscritos
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-accent" />
                  <div>
                    <div className="text-2xl font-bold">
                      {activePlayers.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sobreviventes
                    </div>
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
                      {currentRoom.status === "active"
                        ? currentRoom.currentRound
                        : "-"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Rodada Atual
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          {currentRoom.status === "waiting" && isAdmin && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    {roomPlayers.length < currentRoom.minPlayers
                      ? `Aguardando mais ${
                          currentRoom.minPlayers - roomPlayers.length
                        } jogador(es) para iniciar`
                      : "Número mínimo de jogadores atingido!"}
                  </p>
                  <Button
                    size="lg"
                    disabled={!canStart}
                    onClick={handleStart}
                    className="w-full md:w-auto"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Iniciar Competição
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentRoom.status === "waiting" && !isAdmin && (
            <Card className="border-accent/50 bg-accent/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    {roomPlayers.length < currentRoom.minPlayers
                      ? `Aguardando mais ${
                          currentRoom.minPlayers - roomPlayers.length
                        } jogador(es) para iniciar`
                      : "Número mínimo de jogadores atingido! Prepare-se!"}
                  </p>
                  <Button
                    size="lg"
                    disabled={!canStart}
                    onClick={handleSelectTeam}
                    className="w-full md:w-auto"
                  >
                    <Trophy className="mr-2 h-5 w-5" />
                    INICIAR SOBREVIVÊNCIA
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentRoom.status === "active" &&
            currentPlayer &&
            !currentPlayer.isEliminated && (
              <Card className="border-accent/50 bg-accent/5">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <p className="text-lg font-semibold">
                      Rodada {currentRoom.currentRound} - Escolha seu time!
                    </p>
                    <Button
                      size="lg"
                      onClick={handleSelectTeam}
                      className="w-full md:w-auto"
                    >
                      Selecionar Time
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Players List */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Jogadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roomPlayers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum jogador inscrito ainda
                  </p>
                ) : (
                  roomPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-background/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            player.isEliminated
                              ? "bg-destructive"
                              : "bg-primary"
                          }`}
                        />
                        <span
                          className={
                            player.isEliminated
                              ? "line-through text-muted-foreground"
                              : ""
                          }
                        >
                          {player.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {player.isEliminated ? (
                          <Badge variant="destructive">Eliminado</Badge>
                        ) : (
                          <Badge variant="default">Ativo</Badge>
                        )}
                      </div>
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
