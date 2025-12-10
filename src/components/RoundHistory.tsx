import React from "react";
import {
  Calendar,
  Trophy,
  TrendingUp,
  CheckCircle,
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

  // Toggle expansão de uma rodada
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

  // Calcular estatísticas
  const stats = {
    total: selections.length,
    wins: selections.filter((s) => s.won === true).length,
    losses: selections.filter((s) => s.won === false).length,
    pending: selections.filter((s) => s.won === null).length,
  };

  // Renderizar cada rodada
  const renderRound = (round: number) => {
    const selection = selections.find((s) => s.round === round);
    const isExpanded = expandedRounds.has(round);
    const isCurrent = round === currentRound;
    const isPast = round < currentRound;
    const isFuture = round > currentRound;

    // Estilo do card baseado no status
    let cardStyle =
      "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";

    if (isCurrent) {
      cardStyle =
        "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700";
    } else if (selection?.won === false) {
      cardStyle =
        "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    } else if (selection?.won === true) {
      cardStyle =
        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    }

    return (
      <div
        key={round}
        className={`border rounded-lg overflow-hidden transition-all ${cardStyle}`}
      >
        {/* Header da rodada */}
        <button
          onClick={() => toggleRound(round)}
          className="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            {/* Badge da rodada */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                isCurrent
                  ? "bg-indigo-600 text-white"
                  : isPast
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              }`}
            >
              {round}
            </div>

            {/* Info da rodada */}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Rodada {round}
                </span>
                {isCurrent && (
                  <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                    Atual
                  </span>
                )}
              </div>
              {selection && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selection.teamName}
                </div>
              )}
              {!selection && isFuture && (
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  Ainda não disputada
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status badge */}
            {selection && <MatchResultBadge won={selection.won} size="md" />}

            {/* Ícone de expansão */}
            {isExpanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </div>
        </button>

        {/* Conteúdo expandido */}
        {isExpanded && selection && (
          <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
            {/* Time selecionado */}
            <div className="mt-3 flex items-center gap-2">
              <Trophy
                size={16}
                className="text-indigo-600 dark:text-indigo-400"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Time escolhido:
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {selection.teamName}
              </span>
            </div>

            {/* Data de seleção */}
            <div className="mt-2 flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Selecionado em{" "}
                {new Date(selection.selectedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Resultado da partida */}
            {selection.matchResult ? (
              <div className="mt-3 bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Resultado
                  </span>
                  {selection.won !== null && (
                    <span
                      className={`text-xs font-bold ${
                        selection.won
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {selection.won ? "✅ VITÓRIA" : "❌ DERROTA"}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selection.matchResult.homeTeam}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {selection.matchResult.homeScore}
                    </div>
                  </div>

                  <div className="px-4">
                    <div className="text-gray-400 font-bold">×</div>
                  </div>

                  <div className="flex-1 text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selection.matchResult.awayTeam}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {selection.matchResult.awayScore}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 flex items-center justify-center gap-2">
                <Clock size={16} className="text-gray-400 animate-pulse" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Aguardando resultado da partida
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header com estatísticas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp
              size={20}
              className="text-indigo-600 dark:text-indigo-400"
            />
            Histórico de Rodadas
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentRound} / {totalRounds}
          </span>
        </div>

        {/* Estatísticas em grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.total}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Rodadas
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.wins}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Vitórias
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.losses}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">
              Derrotas
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {stats.pending}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Pendentes
            </div>
          </div>
        </div>

        {/* Status de eliminação */}
        {isEliminated && eliminationRound && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
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
        {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) =>
          renderRound(round)
        )}
      </div>

      {/* Mensagem se não houver seleções */}
      {selections.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
          <Clock size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            Nenhuma seleção realizada ainda
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Aguardando o início do jogo
          </p>
        </div>
      )}
    </div>
  );
};

export default RoundHistory;
