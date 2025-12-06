import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GameProvider } from "@/contexts/game";
import { SplashScreen } from "@/components/SplashScreen";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminCreateRoom from "./pages/AdminCreateRoom";
import JoinRoom from "./pages/JoinRoom";
import Room from "./pages/Room";
import SelectTeam from "./pages/SelectTeam";
import SurvivalRoom from "./pages/SurvivalRoom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* ✅ ROTAS PÚBLICAS - Apenas Login, Signup e Index */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Signup />} />

              {/* 🔒 ROTAS PROTEGIDAS - Todas as outras rotas */}

              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Criar Sala */}
              <Route
                path="/admin/create-room"
                element={
                  <ProtectedRoute>
                    <AdminCreateRoom />
                  </ProtectedRoute>
                }
              />

              {/* 🚨 ROTAS DE SALA - TOTALMENTE PROTEGIDAS */}
              <Route
                path="/join-room/:roomId"
                element={
                  <ProtectedRoute>
                    <JoinRoom />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/room/select-team/:roomId"
                element={
                  <ProtectedRoute>
                    <SelectTeam />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/survival-room/:roomId"
                element={
                  <ProtectedRoute>
                    <SurvivalRoom />
                  </ProtectedRoute>
                }
              />

              {/* Rotas antigas (manter para compatibilidade) */}
              <Route
                path="/room"
                element={
                  <ProtectedRoute>
                    <Room />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/room/select-team"
                element={
                  <ProtectedRoute>
                    <SelectTeam />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/survival-room"
                element={
                  <ProtectedRoute>
                    <SurvivalRoom />
                  </ProtectedRoute>
                }
              />

              {/* 404 - SEMPRE POR ÚLTIMO */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </GameProvider>
    </QueryClientProvider>
  );
};

export default App;
