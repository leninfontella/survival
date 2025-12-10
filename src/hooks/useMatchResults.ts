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
  const emptyCountRef = useRef(0); // 🆕 Contador de tentativas vazias
  const isMountedRef = useRef(true); // 🆕 Controle de montagem

  /**
   * Busca dados da rodada atual
   */
  const fetchMatchResults = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // 🆕 Buscar partidas UMA VEZ
      const matches = await getMatchesByRound(league, currentRound);

      // Verificar se há partidas
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

        // 🆕 Retornar estado vazio sem fazer mais chamadas
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

      // 🆕 Calcular tudo localmente a partir das partidas já obtidas
      let teamMatch: Match | null = null;
      let teamResult: boolean | null = null;

      if (selectedTeamId) {
        // Encontrar partida do time nas partidas já obtidas
        teamMatch =
          matches.find(
            (m) =>
              m.homeTeamId === selectedTeamId || m.awayTeamId === selectedTeamId
          ) || null;

        if (teamMatch) {
          teamResult = didTeamWin(teamMatch, selectedTeamId);
        }
      }

      // 🆕 Verificar se rodada está completa (localmente)
      const isRoundComplete = matches.every(
        (match) =>
          match.status === "Match Finished" ||
          (match.homeScore !== null && match.awayScore !== null)
      );

      // 🆕 Calcular estatísticas (localmente)
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
   */
  useEffect(() => {
    isMountedRef.current = true;
    emptyCountRef.current = 0; // Reset contador

    // Buscar dados inicialmente
    fetchMatchResults();

    // Configurar polling se auto-refresh estiver habilitado
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        // 🆕 Não fazer polling se já tentou 3 vezes sem sucesso
        if (emptyCountRef.current >= 3) {
          console.log("⏹️ Polling já foi parado");
          return;
        }

        fetchMatchResults();
      }, refreshInterval);
    }

    // Cleanup
    return () => {
      isMountedRef.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchMatchResults, autoRefresh, refreshInterval]);

  /**
   * Forçar atualização manual
   */
  const refresh = useCallback(() => {
    emptyCountRef.current = 0; // 🆕 Reset contador ao forçar refresh
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
      emptyCountRef.current = 0; // 🆕 Reset contador ao retomar

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
  const isMountedRef = useRef(true);

  const checkStatus = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      const complete = await checkRoundCompleted(league, round);

      if (isMountedRef.current) {
        setIsComplete(complete);
      }
    } catch (error) {
      console.error("Erro ao verificar status da rodada:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [league, round]);

  useEffect(() => {
    isMountedRef.current = true;

    checkStatus();

    if (autoRefresh && !isComplete) {
      intervalRef.current = setInterval(checkStatus, refreshInterval);
    }

    return () => {
      isMountedRef.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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
      console.log(
        `🔄 Mudança de rodada detectada: ${previousRoundRef.current} → ${currentRound}`
      );
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
      console.log("❌ Eliminação detectada!");
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
    autoRefresh: !isEliminated, // 🆕 Para de atualizar se eliminado
    refreshInterval: 120000, // 🆕 2 minutos (aumentado de 1)
  });

  // Detectar mudança de rodada
  useRoundChangeDetector(currentRound, () => {
    console.log("🔄 Nova rodada detectada:", currentRound);
    matchResults.refresh();
  });

  // Detectar eliminação
  useEliminationDetector(isEliminated, () => {
    console.log("❌ Jogador eliminado - parando polling!");
    matchResults.stopAutoRefresh();
    if (onEliminated) {
      onEliminated();
    }
  });

  // Detectar conclusão da rodada
  useEffect(() => {
    if (matchResults.isRoundComplete && onRoundComplete) {
      console.log("✅ Rodada completa!");
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
