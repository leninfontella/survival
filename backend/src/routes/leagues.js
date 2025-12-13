const express = require("express");
const router = express.Router();
const { getLeagues } = require("../controllers/leagueController");

/**
 * @route   GET /api/leagues
 * @desc    Obter todas as ligas disponíveis
 * @access  Public
 */
router.get("/", getLeagues);

module.exports = router;
