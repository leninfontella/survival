import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { authAPI } from "@/services/api";

const Signup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalSteps = 3;

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

  const handleNext = () => {
    if (currentStep === 1 && !name.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira seu nome completo",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 2 && !email.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira seu email",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentStep < totalSteps && !isLoading) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.signup({ name, email, password });

      toast({
        title: "Cadastro realizado!",
        description: "Bem-vindo ao Brasileirão Survivor",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Erro no cadastro:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao criar conta. Tente novamente.";

      toast({
        title: "Erro ao criar conta",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(10,125,74,0.1),transparent_50%)]" />

      <div className="w-full max-w-md relative">
        <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-[0_0_50px_rgba(10,125,74,0.2)]">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-glow mb-2">
              Cadastro
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Crie sua conta e comece a jogar
            </p>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                    step === currentStep
                      ? "w-10 sm:w-12 bg-primary"
                      : step < currentStep
                      ? "w-6 sm:w-8 bg-primary/50"
                      : "w-6 sm:w-8 bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Etapa {currentStep} de {totalSteps}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Step 1: Nome */}
            {currentStep === 1 && (
              <div className="space-y-3 sm:space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">
                    Nome completo
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-background/50 border-primary/30 focus:border-primary text-sm sm:text-base h-10 sm:h-11"
                    autoFocus
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full text-sm sm:text-base h-10 sm:h-11"
                  size="lg"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Email */}
            {currentStep === 2 && (
              <div className="space-y-3 sm:space-y-4 animate-fade-in">
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
                    onKeyPress={handleKeyPress}
                    className="bg-background/50 border-primary/30 focus:border-primary text-sm sm:text-base h-10 sm:h-11"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    size="lg"
                    className="w-full text-sm sm:text-base h-10 sm:h-11"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Voltar</span>
                    <span className="sm:hidden">Voltar</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full text-sm sm:text-base h-10 sm:h-11"
                    size="lg"
                  >
                    <span className="hidden sm:inline">Próximo</span>
                    <span className="sm:hidden">Avançar</span>
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Senha */}
            {currentStep === 3 && (
              <div className="space-y-3 sm:space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm sm:text-base">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    className="bg-background/50 border-primary/30 focus:border-primary text-sm sm:text-base h-10 sm:h-11"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm sm:text-base"
                  >
                    Confirmar senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    className="bg-background/50 border-primary/30 focus:border-primary text-sm sm:text-base h-10 sm:h-11"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    size="lg"
                    className="w-full text-sm sm:text-base h-10 sm:h-11"
                    disabled={isLoading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Voltar</span>
                    <span className="sm:hidden">Voltar</span>
                  </Button>
                  <Button
                    type="submit"
                    className="w-full text-sm sm:text-base h-10 sm:h-11"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="hidden sm:inline">Criando conta...</span>
                    ) : (
                      <span className="hidden sm:inline">Criar conta</span>
                    )}
                    {isLoading ? (
                      <span className="sm:hidden">Criando...</span>
                    ) : (
                      <span className="sm:hidden">Criar</span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-5 sm:mt-6 text-center space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="text-primary hover:text-glow transition-colors font-semibold"
              >
                Faça login
              </Link>
            </p>
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

export default Signup;
