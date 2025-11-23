import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/contexts/game";
import { SplashScreen } from "@/components/SplashScreen";
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
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin/create-room" element={<AdminCreateRoom />} />
              <Route path="/join-room/:roomId" element={<JoinRoom />} />
              <Route path="/room" element={<Room />} />
              <Route path="/room/select-team" element={<SelectTeam />} />
              <Route path="/survival-room" element={<SurvivalRoom />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </GameProvider>
    </QueryClientProvider>
  );
};

export default App;
