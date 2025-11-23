const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Por favor, insira seu nome"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Por favor, insira seu email"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Por favor, insira um email válido",
    ],
  },
  password: {
    type: String,
    required: [true, "Por favor, insira uma senha"],
    minlength: [6, "A senha deve ter pelo menos 6 caracteres"],
    select: false, // Não retorna a senha por padrão nas queries
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  stats: {
    totalRooms: {
      type: Number,
      default: 0,
    },
    roomsWon: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
  },
});

// Criptografar senha antes de salvar
UserSchema.pre("save", async function (next) {
  // Só criptografa se a senha foi modificada
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar senha
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
