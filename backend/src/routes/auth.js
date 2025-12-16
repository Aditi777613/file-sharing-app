import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: "Missing fields" });
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ email, name, passwordHash });
    return res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token: signToken(user),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    return res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token: signToken(user),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", authRequired, (req, res) => {
  const { user } = req;
  return res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );
}

export default router;


