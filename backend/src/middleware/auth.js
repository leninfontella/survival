const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Proteger rotas - verificar se está autenticado (OBRIGATÓRIO)
exports.protect = async (req, res, next) => {
  let token;

  // Verificar se o token está no header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Verificar se o token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Não autorizado. Por favor, faça login.",
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adicionar usuário à requisição
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não encontrado.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token inválido ou expirado.",
    });
  }
};

// Autenticação OPCIONAL - tenta autenticar, mas permite continuar sem token
exports.optionalAuth = async (req, res, next) => {
  let token;

  // Verificar se o token está no header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Se não houver token, continua sem autenticação
  if (!token) {
    console.log("⚠️ Nenhum token fornecido - continuando sem autenticação");
    req.user = null;
    return next();
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adicionar usuário à requisição
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.log("⚠️ Usuário não encontrado - continuando sem autenticação");
      req.user = null;
    } else {
      console.log("✅ Usuário autenticado:", req.user.name);
    }

    next();
  } catch (error) {
    // Se o token for inválido, continua sem autenticação (não retorna erro)
    console.log("⚠️ Token inválido - continuando sem autenticação");
    req.user = null;
    next();
  }
};

// Gerar JWT Token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};
