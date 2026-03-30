// totpUtils.js
import speakeasy from "speakeasy";
import crypto from "crypto";
import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.TOTP_ENCRYPT_KEY || process.env.TOTP_ENCRYPT_KEY.length !== 64) {
  throw new Error("❌ TOTP_ENCRYPT_KEY ต้องเป็น hex string ขนาด 64 ตัวอักษร (32 bytes)");
}
const ENCRYPT_KEY = Buffer.from(process.env.TOTP_ENCRYPT_KEY, "hex");
const IV_LENGTH = 16;

// ── Redis Client ───────────────────────────────────────────────
export const redis = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
redis.on("error", (err) => console.error("Redis error:", err));
await redis.connect();

// ── Encryption / Decryption ────────────────────────────────────
export function encryptSecret(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPT_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(stored) {
  const [ivHex, encHex] = stored.split(":");
  if (!ivHex || !encHex) throw new Error("Invalid encrypted secret format");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPT_KEY, iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

// ── Rate Limit Helpers ─────────────────────────────────────────
const SETUP_MAX = 3;
const SETUP_WINDOW_SEC = 10 * 60;
const TOTP_MAX = 5;
const TOTP_WINDOW_SEC = 5 * 60;

export async function checkSetupRateLimit(userId) {
  const key = `totp:setup:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, SETUP_WINDOW_SEC);
  if (count > SETUP_MAX) {
    const ttl = await redis.ttl(key);
    return { blocked: true, message: `ขอ QR บ่อยเกินไป กรุณารอ ${ttl} วินาที` };
  }
  return { blocked: false };
}

export async function checkTotpAttempt(userId, action) {
  const key = `totp:attempt:${action}:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, TOTP_WINDOW_SEC);
  if (count > TOTP_MAX) {
    const ttl = await redis.ttl(key);
    return { blocked: true, message: `ลองผิดบ่อยเกินไป กรุณารอ ${ttl} วินาที` };
  }
  return { blocked: false };
}

export async function resetTotpAttempt(userId, action) {
  await redis.del(`totp:attempt:${action}:${userId}`);
}

// ── TOTP Secret & OTP ─────────────────────────────────────────
export function generateTotpSecret(username) {
  return speakeasy.generateSecret({
    name: `CubixPay (${username})`,
    length: 20,
  });
}

export function verifyTotpToken(secret, token, window = 1) {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window,
  });
}