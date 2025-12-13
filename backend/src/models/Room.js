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

  // 🆕 NOVO: Referências às partidas reais de cada rodada
  rounds: [
    {
      roundNumber: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: ["upcoming", "selecting", "playing", "finished"],
        default: "upcoming",
      },
      // Referência às partidas da API-Football desta rodada
      matches: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Match",
        },
      ],
      // Deadline para seleção (antes do primeiro jogo da rodada)
      selectionDeadline: {
        type: Date,
      },
      // Data de início (primeiro jogo da rodada)
      startDate: {
        type: Date,
      },
      // Data de fim (último jogo da rodada)
      endDate: {
        type: Date,
      },
      // Processada (resultados aplicados)
      processed: {
        type: Boolean,
        default: false,
      },
      processedAt: {
        type: Date,
      },
    },
  ],

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

// 🆕 Método para obter rodada atual
RoomSchema.methods.getCurrentRound = function () {
  return this.rounds.find((r) => r.roundNumber === this.currentRound);
};

// 🆕 Método para verificar se a rodada pode ser processada
RoomSchema.methods.canProcessRound = function (roundNumber) {
  const round = this.rounds.find((r) => r.roundNumber === roundNumber);
  if (!round) return false;

  // Todas as partidas da rodada devem estar finalizadas
  return round.status === "playing" && !round.processed;
};

// 🆕 Método para verificar se todas as seleções foram feitas
RoomSchema.methods.allPlayersSelected = async function (roundNumber) {
  await this.populate("players");

  const activePlayers = this.players.filter((p) => !p.isEliminated);

  return activePlayers.every((player) => {
    return player.selectedTeams.some((st) => st.round === roundNumber);
  });
};

module.exports = mongoose.model("Room", RoomSchema);
