const Match = require("../models/Match");

// @desc    Obter todas as ligas disponíveis
// @route   GET /api/leagues
// @access  Public
exports.getLeagues = async (req, res) => {
  try {
    // Buscar todas as ligas distintas da coleção de partidas
    const leagues = await Match.distinct("league");

    if (!leagues || leagues.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Nenhuma liga encontrada",
      });
    }

    // Mapear os slugs para nomes mais amigáveis
    const leagueNames = {
      brasil: "Brasileirão",
      espanha: "La Liga",
      inglaterra: "Premier League",
      alemanha: "Bundesliga",
      italia: "Serie A",
      franca: "Ligue 1",
    };

    const formattedLeagues = leagues.map((slug) => ({
      slug: slug,
      name: leagueNames[slug] || slug, // Retorna o slug se não houver nome amigável
    }));

    res.status(200).json({
      success: true,
      count: formattedLeagues.length,
      data: formattedLeagues,
    });
  } catch (error) {
    console.error("Erro ao buscar ligas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar ligas",
      error: error.message,
    });
  }
};
