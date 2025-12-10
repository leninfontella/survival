import React from "react";
import { CheckCircle, XCircle, Clock, Trophy, Minus } from "lucide-react";

interface MatchResultIndicatorProps {
  won: boolean | null;
  teamName: string;
  round: number;
  matchResult?: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
  };
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  className?: string;
}

export const MatchResultIndicator: React.FC<MatchResultIndicatorProps> = ({
  won,
  teamName,
  round,
  matchResult,
  size = "md",
  showDetails = true,
  className = "",
}) => {
  // Tamanhos dos ícones
  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const iconSize = iconSizes[size];

  // Renderizar indicador baseado no resultado
  const renderIndicator = () => {
    // Aguardando resultado
    if (won === null) {
      return (
        <div
          className={`flex items-center gap-2 text-gray-600 dark:text-gray-400 ${className}`}
        >
          <Clock size={iconSize} className="animate-pulse" />
          {showDetails && (
            <div className="flex flex-col">
              <span className="font-medium text-sm">Aguardando resultado</span>
              <span className="text-xs opacity-75">{teamName}</span>
            </div>
          )}
        </div>
      );
    }

    // Vitória
    if (won) {
      return (
        <div
          className={`flex items-center gap-2 text-green-600 dark:text-green-400 ${className}`}
        >
          <CheckCircle size={iconSize} className="animate-bounce" />
          {showDetails && (
            <div className="flex flex-col">
              <span className="font-bold text-sm">✅ SOBREVIVEU!</span>
              <span className="text-xs opacity-75">{teamName} venceu</span>
            </div>
          )}
        </div>
      );
    }

    // Derrota/Empate
    return (
      <div
        className={`flex items-center gap-2 text-red-600 dark:text-red-400 ${className}`}
      >
        <XCircle size={iconSize} />
        {showDetails && (
          <div className="flex flex-col">
            <span className="font-bold text-sm">❌ ELIMINADO</span>
            <span className="text-xs opacity-75">
              {teamName} perdeu/empatou
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Indicador principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded">
            Rodada {round}
          </span>
          {renderIndicator()}
        </div>
      </div>

      {/* Detalhes da partida */}
      {showDetails && matchResult && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {matchResult.homeTeam}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Mandante
              </div>
            </div>

            <div className="flex items-center gap-3 px-4">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {matchResult.homeScore}
              </span>
              <Minus size={16} className="text-gray-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {matchResult.awayScore}
              </span>
            </div>

            <div className="flex-1 text-right">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {matchResult.awayTeam}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Visitante
              </div>
            </div>
          </div>

          {/* Destaque do time selecionado */}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 text-xs">
              <Trophy
                size={14}
                className="text-indigo-600 dark:text-indigo-400"
              />
              <span className="text-gray-600 dark:text-gray-300">
                Você escolheu:{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {teamName}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente compacto para listas
export const MatchResultBadge: React.FC<{
  won: boolean | null;
  size?: "sm" | "md";
}> = ({ won, size = "sm" }) => {
  const baseClasses = size === "sm" ? "w-5 h-5" : "w-6 h-6";

  if (won === null) {
    return (
      <div
        className={`${baseClasses} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}
      >
        <Clock size={size === "sm" ? 12 : 16} className="text-gray-500" />
      </div>
    );
  }

  if (won) {
    return (
      <div
        className={`${baseClasses} rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center`}
      >
        <CheckCircle
          size={size === "sm" ? 12 : 16}
          className="text-green-600 dark:text-green-400"
        />
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center`}
    >
      <XCircle
        size={size === "sm" ? 12 : 16}
        className="text-red-600 dark:text-red-400"
      />
    </div>
  );
};

// Componente de estatísticas rápidas
export const MatchResultStats: React.FC<{
  total: number;
  wins: number;
  losses: number;
  pending: number;
}> = ({ total, wins, losses, pending }) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {total}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center border border-green-200 dark:border-green-800">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {wins}
        </div>
        <div className="text-xs text-green-600 dark:text-green-400">
          Vitórias
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center border border-red-200 dark:border-red-800">
        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
          {losses}
        </div>
        <div className="text-xs text-red-600 dark:text-red-400">Derrotas</div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
          {pending}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Pendentes
        </div>
      </div>
    </div>
  );
};

export default MatchResultIndicator;
