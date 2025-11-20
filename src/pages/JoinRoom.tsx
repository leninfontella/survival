import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame } from '@/contexts/GameContext';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { currentRoom, joinRoom } = useGame();
  const [formData, setFormData] = useState({
    name: '',
    lines: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentRoom) {
      toast({
        title: 'Erro',
        description: 'Sala não encontrada.',
        variant: 'destructive',
      });
      return;
    }

    joinRoom(currentRoom.id, formData.name, formData.lines);

    toast({
      title: 'Entrada confirmada!',
      description: `Você comprou ${formData.lines} linha(s).`,
    });

    navigate('/room');
  };

  const totalPrice = currentRoom ? formData.lines * currentRoom.entryPrice : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <Card className="max-w-2xl mx-auto border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Entrar na Sala
            </CardTitle>
            <CardDescription className="text-center">
              {currentRoom?.name || 'Carregando...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentRoom ? (
              <>
                <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold text-primary mb-3">Informações da Sala</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium capitalize">{currentRoom.status === 'waiting' ? 'Aguardando' : currentRoom.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor por linha:</span>
                      <span className="font-medium">R$ {currentRoom.entryPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rodadas:</span>
                      <span className="font-medium">{currentRoom.totalRounds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prêmio atual:</span>
                      <span className="font-bold text-primary">R$ {currentRoom.prizePool.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Seu Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Digite seu nome"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lines">Quantidade de Linhas</Label>
                    <Input
                      id="lines"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.lines}
                      onChange={(e) => setFormData({ ...formData, lines: parseInt(e.target.value) || 1 })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Cada linha é uma chance de ganhar. Máximo: 10 linhas.
                    </p>
                  </div>

                  <div className="pt-4 space-y-4">
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
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma sala disponível no momento.</p>
                <Link to="/admin/create-room">
                  <Button className="mt-4">Criar Nova Sala</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
