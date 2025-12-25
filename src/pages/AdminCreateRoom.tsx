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
    totalRounds: 38,
    isPrivate: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLeagueChange = (league: League) => {
    const selectedLeague = leagueOptions.find((l) => l.value === league);

    setFormData({
      ...formData,
      league,
      totalRounds: selectedLeague?.rounds || 38,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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

  const selectedLeague = leagueOptions.find((l) => l.value === formData.league);
  const maxRounds = selectedLeague?.rounds || 38;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 mt-16 sm:mt-20">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-4 sm:mb-6 text-sm sm:text-base">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <Card className="max-w-2xl mx-auto border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Criar Nova Sala
            </CardTitle>
            <CardDescription className="text-center text-xs sm:text-sm">
              Configure os parâmetros da competição
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Privacy Toggle */}
              <div className="p-3 sm:p-4 rounded-lg border-2 border-border bg-muted/50">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {formData.isPrivate ? (
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                      ) : (
                        <Unlock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                      )}
                      <Label
                        htmlFor="privacy"
                        className="text-sm sm:text-base font-semibold cursor-pointer"
                      >
                        {formData.isPrivate ? "Sala Privada" : "Sala Pública"}
                      </Label>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                      {formData.isPrivate
                        ? "Apenas você e jogadores convidados poderão ver e entrar"
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
                    className="shrink-0"
                  />
                </div>
              </div>

              {/* Liga */}
              <div className="space-y-2">
                <Label htmlFor="league" className="text-sm sm:text-base">
                  Liga / Campeonato
                </Label>
                <Select
                  value={formData.league}
                  onValueChange={handleLeagueChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Selecione a liga" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagueOptions.map((league) => (
                      <SelectItem
                        key={league.value}
                        value={league.value}
                        className="text-sm sm:text-base"
                      >
                        <span className="block sm:hidden">
                          {league.label.split("(")[0].trim()}
                        </span>
                        <span className="hidden sm:block">
                          {league.label} • {league.rounds} rodadas
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3 shrink-0" />
                  <span>Esta liga tem {maxRounds} rodadas</span>
                </p>
              </div>

              {/* Nome da Sala */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">
                  Nome da Sala
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Survivor Premier 2024"
                  required
                  disabled={isLoading}
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Grid de Configurações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Jogadores Mínimos */}
                <div className="space-y-2">
                  <Label htmlFor="minPlayers" className="text-sm sm:text-base">
                    Jogadores Mínimos
                  </Label>
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
                    className="text-sm sm:text-base"
                  />
                </div>

                {/* Valor de Entrada */}
                <div className="space-y-2">
                  <Label htmlFor="entryPrice" className="text-sm sm:text-base">
                    Valor de Entrada (R$)
                  </Label>
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
                    className="text-sm sm:text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cada jogador paga este valor
                  </p>
                </div>
              </div>

              {/* Total de Rodadas */}
              <div className="space-y-2">
                <Label htmlFor="totalRounds" className="text-sm sm:text-base">
                  Total de Rodadas
                </Label>
                <Input
                  id="totalRounds"
                  type="number"
                  min="1"
                  max={maxRounds}
                  value={formData.totalRounds}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
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
                  className="text-sm sm:text-base"
                />
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <p className="leading-tight">
                    Máximo: {maxRounds} rodadas da{" "}
                    {selectedLeague?.label.split("(")[0].trim()}
                  </p>
                </div>
              </div>

              {/* Resumo */}
              <div className="pt-2 sm:pt-4 space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2 text-sm sm:text-base">
                    Resumo
                  </h4>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <p className="flex items-center gap-2">
                      {formData.isPrivate ? (
                        <>
                          <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                          <span>
                            Privacidade: <strong>Privada</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                          <span>
                            Privacidade: <strong>Pública</strong>
                          </span>
                        </>
                      )}
                    </p>
                    <p className="break-words">
                      • Liga:{" "}
                      <span className="inline sm:hidden">
                        {leagueOptions
                          .find((l) => l.value === formData.league)
                          ?.label.split("(")[0]
                          .trim()}
                      </span>
                      <span className="hidden sm:inline">
                        {
                          leagueOptions.find((l) => l.value === formData.league)
                            ?.label
                        }
                      </span>
                    </p>
                    <p>• Entrada: R$ {formData.entryPrice.toFixed(2)}</p>
                    <p>• Mínimo: {formData.minPlayers} jogadores</p>
                    <p>
                      • Duração: {formData.totalRounds} de {maxRounds} rodadas
                    </p>
                    <p>
                      • Prêmio: R${" "}
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
                  className="w-full text-sm sm:text-base"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      {formData.isPrivate ? (
                        <Lock className="mr-2 h-4 w-4" />
                      ) : (
                        <Unlock className="mr-2 h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        Criar Sala e Entrar
                      </span>
                      <span className="sm:hidden">Criar e Entrar</span>
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
