require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

// Conectar ao banco de dados
connectDB();

// Inicializar app
const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============= ROTAS =============
app.use("/api/auth", require("./routes/auth"));
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/matches", require("./routes/matches")); // 🆕 Nova rota de partidas
app.use("/api/leagues", require("./routes/leagues"));

// Rota de teste
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Brasileirão Survivor está rodando!",
    version: "2.0.0",
    endpoints: {
      auth: "/api/auth",
      rooms: "/api/rooms",
      stats: "/api/stats",
      matches: "/api/matches", // 🆕
    },
    features: {
      realTimeMatches: true,
      apiFootball: process.env.RAPIDAPI_KEY
        ? "✅ Configured"
        : "❌ Not configured",
    },
  });
});

// ============= INICIAR JOBS DE ATUALIZAÇÃO =============
// Importar e iniciar os jobs de atualização de partidas
if (process.env.NODE_ENV !== "test") {
  const matchUpdater = require("./jobs/updateMatches");
  console.log("⚽ Jobs de atualização de partidas iniciados");
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Algo deu errado!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada",
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(
    `⚽ API-Football: ${
      process.env.RAPIDAPI_KEY ? "✅ Configurada" : "❌ Não configurada"
    }`
  );
  console.log("=".repeat(60));
});
