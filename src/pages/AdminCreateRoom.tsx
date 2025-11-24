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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Check, Loader2 } from "lucide-react";
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
  });
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState("");
  const [copied, setCopied] = useState(false);
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
      });

      if (response.success) {
        setCreatedRoomId(response.data._id || response.data.id);
        setShowShareDialog(true);

        toast({
          title: "Sala criada com sucesso!",
          description: "Compartilhe o link com os jogadores.",
        });
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

  const shareLink = `${window.location.origin}/join-room/${createdRoomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const handleCloseDialog = () => {
    setShowShareDialog(false);
    navigate("/dashboard");
  };

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
                        {league.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="totalRounds">Total de Rodadas</Label>
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
                />
                <p className="text-xs text-muted-foreground">
                  Defina o número de rodadas da competição
                </p>
              </div>

              <div className="pt-4 space-y-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2">Resumo</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      • Liga:{" "}
                      {
                        leagueOptions.find((l) => l.value === formData.league)
                          ?.label
                      }
                    </p>
                    <p>• Entrada: R$ {formData.entryPrice}</p>
                    <p>• Mínimo: {formData.minPlayers} jogadores</p>
                    <p>• Duração: {formData.totalRounds} rodadas</p>
                    <p>
                      • Prêmio inicial: R${" "}
                      {(
                        formData.minPlayers * formData.entryPrice
                      ).toLocaleString()}
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
                    "Criar Sala"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sala criada com sucesso!</DialogTitle>
              <DialogDescription>
                Compartilhe o link abaixo com os jogadores
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted border border-border">
                <p className="text-sm break-all">{shareLink}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCopyLink} className="flex-1">
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? "Copiado!" : "Copiar Link"}
                </Button>
                <Button
                  onClick={handleCloseDialog}
                  variant="outline"
                  className="flex-1"
                >
                  Ir para Dashboard
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
