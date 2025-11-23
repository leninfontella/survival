const express = require("express");
const router = express.Router();
const {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  startRoom,
} = require("../controllers/roomController");
const { protect } = require("../middleware/auth");

// Rotas públicas
router.get("/", getRooms);
router.get("/:id", getRoomById);

// Rotas protegidas
router.post("/", protect, createRoom);
router.post("/:id/join", protect, joinRoom);
router.put("/:id/start", protect, startRoom);

module.exports = router;
