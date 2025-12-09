const express = require("express");
const router = express.Router();
const {
  getMatchesByRound,
  getMatchDetails,
  getTeamsByLeague,
  checkMatchResult,
  getNextMatches,
  getLastMatches,
  forceCheckRoom,
  getCheckerStatus,
} = require("../controllers/matchResults.controller");
const { protect } = require("../middleware/auth");

// Rotas públicas
router.get("/matches/:league/:round", getMatchesByRound);
router.get("/match/:matchId", getMatchDetails);
router.get("/teams/:league", getTeamsByLeague);
router.get("/check/:matchId/:teamId", checkMatchResult);
router.get("/next/:teamId", getNextMatches);
router.get("/last/:teamId", getLastMatches);
router.get("/checker-status", getCheckerStatus);

// Rotas protegidas
router.post("/check-room/:roomId", protect, forceCheckRoom);

module.exports = router;
