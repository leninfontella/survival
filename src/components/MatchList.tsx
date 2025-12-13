import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Filter,
  Calendar,
  Trophy,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Match } from "@/services/api";
import { MatchCard } from "@/components/MatchCard";
import {
  LiveMatchIndicator,
  LiveMatchCounter,
} from "@/components/LiveMatchIndicator";
import {
  groupMatchesByDate,
  filterMatchesByStatus,
  calculateMatchStats,
} from "@/utils/matchHelpers";

interface MatchListProps {
  matches: Match[];
  onSelectTeam?: (
    teamId: number,
    teamName: string,
    matchId: string,
    isHome: boolean
  ) => void;
  selectedTeamId?: number | null;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  showFilters?: boolean;
  compact?: boolean;
  title?: string;
}

export function MatchList({
  matches,
  onSelectTeam,
  selectedTeamId,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  showFilters = true,
  compact = false,
  title = "Partidas da Rodada",
}: MatchListProps) {
  const [activeFilter, setActiveFilter] = useState<
    "all" | "scheduled" | "live" | "finished"
  >("all");
  const [groupByDate, setGroupByDate] = useState(false);

  const stats = calculateMatchStats(matches);

  // Filtrar partidas
  const filteredMatches =
    activeFilter === "all"
      ? matches
      : filterMatchesByStatus(matches, activeFilter);

  // Agrupar por data se ativado
  const groupedMatches = groupByDate
    ? groupMatchesByDate(filteredMatches)
    : null;

  const handleSelectTeam = (
    teamId: number,
    teamName: string,
    matchId: string,
    isHome: boolean
  ) => {
    if (onSelectTeam) {
      onSelectTeam(teamId, teamName, matchId, isHome);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando partidas...</p>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-semibold mb-2">
            Nenhuma partida disponível
          </p>
          <p className="text-sm text-muted-foreground">
            As partidas desta rodada ainda não foram carregadas.
          </p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl">{title}</CardTitle>
            {stats.live > 0 && (
              <LiveMatchIndicator count={stats.live} showCount />
            )}
          </div>

          <div className="flex items-center gap-2">
            {stats.live > 0 && (
              <LiveMatchCounter
                liveCount={stats.live}
                totalCount={stats.total}
              />
            )}

            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                {isRefreshing ? "Atualizando..." : "Atualizar"}
              </Button>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Total: {stats.total}
          </Badge>
          {stats.scheduled > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Agendadas: {stats.scheduled}
            </Badge>
          )}
          {stats.live > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              Ao Vivo: {stats.live}
            </Badge>
          )}
          {stats.finished > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Finalizadas: {stats.finished}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Filtros */}
        {showFilters && (
          <Tabs
            value={activeFilter}
            onValueChange={(v) => setActiveFilter(v as any)}
            className="mb-6"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Todas
                <Badge variant="secondary" className="ml-2">
                  {stats.total}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                Agendadas
                <Badge variant="secondary" className="ml-2">
                  {stats.scheduled}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="live" disabled={stats.live === 0}>
                Ao Vivo
                {stats.live > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {stats.live}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="finished" disabled={stats.finished === 0}>
                Finalizadas
                <Badge variant="secondary" className="ml-2">
                  {stats.finished}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Lista de Partidas */}
        {groupedMatches ? (
          // Agrupado por data
          <div className="space-y-6">
            {Object.entries(groupedMatches).map(([date, dateMatches]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {date}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dateMatches.map((match, index) => (
                    <motion.div
                      key={match._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <MatchCard
                        match={match as any}
                        onSelectTeam={(teamId, teamName, isHome) =>
                          handleSelectTeam(teamId, teamName, match._id, isHome)
                        }
                        selectedTeamId={selectedTeamId}
                        compact={compact}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Lista simples
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredMatches.map((match, index) => (
                <motion.div
                  key={match._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <MatchCard
                    match={match as any}
                    onSelectTeam={(teamId, teamName, isHome) =>
                      handleSelectTeam(teamId, teamName, match._id, isHome)
                    }
                    selectedTeamId={selectedTeamId}
                    compact={compact}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredMatches.length === 0 && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-semibold mb-2">
              Nenhuma partida{" "}
              {activeFilter !== "all" && getFilterText(activeFilter)}
            </p>
            <Button
              onClick={() => setActiveFilter("all")}
              variant="outline"
              className="mt-4"
            >
              Ver Todas as Partidas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getFilterText(filter: string): string {
  const texts: Record<string, string> = {
    scheduled: "agendada",
    live: "ao vivo",
    finished: "finalizada",
  };
  return texts[filter] || "";
}
