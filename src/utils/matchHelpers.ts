import { Match } from "@/services/api";

/**
 * Formatar data de partida
 */
export function formatMatchDate(
  dateString: string,
  format: "full" | "short" | "time" = "full"
): string {
  const date = new Date(dateString);

  if (format === "full") {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (format === "short") {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  // time
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Obter status da partida em português
 */
export function getMatchStatusText(status: Match["status"]): string {
  const statusMap: Record<Match["status"], string> = {
    scheduled: "Agendada",
    live: "Ao Vivo",
    finished: "Encerrada",
    postponed: "Adiada",
    cancelled: "Cancelada",
  };

  return statusMap[status] || status;
}

/**
 * Obter cor do status
 */
export function getMatchStatusColor(status: Match["status"]): string {
  const colorMap: Record<Match["status"], string> = {
    scheduled: "text-muted-foreground",
    live: "text-red-500",
    finished: "text-green-500",
    postponed: "text-yellow-500",
    cancelled: "text-gray-500",
  };

  return colorMap[status] || "text-muted-foreground";
}

/**
 * Verificar se a partida está ao vivo
 */
export function isMatchLive(match: Match): boolean {
  return match.status === "live";
}

/**
 * Verificar se a partida está finalizada
 */
export function isMatchFinished(match: Match): boolean {
  return match.status === "finished";
}

/**
 * Verificar se a partida está agendada
 */
export function isMatchScheduled(match: Match): boolean {
  return match.status === "scheduled";
}

/**
 * Obter tempo decorrido da partida
 */
export function getMatchElapsed(match: Match): number | null {
  return match.statusDetail?.elapsed || null;
}

/**
 * Obter período da partida (1H, HT, 2H, etc)
 */
export function getMatchPeriod(match: Match): string {
  return match.statusDetail?.short || "";
}

/**
 * Obter texto do período em português
 */
export function getMatchPeriodText(period: string): string {
  const periodMap: Record<string, string> = {
    NS: "Não Iniciado",
    "1H": "1º Tempo",
    HT: "Intervalo",
    "2H": "2º Tempo",
    ET: "Prorrogação",
    P: "Pênaltis",
    FT: "Encerrado",
    AET: "Após Prorrogação",
    PEN: "Após Pênaltis",
    PST: "Adiado",
    CANC: "Cancelado",
  };

  return periodMap[period] || period;
}

/**
 * Obter placar da partida
 */
export function getMatchScore(match: Match): {
  home: number | null;
  away: number | null;
} {
  return {
    home: match.result.home,
    away: match.result.away,
  };
}

/**
 * Obter vencedor da partida
 */
export function getMatchWinner(match: Match): "home" | "away" | "draw" | null {
  return match.result.winner;
}

/**
 * Verificar se um time venceu
 */
export function didTeamWin(
  match: Match,
  teamId: number,
  isHome: boolean
): boolean | null {
  if (!isMatchFinished(match)) return null;

  const winner = getMatchWinner(match);
  if (winner === "draw") return false;
  if (winner === null) return null;

  return (isHome && winner === "home") || (!isHome && winner === "away");
}

/**
 * Formatar placar
 */
export function formatScore(home: number | null, away: number | null): string {
  if (home === null || away === null) return "- : -";
  return `${home} : ${away}`;
}

/**
 * Calcular tempo restante até a partida
 */
export function getTimeUntilMatch(dateString: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  formatted: string;
} {
  const matchDate = new Date(dateString);
  const now = new Date();
  const diff = matchDate.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      formatted: "Iniciada",
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let formatted = "";
  if (days > 0) {
    formatted = `${days}d ${hours}h`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formatted = `${minutes}m`;
  } else {
    formatted = `${seconds}s`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    total: diff,
    formatted,
  };
}

/**
 * Verificar se a partida começa em breve (menos de 1 hora)
 */
export function isMatchStartingSoon(
  dateString: string,
  thresholdMinutes = 60
): boolean {
  const { total } = getTimeUntilMatch(dateString);
  return total > 0 && total <= thresholdMinutes * 60 * 1000;
}

/**
 * Agrupar partidas por data
 */
export function groupMatchesByDate(matches: Match[]): Record<string, Match[]> {
  const grouped: Record<string, Match[]> = {};

  matches.forEach((match) => {
    const date = new Date(match.date);
    const dateKey = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }

    grouped[dateKey].push(match);
  });

  return grouped;
}

/**
 * Ordenar partidas por data
 */
export function sortMatchesByDate(
  matches: Match[],
  order: "asc" | "desc" = "asc"
): Match[] {
  return [...matches].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === "asc" ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Filtrar partidas por status
 */
export function filterMatchesByStatus(
  matches: Match[],
  status: Match["status"] | Match["status"][]
): Match[] {
  const statuses = Array.isArray(status) ? status : [status];
  return matches.filter((match) => statuses.includes(match.status));
}

/**
 * Obter próxima partida
 */
export function getNextMatch(matches: Match[]): Match | null {
  const scheduled = filterMatchesByStatus(matches, "scheduled");
  const sorted = sortMatchesByDate(scheduled, "asc");
  return sorted[0] || null;
}

/**
 * Obter última partida finalizada
 */
export function getLastFinishedMatch(matches: Match[]): Match | null {
  const finished = filterMatchesByStatus(matches, "finished");
  const sorted = sortMatchesByDate(finished, "desc");
  return sorted[0] || null;
}

/**
 * Calcular estatísticas das partidas
 */
export function calculateMatchStats(matches: Match[]) {
  const total = matches.length;
  const live = matches.filter((m) => m.status === "live").length;
  const finished = matches.filter((m) => m.status === "finished").length;
  const scheduled = matches.filter((m) => m.status === "scheduled").length;
  const postponed = matches.filter((m) => m.status === "postponed").length;

  const homeWins = matches.filter((m) => m.result.winner === "home").length;
  const awayWins = matches.filter((m) => m.result.winner === "away").length;
  const draws = matches.filter((m) => m.result.winner === "draw").length;

  return {
    total,
    live,
    finished,
    scheduled,
    postponed,
    homeWins,
    awayWins,
    draws,
    progress: total > 0 ? Math.round((finished / total) * 100) : 0,
  };
}
