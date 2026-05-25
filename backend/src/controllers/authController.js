const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

const sendAuthResponse = (res, user, statusCode) => {
  const token = createToken(user._id);

  res.status(statusCode).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!["admin", "recruiter", "interviewer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role
    });

    logger.info("User registered", {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    sendAuthResponse(res, user, 201);
  } catch (error) {
    logger.error("Registration failed", {
      email: req.body?.email,
      error: error.message
    });
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      logger.warn("Login failed: user not found", { email: normalizedEmail });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      logger.warn("Login failed: invalid password", {
        userId: user._id.toString(),
        email: user.email
      });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    logger.info("User logged in", {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    sendAuthResponse(res, user, 200);
  } catch (error) {
    logger.error("Login failed unexpectedly", {
      email: req.body?.email,
      error: error.message
    });
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const getMe = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
};

module.exports = {
  register,
  login,
  getMe
};
