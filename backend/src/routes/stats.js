const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const Player = require("../models/Player");
const User = require("../models/User");
const { getDashboardStats } = require("../controllers/statsController");

// @route   GET /api/stats
// @desc    Obter estatísticas para a página inicial
// @access  Public
router.get("/", async (req, res) => {
  try {
    // Total de jogadores ativos (usuários com pelo menos uma partida ativa)
    const activePlayers = await Player.countDocuments({
      isEliminated: false,
    });

    // Total de usuários cadastrados
    const totalUsers = await User.countDocuments();

    // Prêmio total acumulado (soma de todos os prize pools de salas ativas)
    const prizePoolResult = await Room.aggregate([
      {
        $match: {
          status: { $in: ["waiting", "active"] },
        },
      },
      {
        $group: {
          _id: null,
          totalPrize: { $sum: "$prizePool" },
        },
      },
    ]);

    const totalPrize =
      prizePoolResult.length > 0 ? prizePoolResult[0].totalPrize : 0;

    // Rodada mais avançada em andamento
    const maxRound = await Room.findOne(
      { status: "active" },
      { currentRound: 1 }
    ).sort({ currentRound: -1 });

    // Total de salas ativas
    const activeRooms = await Room.countDocuments({
      status: { $in: ["waiting", "active"] },
    });

    // Total de salas finalizadas
    const finishedRooms = await Room.countDocuments({
      status: "finished",
    });

    res.json({
      success: true,
      data: {
        activePlayers: activePlayers || totalUsers || 0,
        totalPrize: totalPrize,
        currentRound: maxRound ? maxRound.currentRound : 0,
        activeRooms: activeRooms,
        finishedRooms: finishedRooms,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas",
      error: error.message,
    });
  }
});

// @route   GET /api/stats/dashboard
// @desc    Obter estatísticas para o dashboard de admin
// @access  Public (ou Private/Admin)
router.get("/dashboard", getDashboardStats);

module.exports = router;
