import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.login({ email, password });

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao Brasileirão Survivor",
      });

      // Redireciona para a página principal ao invés do dashboard
      navigate("/");
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
                className="text-primary hover:text-glow transition-colors font-semibold"
              >
                Cadastre-se
              </Link>
            </p>
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
