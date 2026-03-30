import express from "express";
import jwt from "jsonwebtoken";
import { generateCsrfToken } from "../utils/csrf.js";
import { loginGuard, loginFailed, loginSuccess } from "../utils/loginGuard.js";
import User from "../models/User.js";

const router = express.Router();

const JWT_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};

const CSRF_COOKIE = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "กรุณากรอก username และ password" });

  // ── 1. ตรวจ brute-force ก่อนแตะ DB ──────────────────────────────────────
  const guard = loginGuard(username);
  if (guard.blocked) return res.status(429).json({ message: guard.message });

  try {
    const user = await User.findOne({ username, isActive: true });

    // ── 2. username ไม่มี หรือ password ผิด → นับ attempt ──────────────────
    if (!user) {
      loginFailed(username);
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const attempts = loginFailed(username);
      const remaining = Math.max(0, 5 - attempts);
      return res.status(401).json({
        message: `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง${
          remaining > 0
            ? ` (เหลืออีก ${remaining} ครั้ง)`
            : " — บัญชีถูกล็อคชั่วคราว"
        }`,
      });
    }

    // ── 3. login สำเร็จ → reset attempt counter ──────────────────────────
    loginSuccess(username);

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const csrfToken = generateCsrfToken();
    res.cookie("token", token, JWT_COOKIE);
    res.cookie("csrf_token", csrfToken, CSRF_COOKIE);

    res.json({ success: true, user: user.toJSON(), csrfToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.clearCookie("csrf_token", { path: "/" });
  res.json({ success: true });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "ไม่ได้เข้าสู่ระบบ" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "ไม่พบผู้ใช้" });

    const csrfToken = generateCsrfToken();
    res.cookie("csrf_token", csrfToken, CSRF_COOKIE);

    res.json({ success: true, user, csrfToken });
  } catch (err) {
    console.error("JWT verify error:", err);
    res.clearCookie("token", { path: "/" });
    res.clearCookie("csrf_token", { path: "/" });
    res.status(401).json({ message: "Session หมดอายุ" });
  }
});

export default router;
