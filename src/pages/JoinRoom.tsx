import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useGame } from "@/hooks/useGame";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Users, DollarSign, QrCode, Copy } from "lucide-react";
import { Link } from "react-router-dom";

export default function JoinRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { rooms, joinRoom } = useGame();
  const [currentRoom, setCurrentRoom] = useState(
    rooms.find((r) => r.id === roomId)
  );
  const [formData, setFormData] = useState({
    name: "",
  });
  const [showPayment, setShowPayment] = useState(false);
  const [pixCode] = useState(
    "00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Bolao Survivor6009SAO PAULO62070503***6304ABCD"
  );

  useEffect(() => {
    const room = rooms.find((r) => r.id === roomId);
    setCurrentRoom(room);
  }, [rooms, roomId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentRoom) {
      toast({
        title: "Erro",
        description: "Sala não encontrada.",
        variant: "destructive",
      });
      return;
    }

    setShowPayment(true);
  };

  const handlePaymentConfirm = () => {
    if (!currentRoom) return;

    joinRoom(currentRoom.id, formData.name);

    toast({
      title: "Pagamento confirmado!",
      description: "Você entrou na sala.",
    });

    navigate("/room");
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    toast({
      title: "Código PIX copiado!",
      description: "Cole no seu aplicativo de pagamento.",
    });
  };

  const totalPrice = currentRoom ? currentRoom.entryPrice : 0;

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
              Entrar na Sala
            </CardTitle>
            <CardDescription className="text-center">
              {currentRoom?.name || "Carregando..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentRoom ? (
              <>
                {!showPayment ? (
                  <>
                    <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <h4 className="font-semibold text-primary mb-3">
                        Informações da Sala
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium capitalize">
                            {currentRoom.status === "waiting"
                              ? "Aguardando"
                              : currentRoom.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Valor de entrada:
                          </span>
                          <span className="font-medium">
                            R$ {currentRoom.entryPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Rodadas:
                          </span>
                          <span className="font-medium">
                            {currentRoom.totalRounds}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Prêmio atual:
                          </span>
                          <span className="font-bold text-primary">
                            R$ {currentRoom.prizePool.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Seu Nome</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Digite seu nome"
                          required
                        />
                      </div>

                      <div className="pt-4 space-y-4">
                        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-accent" />
                              <span className="font-semibold">
                                Total a Pagar
                              </span>
                            </div>
                            <span className="text-2xl font-bold text-accent">
                              R$ {totalPrice.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Você terá 1 linha que dura até ser eliminado
                          </p>
                        </div>

                        <Button type="submit" className="w-full" size="lg">
                          <Users className="mr-2 h-5 w-5" />
                          Confirmar Entrada
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">
                        Pagamento via PIX
                      </h3>
                      <p className="text-muted-foreground">
                        Escaneie o QR Code ou copie o código PIX
                      </p>
                    </div>

                    <div className="p-6 rounded-lg bg-accent/10 border border-accent/20 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-48 h-48 bg-white p-4 rounded-lg flex items-center justify-center">
                          <QrCode className="w-full h-full text-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold">
                          Valor: R$ {totalPrice.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Nome: {formData.name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Código PIX Copia e Cola</Label>
                      <div className="flex gap-2">
                        <Input
                          value={pixCode}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button onClick={handleCopyPix} variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm text-muted-foreground text-center">
                        Após realizar o pagamento, clique no botão abaixo para
                        confirmar
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowPayment(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handlePaymentConfirm}
                        className="flex-1"
                        size="lg"
                      >
                        Confirmar Pagamento
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Sala não encontrada.</p>
                <Link to="/dashboard">
                  <Button className="mt-4">Voltar ao Dashboard</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
