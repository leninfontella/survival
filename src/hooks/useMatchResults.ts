import { useState, useEffect, useCallback, useRef } from "react";
import {
  getMatchesByRound,
  Match,
  didTeamWin,
} from "../services/matchResults.api";

interface UseMatchResultsOptions {
  roomId: string;
  league: string;
  currentRound: number;
  selectedTeamId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface MatchResultsState {
  matches: Match[];
  teamMatch: Match | null;
  isRoundComplete: boolean;
  teamResult: boolean | null;
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    finished: number;
    pending: number;
    percentComplete: number;
  };
}

/**
 * Hook para gerenciar estado e atualizações de resultados de partidas
 */
export const useMatchResults = ({
  roomId,
  league,
  currentRound,
  selectedTeamId,
  autoRefresh = true,
  refreshInterval = 120000, // 2 minutos
}: UseMatchResultsOptions) => {
  const [state, setState] = useState<MatchResultsState>({
    matches: [],
    teamMatch: null,
    isRoundComplete: false,
    teamResult: null,
    loading: true,
    error: null,
    stats: {
      total: 0,
      finished: 0,
      pending: 0,
      percentComplete: 0,
    },
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const emptyCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0); // 🆕 Timestamp da última busca

  /**
   * Busca dados da rodada atual
   */
  const fetchMatchResults = useCallback(async () => {
    if (!isMountedRef.current) return;

    // 🆕 Evitar múltiplas chamadas em sequência (debounce)
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) {
      console.log("⏭️ Pulando fetch - última busca foi há menos de 5s");
      return;
    }
    lastFetchRef.current = now;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const matches = await getMatchesByRound(league, currentRound);

      if (matches.length === 0) {
        emptyCountRef.current++;
        console.log(
          `⚠️ Nenhuma partida encontrada (tentativa ${emptyCountRef.current}/3)`
        );

        if (emptyCountRef.current >= 3) {
          console.log("⏹️ Parando polling - sem partidas após 3 tentativas");

          if (!isMountedRef.current) return;

          setState({
            matches: [],
            teamMatch: null,
            isRoundComplete: false,
            teamResult: null,
            loading: false,
            error: "Nenhuma partida disponível para esta rodada",
            stats: {
              total: 0,
              finished: 0,
              pending: 0,
              percentComplete: 0,
            },
          });

          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          return;
        }

        if (!isMountedRef.current) return;

        setState({
          matches: [],
          teamMatch: null,
          isRoundComplete: false,
          teamResult: null,
          loading: false,
          error: null,
          stats: {
            total: 0,
            finished: 0,
            pending: 0,
            percentComplete: 0,
          },
        });

        return;
      }

      // Reset contador se encontrou partidas
      emptyCountRef.current = 0;

      // Calcular tudo localmente
      let teamMatch: Match | null = null;
      let teamResult: boolean | null = null;

      if (selectedTeamId) {
        teamMatch =
          matches.find(
            (m) =>
              m.homeTeamId === selectedTeamId || m.awayTeamId === selectedTeamId
          ) || null;

        if (teamMatch) {
          teamResult = didTeamWin(teamMatch, selectedTeamId);
        }
      }

      const isRoundComplete = matches.every(
        (match) =>
          match.status === "Match Finished" ||
          (match.homeScore !== null && match.awayScore !== null)
      );

      const total = matches.length;
      const finished = matches.filter(
        (match) =>
          match.status === "Match Finished" ||
          (match.homeScore !== null && match.awayScore !== null)
      ).length;
      const pending = total - finished;
      const percentComplete =
        total > 0 ? Math.round((finished / total) * 100) : 0;

      const stats = {
        total,
        finished,
        pending,
        percentComplete,
      };

      if (!isMountedRef.current) return;

      setState({
        matches,
        teamMatch,
        isRoundComplete,
        teamResult,
        loading: false,
        error: null,
        stats,
      });
    } catch (error) {
      console.error("Erro ao buscar resultados:", error);

      if (!isMountedRef.current) return;

      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Erro ao buscar resultados das partidas",
      }));
    }
  }, [league, currentRound, selectedTeamId]);

  /**
   * Configurar auto-refresh
   * 🔥 FIX: Removido fetchMatchResults das dependencies para evitar loop
   */
  useEffect(() => {
    isMountedRef.current = true;
    emptyCountRef.current = 0;
    lastFetchRef.current = 0; // Reset timestamp

    // Buscar dados inicialmente
    fetchMatchResults();

    // Configurar polling se auto-refresh estiver habilitado
    if (autoRefresh) {
      console.log(`▶️ Polling iniciado: ${refreshInterval}ms`);

      intervalRef.current = setInterval(() => {
        if (emptyCountRef.current >= 3) {
          console.log("⏹️ Polling já foi parado");
          return;
        }

        fetchMatchResults();
      }, refreshInterval);
    }

    // Cleanup
    return () => {
      console.log("🧹 Cleanup useMatchResults");
      isMountedRef.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, league, currentRound]); // 🔥 FIX: SEM fetchMatchResults

  /**
   * Forçar atualização manual
   */
  const refresh = useCallback(() => {
    emptyCountRef.current = 0;
    lastFetchRef.current = 0; // Reset timestamp para permitir fetch imediato
    fetchMatchResults();
  }, [fetchMatchResults]);

  /**
   * Parar auto-refresh
   */
  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log("⏹️ Auto-refresh parado manualmente");
    }
  }, []);

  /**
   * Retomar auto-refresh
   */
  const startAutoRefresh = useCallback(() => {
    if (!intervalRef.current && autoRefresh && isMountedRef.current) {
      emptyCountRef.current = 0;
      lastFetchRef.current = 0;

      intervalRef.current = setInterval(() => {
        if (emptyCountRef.current >= 3) {
          console.log("⏹️ Polling já foi parado");
          return;
        }
        fetchMatchResults();
      }, refreshInterval);

      console.log("▶️ Auto-refresh retomado");
    }
  }, [autoRefresh, refreshInterval, fetchMatchResults]);

  return {
    ...state,
    refresh,
    stopAutoRefresh,
    startAutoRefresh,
  };
};

/**
 * Hook completo para gerenciar sala ativa
 * 🔥 FIX: refreshInterval aumentado para 2 minutos
 */
export const useActiveSurvivorRoom = ({
  roomId,
  league,
  currentRound,
  selectedTeamId,
  isEliminated,
  onRoundComplete,
  onEliminated,
}: {
  roomId: string;
  league: string;
  currentRound: number;
  selectedTeamId?: string;
  isEliminated: boolean;
  onRoundComplete?: () => void;
  onEliminated?: () => void;
}) => {
  const previousRoundRef = useRef(currentRound);
  const wasEliminatedRef = useRef(isEliminated);

  // Resultados das partidas
  const matchResults = useMatchResults({
    roomId,
    league,
    currentRound,
    selectedTeamId,
    autoRefresh: !isEliminated,
    refreshInterval: 120000, // 2 minutos
  });

  // Detectar mudança de rodada
  useEffect(() => {
    if (currentRound !== previousRoundRef.current) {
      console.log(
        `🔄 Mudança de rodada: ${previousRoundRef.current} → ${currentRound}`
      );
      matchResults.refresh();
      previousRoundRef.current = currentRound;
    }
  }, [currentRound, matchResults]);

  // Detectar eliminação
  useEffect(() => {
    if (isEliminated && !wasEliminatedRef.current) {
      console.log("❌ Eliminação detectada - parando polling!");
      matchResults.stopAutoRefresh();
      if (onEliminated) {
        onEliminated();
      }
      wasEliminatedRef.current = true;
    }
  }, [isEliminated, matchResults, onEliminated]);

  // Detectar conclusão da rodada
  useEffect(() => {
    if (matchResults.isRoundComplete && onRoundComplete) {
      console.log("✅ Rodada completa!");
      onRoundComplete();
    }
  }, [matchResults.isRoundComplete, onRoundComplete]);

  return {
    ...matchResults,
    hasTeamResult: matchResults.teamResult !== null,
    isWinner: matchResults.teamResult === true,
    isLoser: matchResults.teamResult === false,
    shouldShowResults: matchResults.isRoundComplete,
  };
};

export default useMatchResults;
