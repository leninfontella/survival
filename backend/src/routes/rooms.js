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
  deleteRoom,
} = require("../controllers/roomController");
const { protect, optionalAuth } = require("../middleware/auth");

router.get("/", optionalAuth, getRooms);
router.get("/:id", optionalAuth, getRoomById); // ⚠️ Retorna 401 se privada e não logado

// 🔒 Rotas protegidas (REQUEREM autenticação obrigatória)
router.post("/", protect, createRoom);
router.post("/:id/join", protect, joinRoom); // 🚨 OBRIGATÓRIO LOGIN
router.put("/:id/toggle-ready", protect, toggleReady);
router.put("/:id/start", protect, startRoom);
router.post("/:id/select-team", protect, selectTeam);
router.get("/:id/used-teams", protect, getUsedTeams);
router.delete("/:id", protect, deleteRoom);

module.exports = router;
