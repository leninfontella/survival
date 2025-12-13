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

  // 🆕 ATUALIZADO: Incluir dados da partida real
  selectedTeams: [
    {
      // ID do time no sistema interno (pode ser diferente da API)
      teamId: {
        type: String,
        required: true,
      },
      teamName: {
        type: String,
        required: true,
      },
      // 🆕 NOVO: ID do time na API-Football
      apiTeamId: {
        type: Number,
      },
      round: {
        type: Number,
        required: true,
      },
      // 🆕 NOVO: Referência à partida real da API-Football
      match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
      // 🆕 NOVO: Informações da partida no momento da seleção
      matchInfo: {
        opponent: String, // Nome do adversário
        isHome: Boolean, // Se o time selecionado é mandante
        date: Date, // Data da partida
      },
      // Resultado
      won: {
        type: Boolean,
        default: null,
      },
      // 🆕 NOVO: Resultado detalhado
      result: {
        yourTeamGoals: Number,
        opponentGoals: Number,
        matchStatus: String, // finished, live, scheduled
      },
      // Data da seleção
      selectedAt: {
        type: Date,
        default: Date.now,
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

// Índice composto para garantir que um usuário não entre duas vezes na mesma sala
PlayerSchema.index({ user: 1, room: 1 }, { unique: true });

// 🆕 Método para verificar se o jogador já selecionou na rodada
PlayerSchema.methods.hasSelectedInRound = function (round) {
  return this.selectedTeams.some((st) => st.round === round);
};

// 🆕 Método para obter times já usados
PlayerSchema.methods.getUsedTeamIds = function () {
  return this.selectedTeams.map((st) => st.teamId);
};

// 🆕 Método para obter seleção de uma rodada específica
PlayerSchema.methods.getSelectionForRound = function (round) {
  return this.selectedTeams.find((st) => st.round === round);
};

module.exports = mongoose.model("Player", PlayerSchema);
