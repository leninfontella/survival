const express = require("express");
const router = express.Router();
const matchController = require("../controllers/matchController");
const { protect } = require("../middleware/auth");

// ============= ROTAS PÚBLICAS (ou com autenticação opcional) =============

/**
 * @route   GET /api/matches/round/:roundNumber/league/:league
 * @desc    Buscar partidas de uma rodada específica
 * @query   forceSync=true para forçar sincronização com API
 * @access  Public/Protected
 */
router.get(
  "/round/:roundNumber/league/:league",
  protect,
  matchController.getMatchesByRound
);

/**
 * @route   GET /api/matches/live/:league
 * @desc    Buscar partidas ao vivo de uma liga
 * @access  Public/Protected
 */
router.get("/live/:league", protect, matchController.getLiveMatches);

/**
 * @route   GET /api/matches/upcoming/:league
 * @desc    Buscar próximas partidas de uma liga
 * @query   limit=10 (padrão)
 * @access  Public/Protected
 */
router.get("/upcoming/:league", protect, matchController.getUpcomingMatches);

/**
 * @route   GET /api/matches/team/:teamId
 * @desc    Buscar partidas de um time específico
 * @query   league, round (opcionais)
 * @access  Public/Protected
 */
router.get("/team/:teamId", protect, matchController.getMatchesByTeam);

/**
 * @route   GET /api/matches/stats/:league
 * @desc    Obter estatísticas das partidas de uma liga
 * @access  Public/Protected
 */
router.get("/stats/:league", protect, matchController.getMatchStats);

/**
 * @route   GET /api/matches/:matchId
 * @desc    Buscar uma partida específica por ID
 * @access  Public/Protected
 */
router.get("/:matchId", protect, matchController.getMatchById);

// ============= ROTAS PROTEGIDAS (Requerem Autenticação) =============

/**
 * @route   PUT /api/matches/:matchId/update
 * @desc    Atualizar resultado de uma partida da API
 * @access  Protected
 */
router.put("/:matchId/update", protect, matchController.updateMatchResult);

/**
 * @route   POST /api/matches/sync
 * @desc    Sincronizar partidas de uma rodada com a API
 * @body    { league: string, round: number }
 * @access  Protected
 */
router.post("/sync", protect, matchController.syncMatches);

module.exports = router;
