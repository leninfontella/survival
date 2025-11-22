import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Target, Zap, Shield, TrendingUp } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Brasileirão Survivor
            </span>
          </div>
          <div className="flex gap-4">
            <Link to="/login">
              <Button
                variant="ghost"
                className="text-foreground hover:text-primary"
              >
                Login
              </Button>
            </Link>
            <Link to="/cadastro">
              <Button variant="default">Cadastrar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
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

        <div className="container mx-auto px-4 z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Sobreviva às{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
                38 Rodadas
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Escolha o time vencedor a cada rodada do Brasileirão. Um erro e
              você está fora. O último sobrevivente leva tudo!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/admin/create-room">
                <Button variant="hero" size="lg" className="min-w-[200px]">
                  Criar Sala (Admin)
                </Button>
              </Link>
              <Link to="/join-room">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  Entrar na Sala
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all hover:scale-105">
                <CardContent className="pt-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">1.247</h3>
                  <p className="text-muted-foreground">Jogadores Ativos</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all hover:scale-105">
                <CardContent className="pt-6 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-accent" />
                  <h3 className="text-2xl font-bold mb-2">R$ 150.000</h3>
                  <p className="text-muted-foreground">Prêmio Acumulado</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all hover:scale-105">
                <CardContent className="pt-6 text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">Rodada 8</h3>
                  <p className="text-muted-foreground">Em Andamento</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simples, emocionante e com estratégia a cada rodada
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Target className="w-10 h-10" />,
                step: "01",
                title: "Compre sua Linha",
                description:
                  "Adquira uma ou mais linhas (entradas) para participar do campeonato",
              },
              {
                icon: <Shield className="w-10 h-10" />,
                step: "02",
                title: "Escolha o Vencedor",
                description:
                  "A cada rodada, escolha UM time que você acredita que vai VENCER",
              },
              {
                icon: <Zap className="w-10 h-10" />,
                step: "03",
                title: "Avance ou Seja Eliminado",
                description:
                  "Vitória = avança. Empate ou derrota = eliminado. Sem escolher o mesmo time 2x",
              },
              {
                icon: <Trophy className="w-10 h-10" />,
                step: "04",
                title: "Ganhe o Prêmio",
                description:
                  "O último jogador sobrevivente leva todo o prêmio acumulado",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <Card className="h-full bg-card border-primary/20 hover:border-primary/50 transition-all group hover:scale-105">
                  <CardContent className="pt-8 text-center space-y-4">
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(10,125,74,0.5)]">
                      {item.step}
                    </div>
                    <div className="text-primary group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regras do Jogo */}
      <section className="py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Regras Oficiais
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa saber para jogar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Compra de Linha",
                description:
                  "Cada jogador pode comprar uma ou mais linhas (entradas) para participar. Quanto mais linhas, mais chances de sobreviver!",
              },
              {
                title: "Escolha por Rodada",
                description:
                  "A cada rodada do Brasileirão, você escolhe UM time que acredita que vai VENCER sua partida.",
              },
              {
                title: "Condição de Vitória",
                description:
                  "Se o time escolhido VENCER sua partida, você avança automaticamente para a próxima rodada.",
              },
              {
                title: "Condição de Eliminação",
                description:
                  "Se o time escolhido EMPATAR ou PERDER, você é ELIMINADO e perde a linha. Sem chances extras!",
              },
              {
                title: "Restrição Importante",
                description:
                  "Você NÃO PODE escolher o mesmo time duas vezes durante todo o campeonato. Escolha com sabedoria!",
              },
              {
                title: "Prêmio Final",
                description:
                  "O último jogador que sobreviver até o final leva TODO o prêmio acumulado (valor total menos taxa administrativa).",
              },
            ].map((rule, index) => (
              <Card
                key={index}
                className="bg-card border-primary/20 hover:border-primary/40 transition-all hover:translate-x-2"
              >
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{rule.title}</h3>
                      <p className="text-muted-foreground">
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
      <section className="py-24 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <TrendingUp className="w-20 h-20 mx-auto text-primary animate-bounce" />
            <h2 className="text-5xl md:text-6xl font-bold">Prêmio Atual</h2>
            <div className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              R$ 150.000
            </div>
            <p className="text-xl text-muted-foreground">
              O prêmio aumenta a cada nova linha comprada. Entre agora e aumente
              suas chances!
            </p>
            <Button
              variant="hero"
              size="lg"
              className="text-xl px-12 py-6 h-auto"
            >
              Participar Agora
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-card via-primary/5 to-card border-primary/30">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                Pronto Para o Desafio?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Cadastre-se agora e comece sua jornada rumo ao prêmio máximo.
                Teste sua sorte e conhecimento do futebol brasileiro!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/cadastro">
                  <Button variant="hero" size="lg" className="min-w-[200px]">
                    Criar Conta
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="min-w-[200px]">
                    Já Tenho Conta
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Brasileirão Survivor</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
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
            <p className="text-sm text-muted-foreground">
              © 2024 Brasileirão Survivor. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
