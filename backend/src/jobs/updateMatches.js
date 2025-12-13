const cron = require("node-cron");
const Match = require("../models/Match");
const footballAPIService = require("../services/footballAPIService");

class MatchUpdater {
  constructor() {
    this.isRunning = false;
    this.updateInterval = null;
  }

  /**
   * Iniciar jobs de atualização
   */
  start() {
    console.log("⚽ Iniciando jobs de atualização de partidas...");

    // Job 1: Atualizar partidas ao vivo a cada 1 minuto
    this.startLiveMatchesUpdate();

    // Job 2: Sincronizar rodadas ativas a cada 15 minutos
    this.startRoundSync();

    // Job 3: Verificar partidas finalizadas a cada 5 minutos
    this.startFinishedMatchesCheck();
  }

  /**
   * Job: Atualizar partidas ao vivo
   * Executado a cada 1 minuto
   */
  startLiveMatchesUpdate() {
    cron.schedule("*/1 * * * *", async () => {
      if (this.isRunning) {
        console.log("⏭️ Job anterior ainda em execução, pulando...");
        return;
      }

      this.isRunning = true;
      try {
        console.log("🔴 [LIVE] Atualizando partidas ao vivo...");

        // Buscar todas as partidas marcadas como "live" no banco
        const liveMatches = await Match.find({ status: "live" });

        if (liveMatches.length === 0) {
          console.log("✅ Nenhuma partida ao vivo no momento");
          return;
        }

        console.log(`📊 ${liveMatches.length} partidas ao vivo encontradas`);

        // Atualizar cada partida
        for (const match of liveMatches) {
          try {
            await footballAPIService.updateMatchResult(match.apiMatchId);
            console.log(
              `✅ ${match.homeTeam.name} vs ${match.awayTeam.name} atualizada`
            );
          } catch (error) {
            console.error(
              `❌ Erro ao atualizar ${match.homeTeam.name} vs ${match.awayTeam.name}:`,
              error.message
            );
          }
        }

        console.log("✅ [LIVE] Atualização de partidas ao vivo concluída");
      } catch (error) {
        console.error("❌ Erro no job de partidas ao vivo:", error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log("✅ Job de partidas ao vivo iniciado (a cada 1 minuto)");
  }

  /**
   * Job: Sincronizar rodadas ativas
   * Executado a cada 15 minutos
   */
  startRoundSync() {
    cron.schedule("*/15 * * * *", async () => {
      try {
        console.log("🔄 [SYNC] Sincronizando rodadas ativas...");

        // Buscar partidas agendadas para hoje e amanhã
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const upcomingMatches = await Match.find({
          status: "scheduled",
          date: {
            $gte: now,
            $lte: tomorrow,
          },
        });

        if (upcomingMatches.length === 0) {
          console.log("✅ Nenhuma partida próxima para sincronizar");
          return;
        }

        // Agrupar por liga e rodada
        const groupedMatches = {};
        upcomingMatches.forEach((match) => {
          const key = `${match.league}-${match.round}`;
          if (!groupedMatches[key]) {
            groupedMatches[key] = {
              league: match.league,
              round: match.round,
            };
          }
        });

        // Sincronizar cada grupo
        for (const key in groupedMatches) {
          const { league, round } = groupedMatches[key];
          try {
            await footballAPIService.syncRoundFixtures(league, round);
            console.log(`✅ Sincronizado: ${league} - Rodada ${round}`);
          } catch (error) {
            console.error(
              `❌ Erro ao sincronizar ${league} - Rodada ${round}:`,
              error.message
            );
          }
        }

        console.log("✅ [SYNC] Sincronização de rodadas concluída");
      } catch (error) {
        console.error("❌ Erro no job de sincronização:", error);
      }
    });

    console.log("✅ Job de sincronização iniciado (a cada 15 minutos)");
  }

  /**
   * Job: Verificar partidas que foram finalizadas
   * Executado a cada 5 minutos
   */
  startFinishedMatchesCheck() {
    cron.schedule("*/5 * * * *", async () => {
      try {
        console.log("🏁 [FINISHED] Verificando partidas finalizadas...");

        // Buscar partidas que deveriam ter terminado (2 horas após início)
        const twoHoursAgo = new Date();
        twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

        const possiblyFinished = await Match.find({
          status: { $in: ["scheduled", "live"] },
          date: { $lte: twoHoursAgo },
        });

        if (possiblyFinished.length === 0) {
          console.log("✅ Nenhuma partida para verificar");
          return;
        }

        console.log(`📊 ${possiblyFinished.length} partidas para verificar`);

        // Atualizar cada partida
        for (const match of possiblyFinished) {
          try {
            await footballAPIService.updateMatchResult(match.apiMatchId);
            console.log(
              `✅ ${match.homeTeam.name} vs ${match.awayTeam.name} verificada`
            );
          } catch (error) {
            console.error(
              `❌ Erro ao verificar ${match.homeTeam.name} vs ${match.awayTeam.name}:`,
              error.message
            );
          }
        }

        console.log("✅ [FINISHED] Verificação de partidas concluída");
      } catch (error) {
        console.error("❌ Erro no job de verificação:", error);
      }
    });

    console.log(
      "✅ Job de verificação de finalizadas iniciado (a cada 5 minutos)"
    );
  }

  /**
   * Parar todos os jobs
   */
  stop() {
    console.log("⏹️ Parando jobs de atualização...");
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    console.log("✅ Jobs parados");
  }

  /**
   * Executar atualização manual (útil para testes)
   */
  async manualUpdate(league) {
    try {
      console.log(`🔧 Atualização manual iniciada para: ${league}`);

      const liveMatches = await Match.find({ league, status: "live" });

      for (const match of liveMatches) {
        await footballAPIService.updateMatchResult(match.apiMatchId);
      }

      console.log(
        `✅ Atualização manual concluída: ${liveMatches.length} partidas`
      );
      return { success: true, updated: liveMatches.length };
    } catch (error) {
      console.error("❌ Erro na atualização manual:", error);
      throw error;
    }
  }
}

// Singleton
const matchUpdater = new MatchUpdater();

// Iniciar automaticamente se não estiver em modo de teste
if (process.env.NODE_ENV !== "test") {
  matchUpdater.start();
}

module.exports = matchUpdater;
