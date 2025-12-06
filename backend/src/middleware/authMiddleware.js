const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware de proteção - bloqueia acesso sem token
exports.protect = async (req, res, next) => {
  let token;

  // Verificar se token existe no header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Se não houver token, negar acesso
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Acesso negado. Faça login para continuar.",
      requiresAuth: true,
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não encontrado. Faça login novamente.",
        requiresAuth: true,
      });
    }

    next();
  } catch (error) {
    console.error("❌ Erro ao verificar token:", error);
    return res.status(401).json({
      success: false,
      message: "Token inválido ou expirado. Faça login novamente.",
      requiresAuth: true,
    });
  }
};

// Middleware opcional - permite acesso mas identifica usuário se logado
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    // Sem token, mas permite continuar
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
  } catch (error) {
    console.error("⚠️ Token inválido, mas permitindo acesso:", error.message);
    req.user = null;
  }

  next();
};
