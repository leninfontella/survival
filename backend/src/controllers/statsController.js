const Room = require("../models/Room");
const Player = require("../models/Player");
const User = require("../models/User");

/**
 * @desc    Obter estatísticas para o dashboard de admin
 * @route   GET /api/stats/dashboard
 * @access  Public (ou Private/Admin se necessário)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Total de jogadores (usuários cadastrados)
    const totalPlayers = await User.countDocuments();

    // Total de salas criadas
    const totalRooms = await Room.countDocuments();

    // Total em prêmios (soma de todos os prize pools)
    const totalPrizesResult = await Room.aggregate([
      { $group: { _id: null, total: { $sum: "$prizePool" } } },
    ]);
    const totalPrizes =
      totalPrizesResult.length > 0 ? totalPrizesResult[0].total : 0;

    // Top 5 ligas com mais salas
    const topLeagues = await Room.aggregate([
      { $group: { _id: "$league", roomCount: { $sum: 1 } } },
      { $sort: { roomCount: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, league: "$_id", roomCount: "$roomCount" } },
    ]);

    // Últimos 5 vencedores
    const recentWinners = await Room.find({
      status: "finished",
      winner: { $ne: null },
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("winner", "name")
      .select("name prizePool winner");

    const formattedWinners = recentWinners.map((room) => ({
      playerName: room.winner ? room.winner.name : "N/A",
      roomName: room.name,
      prize: room.prizePool,
    }));

    res.json({
      success: true,
      data: {
        totalPlayers,
        totalRooms,
        totalPrizes,
        topLeagues,
        recentWinners: formattedWinners,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas do dashboard",
      error: error.message,
    });
  }
};
