// ────────────────────────────────────────────────────────────────
// auth.js - Login + 2FA
// ────────────────────────────────────────────────────────────────
import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import { generateCsrfToken } from "../utils/csrf.js";
import { loginGuard, loginFailed, loginSuccess } from "../utils/loginGuard.js";
import User from "../models/User.js";
import { decryptSecret } from "../utils/totpUtils.js"; // ฟังก์ชัน decrypt จาก TOTP module

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

// ── POST /api/auth/login ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "กรุณากรอก username และ password" });

  // ตรวจ brute-force ก่อนแตะ DB
  const guard = loginGuard(username);
  if (guard.blocked) return res.status(429).json({ message: guard.message });

  try {
    const user = await User.findOne({ username, isActive: true });
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

    // ถ้าเปิดใช้ 2FA → สร้าง temp token และบังคับ OTP
    if (user.totpEnabled) {
      const tempToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(tempToken)
        .digest("hex");

      user.twoFactorTempToken = hashedToken;
      user.twoFactorTempTokenExpires = Date.now() + 10 * 60 * 1000; // 10 นาที
      await user.save();

      // ส่ง temp token ผ่าน httpOnly cookie เท่านั้น
      res.cookie("2fa_temp_token", tempToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60 * 1000,
        path: "/",
      });

      return res.status(200).json({
        requiresTwoFactor: true,
        message: "กรุณากรอกรหัส 2FA",
      });
    }

    // login ปกติ → reset attempt
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

// ── POST /api/auth/2fa-verify ─────────────────────────────────────────
router.post("/2fa/verify", async (req, res) => {
  const tempToken = req.cookies?.["2fa_temp_token"];
  const { otp } = req.body;

  if (!tempToken || !otp)
    return res.status(400).json({ message: "กรุณาส่ง tempToken และ OTP" });

  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(tempToken)
      .digest("hex");
    const user = await User.findOne({
      twoFactorTempToken: hashedToken,
      twoFactorTempTokenExpires: { $gt: Date.now() },
    });

    if (!user || !user.totpEnabled)
      return res
        .status(400)
        .json({ message: "ไม่พบผู้ใช้หรือ 2FA ไม่ได้เปิด" });

    const rawSecret = decryptSecret(user.totpSecret);

    const valid = speakeasy.totp.verify({
      secret: rawSecret,
      encoding: "base32",
      token: otp,
      window: 1,
    });
    console.log("TOTP verification result:", valid);
    if (!valid) return res.status(401).json({ message: "OTP ไม่ถูกต้อง" });

    // ✅ ล้าง temp token
    user.twoFactorTempToken = null;
    user.twoFactorTempTokenExpires = null;
    user.lastLoginAt = new Date();
    await user.save();

    res.clearCookie("2fa_temp_token", { path: "/" });

    // สร้าง JWT ตัวจริง
    const authToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    const csrfToken = generateCsrfToken();

    res.cookie("token", authToken, JWT_COOKIE);
    res.cookie("csrf_token", csrfToken, CSRF_COOKIE);

    res.json({ success: true, user: user.toJSON(), csrfToken });
  } catch (err) {
    console.error("2FA verify error:", err);
    res.status(401).json({ message: "Session หมดอายุหรือไม่ถูกต้อง" });
  }
});

// ── POST /api/auth/logout ──────────────────────────────────────────────
router.post("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.clearCookie("csrf_token", { path: "/" });
  res.clearCookie("2fa_temp_token", { path: "/" });
  res.json({ success: true });
});

// ── GET /api/auth/me ───────────────────────────────────────────────────
router.get("/me", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "ไม่ได้เข้าสู่ระบบ" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "-password -totpSecret"
    );
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
