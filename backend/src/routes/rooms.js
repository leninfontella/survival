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
} = require("../controllers/roomController");
const { protect, optionalAuth } = require("../middleware/auth");

// Rotas com autenticação opcional (para verificar privacidade)
router.get("/", optionalAuth, getRooms);
router.get("/:id", optionalAuth, getRoomById);

// Rotas protegidas (requerem autenticação)
router.post("/", protect, createRoom);
router.post("/:id/join", protect, joinRoom);
router.put("/:id/toggle-ready", protect, toggleReady);
router.put("/:id/start", protect, startRoom);
router.post("/:id/select-team", protect, selectTeam);
router.get("/:id/used-teams", protect, getUsedTeams);

module.exports = router;
