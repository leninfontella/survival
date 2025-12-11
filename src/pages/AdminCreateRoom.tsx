import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Lock, Unlock, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { League } from "@/types/game";
import { roomAPI } from "@/services/api";
import { Navbar } from "@/components/Navbar";

// 🔥 FIX: Dados corretos das ligas com rodadas FIXAS
const leagueOptions = [
  { value: "brasil" as League, label: "🇧🇷 Brasileirão", rounds: 38 },
  { value: "espanha" as League, label: "🇪🇸 La Liga (Espanha)", rounds: 38 },
  {
    value: "inglaterra" as League,
    label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League (Inglaterra)",
    rounds: 38,
  },
  {
    value: "alemanha" as League,
    label: "🇩🇪 Bundesliga (Alemanha)",
    rounds: 34,
  },
  { value: "italia" as League, label: "🇮🇹 Serie A (Itália)", rounds: 38 },
  { value: "franca" as League, label: "🇫🇷 Ligue 1 (França)", rounds: 34 },
];

export default function AdminCreateRoom() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    league: "brasil" as League,
    minPlayers: 10,
    entryPrice: 50,
    totalRounds: 38, // Será atualizado automaticamente
    isPrivate: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 FIX: Atualizar totalRounds automaticamente ao mudar a liga
  const handleLeagueChange = (league: League) => {
    const selectedLeague = leagueOptions.find((l) => l.value === league);

    setFormData({
      ...formData,
      league,
      totalRounds: selectedLeague?.rounds || 38, // 🔥 ATUALIZA AUTOMATICAMENTE
    });
  };

  // 🔥 FIX: Validar totalRounds antes de enviar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar se totalRounds está correto para a liga
      const selectedLeague = leagueOptions.find(
        (l) => l.value === formData.league
      );
      const maxRounds = selectedLeague?.rounds || 38;

      if (formData.totalRounds > maxRounds) {
        toast({
          title: "Número de rodadas inválido",
          description: `${selectedLeague?.label} tem apenas ${maxRounds} rodadas. Ajustando automaticamente.`,
          variant: "destructive",
        });

        setFormData({ ...formData, totalRounds: maxRounds });
        setIsLoading(false);
        return;
      }

      const response = await roomAPI.create({
        name: formData.name,
        league: formData.league,
        minPlayers: formData.minPlayers,
        entryPrice: formData.entryPrice,
        totalRounds: formData.totalRounds,
        isPrivate: formData.isPrivate,
      });

      if (response.success) {
        const roomId = response.data._id || response.data.id;

        toast({
          title: "Sala criada com sucesso!",
          description: formData.isPrivate
            ? "Sala privada criada. Apenas convidados poderão entrar."
            : "Sala pública criada. Todos podem ver e entrar.",
        });

        navigate(`/join-room/${roomId}`);
      }
    } catch (error) {
      console.error("Erro ao criar sala:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Tente novamente mais tarde.";

      toast({
        title: "Erro ao criar sala",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Obter rodadas máximas da liga selecionada
  const selectedLeague = leagueOptions.find((l) => l.value === formData.league);
  const maxRounds = selectedLeague?.rounds || 38;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <Navbar />

      <div className="container mx-auto px-4 py-8 mt-20">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
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
              {/* Privacy Toggle */}
              <div className="p-4 rounded-lg border-2 border-border bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      {formData.isPrivate ? (
                        <Lock className="h-5 w-5 text-primary" />
                      ) : (
                        <Unlock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <Label
                        htmlFor="privacy"
                        className="text-base font-semibold cursor-pointer"
                      >
                        {formData.isPrivate ? "Sala Privada" : "Sala Pública"}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formData.isPrivate
                        ? "Apenas você e jogadores convidados poderão ver e entrar nesta sala"
                        : "Qualquer pessoa pode ver e entrar nesta sala"}
                    </p>
                  </div>
                  <Switch
                    id="privacy"
                    checked={formData.isPrivate}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPrivate: checked })
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Liga */}
              <div className="space-y-2">
                <Label htmlFor="league">Liga / Campeonato</Label>
                <Select
                  value={formData.league}
                  onValueChange={handleLeagueChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a liga" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagueOptions.map((league) => (
                      <SelectItem key={league.value} value={league.value}>
                        {league.label} • {league.rounds} rodadas
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Esta liga tem {maxRounds} rodadas no campeonato real
                </p>
              </div>

              {/* Nome da Sala */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Sala</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Survivor Premier League 2024"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Grid de Configurações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Jogadores Mínimos */}
                <div className="space-y-2">
                  <Label htmlFor="minPlayers">Jogadores Mínimos</Label>
                  <Input
                    id="minPlayers"
                    type="number"
                    min="2"
                    value={formData.minPlayers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minPlayers: parseInt(e.target.value),
                      })
                    }
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Valor de Entrada */}
                <div className="space-y-2">
                  <Label htmlFor="entryPrice">Valor de Entrada (R$)</Label>
                  <Input
                    id="entryPrice"
                    type="number"
                    min="1"
                    value={formData.entryPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        entryPrice: parseFloat(e.target.value),
                      })
                    }
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cada jogador paga este valor para participar
                  </p>
                </div>
              </div>

              {/* 🔥 FIX: Total de Rodadas - AUTOMÁTICO ou com limite */}
              <div className="space-y-2">
                <Label htmlFor="totalRounds">Total de Rodadas</Label>
                <Input
                  id="totalRounds"
                  type="number"
                  min="1"
                  max={maxRounds} // 🔥 LIMITAR ao máximo da liga
                  value={formData.totalRounds}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    // 🔥 Validar se não excede o máximo
                    if (value <= maxRounds) {
                      setFormData({
                        ...formData,
                        totalRounds: value,
                      });
                    } else {
                      toast({
                        title: "Limite excedido",
                        description: `${selectedLeague?.label} tem apenas ${maxRounds} rodadas`,
                        variant: "destructive",
                      });
                    }
                  }}
                  required
                  disabled={isLoading}
                />
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <p>
                    Defina quantas rodadas serão jogadas (máximo: {maxRounds}{" "}
                    rodadas da {selectedLeague?.label})
                  </p>
                </div>
              </div>

              {/* Resumo */}
              <div className="pt-4 space-y-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2">Resumo</h4>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      {formData.isPrivate ? (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          <span>
                            Privacidade: <strong>Privada</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3.5 w-3.5" />
                          <span>
                            Privacidade: <strong>Pública</strong>
                          </span>
                        </>
                      )}
                    </p>
                    <p>
                      • Liga:{" "}
                      {
                        leagueOptions.find((l) => l.value === formData.league)
                          ?.label
                      }
                    </p>
                    <p>• Entrada: R$ {formData.entryPrice.toFixed(2)}</p>
                    <p>• Mínimo: {formData.minPlayers} jogadores</p>
                    <p>
                      • Duração: {formData.totalRounds} de {maxRounds} rodadas
                      disponíveis
                    </p>
                    <p>
                      • Prêmio inicial: R${" "}
                      {(
                        formData.minPlayers * formData.entryPrice
                      ).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando Sala...
                    </>
                  ) : (
                    <>
                      {formData.isPrivate ? (
                        <Lock className="mr-2 h-4 w-4" />
                      ) : (
                        <Unlock className="mr-2 h-4 w-4" />
                      )}
                      Criar Sala e Entrar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
