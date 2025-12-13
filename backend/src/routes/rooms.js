const express = require("express");
const router = express.Router();

const {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  startRoom,
  toggleReady,
  selectTeam,
  getUsedTeams,
  getAvailableMatches,
  deleteRoom,
  processRound, // 🆕 API-Football
  updateRoomMatches, // 🆕 API-Football
} = require("../controllers/roomController");

const { protect, optionalAuth } = require("../middleware/auth");

// =====================================================
// ============= ROTAS PÚBLICAS / OPCIONAIS =============
// =====================================================

/**
 * @route   GET /api/rooms
 * @desc    Listar todas as salas
 * @access  Public (optionalAuth para salas privadas do usuário)
 */
router.get("/", optionalAuth, getRooms);

/**
 * @route   GET /api/rooms/:id
 * @desc    Obter sala por ID (valida privacidade)
 * @access  Public
 */
router.get("/:id", optionalAuth, getRoomById);

// =====================================================
// ================= ROTAS PROTEGIDAS ==================
// =====================================================

/**
 * @route   POST /api/rooms
 * @desc    Criar nova sala
 * @access  Private
 */
router.post("/", protect, createRoom);

/**
 * @route   POST /api/rooms/:id/join
 * @desc    Entrar em uma sala
 * @access  Private (login obrigatório)
 */
router.post("/:id/join", protect, joinRoom);

/**
 * @route   PUT /api/rooms/:id/toggle-ready
 * @desc    Alternar status "ready" do jogador
 * @access  Private
 */
router.put("/:id/toggle-ready", protect, toggleReady);

/**
 * @route   PUT /api/rooms/:id/start
 * @desc    Iniciar sala manualmente (apenas criador)
 * @desc    Sincroniza partidas da API-Football
 * @access  Private
 */
router.put("/:id/start", protect, startRoom);

/**
 * @route   POST /api/rooms/:id/select-team
 * @desc    Selecionar time da rodada atual
 * @access  Private
 */
router.post("/:id/select-team", protect, selectTeam);

/**
 * @route   GET /api/rooms/:id/used-teams
 * @desc    Listar times já utilizados pelo jogador
 * @access  Private
 */
router.get("/:id/used-teams", protect, getUsedTeams);

/**
 * @route   GET /api/rooms/:id/available-matches
 * @desc    Obter partidas reais disponíveis da rodada
 * @access  Private
 */
router.get("/:id/available-matches", protect, getAvailableMatches);

/**
 * @route   DELETE /api/rooms/:id
 * @desc    Excluir sala (apenas criador)
 * @access  Private
 */
router.delete("/:id", protect, deleteRoom);

// =====================================================
// ========== ROTAS AVANÇADAS - API FOOTBALL ============
// =====================================================

/**
 * @route   POST /api/rooms/:id/process-round
 * @desc    Processar resultados da rodada
 * @desc    Elimina jogadores com base nos resultados reais
 * @access  Private (criador ou sistema)
 */
router.post("/:id/process-round", protect, processRound);

/**
 * @route   PUT /api/rooms/:id/update-matches
 * @desc    Atualizar status das partidas da rodada atual
 * @access  Private
 */
router.put("/:id/update-matches", protect, updateRoomMatches);

module.exports = router;
