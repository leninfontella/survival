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

module.exports = mongoose.model("Room", RoomSchema);
