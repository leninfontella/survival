import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Trophy, Circle } from "lucide-react";
import { Match } from "@/services/api";

interface MatchCardProps {
  match: Match & {
    homeTeam: {
      apiTeamId: number;
      name: string;
      logo: string;
      canSelect?: boolean;
      used?: boolean;
    };
    awayTeam: {
      apiTeamId: number;
      name: string;
      logo: string;
      canSelect?: boolean;
      used?: boolean;
    };
    hasAvailableTeam?: boolean;
  };
  onSelectTeam?: (teamId: number, teamName: string, isHome: boolean) => void;
  selectedTeamId?: number | null;
  compact?: boolean;
}

export function MatchCard({
  match,
  onSelectTeam,
  selectedTeamId,
  compact = false,
}: MatchCardProps) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusBadge = () => {
    if (isLive) {
      return (
        <Badge variant="destructive" className="animate-pulse">
          <Circle className="w-2 h-2 mr-1 fill-current" />
          AO VIVO
        </Badge>
      );
    }
    if (isFinished) {
      return <Badge variant="secondary">ENCERRADO</Badge>;
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Clock className="w-3 h-3 mr-1" />
        {formatDate(match.date)}
      </Badge>
    );
  };

  const renderTeam = (
    team: typeof match.homeTeam,
    isHome: boolean,
    goals?: number | null
  ) => {
    const isSelected = selectedTeamId === team.apiTeamId;
    const canSelect = team.canSelect && onSelectTeam;
    const isUsed = team.used;

    return (
      <motion.button
        onClick={() =>
          canSelect && onSelectTeam(team.apiTeamId, team.name, isHome)
        }
        disabled={!canSelect || isUsed}
        whileHover={canSelect ? { scale: 1.03 } : {}}
        whileTap={canSelect ? { scale: 0.98 } : {}}
        className={`
          flex flex-col items-center gap-2 p-3 rounded-lg transition-all
          ${compact ? "flex-1" : "flex-1"}
          ${
            canSelect && !isUsed
              ? "cursor-pointer hover:bg-primary/10"
              : "cursor-default"
          }
          ${isSelected ? "bg-primary/20 ring-2 ring-primary" : ""}
          ${isUsed ? "opacity-40" : ""}
        `}
      >
        <div className="relative">
          <div
            className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${
              isSelected ? "bg-primary/20 ring-2 ring-primary" : "bg-background"
            }
          `}
          >
            <img
              src={team.logo}
              alt={team.name}
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.currentTarget.src = `https://via.placeholder.com/40?text=${team.name.charAt(
                  0
                )}`;
              }}
            />
          </div>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
            >
              <Trophy className="w-3 h-3 text-primary-foreground" />
            </motion.div>
          )}
        </div>

        <div className="text-center">
          <p
            className={`
            font-semibold text-sm
            ${isSelected ? "text-primary" : "text-foreground"}
          `}
          >
            {team.name}
          </p>
          {isUsed && (
            <Badge variant="destructive" className="text-xs mt-1">
              Usado
            </Badge>
          )}
        </div>

        {(isLive || isFinished) && goals !== null && goals !== undefined && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
              text-3xl font-bold
              ${
                isFinished && match.result.winner === (isHome ? "home" : "away")
                  ? "text-primary"
                  : ""
              }
            `}
          >
            {goals}
          </motion.div>
        )}
      </motion.button>
    );
  };

  return (
    <Card
      className={`
        overflow-hidden transition-all
        ${isLive ? "border-red-500 shadow-lg shadow-red-500/20" : ""}
        ${match.hasAvailableTeam === false ? "opacity-60" : ""}
        ${compact ? "hover:shadow-md" : "hover:shadow-xl"}
      `}
    >
      <CardContent className="p-4">
        {/* Header com Status */}
        <div className="flex items-center justify-between mb-4">
          {getStatusBadge()}

          {match.venue && !compact && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{match.venue.name}</span>
            </div>
          )}
        </div>

        {/* Times e Placar */}
        <div className="flex items-center justify-between gap-4">
          {/* Time da Casa */}
          {renderTeam(
            match.homeTeam,
            true,
            isLive || isFinished ? match.result.home : null
          )}

          {/* VS ou Placar ao Vivo */}
          <div className="flex flex-col items-center gap-1">
            {isScheduled ? (
              <span className="text-2xl font-bold text-muted-foreground">
                VS
              </span>
            ) : (
              <span className="text-4xl font-black text-primary">:</span>
            )}
            {isLive && match.statusDetail?.elapsed && (
              <Badge variant="outline" className="text-xs">
                {match.statusDetail.elapsed}'
              </Badge>
            )}
          </div>

          {/* Time Visitante */}
          {renderTeam(
            match.awayTeam,
            false,
            isLive || isFinished ? match.result.away : null
          )}
        </div>

        {/* Informações Adicionais */}
        {isFinished && match.result.winner && !compact && (
          <div className="mt-3 pt-3 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Vencedor:{" "}
              <span className="font-bold text-primary">
                {match.result.winner === "home"
                  ? match.homeTeam.name
                  : match.result.winner === "away"
                  ? match.awayTeam.name
                  : "Empate"}
              </span>
            </p>
          </div>
        )}

        {/* Aviso de Times Indisponíveis */}
        {match.hasAvailableTeam === false && !compact && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-center text-muted-foreground">
              ⚠️ Você já usou ambos os times desta partida
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
