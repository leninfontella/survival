const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  isReady: {
    type: Boolean,
    default: false,
  },
  isEliminated: {
    type: Boolean,
    default: false,
  },
  eliminatedAt: {
    type: Date,
  },
  eliminatedRound: {
    type: Number,
  },
  selectedTeams: [
    {
      teamId: {
        type: String, // ID do time na API externa (TheSportsDB)
        required: true,
      },
      teamName: {
        type: String,
        required: true,
      },
      round: {
        type: Number,
        required: true,
      },
      won: {
        type: Boolean,
        default: null, // null = ainda não verificado, true = venceu, false = perdeu/empatou
      },
      selectedAt: {
        type: Date,
        default: Date.now,
      },
      matchResult: {
        homeTeam: String,
        awayTeam: String,
        homeScore: Number,
        awayScore: Number,
        verifiedAt: Date,
      },
    },
  ],
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded"],
    default: "pending",
  },
  paymentId: {
    type: String,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// Índices compostos para garantir unicidade e otimizar queries
PlayerSchema.index({ user: 1, room: 1 }, { unique: true });
PlayerSchema.index({ room: 1, isEliminated: 1 });

// Método para verificar se o jogador selecionou time na rodada atual
PlayerSchema.methods.hasSelectedTeamForRound = function (round) {
  return this.selectedTeams.some((selection) => selection.round === round);
};

// Método para obter a seleção da rodada atual
PlayerSchema.methods.getSelectionForRound = function (round) {
  return this.selectedTeams.find((selection) => selection.round === round);
};

// Método para obter times já usados (IDs)
PlayerSchema.methods.getUsedTeamIds = function () {
  return this.selectedTeams.map((selection) => selection.teamId);
};

// Método para verificar se pode selecionar um time
PlayerSchema.methods.canSelectTeam = function (teamId, currentRound) {
  // Verificar se já foi eliminado
  if (this.isEliminated) return false;

  // Verificar se já selecionou para esta rodada
  if (this.hasSelectedTeamForRound(currentRound)) return false;

  // Verificar se o time já foi usado
  const usedTeamIds = this.getUsedTeamIds();
  if (usedTeamIds.includes(teamId)) return false;

  return true;
};

module.exports = mongoose.model("Player", PlayerSchema);
