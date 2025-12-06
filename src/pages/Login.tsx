import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/services/api";
import { Lock, AlertCircle } from "lucide-react";

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

  // Pegar informações do estado (de onde veio)
  const state = location.state as LocationState;
  const redirectPath = state?.from || "/dashboard";
  const blockMessage = state?.message;

  // Se já estiver logado, redirecionar
  useEffect(() => {
    if (authAPI.isAuthenticated()) {
      console.log("✅ Já está logado, redirecionando para:", redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectPath]);

  // Mostrar mensagem de bloqueio se existir
  useEffect(() => {
    if (blockMessage) {
      toast({
        title: "Acesso Restrito",
        description: blockMessage,
        variant: "destructive",
      });
    }
  }, [blockMessage, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.login({ email, password });

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao Brasileirão Survivor",
      });

      // Pequeno delay para garantir que o token foi salvo
      setTimeout(() => {
        console.log("✅ Redirecionando para:", redirectPath);
        navigate(redirectPath, { replace: true });
      }, 100);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(10,125,74,0.1),transparent_50%)]" />

      <div className="w-full max-w-md relative">
        <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(10,125,74,0.2)]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-glow mb-2">Login</h1>
            <p className="text-muted-foreground">
              Entre para continuar jogando
            </p>
          </div>

          {/* Alerta de sala privada ou acesso bloqueado */}
          {blockMessage && (
            <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
              <Lock className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                <strong>
                  {redirectPath.includes("/join-room")
                    ? "🔒 Sala Privada Detectada!"
                    : "⚠️ Acesso Restrito"}
                </strong>
                <br />
                {blockMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 border-primary/30 focus:border-primary"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 border-primary/30 focus:border-primary"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link
                to="/cadastro"
                state={{ from: redirectPath }} // Passar o redirect para o cadastro também
                className="text-primary hover:text-glow transition-colors font-semibold"
              >
                Cadastre-se
              </Link>
            </p>

            {/* Mostrar rota de redirecionamento se não for dashboard */}
            {redirectPath !== "/dashboard" && redirectPath !== "/" && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  📍 Você será redirecionado para:
                </p>
                <code className="block mt-1 text-xs bg-muted px-3 py-2 rounded text-primary font-mono">
                  {redirectPath}
                </code>
              </div>
            )}

            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors block"
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
