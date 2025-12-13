const Match = require("../models/Match");
const footballAPIService = require("../services/footballAPIService");

// ============= BUSCAR PARTIDAS =============

/**
 * Buscar partidas de uma rodada específica
 * GET /api/matches/round/:roundNumber/league/:league
 */
exports.getMatchesByRound = async (req, res) => {
  try {
    const { roundNumber, league } = req.params;
    const { forceSync } = req.query;

    // Validar parâmetros
    if (!league || !roundNumber) {
      return res.status(400).json({
        success: false,
        message: "Liga e rodada são obrigatórios",
      });
    }

    const round = parseInt(roundNumber);
    if (isNaN(round) || round < 1) {
      return res.status(400).json({
        success: false,
        message: "Número da rodada inválido",
      });
    }

    // Verificar se precisa sincronizar com a API
    let matches = await Match.find({ league, round }).sort({ date: 1 });

    // Se não tem partidas no banco OU forceSync=true, buscar da API
    if (matches.length === 0 || forceSync === "true") {
      console.log(
        `🔄 Sincronizando partidas da API: ${league} - Rodada ${round}`
      );
      matches = await footballAPIService.syncRoundFixtures(league, round);
    }

    // Retornar partidas
    res.json({
      success: true,
      data: {
        league,
        round,
        matches,
        count: matches.length,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar partidas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar partidas",
      error: error.message,
    });
  }
};

/**
 * Buscar uma partida específica por ID
 * GET /api/matches/:matchId
 */
exports.getMatchById = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Partida não encontrada",
      });
    }

    res.json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error("Erro ao buscar partida:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar partida",
      error: error.message,
    });
  }
};

/**
 * Buscar partidas ao vivo de uma liga
 * GET /api/matches/live/:league
 */
exports.getLiveMatches = async (req, res) => {
  try {
    const { league } = req.params;

    // Buscar partidas ao vivo no banco
    let liveMatches = await Match.find({
      league,
      status: "live",
    }).sort({ date: 1 });

    // Atualizar partidas ao vivo da API
    if (footballAPIService.isConfigured()) {
      try {
        await footballAPIService.updateLiveMatches(league);

        // Buscar novamente após atualização
        liveMatches = await Match.find({
          league,
          status: "live",
        }).sort({ date: 1 });
      } catch (apiError) {
        console.error("Erro ao atualizar partidas ao vivo:", apiError);
        // Continua com os dados do cache
      }
    }

    res.json({
      success: true,
      data: {
        league,
        matches: liveMatches,
        count: liveMatches.length,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar partidas ao vivo:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar partidas ao vivo",
      error: error.message,
    });
  }
};

// ============= ATUALIZAR PARTIDAS =============

/**
 * Atualizar resultado de uma partida
 * PUT /api/matches/:matchId/update
 */
exports.updateMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Partida não encontrada",
      });
    }

    // Atualizar da API
    const updatedMatch = await footballAPIService.updateMatchResult(
      match.apiMatchId
    );

    res.json({
      success: true,
      message: "Partida atualizada com sucesso",
      data: updatedMatch,
    });
  } catch (error) {
    console.error("Erro ao atualizar partida:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar partida",
      error: error.message,
    });
  }
};

/**
 * Sincronizar partidas de uma rodada com a API
 * POST /api/matches/sync
 */
exports.syncMatches = async (req, res) => {
  try {
    const { league, round } = req.body;

    if (!league || !round) {
      return res.status(400).json({
        success: false,
        message: "Liga e rodada são obrigatórios",
      });
    }

    // Sincronizar com a API
    const matches = await footballAPIService.syncRoundFixtures(league, round);

    res.json({
      success: true,
      message: `${matches.length} partidas sincronizadas com sucesso`,
      data: {
        league,
        round,
        matches,
        count: matches.length,
      },
    });
  } catch (error) {
    console.error("Erro ao sincronizar partidas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao sincronizar partidas",
      error: error.message,
    });
  }
};

// ============= FILTROS E BUSCAS =============

/**
 * Buscar partidas de um time específico
 * GET /api/matches/team/:teamId
 */
exports.getMatchesByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { league, round } = req.query;

    const query = {
      $or: [
        { "homeTeam.apiTeamId": parseInt(teamId) },
        { "awayTeam.apiTeamId": parseInt(teamId) },
      ],
    };

    if (league) query.league = league;
    if (round) query.round = parseInt(round);

    const matches = await Match.find(query).sort({ date: -1 });

    res.json({
      success: true,
      data: {
        teamId,
        matches,
        count: matches.length,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar partidas do time:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar partidas do time",
      error: error.message,
    });
  }
};

/**
 * Buscar próximas partidas de uma liga
 * GET /api/matches/upcoming/:league
 */
exports.getUpcomingMatches = async (req, res) => {
  try {
    const { league } = req.params;
    const { limit = 10 } = req.query;

    const matches = await Match.find({
      league,
      status: "scheduled",
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        league,
        matches,
        count: matches.length,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar próximas partidas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar próximas partidas",
      error: error.message,
    });
  }
};

/**
 * Obter estatísticas das partidas
 * GET /api/matches/stats/:league
 */
exports.getMatchStats = async (req, res) => {
  try {
    const { league } = req.params;

    const stats = await Match.aggregate([
      { $match: { league } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Match.countDocuments({ league });

    res.json({
      success: true,
      data: {
        league,
        total,
        byStatus: stats,
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
};
