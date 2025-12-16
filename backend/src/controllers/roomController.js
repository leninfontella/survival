const Room = require("../models/Room");
const Player = require("../models/Player");

// @desc    Criar nova sala
// @route   POST /api/rooms
// @access  Private
exports.createRoom = async (req, res) => {
  try {
    const { name, league, minPlayers, entryPrice, totalRounds, isPrivate } =
      req.body;

    // Validações
    if (!name || !league || !minPlayers || !entryPrice || !totalRounds) {
      return res.status(400).json({
        success: false,
        message: "Por favor, preencha todos os campos",
      });
    }

    // Criar sala
    const room = await Room.create({
      name,
      league,
      minPlayers,
      entryPrice,
      totalRounds,
      isPrivate: isPrivate || false,
      createdBy: req.user.id,
      prizePool: 0,
    });

    console.log("✅ Sala criada:", room.name);
    console.log("👑 Criador:", req.user.name);
    console.log("🔒 Privada:", room.isPrivate);

    res.status(201).json({
      success: true,
      message: "Sala criada com sucesso!",
      data: room,
    });
  } catch (error) {
    console.error("Erro ao criar sala:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar sala",
      error: error.message,
    });
  }
};

// @desc    Listar todas as salas
// @route   GET /api/rooms
// @access  Public (com optionalAuth)
exports.getRooms = async (req, res) => {
  try {
    const { status, league } = req.query;

    let filter = {};

    // Mostrar salas públicas E salas privadas ativas/finalizadas
    // Salas privadas "waiting" só aparecem para membros
    if (req.user) {
      // Usuário autenticado: ver suas salas + públicas + privadas ativas
      const playerIds = await Player.find({ user: req.user.id }).distinct(
        "_id"
      );

      filter.$or = [
        { isPrivate: false }, // Todas as salas públicas
        { createdBy: req.user.id }, // Salas criadas pelo usuário
        { players: { $in: playerIds } }, // Salas onde é jogador
        { isPrivate: true, status: { $in: ["active", "finished"] } }, // Salas privadas ativas/finalizadas (para todos)
      ];
    } else {
      // Usuário não autenticado: salas públicas + privadas ativas/finalizadas
      filter.$or = [
        { isPrivate: false }, // Salas públicas
        { isPrivate: true, status: { $in: ["active", "finished"] } }, // Salas privadas ativas/finalizadas
      ];
    }

    if (status) {
      // Se já existe $or, adicionar status ao filtro principal
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { status }];
        delete filter.$or;
      } else {
        filter.status = status;
      }
    }

    if (league) filter.league = league;

    const rooms = await Room.find(filter)
      .populate("createdBy", "name email")
      .populate({
        path: "players",
        select: "name isEliminated isReady",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar salas",
      error: error.message,
    });
  }
};

// @desc    Obter sala por ID
// @route   GET /api/rooms/:id
// @access  Public (mas valida privacidade e BLOQUEIA não autenticados)
exports.getRoomById = async (req, res) => {
  try {
    console.log("🔍 Buscando sala com ID:", req.params.id);
    console.log("👤 Usuário autenticado:", req.user ? req.user.id : "Nenhum");

    const room = await Room.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate({
        path: "players",
        select: "name isEliminated isReady selectedTeams user",
        populate: {
          path: "user",
          select: "name email",
        },
      });

    if (!room) {
      console.log("❌ Sala não encontrada:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }

    console.log("🔒 Sala privada?", room.isPrivate);
    console.log("📊 Status da sala:", room.status);

    // 🚨 VERIFICAR ACESSO A SALA PRIVADA
    if (room.isPrivate) {
      // ❌ SE NÃO ESTIVER AUTENTICADO = BLOQUEAR TOTALMENTE
      if (!req.user) {
        console.log(
          "🚫 BLOQUEIO TOTAL: Usuário não autenticado em sala privada"
        );

        // Retornar 401 para forçar login
        return res.status(401).json({
          success: false,
          message:
            "Esta sala é privada. Você precisa fazer login para acessar.",
          requiresAuth: true, // Flag para frontend detectar
          roomId: req.params.id,
          isPrivate: true,
        });
      }

      // ✅ Usuário autenticado - verificar se é membro
      const creatorId = room.createdBy._id || room.createdBy.id;
      const isCreator = creatorId.toString() === req.user.id;
      console.log("👑 É criador?", isCreator);

      // Verificar se é um jogador na sala
      const isPlayer = room.players.some((player) => {
        if (typeof player.user === "object" && player.user !== null) {
          const playerId = player.user._id || player.user.id;
          return playerId.toString() === req.user.id;
        }
        return player.user?.toString() === req.user.id;
      });
      console.log("🎮 É jogador?", isPlayer);

      // Se for sala ativa/finalizada e não for membro, pode ver mas não interagir
      if (
        (room.status === "active" || room.status === "finished") &&
        !isCreator &&
        !isPlayer
      ) {
        console.log(
          "⚠️ Usuário autenticado visualizando sala privada ativa onde não é membro"
        );
        return res.status(200).json({
          success: true,
          data: room,
          needsInvite: true,
          message:
            "Esta é uma sala privada em andamento. Apenas membros podem participar.",
        });
      }

      // Se sala está aguardando e não é membro, permitir ver para entrar via convite
      if (room.status === "waiting" && !isCreator && !isPlayer) {
        console.log(
          "✅ Usuário autenticado pode ver sala privada em espera via link"
        );
      }
    }

    console.log("✅ Sala encontrada:", room.name);
    console.log("👥 Jogadores:", room.players.length);

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar sala:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID da sala inválido",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao buscar sala",
      error: error.message,
    });
  }
};

// @desc    Entrar em uma sala
// @route   POST /api/rooms/:id/join
// @access  Private (REQUER AUTENTICAÇÃO OBRIGATÓRIA)
exports.joinRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const roomId = req.params.id;
    const userId = req.user.id; // req.user garantido pelo middleware protect

    console.log("🚪 Tentando entrar na sala:", roomId);
    console.log("👤 Usuário:", userId, "Nome:", name);

    // Verificar se a sala existe
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }

    console.log("🔒 Sala privada?", room.isPrivate);

    // Para salas privadas, apenas verificar se o usuário está autenticado
    // O link de convite já garante que ele conhece a sala
    if (room.isPrivate) {
      console.log(
        "✅ Sala privada - usuário autenticado pode entrar via link de convite"
      );
    }

    // Verificar se a sala está aberta
    if (room.status !== "waiting") {
      return res.status(400).json({
        success: false,
        message: "Esta sala não está mais aceitando jogadores",
      });
    }

    // Verificar se o usuário já está na sala
    const existingPlayer = await Player.findOne({
      user: userId,
      room: roomId,
    });

    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        message: "Você já está nesta sala",
      });
    }

    // Criar player
    const player = await Player.create({
      user: userId,
      room: roomId,
      name: name || req.user.name,
      isReady: false,
    });

    console.log("✅ Player criado:", player.name);

    // Adicionar player à sala
    room.players.push(player._id);
    room.prizePool = room.players.length * room.entryPrice;
    await room.save();

    console.log(
      "✅ Player adicionado à sala. Total de jogadores:",
      room.players.length
    );

    // Buscar sala atualizada com todos os players
    const updatedRoom = await Room.findById(roomId)
      .populate("createdBy", "name email")
      .populate({
        path: "players",
        select: "name isEliminated isReady user",
      });

    res.status(201).json({
      success: true,
      message: "Você entrou na sala!",
      data: {
        player,
        room: updatedRoom,
      },
    });
  } catch (error) {
    console.error("Erro ao entrar na sala:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao entrar na sala",
      error: error.message,
    });
  }
};

// @desc    Toggle Ready Status
// @route   PUT /api/rooms/:id/toggle-ready
// @access  Private
exports.toggleReady = async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.id;

    console.log("🎮 Toggle ready:", { roomId, userId });

    // Buscar sala
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }

    // Verificar se a sala está aguardando
    if (room.status !== "waiting") {
      return res.status(400).json({
        success: false,
        message: "A sala não está mais aguardando jogadores",
      });
    }

    // Buscar jogador
    const player = await Player.findOne({
      user: userId,
      room: roomId,
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Você não está nesta sala",
      });
    }

    // Toggle ready
    player.isReady = !player.isReady;
    await player.save();

    console.log(
      `✅ Player ${player.name} agora está: ${
        player.isReady ? "PRONTO" : "NÃO PRONTO"
      }`
    );

    // Buscar todos os jogadores da sala
    const allPlayers = await Player.find({ room: roomId });
    const totalPlayers = allPlayers.length;
    const readyPlayers = allPlayers.filter((p) => p.isReady).length;

    console.log(`📊 Status: ${readyPlayers}/${totalPlayers} jogadores prontos`);

    // Verificar se todos estão prontos e se atingiu o mínimo
    const allReady =
      totalPlayers >= room.minPlayers && readyPlayers === totalPlayers;

    if (allReady) {
      console.log("🚀 TODOS OS JOGADORES PRONTOS! Iniciando sala...");

      // Iniciar sala automaticamente
      room.status = "active";
      room.currentRound = 1;
      room.startedAt = Date.now();
      await room.save();

      console.log("✅ Sala iniciada automaticamente!");
    }

    // Buscar sala atualizada
    const updatedRoom = await Room.findById(roomId)
      .populate("createdBy", "name email")
      .populate({
        path: "players",
        select: "name isEliminated isReady user",
      });

    res.status(200).json({
      success: true,
      message: player.isReady
        ? "Você está pronto!"
        : "Você não está mais pronto",
      data: {
        player,
        room: updatedRoom,
        readyCount: readyPlayers,
        totalCount: totalPlayers,
        allReady,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao alternar status ready:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao alternar status",
      error: error.message,
    });
  }
};

// @desc    Iniciar sala (Deprecated - mantido para compatibilidade)
// @route   PUT /api/rooms/:id/start
// @access  Private (Apenas criador)
exports.startRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate(
      "players",
      "name isEliminated isReady"
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }

    // Verificar se é o criador
    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Apenas o criador pode iniciar a sala",
      });
    }

    // Verificar número mínimo de jogadores
    if (room.players.length < room.minPlayers) {
      return res.status(400).json({
        success: false,
        message: `Número mínimo de jogadores não atingido (${room.players.length}/${room.minPlayers})`,
      });
    }

    // Verificar se a sala já foi iniciada
    if (room.status !== "waiting") {
      return res.status(400).json({
        success: false,
        message: "Esta sala já foi iniciada",
      });
    }

    room.status = "active";
    room.currentRound = 1;
    room.startedAt = Date.now();
    await room.save();

    // Buscar sala atualizada
    const updatedRoom = await Room.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate({
        path: "players",
        select: "name isEliminated isReady user",
      });

    res.status(200).json({
      success: true,
      message: "Sala iniciada! Todos os jogadores devem selecionar seus times.",
      data: updatedRoom,
    });
  } catch (error) {
    console.error("Erro ao iniciar sala:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao iniciar sala",
      error: error.message,
    });
  }
};

exports.selectTeam = async (req, res) => {
  try {
    const { teamId, teamName, matchId } = req.body; // 🆕 ADICIONAR matchId
    const roomId = req.params.id;
    const userId = req.user.id;

    console.log("🎯 Selecionando time:", {
      roomId,
      userId,
      teamId,
      teamName,
      matchId, // 🆕 Log do matchId
    });

    // Validações
    if (!teamId || !teamName) {
      return res.status(400).json({
        success: false,
        message: "Por favor, forneça o ID e nome do time",
      });
    }

    // Buscar sala
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }

    // Verificar se a sala está ativa
    if (room.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "A sala não está ativa",
      });
    }

    // Buscar jogador
    const player = await Player.findOne({
      user: userId,
      room: roomId,
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Você não está nesta sala",
      });
    }

    // Verificar se o jogador já foi eliminado
    if (player.isEliminated) {
      return res.status(400).json({
        success: false,
        message: "Você já foi eliminado desta competição",
      });
    }

    // Verificar se o time já foi usado
    const teamAlreadyUsed = player.selectedTeams.some(
      (selection) => selection.teamId === teamId
    );

    if (teamAlreadyUsed) {
      return res.status(400).json({
        success: false,
        message: "Você já usou este time anteriormente",
      });
    }

    // Verificar se o jogador já selecionou um time para esta rodada
    const alreadySelectedThisRound = player.selectedTeams.some(
      (selection) => selection.round === room.currentRound
    );

    if (alreadySelectedThisRound) {
      return res.status(400).json({
        success: false,
        message: "Você já selecionou um time para esta rodada",
      });
    }

    if (matchId) {
      const sportsAPI = require("../services/sportsAPI.service");

      try {
        const match = await sportsAPI.getMatchDetails(matchId);

        // Verificar se o time está nessa partida
        const teamInMatch =
          match.homeTeamId === teamId || match.awayTeamId === teamId;

        if (!teamInMatch) {
          return res.status(400).json({
            success: false,
            message: "O time selecionado não está nesta partida",
          });
        }

        // Verificar se a partida é da rodada atual
        if (match.round !== room.currentRound) {
          return res.status(400).json({
            success: false,
            message: "Esta partida não é da rodada atual",
          });
        }

        console.log(
          `✅ Validação OK: ${teamName} está na partida ${matchId} da rodada ${room.currentRound}`
        );
      } catch (error) {
        console.error("⚠️ Erro ao validar partida:", error);
        // Continuar mesmo se falhar a validação
      }
    }

    // Adicionar seleção do time
    player.selectedTeams.push({
      teamId,
      teamName,
      round: room.currentRound,
      won: null,
      matchId,
    });

    await player.save();

    console.log("✅ Time selecionado com sucesso");

    // Buscar player atualizado
    const updatedPlayer = await Player.findById(player._id)
      .populate("user", "name email")
      .populate("room", "name currentRound");

    res.status(200).json({
      success: true,
      message: "Time selecionado com sucesso!",
      data: {
        player: updatedPlayer,
        selectedTeam: {
          teamId,
          teamName,
          round: room.currentRound,
          matchId, // 🆕 ADICIONAR ESTE CAMPO
        },
      },
    });
  } catch (error) {
    console.error("❌ Erro ao selecionar time:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao selecionar time",
      error: error.message,
    });
  }
};

// @desc    Obter times já usados pelo jogador
// @route   GET /api/rooms/:id/used-teams
// @access  Private
exports.getUsedTeams = async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.id;

    // Buscar jogador
    const player = await Player.findOne({
      user: userId,
      room: roomId,
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Você não está nesta sala",
      });
    }

    // Extrair IDs dos times já usados
    const usedTeamIds = player.selectedTeams.map(
      (selection) => selection.teamId
    );

    res.status(200).json({
      success: true,
      data: {
        usedTeams: usedTeamIds,
        selections: player.selectedTeams,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar times usados:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar times usados",
      error: error.message,
    });
  }
};

// @desc    Excluir sala
// @route   DELETE /api/rooms/:id
// @access  Private (Apenas criador)
exports.deleteRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.id;

    console.log("🗑️ Tentando excluir sala:", roomId);
    console.log("👤 Usuário:", userId);

    // Buscar sala
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }

    // Verificar se é o criador
    const creatorId = room.createdBy._id || room.createdBy.id || room.createdBy;
    const isCreator = creatorId.toString() === userId;

    console.log("👑 É criador?", isCreator);
    console.log("📊 Criador:", creatorId.toString());
    console.log("📊 User:", userId);

    if (!isCreator) {
      return res.status(403).json({
        success: false,
        message: "Apenas o criador pode excluir a sala",
      });
    }

    // Verificar se a sala pode ser excluída
    if (room.status === "active") {
      return res.status(400).json({
        success: false,
        message: "Não é possível excluir uma sala em andamento",
      });
    }

    // Excluir todos os jogadores da sala
    await Player.deleteMany({ room: roomId });
    console.log("✅ Jogadores removidos");

    // Excluir a sala
    await Room.findByIdAndDelete(roomId);
    console.log("✅ Sala excluída:", room.name);

    res.status(200).json({
      success: true,
      message: "Sala excluída com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao excluir sala:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir sala",
      error: error.message,
    });
  }
};

exports.getAvailableMatches = async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.id;

    console.log("⚽ Buscando partidas disponíveis:", { roomId, userId });

    // Buscar sala
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }

    // Verificar se a sala está ativa
    if (room.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "A sala não está ativa",
      });
    }

    // Buscar jogador
    const player = await Player.findOne({
      user: userId,
      room: roomId,
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Você não está nesta sala",
      });
    }

    // Verificar se já foi eliminado
    if (player.isEliminated) {
      return res.status(400).json({
        success: false,
        message: "Você já foi eliminado desta competição",
      });
    }

    // Verificar se já selecionou para esta rodada
    const alreadySelected = player.selectedTeams.some(
      (sel) => sel.round === room.currentRound
    );

    if (alreadySelected) {
      return res.status(400).json({
        success: false,
        message: "Você já selecionou um time para esta rodada",
        alreadySelected: true,
      });
    }

    // Buscar partidas da rodada atual via SportsAPI
    const sportsAPI = require("../services/sportsAPI.service");
    const matches = await sportsAPI.getMatchesByRound(
      room.league,
      room.currentRound
    );

    if (matches.length === 0) {
      console.log(
        `⚠️ Nenhuma partida encontrada: ${room.league} - Rodada ${room.currentRound}`
      );

      return res.status(200).json({
        success: true,
        data: {
          matches: [],
          round: room.currentRound,
          usedTeams: player.getUsedTeamIds(),
          message: "Nenhuma partida disponível para esta rodada ainda",
        },
      });
    }

    // Times já usados pelo jogador
    const usedTeamIds = player.getUsedTeamIds();

    // Formatar partidas com informação de disponibilidade
    const formattedMatches = matches.map((match) => {
      const homeTeamUsed = usedTeamIds.includes(match.homeTeamId);
      const awayTeamUsed = usedTeamIds.includes(match.awayTeamId);

      return {
        id: match.id,
        homeTeam: {
          id: match.homeTeamId,
          name: match.homeTeamName,
          canSelect: !homeTeamUsed,
          used: homeTeamUsed,
        },
        awayTeam: {
          id: match.awayTeamId,
          name: match.awayTeamName,
          canSelect: !awayTeamUsed,
          used: awayTeamUsed,
        },
        date: match.date,
        time: match.time,
        status: match.status,
        round: match.round,
        season: match.season,
        hasAvailableTeam: !homeTeamUsed || !awayTeamUsed,
      };
    });

    // Ordenar: partidas com times disponíveis primeiro
    formattedMatches.sort((a, b) => {
      if (a.hasAvailableTeam && !b.hasAvailableTeam) return -1;
      if (!a.hasAvailableTeam && b.hasAvailableTeam) return 1;
      return 0;
    });

    console.log(
      `✅ ${formattedMatches.length} partidas encontradas (${
        formattedMatches.filter((m) => m.hasAvailableTeam).length
      } com times disponíveis)`
    );

    res.status(200).json({
      success: true,
      data: {
        matches: formattedMatches,
        round: room.currentRound,
        totalRounds: room.totalRounds,
        usedTeams: usedTeamIds,
        league: room.league,
        roomName: room.name,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar partidas disponíveis:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar partidas disponíveis",
      error: error.message,
    });
  }
};
