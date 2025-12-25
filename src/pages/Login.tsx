import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/services/api";
import { Lock, Loader2 } from "lucide-react";

interface LocationState {
  from?: string;
  message?: string;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as LocationState;
  const redirectPath = state?.from || "/";
  const blockMessage = state?.message;

  useEffect(() => {
    if (authAPI.isAuthenticated()) {
      console.log("✅ Já está logado, redirecionando para:", redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectPath]);

  useEffect(() => {
    if (blockMessage) {
      toast({
        title: "Acesso Restrito",
        description: blockMessage,
        variant: "destructive",
      });
    }
  }, [blockMessage, toast]);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/");
      }
    };

    window.addEventListener("keydown", handleEscKey);

    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.login({ email, password });

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao Brasileirão Survivor",
      });

      // Manter loading por 5 segundos antes de redirecionar
      setTimeout(() => {
        console.log("✅ Redirecionando para:", redirectPath);
        navigate(redirectPath, { replace: true });
      }, 3000);
    } catch (error: unknown) {
      console.error("Erro ao fazer login:", error);

      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Erro ao fazer login",
        description:
          axiosError.response?.data?.message ||
          "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Loading Overlay
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-accent/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(10,125,74,0.1),transparent_50%)]" />

        <div className="relative z-10 flex flex-col items-center justify-center space-y-6 px-4">
          <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-primary animate-spin" />
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Fazendo o seu login...
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Aguarde!
            </p>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(10,125,74,0.1),transparent_50%)]" />

      <div className="w-full max-w-md relative">
        <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-[0_0_50px_rgba(10,125,74,0.2)]">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-glow mb-2">
              Login
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Entre para continuar jogando
            </p>
          </div>

          {/* Alerta de sala privada ou acesso bloqueado */}
          {blockMessage && (
            <Alert className="mb-4 sm:mb-6 border-amber-500/50 bg-amber-500/10">
              <Lock className="h-4 w-4 text-amber-500 shrink-0" />
              <AlertDescription className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                <strong className="block mb-1">
                  {redirectPath.includes("/join-room")
                    ? "🔒 Sala Privada Detectada!"
                    : "⚠️ Acesso Restrito"}
                </strong>
                <span className="text-xs sm:text-sm">{blockMessage}</span>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 border-primary/30 focus:border-primary text-sm sm:text-base h-10 sm:h-11"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 border-primary/30 focus:border-primary text-sm sm:text-base h-10 sm:h-11"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full text-sm sm:text-base h-10 sm:h-11"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-5 sm:mt-6 text-center space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link
                to="/cadastro"
                state={{ from: redirectPath }}
                className="text-primary hover:text-glow transition-colors font-semibold"
              >
                Cadastre-se
              </Link>
            </p>

            {/* Mostrar rota de redirecionamento se não for dashboard */}
            {redirectPath !== "/" && redirectPath !== "/" && (
              <div className="pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1.5">
                  📍 Você será redirecionado para:
                </p>
                <code className="block text-xs bg-muted px-2.5 sm:px-3 py-1.5 sm:py-2 rounded text-primary font-mono break-all">
                  {redirectPath}
                </code>
              </div>
            )}

            <Link
              to="/"
              className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors block pt-2"
            >
              ← Voltar para home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
