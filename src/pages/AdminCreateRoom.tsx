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
import { useGame } from "@/contexts/GameContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { League } from "@/types/game";

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
  const { createRoom } = useGame();
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

  const handleLeagueChange = (league: League) => {
    const selectedLeague = leagueOptions.find((l) => l.value === league);
    setFormData({
      ...formData,
      league,
      totalRounds: selectedLeague?.rounds || 38,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const room = createRoom({
      ...formData,
      status: "waiting",
      currentRound: 0,
      createdBy: "admin",
    });

    setCreatedRoomId(room.id);
    setShowShareDialog(true);

    toast({
      title: "Sala criada com sucesso!",
      description: "Compartilhe o link com os jogadores.",
    });
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
      <div className="container mx-auto px-4 py-8">
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryPrice">Valor por Linha (R$)</Label>
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
                  />
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
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Definido automaticamente pela liga selecionada
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
