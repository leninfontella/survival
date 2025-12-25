import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Target, Zap, Shield, TrendingUp } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { authAPI } from "@/services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Stats {
  activePlayers: number;
  totalPrize: number;
  currentRound: number;
  activeRooms: number;
  finishedRooms: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<Stats>({
    activePlayers: 0,
    totalPrize: 0,
    currentRound: 0,
    activeRooms: 0,
    finishedRooms: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authAPI.isAuthenticated());
    };

    checkAuth();

    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();

        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleProtectedAction = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate("/login");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.3)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background z-0" />

        <div className="container mx-auto px-3 sm:px-4 z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight px-2">
              Sobreviva a{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
                cada rodada!
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto px-4">
              Escolha o time vencedor a cada rodada das maiores ligas do MUNDO.
              Um erro e você está fora. O último sobrevivente leva tudo!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 pt-2">
              <Button
                variant="hero"
                size="lg"
                className="w-full sm:min-w-[200px] sm:w-auto text-sm sm:text-base"
                onClick={() => handleProtectedAction("/admin/create-room")}
              >
                Criar Sala
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:min-w-[200px] sm:w-auto text-sm sm:text-base"
                onClick={() => handleProtectedAction("/dashboard")}
              >
                Ver Salas
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-8 sm:mt-12 md:mt-16 px-2">
              <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all hover:scale-105">
                <CardContent className="pt-4 sm:pt-6 pb-4 text-center">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-2 sm:mb-3 md:mb-4 text-primary" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
                    {isLoadingStats ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      stats.activePlayers.toLocaleString("pt-BR")
                    )}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Jogadores Ativos
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all hover:scale-105">
                <CardContent className="pt-4 sm:pt-6 pb-4 text-center">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-2 sm:mb-3 md:mb-4 text-accent" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
                    {isLoadingStats ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      formatCurrency(stats.totalPrize)
                    )}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Prêmio Acumulado
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all hover:scale-105 sm:col-span-2 lg:col-span-1">
                <CardContent className="pt-4 sm:pt-6 pb-4 text-center">
                  <Target className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-2 sm:mb-3 md:mb-4 text-primary" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
                    {isLoadingStats ? (
                      <span className="animate-pulse">...</span>
                    ) : stats.currentRound > 0 ? (
                      `Rodada ${stats.currentRound}`
                    ) : (
                      "Aguardando"
                    )}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stats.activeRooms > 0
                      ? `${stats.activeRooms} sala${
                          stats.activeRooms !== 1 ? "s" : ""
                        } ativa${stats.activeRooms !== 1 ? "s" : ""}`
                      : "Nenhuma sala ativa"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 px-2">
              Como Funciona
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Simples, emocionante e com estratégia a cada rodada
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: (
                  <Target className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />
                ),
                step: "01",
                title: "Compre sua Linha",
                description: "Adquira linhas para participar das rodadas",
              },
              {
                icon: (
                  <Shield className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />
                ),
                step: "02",
                title: "Escolha o Vencedor",
                description: "A cada rodada, escolha UM time que vai VENCER",
              },
              {
                icon: <Zap className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />,
                step: "03",
                title: "Avance ou Seja Eliminado",
                description: "Vitória = avança. Empate ou derrota = eliminado",
              },
              {
                icon: (
                  <Trophy className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />
                ),
                step: "04",
                title: "Ganhe o Prêmio",
                description: "O último sobrevivente leva todo o prêmio!",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <Card className="h-full bg-card border-primary/20 hover:border-primary/50 transition-all group hover:scale-105">
                  <CardContent className="pt-6 sm:pt-8 pb-4 sm:pb-6 text-center space-y-2 sm:space-y-3 md:space-y-4">
                    <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center font-bold text-base sm:text-lg shadow-[0_0_20px_rgba(10,125,74,0.5)]">
                      {item.step}
                    </div>
                    <div className="text-primary group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold px-2">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground px-2">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regras do Jogo */}
      <section className="py-12 sm:py-16 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 px-2">
              Regras Oficiais
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Tudo que você precisa saber para jogar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Compra de Linha",
                description:
                  "Cada jogador pode comprar uma ou mais linhas para participar. Quanto mais ligas, mais chances!",
              },
              {
                title: "Escolha por Rodada",
                description:
                  "A cada rodada, você escolhe UM time que acredita que vai VENCER sua partida.",
              },
              {
                title: "Condição de Vitória",
                description:
                  "Se o time escolhido VENCER, você avança automaticamente para a próxima rodada.",
              },
              {
                title: "Condição de Eliminação",
                description:
                  "Se o time EMPATAR ou PERDER, você é ELIMINADO. Sem chances extras!",
              },
              {
                title: "Restrição Importante",
                description:
                  "Você NÃO PODE escolher o mesmo time duas vezes. Escolha com sabedoria!",
              },
              {
                title: "Prêmio Final",
                description:
                  "O último jogador sobrevivente leva TODO o prêmio acumulado!",
              },
            ].map((rule, index) => (
              <Card
                key={index}
                className="bg-card border-primary/20 hover:border-primary/40 transition-all hover:translate-x-1 sm:hover:translate-x-2"
              >
                <CardContent className="pt-4 sm:pt-6 pb-4 px-3 sm:px-6">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center font-bold text-sm sm:text-base text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">
                        {rule.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Prêmio em Destaque */}
      <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8">
            <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto text-primary animate-bounce" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold px-2">
              Prêmio Atual
            </h2>
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {isLoadingStats ? (
                <span className="animate-pulse">...</span>
              ) : (
                formatCurrency(stats.totalPrize)
              )}
            </div>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground px-4">
              O prêmio aumenta a cada novo jogador! Entre agora e aumente suas
              chances!
            </p>
            <Button
              variant="hero"
              size="lg"
              className="text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 h-auto"
              onClick={() => handleProtectedAction("/dashboard")}
            >
              Participar Agora
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 sm:py-16 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-3 sm:px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-card via-primary/5 to-card border-primary/30">
            <CardContent className="pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-10 md:pb-12 text-center space-y-4 sm:space-y-5 md:space-y-6 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-2">
                Pronto Para o Desafio?
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
                Cadastre-se agora e comece sua jornada rumo ao prêmio máximo!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4">
                <Link to="/cadastro" className="w-full sm:w-auto">
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full sm:min-w-[200px] text-sm sm:text-base"
                  >
                    Criar Conta
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:min-w-[200px] text-sm sm:text-base"
                  >
                    Já Tenho Conta
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 md:py-12 bg-background border-t border-border">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span className="text-lg sm:text-xl font-bold">Sobrevivente</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Privacidade
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Suporte
              </a>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              © 2026 Sobrevivente. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
