const express = require("express");
const router = express.Router();
const {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  startRoom,
  selectTeam,
  getUsedTeams,
} = require("../controllers/roomController");
const { protect } = require("../middleware/auth");

// Rotas públicas
router.get("/", getRooms);
router.get("/:id", getRoomById);

// Rotas protegidas
router.post("/", protect, createRoom);
router.post("/:id/join", protect, joinRoom);
router.put("/:id/start", protect, startRoom);
router.post("/:id/select-team", protect, selectTeam);
router.get("/:id/used-teams", protect, getUsedTeams);

module.exports = router;
