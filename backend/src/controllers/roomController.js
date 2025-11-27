const Room = require("../models/Room");
const Player = require("../models/Player");

// @desc    Criar nova sala
// @route   POST /api/rooms
// @access  Private
exports.createRoom = async (req, res) => {
  try {
    const { name, league, minPlayers, entryPrice, totalRounds } = req.body;

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
      createdBy: req.user.id,
      prizePool: 0,
    });

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
// @access  Public
exports.getRooms = async (req, res) => {
  try {
    const { status, league } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (league) filter.league = league;

    const rooms = await Room.find(filter)
      .populate("createdBy", "name email")
      .populate({
        path: "players",
        select: "name isEliminated",
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
// @access  Public
exports.getRoomById = async (req, res) => {
  try {
    console.log("🔍 Buscando sala com ID:", req.params.id);

    const room = await Room.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate({
        path: "players",
        select: "name isEliminated selectedTeams user",
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

    console.log("✅ Sala encontrada:", room.name);
    console.log("👥 Jogadores:", room.players.length);

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar sala:", error);

    // Verificar se é um erro de ID inválido
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
// @access  Private
exports.joinRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const roomId = req.params.id;
    const userId = req.user.id;

    // Verificar se a sala existe
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
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
    });

    // Adicionar player à sala
    room.players.push(player._id);
    room.prizePool = room.players.length * room.entryPrice;
    await room.save();

    // Buscar sala atualizada com todos os players
    const updatedRoom = await Room.findById(roomId)
      .populate("createdBy", "name email")
      .populate({
        path: "players",
        select: "name isEliminated user",
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

// @desc    Iniciar sala
// @route   PUT /api/rooms/:id/start
// @access  Private (Apenas criador)
exports.startRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate(
      "players",
      "name isEliminated"
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
        select: "name isEliminated user",
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
