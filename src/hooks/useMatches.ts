import { useState, useEffect, useCallback, useRef } from "react";
import { matchAPI, Match } from "@/services/api";
import { toast } from "@/hooks/use-toast";

interface UseMatchesOptions {
  league: string;
  round: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // em segundos
  onMatchUpdate?: (matches: Match[]) => void;
}

interface UseMatchesReturn {
  matches: Match[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  liveCount: number;
  finishedCount: number;
  scheduledCount: number;
  refresh: () => Promise<void>;
  forceSync: () => Promise<void>;
}

export function useMatches({
  league,
  round,
  autoRefresh = true,
  refreshInterval = 30, // 30 segundos por padrão
  onMatchUpdate,
}: UseMatchesOptions): UseMatchesReturn {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Buscar partidas
  const fetchMatches = useCallback(
    async (forceSync = false) => {
      try {
        if (forceSync) {
          setIsRefreshing(true);
        } else if (matches.length === 0) {
          setIsLoading(true);
        }

        const response = await matchAPI.getByRound(league, round, forceSync);

        if (response.success && isMountedRef.current) {
          const fetchedMatches = response.data.matches;
          setMatches(fetchedMatches);
          setError(null);

          if (onMatchUpdate) {
            onMatchUpdate(fetchedMatches);
          }
        }
      } catch (err: any) {
        console.error("Erro ao buscar partidas:", err);
        if (isMountedRef.current) {
          setError(err.message || "Erro ao carregar partidas");
          toast({
            title: "Erro",
            description: "Não foi possível carregar as partidas.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [league, round, matches.length, onMatchUpdate]
  );

  // Refresh manual
  const refresh = useCallback(async () => {
    await fetchMatches(false);
  }, [fetchMatches]);

  // Force sync com API
  const forceSync = useCallback(async () => {
    await fetchMatches(true);
    toast({
      title: "Sincronizado!",
      description: "Partidas atualizadas com sucesso.",
    });
  }, [fetchMatches]);

  // Buscar inicial
  useEffect(() => {
    fetchMatches(false);
  }, [league, round]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    // Verificar se há partidas ao vivo
    const hasLiveMatches = matches.some((m) => m.status === "live");

    // Se tiver partidas ao vivo, atualizar mais rápido (15 segundos)
    const interval = hasLiveMatches ? 15000 : refreshInterval * 1000;

    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchMatches(false);
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, matches, fetchMatches]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Contadores
  const liveCount = matches.filter((m) => m.status === "live").length;
  const finishedCount = matches.filter((m) => m.status === "finished").length;
  const scheduledCount = matches.filter((m) => m.status === "scheduled").length;

  return {
    matches,
    isLoading,
    isRefreshing,
    error,
    liveCount,
    finishedCount,
    scheduledCount,
    refresh,
    forceSync,
  };
}

// Hook para buscar partidas ao vivo de uma liga
export function useLiveMatches(league: string, enabled = true) {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchLiveMatches = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      const response = await matchAPI.getLive(league);

      if (response.success && isMountedRef.current) {
        setLiveMatches(response.data.matches);
      }
    } catch (err) {
      console.error("Erro ao buscar partidas ao vivo:", err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [league, enabled]);

  useEffect(() => {
    if (!enabled) return;

    fetchLiveMatches();

    // Atualizar a cada 30 segundos
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchLiveMatches();
      }
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchLiveMatches, enabled]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    liveMatches,
    isLoading,
    count: liveMatches.length,
    refresh: fetchLiveMatches,
  };
}

// Hook para atualizar uma partida específica
export function useMatchUpdate(matchId: string | null) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateMatch = useCallback(async () => {
    if (!matchId) return null;

    try {
      setIsUpdating(true);
      const response = await matchAPI.updateResult(matchId);

      if (response.success) {
        toast({
          title: "Atualizado!",
          description: "Resultado da partida atualizado.",
        });
        return response.data;
      }
    } catch (err) {
      console.error("Erro ao atualizar partida:", err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a partida.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [matchId]);

  return { updateMatch, isUpdating };
}
