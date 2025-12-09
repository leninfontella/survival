const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Por favor, insira o nome da sala"],
    trim: true,
  },
  league: {
    type: String,
    required: true,
    enum: ["brasil", "espanha", "inglaterra", "alemanha", "italia", "franca"],
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["waiting", "active", "finished"],
    default: "waiting",
  },
  currentRound: {
    type: Number,
    default: 0,
  },
  totalRounds: {
    type: Number,
    required: true,
    min: 1,
  },
  minPlayers: {
    type: Number,
    required: true,
    min: 2,
  },
  entryPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  prizePool: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
  ],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
  },
  // 🆕 NOVOS CAMPOS PARA CONTROLE DE RESULTADOS
  lastResultsCheck: {
    type: Date,
    default: null,
    index: true,
  },
  roundsData: [
    {
      round: Number,
      startedAt: Date,
      completedAt: Date,
      matchesFinished: Boolean,
      survivors: Number,
      eliminated: Number,
    },
  ],
  autoAdvanceEnabled: {
    type: Boolean,
    default: true, // Habilita avanço automático de rodadas
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  startedAt: {
    type: Date,
  },
  finishedAt: {
    type: Date,
  },
});

// Calcular prize pool automaticamente
RoomSchema.pre("save", function (next) {
  if (this.isModified("players") || this.isModified("entryPrice")) {
    this.prizePool = this.players.length * this.entryPrice;
  }
  next();
});

// 🆕 Método para registrar dados da rodada
RoomSchema.methods.recordRoundData = function (survivors, eliminated) {
  const existingRound = this.roundsData.find(
    (r) => r.round === this.currentRound
  );

  if (existingRound) {
    existingRound.completedAt = Date.now();
    existingRound.matchesFinished = true;
    existingRound.survivors = survivors;
    existingRound.eliminated = eliminated;
  } else {
    this.roundsData.push({
      round: this.currentRound,
      startedAt: Date.now(),
      completedAt: Date.now(),
      matchesFinished: true,
      survivors,
      eliminated,
    });
  }
};

// 🆕 Método para verificar se pode avançar rodada
RoomSchema.methods.canAdvanceRound = function () {
  if (!this.autoAdvanceEnabled) return false;
  if (this.status !== "active") return false;
  if (this.currentRound >= this.totalRounds) return false;

  // Verificar se os resultados da rodada atual foram processados
  const currentRoundData = this.roundsData.find(
    (r) => r.round === this.currentRound
  );

  return currentRoundData && currentRoundData.matchesFinished;
};

// Índices para performance
RoomSchema.index({ status: 1, league: 1 });
RoomSchema.index({ createdBy: 1 });
RoomSchema.index({ status: 1, lastResultsCheck: 1 }); // Para o cron job

module.exports = mongoose.model("Room", RoomSchema);
