const cron = require("node-cron");
const Room = require("../models/Room");
const Player = require("../models/Player");
const sportsAPI = require("../services/sportsAPI.service");

class MatchResultsChecker {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Inicia o cron job para verificar resultados
   * Roda a cada 30 minutos
   */
  start() {
    console.log("🤖 Iniciando verificador de resultados...");

    // Executa a cada 30 minutos
    cron.schedule("*/30 * * * *", async () => {
      if (this.isRunning) {
        console.log("⏳ Verificação já em andamento, aguardando...");
        return;
      }

      this.isRunning = true;
      console.log("🔄 Iniciando verificação de resultados...");

      try {
        await this.checkAllActiveRooms();
      } catch (error) {
        console.error("❌ Erro na verificação:", error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log("✅ Verificador de resultados ativo (a cada 30 minutos)");

    // Executa uma verificação inicial após 1 minuto
    setTimeout(() => {
      this.checkAllActiveRooms();
    }, 60000);
  }

  /**
   * Verifica todas as salas ativas
   */
  async checkAllActiveRooms() {
    try {
      // Buscar todas as salas ativas
      const activeRooms = await Room.find({ status: "active" }).populate(
        "players"
      );

      if (activeRooms.length === 0) {
        console.log("📭 Nenhuma sala ativa para verificar");
        return;
      }

      console.log(`🎮 Verificando ${activeRooms.length} salas ativas...`);

      for (const room of activeRooms) {
        try {
          await this.checkRoomResults(room);
        } catch (error) {
          console.error(
            `❌ Erro ao verificar sala ${room.name}:`,
            error.message
          );
        }
      }

      console.log("✅ Verificação concluída");
    } catch (error) {
      console.error("❌ Erro ao buscar salas ativas:", error);
      throw error;
    }
  }

  /**
   * Verifica resultados de uma sala específica
   */
  async checkRoomResults(room) {
    console.log(`\n🏟️ Verificando sala: ${room.name}`);
    console.log(`📊 Rodada atual: ${room.currentRound}/${room.totalRounds}`);

    // Buscar partidas da rodada atual
    const matches = await sportsAPI.getMatchesByRound(
      room.league,
      room.currentRound
    );

    if (matches.length === 0) {
      console.log("⚠️ Nenhuma partida encontrada para esta rodada");
      return;
    }

    // Verificar se todas as partidas foram finalizadas
    const allMatchesFinished = matches.every(
      (match) =>
        match.status === "Match Finished" ||
        (match.homeScore !== null && match.awayScore !== null)
    );

    if (!allMatchesFinished) {
      console.log("⏳ Nem todas as partidas foram finalizadas ainda");
      return;
    }

    console.log("✅ Todas as partidas da rodada foram finalizadas!");

    // Processar resultados de cada jogador
    await this.processPlayerResults(room, matches);

    // Verificar se a rodada acabou e avançar
    await this.advanceRound(room);
  }

  /**
   * Processa os resultados dos jogadores
   */
  async processPlayerResults(room, matches) {
    console.log(`\n👥 Processando resultados dos jogadores...`);

    const activePlayers = room.players.filter((p) => !p.isEliminated);

    for (const player of activePlayers) {
      try {
        // Buscar seleção do jogador para esta rodada
        const selection = player.selectedTeams.find(
          (s) => s.round === room.currentRound && s.won === null
        );

        if (!selection) {
          console.log(`⚠️ ${player.name} não selecionou time nesta rodada`);
          // Eliminar jogador por não selecionar
          player.isEliminated = true;
          player.eliminatedAt = Date.now();
          player.eliminationRound = room.currentRound;
          await player.save();
          console.log(`❌ ${player.name} ELIMINADO por não selecionar time`);
          continue;
        }

        // Encontrar a partida do time selecionado
        const teamMatch = matches.find(
          (m) =>
            m.homeTeamId === selection.teamId ||
            m.awayTeamId === selection.teamId
        );

        if (!teamMatch) {
          console.log(
            `⚠️ Partida não encontrada para o time ${selection.teamName}`
          );
          continue;
        }

        // Verificar resultado
        const won = this.checkTeamWon(teamMatch, selection.teamId);

        // Atualizar seleção
        selection.won = won;
        selection.matchResult = {
          homeTeam: teamMatch.homeTeamName,
          awayTeam: teamMatch.awayTeamName,
          homeScore: teamMatch.homeScore,
          awayScore: teamMatch.awayScore,
        };

        if (!won) {
          player.isEliminated = true;
          player.eliminatedAt = Date.now();
          player.eliminationRound = room.currentRound;
          console.log(
            `❌ ${player.name} ELIMINADO - ${selection.teamName} perdeu/empatou`
          );
        } else {
          console.log(
            `✅ ${player.name} SOBREVIVEU - ${selection.teamName} venceu!`
          );
        }

        await player.save();
      } catch (error) {
        console.error(
          `❌ Erro ao processar jogador ${player.name}:`,
          error.message
        );
      }
    }
  }

  /**
   * Verifica se o time venceu a partida
   */
  checkTeamWon(match, teamId) {
    // Empate = perda
    if (match.homeScore === match.awayScore) {
      return false;
    }

    // Time mandante venceu
    if (match.homeTeamId === teamId) {
      return match.homeScore > match.awayScore;
    }

    // Time visitante venceu
    if (match.awayTeamId === teamId) {
      return match.awayScore > match.homeScore;
    }

    return false;
  }

  /**
   * Avança para a próxima rodada ou finaliza a sala
   */
  async advanceRound(room) {
    console.log(`\n🔄 Verificando avanço de rodada...`);

    // Contar jogadores ainda ativos
    const activePlayers = room.players.filter((p) => !p.isEliminated);

    console.log(`👥 Jogadores ativos: ${activePlayers.length}`);

    // Se só sobrou 1 jogador, ele é o vencedor
    if (activePlayers.length === 1) {
      room.status = "finished";
      room.winner = activePlayers[0]._id;
      room.finishedAt = Date.now();
      await room.save();

      console.log(`🏆 VENCEDOR: ${activePlayers[0].name}!`);
      console.log(`💰 Prêmio: R$ ${room.prizePool}`);
      return;
    }

    // Se ninguém sobrou, empate (caso raro)
    if (activePlayers.length === 0) {
      room.status = "finished";
      room.finishedAt = Date.now();
      await room.save();

      console.log(`🤝 Empate - Nenhum jogador sobreviveu`);
      return;
    }

    // Se chegou na última rodada, o(s) sobrevivente(s) vencem
    if (room.currentRound >= room.totalRounds) {
      room.status = "finished";
      room.finishedAt = Date.now();

      // Se tem mais de um sobrevivente, dividir prêmio
      if (activePlayers.length > 1) {
        console.log(
          `🤝 ${activePlayers.length} jogadores sobreviveram até o fim!`
        );
      } else {
        room.winner = activePlayers[0]._id;
        console.log(`🏆 VENCEDOR: ${activePlayers[0].name}!`);
      }

      await room.save();
      return;
    }

    // Avançar para próxima rodada
    room.currentRound += 1;
    await room.save();

    console.log(`➡️ Avançando para rodada ${room.currentRound}`);
    console.log(`👥 ${activePlayers.length} jogadores ainda na disputa`);
  }

  /**
   * Verifica uma sala específica manualmente
   */
  async checkRoomManually(roomId) {
    try {
      const room = await Room.findById(roomId).populate("players");

      if (!room) {
        throw new Error("Sala não encontrada");
      }

      if (room.status !== "active") {
        throw new Error("Sala não está ativa");
      }

      await this.checkRoomResults(room);
      return { success: true, message: "Verificação concluída" };
    } catch (error) {
      console.error("❌ Erro na verificação manual:", error);
      throw error;
    }
  }
}

module.exports = new MatchResultsChecker();
