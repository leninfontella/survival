import { Navigate, useLocation } from "react-router-dom";
import { authAPI } from "@/services/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const isAuthenticated = authAPI.isAuthenticated();

  if (!isAuthenticated) {
    // Salvar a rota que o usuário tentou acessar para redirect após login
    const intendedPath = location.pathname + location.search;

    console.log("🚫 Acesso bloqueado - Redirecionando para login");
    console.log("📍 Rota pretendida:", intendedPath);

    // Redirecionar para login passando a rota de origem
    return (
      <Navigate
        to="/login"
        state={{
          from: intendedPath,
          message: "Você precisa fazer login para acessar esta página.",
        }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
