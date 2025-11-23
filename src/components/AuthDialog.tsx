import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  Shield,
  Mail,
  Lock,
  User,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { authAPI } from "@/services/api";

// Validation schemas
const emailSchema = z
  .string()
  .trim()
  .email({ message: "Email inválido" })
  .max(255);
const passwordSchema = z
  .string()
  .min(6, { message: "A senha deve ter pelo menos 6 caracteres" })
  .max(100);
const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Nome não pode estar vazio" })
  .max(100);

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AuthDialog({ open, onOpenChange, onSuccess }: AuthDialogProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep === 1 && !name.trim()) {
      toast.error("Erro", {
        description: "Por favor, insira seu nome completo",
      });
      return;
    }

    // Validate name
    if (currentStep === 1) {
      const result = nameSchema.safeParse(name);
      if (!result.success) {
        toast.error("Erro", {
          description: result.error.errors[0].message,
        });
        return;
      }
    }

    if (currentStep === 2 && !email.trim()) {
      toast.error("Erro", {
        description: "Por favor, insira seu email",
      });
      return;
    }

    // Validate email
    if (currentStep === 2) {
      const result = emailSchema.safeParse(email);
      if (!result.success) {
        toast.error("Erro", {
          description: result.error.errors[0].message,
        });
        return;
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      // Validate login
      const emailResult = emailSchema.safeParse(email);
      const passwordResult = passwordSchema.safeParse(password);

      if (!emailResult.success) {
        toast.error("Erro", {
          description: emailResult.error.errors[0].message,
        });
        return;
      }
      if (!passwordResult.success) {
        toast.error("Erro", {
          description: passwordResult.error.errors[0].message,
        });
        return;
      }
    } else {
      // Validate signup
      if (password !== confirmPassword) {
        toast.error("Erro", {
          description: "As senhas não coincidem",
        });
        return;
      }

      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        toast.error("Erro", {
          description: passwordResult.error.errors[0].message,
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await authAPI.login({ email, password });

        toast.success("Login realizado com sucesso!", {
          description: "Bem-vindo de volta ao Brasileirão Survivor!",
        });
      } else {
        // Signup
        const response = await authAPI.signup({ name, email, password });

        toast.success("Cadastro realizado com sucesso!", {
          description: "Bem-vindo ao Brasileirão Survivor!",
        });
      }

      setLoading(false);
      setCurrentStep(1);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro na autenticação:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Ocorreu um erro. Tente novamente.";

      toast.error("Erro", {
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setCurrentStep(1);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] border-primary/30 bg-gradient-to-br from-card via-card/95 to-primary/5">
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center animate-scale-in">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-3xl text-center font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            {isLogin ? "Faça Login" : "Cadastre-se"}
          </DialogTitle>
          <DialogDescription className="text-center text-lg flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            <span className="font-semibold text-foreground">
              SOBREVIVA às 38 rodadas!
            </span>
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          </DialogDescription>

          {/* Progress Indicator - Only for Signup */}
          {!isLogin && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      step === currentStep
                        ? "w-12 bg-primary"
                        : step < currentStep
                        ? "w-8 bg-primary/50"
                        : "w-8 bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Etapa {currentStep} de {totalSteps}
              </p>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* LOGIN MODE */}
          {isLogin && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-foreground font-medium flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary/50 border-primary/20 focus:border-primary h-12"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-foreground font-medium flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-primary" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-secondary/50 border-primary/20 focus:border-primary h-12"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-[0_0_20px_rgba(10,125,74,0.3)] hover:shadow-[0_0_30px_rgba(10,125,74,0.5)] transition-all"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar Agora"}
              </Button>
            </div>
          )}

          {/* SIGNUP MODE - Multi-step */}
          {!isLogin && (
            <>
              {/* Step 1: Name */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-foreground font-medium flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-primary" />
                      Nome completo
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-secondary/50 border-primary/20 focus:border-primary h-12"
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full h-12 text-lg font-semibold"
                    size="lg"
                    disabled={loading}
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Step 2: Email */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-foreground font-medium flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-secondary/50 border-primary/20 focus:border-primary h-12"
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={handleBack}
                      variant="outline"
                      size="lg"
                      className="w-full h-12"
                      disabled={loading}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="w-full h-12"
                      size="lg"
                      disabled={loading}
                    >
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Password */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-foreground font-medium flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4 text-primary" />
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      className="bg-secondary/50 border-primary/20 focus:border-primary h-12"
                      autoFocus
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-foreground font-medium flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4 text-primary" />
                      Confirmar senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Digite a senha novamente"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      className="bg-secondary/50 border-primary/20 focus:border-primary h-12"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={handleBack}
                      variant="outline"
                      size="lg"
                      className="w-full h-12"
                      disabled={loading}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-[0_0_20px_rgba(10,125,74,0.3)] hover:shadow-[0_0_30px_rgba(10,125,74,0.5)] transition-all"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? "Criando conta..." : "Criar conta"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
            </p>
            <Button
              type="button"
              variant="link"
              className="text-primary hover:text-accent font-semibold"
              onClick={switchMode}
              disabled={loading}
            >
              {isLogin ? "Cadastre-se aqui" : "Faça login aqui"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
