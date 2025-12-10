import { useState, useEffect, useCallback, useRef } from "react";
import {
  getMatchesByRound,
  getTeamMatchInRound,
  checkRoundCompleted,
  getRoundStats,
  Match,
  didTeamWin,
} from "../services/matchResults.api";

interface UseMatchResultsOptions {
  roomId: string;
  league: string;
  currentRound: number;
  selectedTeamId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // em milissegundos
}

interface MatchResultsState {
  matches: Match[];
  teamMatch: Match | null;
  isRoundComplete: boolean;
  teamResult: boolean | null; // true = won, false = lost, null = pending
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
  refreshInterval = 60000, // 1 minuto por padrão
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

  /**
   * Busca dados da rodada atual
   */
  const fetchMatchResults = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Buscar todas as partidas da rodada
      const matches = await getMatchesByRound(league, currentRound);

      // Buscar partida do time selecionado (se houver)
      let teamMatch: Match | null = null;
      let teamResult: boolean | null = null;

      if (selectedTeamId) {
        teamMatch = await getTeamMatchInRound(
          league,
          currentRound,
          selectedTeamId
        );

        if (teamMatch) {
          teamResult = didTeamWin(teamMatch, selectedTeamId);
        }
      }

      // Verificar se a rodada foi completa
      const isRoundComplete = await checkRoundCompleted(league, currentRound);

      // Calcular estatísticas
      const stats = await getRoundStats(league, currentRound);

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
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Erro ao buscar resultados das partidas",
      }));
    }
  }, [league, currentRound, selectedTeamId]);

  /**
   * Configurar auto-refresh
   */
  useEffect(() => {
    // Buscar dados inicialmente
    fetchMatchResults();

    // Configurar polling se auto-refresh estiver habilitado
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchMatchResults();
      }, refreshInterval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchMatchResults, autoRefresh, refreshInterval]);

  /**
   * Forçar atualização manual
   */
  const refresh = useCallback(() => {
    fetchMatchResults();
  }, [fetchMatchResults]);

  /**
   * Parar auto-refresh
   */
  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Retomar auto-refresh
   */
  const startAutoRefresh = useCallback(() => {
    if (!intervalRef.current && autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchMatchResults();
      }, refreshInterval);
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
 * Hook simplificado para verificar apenas o status da rodada
 */
export const useRoundStatus = (
  league: string,
  round: number,
  autoRefresh = true,
  refreshInterval = 60000
) => {
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      const complete = await checkRoundCompleted(league, round);
      setIsComplete(complete);
    } catch (error) {
      console.error("Erro ao verificar status da rodada:", error);
    } finally {
      setLoading(false);
    }
  }, [league, round]);

  useEffect(() => {
    checkStatus();

    if (autoRefresh && !isComplete) {
      intervalRef.current = setInterval(checkStatus, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkStatus, autoRefresh, refreshInterval, isComplete]);

  return { isComplete, loading, refresh: checkStatus };
};

/**
 * Hook para monitorar mudanças de rodada
 */
export const useRoundChangeDetector = (
  currentRound: number,
  onRoundChange: (newRound: number) => void
) => {
  const previousRoundRef = useRef(currentRound);

  useEffect(() => {
    if (currentRound !== previousRoundRef.current) {
      onRoundChange(currentRound);
      previousRoundRef.current = currentRound;
    }
  }, [currentRound, onRoundChange]);
};

/**
 * Hook para verificar se o jogador foi eliminado
 */
export const useEliminationDetector = (
  isEliminated: boolean,
  onEliminated: () => void
) => {
  const wasEliminatedRef = useRef(isEliminated);

  useEffect(() => {
    if (isEliminated && !wasEliminatedRef.current) {
      onEliminated();
      wasEliminatedRef.current = true;
    }
  }, [isEliminated, onEliminated]);
};

/**
 * Hook completo para gerenciar sala ativa com todas as features
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
  // Resultados das partidas
  const matchResults = useMatchResults({
    roomId,
    league,
    currentRound,
    selectedTeamId,
    autoRefresh: !isEliminated, // Para de atualizar se eliminado
    refreshInterval: 60000, // 1 minuto
  });

  // Detectar mudança de rodada
  useRoundChangeDetector(currentRound, () => {
    console.log("🔄 Nova rodada detectada:", currentRound);
    matchResults.refresh();
  });

  // Detectar eliminação
  useEliminationDetector(isEliminated, () => {
    console.log("❌ Jogador eliminado!");
    matchResults.stopAutoRefresh();
    if (onEliminated) {
      onEliminated();
    }
  });

  // Detectar conclusão da rodada
  useEffect(() => {
    if (matchResults.isRoundComplete && onRoundComplete) {
      onRoundComplete();
    }
  }, [matchResults.isRoundComplete, onRoundComplete]);

  return {
    ...matchResults,
    // Flags úteis
    hasTeamResult: matchResults.teamResult !== null,
    isWinner: matchResults.teamResult === true,
    isLoser: matchResults.teamResult === false,
    shouldShowResults: matchResults.isRoundComplete,
  };
};

export default useMatchResults;
