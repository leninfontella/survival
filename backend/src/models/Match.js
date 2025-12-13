const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
  // ID da partida na API-Football
  apiMatchId: {
    type: Number,
    required: true,
    unique: true,
  },

  // Liga
  league: {
    type: String,
    required: true,
    enum: ["brasil", "espanha", "inglaterra", "alemanha", "italia", "franca"],
  },

  // Informações da liga na API
  leagueInfo: {
    apiLeagueId: Number,
    name: String,
    season: Number,
  },

  // Rodada
  round: {
    type: Number,
    required: true,
  },

  // Time mandante
  homeTeam: {
    apiTeamId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    logo: String,
  },

  // Time visitante
  awayTeam: {
    apiTeamId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    logo: String,
  },

  // Data e horário da partida
  date: {
    type: Date,
    required: true,
  },

  // Status da partida
  status: {
    type: String,
    enum: ["scheduled", "live", "finished", "postponed", "cancelled"],
    default: "scheduled",
  },

  // Status detalhado da API
  statusDetail: {
    short: String, // NS, 1H, HT, 2H, ET, FT, etc
    long: String,
    elapsed: Number,
  },

  // Resultado
  result: {
    home: {
      type: Number,
      default: null,
    },
    away: {
      type: Number,
      default: null,
    },
    winner: {
      type: String,
      enum: ["home", "away", "draw", null],
      default: null,
    },
  },

  // Dados adicionais da partida
  venue: {
    name: String,
    city: String,
  },

  // Controle de atualização
  lastUpdated: {
    type: Date,
    default: Date.now,
  },

  // Cache da resposta completa da API (opcional)
  apiResponse: {
    type: mongoose.Schema.Types.Mixed,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Índices para otimizar buscas
MatchSchema.index({ league: 1, round: 1 });
MatchSchema.index({ date: 1 });
MatchSchema.index({ status: 1 });
MatchSchema.index({ "homeTeam.apiTeamId": 1 });
MatchSchema.index({ "awayTeam.apiTeamId": 1 });

// Método para determinar o vencedor
MatchSchema.methods.updateWinner = function () {
  if (this.result.home === null || this.result.away === null) {
    this.result.winner = null;
  } else if (this.result.home > this.result.away) {
    this.result.winner = "home";
  } else if (this.result.away > this.result.home) {
    this.result.winner = "away";
  } else {
    this.result.winner = "draw";
  }
};

// Método para verificar se a partida está finalizada
MatchSchema.methods.isFinished = function () {
  return this.status === "finished";
};

// Método para verificar se está ao vivo
MatchSchema.methods.isLive = function () {
  return this.status === "live";
};

module.exports = mongoose.model("Match", MatchSchema);
