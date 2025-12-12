import React from "react";
import {
  Calendar,
  Trophy,
  TrendingUp,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { MatchResultBadge } from "./MatchResultIndicator";

interface Selection {
  teamId: string;
  teamName: string;
  round: number;
  won: boolean | null;
  selectedAt: string;
  matchResult?: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    verifiedAt?: string;
  };
}

interface RoundHistoryProps {
  selections: Selection[];
  currentRound: number;
  totalRounds: number;
  isEliminated?: boolean;
  eliminationRound?: number;
  className?: string;
}

export const RoundHistory: React.FC<RoundHistoryProps> = ({
  selections,
  currentRound,
  totalRounds,
  isEliminated = false,
  eliminationRound,
  className = "",
}) => {
  const [expandedRounds, setExpandedRounds] = React.useState<Set<number>>(
    new Set([currentRound])
  );

  const toggleRound = (round: number) => {
    setExpandedRounds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(round)) {
        newSet.delete(round);
      } else {
        newSet.add(round);
      }
      return newSet;
    });
  };

  // 🔥 FIX: Validar seleções e filtrar inválidas
  const validSelections = React.useMemo(() => {
    return selections.filter((s) => {
      // Validar campos obrigatórios
      if (!s.teamId || !s.teamName || !s.round) {
        console.warn("⚠️ Seleção inválida detectada:", s);
        return false;
      }
      return true;
    });
  }, [selections]);

  // 🔥 FIX: Calcular estatísticas apenas de seleções válidas
  const stats = React.useMemo(() => {
    return {
      total: validSelections.length,
      wins: validSelections.filter((s) => s.won === true).length,
      losses: validSelections.filter((s) => s.won === false).length,
      pending: validSelections.filter((s) => s.won === null).length,
    };
  }, [validSelections]);

  // 🔥 FIX: Determinar quais rodadas devem ser exibidas
  const roundsToShow = React.useMemo(() => {
    // Rodadas com seleções
    const roundsWithSelections = validSelections.map((s) => s.round);

    // Adicionar rodada atual se não estiver na lista
    if (!roundsWithSelections.includes(currentRound)) {
      roundsWithSelections.push(currentRound);
    }

    // Remover duplicatas e ordenar
    const uniqueRounds = Array.from(new Set(roundsWithSelections)).sort(
      (a, b) => a - b
    );

    // Limitar ao totalRounds
    return uniqueRounds.filter((r) => r <= totalRounds);
  }, [validSelections, currentRound, totalRounds]);

  // 🔥 FIX: Formatar data com segurança
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Data não disponível";

    try {
      const date = new Date(dateString);

      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }

      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };

  const renderRound = (round: number) => {
    const selection = validSelections.find((s) => s.round === round);
    const isExpanded = expandedRounds.has(round);
    const isCurrent = round === currentRound;
    const isFuture = round > currentRound;

    // 🔥 FIX: Estilo do card baseado no estado
    let cardStyle =
      "bg-black/60 backdrop-blur-lg border border-white/10 shadow-xl shadow-black/60";

    if (isCurrent) {
      cardStyle =
        "bg-primary/20 border-primary/40 shadow-primary/30 backdrop-blur-xl";
    } else if (selection?.won === false) {
      cardStyle =
        "bg-red-900/40 border-red-600/40 shadow-red-900/40 backdrop-blur-xl";
    } else if (selection?.won === true) {
      cardStyle =
        "bg-green-900/40 border-green-600/40 shadow-green-900/40 backdrop-blur-xl";
    }

    return (
      <div
        key={round}
        className={`rounded-xl overflow-hidden transition-all ${cardStyle}`}
      >
        <button
          onClick={() => toggleRound(round)}
          className="w-full px-4 py-4 flex items-center justify-between transition-all hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                ${
                  isCurrent
                    ? "bg-primary text-white shadow-lg shadow-primary/40"
                    : "bg-white/10 text-gray-300"
                }`}
            >
              {round}
            </div>

            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Rodada {round}</span>

                {isCurrent && (
                  <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                    Atual
                  </span>
                )}
              </div>

              {selection ? (
                <div className="text-sm text-gray-400">
                  {selection.teamName}
                </div>
              ) : isFuture ? (
                <div className="text-sm text-gray-500">Ainda não disputada</div>
              ) : (
                <div className="text-sm text-yellow-500">
                  Aguardando seleção
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selection && <MatchResultBadge won={selection.won} size="md" />}

            {isExpanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </div>
        </button>

        {/* 🔥 FIX: Só expandir se tiver seleção */}
        {isExpanded && selection && (
          <div className="px-4 pb-4 border-t border-white/10">
            {/* Time escolhido */}
            <div className="mt-3 flex items-center gap-2">
              <Trophy size={16} className="text-primary" />
              <span className="text-sm text-gray-400">Time escolhido:</span>
              <span className="text-sm font-bold text-white">
                {selection.teamName}
              </span>
            </div>

            {/* Data de seleção */}
            <div className="mt-2 flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <span className="text-xs text-gray-500">
                Selecionado em {formatDate(selection.selectedAt)}
              </span>
            </div>

            {/* Resultado da partida */}
            {selection.matchResult ? (
              <div className="mt-3 bg-black/50 backdrop-blur-xl rounded-lg p-3 border border-white/10 shadow-inner shadow-black/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase">
                    Resultado
                  </span>

                  {selection.won !== null && (
                    <span
                      className={`text-xs font-bold ${
                        selection.won ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {selection.won ? "VITÓRIA" : "DERROTA"}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <div className="text-sm font-medium text-white">
                      {selection.matchResult.homeTeam}
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {selection.matchResult.homeScore}
                    </div>
                  </div>

                  <div className="px-4">
                    <div className="text-gray-500 font-bold">×</div>
                  </div>

                  <div className="flex-1 text-center">
                    <div className="text-sm font-medium text-white">
                      {selection.matchResult.awayTeam}
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {selection.matchResult.awayScore}
                    </div>
                  </div>
                </div>

                {/* Data de verificação */}
                {selection.matchResult.verifiedAt && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-gray-500">
                      Verificado em{" "}
                      {formatDate(selection.matchResult.verifiedAt)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 bg-black/40 backdrop-blur-xl rounded-lg p-3 flex items-center justify-center gap-2 border border-white/10">
                <Clock size={16} className="text-gray-500 animate-pulse" />
                <span className="text-sm text-gray-400">
                  Aguardando resultado da partida
                </span>
              </div>
            )}
          </div>
        )}

        {/* 🔥 FIX: Mensagem quando não há seleção mas rodada está ativa */}
        {isExpanded && !selection && isCurrent && (
          <div className="px-4 pb-4 border-t border-white/10">
            <div className="mt-3 bg-yellow-500/10 backdrop-blur-xl rounded-lg p-3 flex items-center justify-center gap-2 border border-yellow-500/30">
              <Clock size={16} className="text-yellow-500" />
              <span className="text-sm text-yellow-500">
                Você ainda não selecionou um time para esta rodada
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Card de estatísticas */}
      <div className="bg-black/70 border border-white/10 rounded-xl p-4 backdrop-blur-xl shadow-xl shadow-black/60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Histórico de Rodadas
          </h3>

          <span className="text-sm text-gray-500">
            {currentRound} / {totalRounds}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-gray-400">Rodadas</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {stats.wins}
            </div>
            <div className="text-xs text-green-400">Vitórias</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {stats.losses}
            </div>
            <div className="text-xs text-red-400">Derrotas</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-300">
              {stats.pending}
            </div>
            <div className="text-xs text-gray-500">Pendentes</div>
          </div>
        </div>

        {/* 🔥 FIX: Mensagem de eliminação */}
        {isEliminated && eliminationRound && (
          <div className="mt-3 p-3 bg-red-900/40 border border-red-600/40 rounded-lg backdrop-blur-xl shadow-inner shadow-red-900/20">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle size={16} />
              <span className="text-sm font-semibold">
                Eliminado na Rodada {eliminationRound}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de rodadas */}
      <div className="space-y-2">
        {roundsToShow.length > 0 ? (
          roundsToShow.map((round) => renderRound(round))
        ) : (
          <div className="bg-black/70 border border-white/10 rounded-lg p-8 text-center backdrop-blur-xl shadow-xl shadow-black/60">
            <Clock size={48} className="mx-auto text-gray-500 mb-3" />
            <p className="text-gray-300">Nenhuma rodada jogada ainda</p>
            <p className="text-sm text-gray-500 mt-1">
              Aguardando o início do jogo
            </p>
          </div>
        )}
      </div>

      {/* 🔥 FIX: Debug info (remover em produção) */}
      {process.env.NODE_ENV === "development" && (
        <details className="bg-black/50 border border-white/10 rounded-lg p-4 text-xs text-gray-400">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 overflow-auto">
            {JSON.stringify(
              {
                totalSelections: selections.length,
                validSelections: validSelections.length,
                currentRound,
                totalRounds,
                roundsToShow,
                stats,
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
};

export default RoundHistory;
