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
import { ArrowLeft, Loader2, Lock, Unlock } from "lucide-react";
import { Link } from "react-router-dom";
import { League } from "@/types/game";
import { roomAPI } from "@/services/api";
import { Navbar } from "@/components/Navbar";

const leagueOptions = [
  { value: "brasil" as League, label: "🇧🇷 Brasileirão", rounds: 38 },
  { value: "espanha" as League, label: "🇪🇸 La Liga", rounds: 38 },
  {
    value: "inglaterra" as League,
    label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League",
    rounds: 38,
  },
  {
    value: "alemanha" as League,
    label: "🇩🇪 Bundesliga",
    rounds: 34,
  },
  { value: "italia" as League, label: "🇮🇹 Serie A", rounds: 38 },
  { value: "franca" as League, label: "🇫🇷 Ligue 1", rounds: 34 },
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
    setFormData({
      ...formData,
      league,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <Navbar />

      <div className="container mx-auto px-3 py-4 mt-16 max-w-2xl">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-4 text-sm h-9">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
              Criar Nova Sala
            </CardTitle>
            <CardDescription className="text-center text-xs">
              Configure os parâmetros da competição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div onSubmit={handleSubmit} className="space-y-4">
              {/* Privacy Toggle - MOBILE OPTIMIZED */}
              <div className="p-3 rounded-lg border-2 border-border bg-muted/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {formData.isPrivate ? (
                        <Lock className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : (
                        <Unlock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <Label
                        htmlFor="privacy"
                        className="text-sm font-semibold cursor-pointer"
                      >
                        {formData.isPrivate ? "Sala Privada" : "Sala Pública"}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {formData.isPrivate
                        ? "Apenas convidados poderão ver e entrar"
                        : "Qualquer pessoa pode ver e entrar"}
                    </p>
                  </div>
                  <Switch
                    id="privacy"
                    checked={formData.isPrivate}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPrivate: checked })
                    }
                    disabled={isLoading}
                    className="flex-shrink-0"
                  />
                </div>
              </div>

              {/* League Select */}
              <div className="space-y-2">
                <Label htmlFor="league" className="text-sm">
                  Liga / Campeonato
                </Label>
                <Select
                  value={formData.league}
                  onValueChange={handleLeagueChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagueOptions.map((league) => (
                      <SelectItem key={league.value} value={league.value}>
                        {league.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Room Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                  Nome da Sala
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Survivor 2024"
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>

              {/* Grid 2 Columns - MOBILE STACKS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="minPlayers" className="text-sm">
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
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryPrice" className="text-sm">
                    Entrada (R$)
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
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground leading-tight">
                    Valor por jogador
                  </p>
                </div>
              </div>

              {/* Total Rounds */}
              <div className="space-y-2">
                <Label htmlFor="totalRounds" className="text-sm">
                  Total de Rodadas
                </Label>
                <Input
                  id="totalRounds"
                  type="number"
                  min="1"
                  value={formData.totalRounds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalRounds: parseInt(e.target.value),
                    })
                  }
                  required
                  disabled={isLoading}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground leading-tight">
                  Número de rodadas da competição
                </p>
              </div>

              {/* Summary Card - MOBILE COMPACT */}
              <div className="pt-2 space-y-3">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2 text-sm">
                    Resumo
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      {formData.isPrivate ? (
                        <>
                          <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>
                            Privacidade: <strong>Privada</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>
                            Privacidade: <strong>Pública</strong>
                          </span>
                        </>
                      )}
                    </div>
                    <p>
                      • Liga:{" "}
                      <strong>
                        {
                          leagueOptions.find((l) => l.value === formData.league)
                            ?.label
                        }
                      </strong>
                    </p>
                    <p>
                      • Entrada: <strong>R$ {formData.entryPrice}</strong>
                    </p>
                    <p>
                      • Mínimo: <strong>{formData.minPlayers} jogadores</strong>
                    </p>
                    <p>
                      • Duração: <strong>{formData.totalRounds} rodadas</strong>
                    </p>
                    <div className="pt-1 mt-1 border-t border-primary/20">
                      <p className="text-primary font-semibold">
                        💰 Prêmio inicial: R${" "}
                        {(
                          formData.minPlayers * formData.entryPrice
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button - MOBILE FRIENDLY */}
                <Button
                  onClick={handleSubmit}
                  className="w-full h-11"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="text-sm">Criando...</span>
                    </>
                  ) : (
                    <>
                      {formData.isPrivate ? (
                        <Lock className="mr-2 h-4 w-4" />
                      ) : (
                        <Unlock className="mr-2 h-4 w-4" />
                      )}
                      <span className="text-sm font-semibold">
                        Criar Sala e Entrar
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card - MOBILE */}
        <Card className="mt-4 border-border/30 bg-muted/30">
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                {formData.isPrivate ? (
                  <>
                    <Lock className="h-4 w-4 text-primary" />
                    Como funcionam salas privadas?
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 text-muted-foreground" />
                    Como funcionam salas públicas?
                  </>
                )}
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                {formData.isPrivate ? (
                  <>
                    <li>
                      • Apenas você e jogadores convidados podem ver esta sala
                    </li>
                    <li>• A sala não aparece na lista pública do dashboard</li>
                    <li>
                      • Você receberá um link de convite para compartilhar
                    </li>
                    <li>
                      • Jogadores precisam estar logados para entrar com o link
                    </li>
                  </>
                ) : (
                  <>
                    <li>• Qualquer pessoa pode ver esta sala no dashboard</li>
                    <li>
                      • Jogadores podem entrar sem login (apenas com nome)
                    </li>
                    <li>• A sala aparece na lista pública de salas ativas</li>
                    <li>• Você ainda pode compartilhar o link diretamente</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
