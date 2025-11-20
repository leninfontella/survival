import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame } from '@/contexts/GameContext';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminCreateRoom() {
  const navigate = useNavigate();
  const { createRoom } = useGame();
  const [formData, setFormData] = useState({
    name: '',
    minPlayers: 10,
    entryPrice: 50,
    totalRounds: 38,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createRoom({
      ...formData,
      status: 'waiting',
      currentRound: 0,
      createdBy: 'admin',
    });

    toast({
      title: 'Sala criada com sucesso!',
      description: 'Compartilhe o link com os jogadores.',
    });

    navigate('/room');
  };

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
              Criar Nova Sala
            </CardTitle>
            <CardDescription className="text-center">
              Configure os parâmetros da competição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Sala</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Brasileirão 2024 - Survivor"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPlayers">Jogadores Mínimos</Label>
                  <Input
                    id="minPlayers"
                    type="number"
                    min="2"
                    value={formData.minPlayers}
                    onChange={(e) => setFormData({ ...formData, minPlayers: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryPrice">Valor por Linha (R$)</Label>
                  <Input
                    id="entryPrice"
                    type="number"
                    min="1"
                    value={formData.entryPrice}
                    onChange={(e) => setFormData({ ...formData, entryPrice: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalRounds">Total de Rodadas</Label>
                <Input
                  id="totalRounds"
                  type="number"
                  min="1"
                  max="38"
                  value={formData.totalRounds}
                  onChange={(e) => setFormData({ ...formData, totalRounds: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Brasileirão tem 38 rodadas no total
                </p>
              </div>

              <div className="pt-4 space-y-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2">Resumo</h4>
                  <div className="space-y-1 text-sm">
                    <p>• Entrada: R$ {formData.entryPrice} por linha</p>
                    <p>• Mínimo: {formData.minPlayers} jogadores</p>
                    <p>• Duração: {formData.totalRounds} rodadas</p>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Criar Sala
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
