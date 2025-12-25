import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, X, Trophy, Target, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { authAPI } from "@/services/api";

export const Navbar = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = () => {
      try {
        const isAuth = authAPI.isAuthenticated();
        if (isAuth) {
          const user = authAPI.getCurrentUser();
          setUserName(user?.name || "Usuário");
        } else {
          setUserName(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const handleStorageChange = () => {
      checkUser();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    setUserName(null);
    setIsDrawerOpen(false);
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-primary/20 shadow-lg"
      >
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <motion.h1
                className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                Sobrevivente
              </motion.h1>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              {userName ? (
                <>
                  {/* Desktop User Info */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="hidden md:flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg border border-primary/20"
                  >
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                      {userName}
                    </span>
                  </motion.div>

                  {/* Mobile Menu Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDrawerOpen(true)}
                    className="border-primary/30 hover:border-primary hover:bg-primary/10 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                  >
                    <Menu className="w-4 h-4 sm:hidden" />
                    <Settings className="w-4 h-4 hidden sm:block" />
                  </Button>

                  {/* Desktop Logout */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="hidden sm:flex gap-2 border-primary/30 hover:border-primary hover:bg-primary/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Sair</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/login")}
                    className="border-primary/30 hover:border-primary hover:bg-primary/10 text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3"
                  >
                    Entrar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate("/cadastro")}
                    className="bg-primary hover:bg-primary/90 text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3"
                  >
                    Criar Conta
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Drawer Lateral */}
      <AnimatePresence>
        {userName && isDrawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setIsDrawerOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed right-0 top-0 h-full w-[85vw] sm:w-80 max-w-sm bg-card border-l border-border z-[70] shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                  <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span className="truncate">Configurações</span>
                  </h2>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Info Mobile */}
                <div className="md:hidden px-4 py-3 bg-secondary/30 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Usuário ativo
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <div className="space-y-2 sm:space-y-3">
                    {/* Perfil */}
                    <button
                      onClick={() => handleNavigation("/profile")}
                      className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base">
                          Meu Perfil
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          Editar informações pessoais
                        </p>
                      </div>
                    </button>

                    {/* Dashboard */}
                    <button
                      onClick={() => handleNavigation("/dashboard")}
                      className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base">
                          Minhas Salas
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          Ver salas e competições
                        </p>
                      </div>
                    </button>

                    {/* Criar Sala */}
                    <button
                      onClick={() => handleNavigation("/admin/create-room")}
                      className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base">
                          Criar Sala
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          Iniciar nova competição
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-border">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors font-semibold text-sm sm:text-base"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    Sair da Conta
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
