import express from "express";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import crypto from "crypto";
import { createClient } from "redis";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Redis Client
// ─────────────────────────────────────────────────────────────────────────────
const redis = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
redis.on("error", (err) => console.error("Redis error:", err));
await redis.connect();

// ─────────────────────────────────────────────────────────────────────────────
// AES-256 Encryption สำหรับ totpSecret ใน DB
// กำหนด TOTP_ENCRYPT_KEY=<64 hex chars> ใน .env
// สร้างด้วย: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// ─────────────────────────────────────────────────────────────────────────────
if (!process.env.TOTP_ENCRYPT_KEY || process.env.TOTP_ENCRYPT_KEY.length !== 64) {
  throw new Error("❌ TOTP_ENCRYPT_KEY ต้องเป็น hex string ขนาด 64 ตัวอักษร (32 bytes)");
}
const ENCRYPT_KEY = Buffer.from(process.env.TOTP_ENCRYPT_KEY, "hex");
const IV_LENGTH = 16;

function encryptSecret(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPT_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptSecret(stored) {
  const [ivHex, encHex] = stored.split(":");
  if (!ivHex || !encHex) throw new Error("Invalid encrypted secret format");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPT_KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limit Helpers (Redis-backed)
// ─────────────────────────────────────────────────────────────────────────────

// QR Setup: สูงสุด 3 ครั้ง / 10 นาที
const SETUP_MAX = 3;
const SETUP_WINDOW_SEC = 10 * 60;

async function checkSetupRateLimit(userId) {
  const key = `totp:setup:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, SETUP_WINDOW_SEC);
  if (count > SETUP_MAX) {
    const ttl = await redis.ttl(key);
    return { blocked: true, message: `ขอ QR บ่อยเกินไป กรุณารอ ${ttl} วินาที` };
  }
  return { blocked: false };
}

// TOTP Verify Attempt: สูงสุด 5 ครั้ง / 5 นาที (กัน brute-force)
const TOTP_MAX = 5;
const TOTP_WINDOW_SEC = 5 * 60;

async function checkTotpAttempt(userId, action) {
  const key = `totp:attempt:${action}:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, TOTP_WINDOW_SEC);
  if (count > TOTP_MAX) {
    const ttl = await redis.ttl(key);
    return { blocked: true, message: `ลองผิดบ่อยเกินไป กรุณารอ ${ttl} วินาที` };
  }
  return { blocked: false };
}

async function resetTotpAttempt(userId, action) {
  await redis.del(`totp:attempt:${action}:${userId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/totp/setup
// สร้าง secret ใหม่ + ส่ง QR URL กลับ (ไม่ส่ง secret plain text)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/setup", requireAuth, async (req, res) => {
  try {
    const userId = req.user._id ?? req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    if (user.totpEnabled) return res.status(400).json({ message: "เปิดใช้ 2FA แล้ว" });

    // Rate limit
    const limit = await checkSetupRateLimit(userId);
    if (limit.blocked) return res.status(429).json({ message: limit.message });

    const secret = speakeasy.generateSecret({
      name: `CubixPay (${user.username})`,
      length: 20,
    });

    // ✅ เข้ารหัส secret ก่อนเก็บ DB
    user.totpSecret = encryptSecret(secret.base32);
    await user.save();

    const qrUrl = await qrcode.toDataURL(secret.otpauth_url);

    // ✅ ไม่ส่ง secret plain text กลับ — ส่งแค่ QR
    // หากต้องการ manual entry ให้ส่ง secret เฉพาะช่วง setup นี้เท่านั้น
    // และ frontend ต้องไม่ log หรือ cache ค่านี้
    res.json({ qrUrl, manualKey: secret.base32 });
  } catch (err) {
    console.error("TOTP setup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/totp/enable
// ยืนยัน OTP token แล้วเปิดใช้ 2FA
// ─────────────────────────────────────────────────────────────────────────────
router.post("/enable", requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user._id ?? req.user.id;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "กรุณาระบุ token" });
    }

    // ✅ Rate limit ก่อน verify
    const limit = await checkTotpAttempt(userId, "enable");
    if (limit.blocked) return res.status(429).json({ message: limit.message });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    if (!user.totpSecret) return res.status(400).json({ message: "ยังไม่ได้ setup 2FA" });
    if (user.totpEnabled) return res.status(400).json({ message: "เปิดใช้ 2FA แล้ว" });

    // ✅ Decrypt ก่อน verify
    const rawSecret = decryptSecret(user.totpSecret);

    const valid = speakeasy.totp.verify({
      secret: rawSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!valid) {
      console.warn(`⚠️ TOTP enable failed for userId: ${userId}`);
      return res.status(400).json({ message: "รหัส OTP ไม่ถูกต้อง" });
    }

    // ✅ Reset attempt counter เมื่อสำเร็จ
    await resetTotpAttempt(userId, "enable");

    user.totpEnabled = true;
    await user.save();

    // ✅ Invalidate session → บังคับ login ใหม่พร้อม 2FA
    req.session.destroy();
    res.clearCookie("connect.sid");

    res.json({ message: "เปิดใช้ 2FA สำเร็จ กรุณา login ใหม่" });
  } catch (err) {
    console.error("TOTP enable error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/totp/disable
// ยืนยัน OTP token แล้วปิด 2FA
// ─────────────────────────────────────────────────────────────────────────────
router.post("/disable", requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user._id ?? req.user.id;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "กรุณาระบุ token" });
    }

    // ✅ Rate limit
    const limit = await checkTotpAttempt(userId, "disable");
    if (limit.blocked) return res.status(429).json({ message: limit.message });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    if (!user.totpEnabled) return res.status(400).json({ message: "ยังไม่ได้เปิด 2FA" });

    // ✅ Decrypt ก่อน verify
    const rawSecret = decryptSecret(user.totpSecret);

    const valid = speakeasy.totp.verify({
      secret: rawSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!valid) {
      console.warn(`⚠️ TOTP disable failed for userId: ${userId}`);
      return res.status(400).json({ message: "รหัส OTP ไม่ถูกต้อง" });
    }

    // ✅ Reset attempt counter
    await resetTotpAttempt(userId, "disable");

    user.totpSecret = null;
    user.totpEnabled = false;
    await user.save();

    // ✅ Invalidate session → บังคับ login ใหม่
    req.session.destroy();
    res.clearCookie("connect.sid");

    res.json({ message: "ปิด 2FA สำเร็จ กรุณา login ใหม่" });
  } catch (err) {
    console.error("TOTP disable error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/totp/status
// ─────────────────────────────────────────────────────────────────────────────
router.get("/status", requireAuth, async (req, res) => {
  try {
    const userId = req.user._id ?? req.user.id;
    const user = await User.findById(userId).select("totpEnabled");
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    res.json({ totpEnabled: user.totpEnabled ?? false });
  } catch (err) {
    console.error("TOTP status error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;