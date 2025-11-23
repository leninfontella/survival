const express = require("express");
const router = express.Router();
const { signup, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Rotas públicas
router.post("/signup", signup);
router.post("/login", login);

// Rotas protegidas
router.get("/me", protect, getMe);

module.exports = router;
