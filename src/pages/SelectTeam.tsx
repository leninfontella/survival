import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGame } from '@/contexts/GameContext';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SelectTeam() {
  const navigate = useNavigate();
  const { currentRoom, currentPlayer, teams, selectTeam } = useGame();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  if (!currentRoom || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Sessão não encontrada</p>
            <Link to="/">
              <Button>Voltar ao Início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleConfirm = () => {
    if (!selectedTeamId) {
      toast({
        title: 'Selecione um time',
        description: 'Você precisa escolher um time para continuar.',
        variant: 'destructive',
      });
      return;
    }

    selectTeam(selectedTeamId);
    toast({
      title: 'Time selecionado!',
      description: 'Boa sorte nesta rodada!',
    });
    navigate('/room');
  };

  const isTeamUsed = (teamId: string) => currentPlayer.selectedTeams.includes(teamId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <div className="container mx-auto px-4 py-8">
        <Link to="/room">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="text-center space-y-2">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Rodada {currentRoom.currentRound}
                </CardTitle>
                <p className="text-muted-foreground">
                  Escolha o time que você acredita que irá <span className="text-primary font-semibold">VENCER</span> nesta rodada
                </p>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Times Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teams.map((team) => {
                  const used = isTeamUsed(team.id);
                  const selected = selectedTeamId === team.id;

                  return (
                    <button
                      key={team.id}
                      onClick={() => !used && setSelectedTeamId(team.id)}
                      disabled={used}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all
                        ${used ? 'opacity-40 cursor-not-allowed bg-muted' : 'cursor-pointer hover:scale-105'}
                        ${selected ? 'border-primary bg-primary/10' : 'border-border bg-background/50'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{team.logo}</span>
                          <span className="font-semibold">{team.name}</span>
                        </div>
                        {used && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <X className="h-3 w-3" />
                            Usado
                          </Badge>
                        )}
                        {selected && (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">⚠️ Lembre-se:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Você só pode escolher cada time UMA vez durante todo o campeonato</li>
                  <li>• Se seu time VENCER, você avança para a próxima rodada</li>
                  <li>• Se seu time EMPATAR ou PERDER, você é eliminado</li>
                </ul>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!selectedTeamId}
                size="lg"
                className="w-full mt-6"
              >
                <Check className="mr-2 h-5 w-5" />
                Confirmar Escolha
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Seus Times Já Usados</CardTitle>
            </CardHeader>
            <CardContent>
              {currentPlayer.selectedTeams.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum time usado ainda
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentPlayer.selectedTeams.map((teamId) => {
                    const team = teams.find(t => t.id === teamId);
                    return team ? (
                      <Badge key={teamId} variant="secondary" className="text-sm">
                        {team.logo} {team.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
