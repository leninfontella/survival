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
        type: String,
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
        default: null,
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

module.exports = mongoose.model("Player", PlayerSchema);
