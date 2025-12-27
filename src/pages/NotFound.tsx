import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4 py-8">
      <div className="text-center max-w-md w-full space-y-4 sm:space-y-6 md:space-y-8">
        {/* Icon */}
        <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl sm:blur-3xl rounded-full animate-pulse" />
            <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border-2 border-primary/20">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-primary" />
            </div>
          </div>
        </div>

        {/* 404 Title */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-none">
          404
        </h1>

        {/* Message */}
        <div className="space-y-2 sm:space-y-3 px-2">
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            Oops! Página não encontrada
          </p>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        {/* Return Button */}
        <div className="pt-2 sm:pt-4">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 sm:gap-2.5 md:gap-3 px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold bg-primary text-primary-foreground rounded-lg sm:rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-95 sm:hover:scale-105 transition-all duration-300 touch-manipulation"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span>Voltar ao Início</span>
          </a>
        </div>

        {/* Additional Info */}
        <div className="pt-4 sm:pt-6 md:pt-8 border-t border-border/30">
          <p className="text-[10px] sm:text-xs text-muted-foreground/70">
            Código do erro:{" "}
            <span className="font-mono text-primary">{location.pathname}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
