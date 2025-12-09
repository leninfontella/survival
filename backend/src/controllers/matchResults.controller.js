const sportsAPI = require("../services/sportsAPI.service");
const matchResultsChecker = require("../jobs/matchResultsChecker.job");
const Room = require("../models/Room");

// @desc    Buscar partidas de uma rodada
// @route   GET /api/match-results/matches/:league/:round
// @access  Public
exports.getMatchesByRound = async (req, res) => {
  try {
    const { league, round } = req.params;

    console.log(`🔍 Buscando partidas: ${league} - Rodada ${round}`);

    const matches = await sportsAPI.getMatchesByRound(league, parseInt(round));

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar partidas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar partidas",
      error: error.message,
    });
  }
};

// @desc    Buscar detalhes de uma partida
// @route   GET /api/match-results/match/:matchId
// @access  Public
exports.getMatchDetails = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await sportsAPI.getMatchDetails(matchId);

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar detalhes da partida:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar detalhes da partida",
      error: error.message,
    });
  }
};

// @desc    Buscar todos os times de uma liga
// @route   GET /api/match-results/teams/:league
// @access  Public
exports.getTeamsByLeague = async (req, res) => {
  try {
    const { league } = req.params;

    console.log(`🔍 Buscando times da liga: ${league}`);

    const teams = await sportsAPI.getTeamsByLeague(league);

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar times:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar times",
      error: error.message,
    });
  }
};

// @desc    Verificar resultado de uma partida para um time
// @route   GET /api/match-results/check/:matchId/:teamId
// @access  Public
exports.checkMatchResult = async (req, res) => {
  try {
    const { matchId, teamId } = req.params;

    const result = await sportsAPI.checkMatchResult(matchId, teamId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Erro ao verificar resultado:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao verificar resultado",
      error: error.message,
    });
  }
};

// @desc    Buscar próximas partidas de um time
// @route   GET /api/match-results/next/:teamId
// @access  Public
exports.getNextMatches = async (req, res) => {
  try {
    const { teamId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const matches = await sportsAPI.getNextMatches(teamId, limit);

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar próximas partidas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar próximas partidas",
      error: error.message,
    });
  }
};

// @desc    Buscar últimas partidas de um time
// @route   GET /api/match-results/last/:teamId
// @access  Public
exports.getLastMatches = async (req, res) => {
  try {
    const { teamId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const matches = await sportsAPI.getLastMatches(teamId, limit);

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar últimas partidas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar últimas partidas",
      error: error.message,
    });
  }
};

// @desc    Forçar verificação manual de uma sala
// @route   POST /api/match-results/check-room/:roomId
// @access  Private (Admin ou Criador da sala)
exports.forceCheckRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Verificar se a sala existe
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }

    // Verificar se é o criador (ou admin no futuro)
    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Apenas o criador pode forçar verificação",
      });
    }

    console.log(`🔄 Verificação manual forçada para sala: ${room.name}`);

    const result = await matchResultsChecker.checkRoomManually(roomId);

    res.status(200).json({
      success: true,
      message: "Verificação de resultados concluída",
      data: result,
    });
  } catch (error) {
    console.error("❌ Erro ao forçar verificação:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao forçar verificação",
      error: error.message,
    });
  }
};

// @desc    Obter status do verificador automático
// @route   GET /api/match-results/checker-status
// @access  Public
exports.getCheckerStatus = async (req, res) => {
  try {
    const activeRooms = await Room.countDocuments({ status: "active" });

    res.status(200).json({
      success: true,
      data: {
        isActive: true,
        checkInterval: "30 minutos",
        activeRooms,
        lastCheck: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar status:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar status",
      error: error.message,
    });
  }
};
