const User = require("../models/User");
const { generateToken } = require("../middleware/auth");

// @desc    Registrar novo usuário
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar se todos os campos foram preenchidos
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor, preencha todos os campos",
      });
    }

    // Verificar se o usuário já existe
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Email já cadastrado",
      });
    }

    // Criar usuário
    const user = await User.create({
      name,
      email,
      password,
    });

    // Gerar token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Cadastro realizado com sucesso!",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          stats: user.stats,
        },
      },
    });
  } catch (error) {
    console.error("Erro no signup:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar conta. Tente novamente.",
      error: error.message,
    });
  }
};

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar se email e senha foram fornecidos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor, forneça email e senha",
      });
    }

    // Buscar usuário e incluir senha (por padrão ela não vem)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou senha incorretos",
      });
    }

    // Verificar senha
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Email ou senha incorretos",
      });
    }

    // Atualizar último login
    user.lastLogin = Date.now();
    await user.save();

    // Gerar token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login realizado com sucesso!",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          stats: user.stats,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao fazer login. Tente novamente.",
      error: error.message,
    });
  }
};

// @desc    Obter usuário autenticado
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        stats: user.stats,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao buscar dados do usuário",
      error: error.message,
    });
  }
};
