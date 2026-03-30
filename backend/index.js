import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import walletRoutes from "./routes/wallet.js";
import depositRoutes from "./routes/deposit.js";
import withdrawRoutes from "./routes/withdraw.js";
import totpRoutes from "./routes/totp.js";
import userRoutes from "./routes/user.js";

import "./db.js";

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// 1. Helmet — ปิด HTTP header ที่เสี่ยง (XSS, clickjacking, sniffing ฯลฯ)
// ─────────────────────────────────────────────────────────────────────────────
app.use(helmet());

// ─────────────────────────────────────────────────────────────────────────────
// 2. CORS — อ่านจาก env ไม่ hardcode
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // อนุญาต server-to-server (origin = undefined) และ origin ที่อยู่ใน whitelist
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Cookie parser
// ─────────────────────────────────────────────────────────────────────────────
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────────────────────
// 4. Session — secret จาก env, ไม่ hardcode
// ─────────────────────────────────────────────────────────────────────────────
if (!process.env.SESSION_SECRET) {
  throw new Error("❌ SESSION_SECRET is not set in .env");
}
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true อัตโนมัติเมื่อ production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 2, // 2 ชั่วโมง
    },
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Request size limit — ป้องกัน payload flooding
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─────────────────────────────────────────────────────────────────────────────
// 6. Rate Limiters
// ─────────────────────────────────────────────────────────────────────────────

// 6a. Auth — เข้มงวดมาก (brute-force login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 100,
  message: { message: "คำขอมากเกินไป กรุณารอ 15 นาที" },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`🚨 Rate limit hit: ${req.ip} → ${req.path}`);
    res.status(429).json({ message: "คำขอมากเกินไป กรุณารอ 15 นาที" });
  },
});

// 6b. API ทั่วไป
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 นาที
  max: 60,
  message: { message: "คำขอมากเกินไป กรุณารอสักครู่" },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`🚨 Rate limit hit: ${req.ip} → ${req.path}`);
    res.status(429).json({ message: "คำขอมากเกินไป กรุณารอ 15 นาที" });
  },
});

// 6c. Payment actions (create deposit/withdraw) — ป้องกัน spam order
const paymentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 นาที
  max: 10,
  message: { message: "ทำรายการถี่เกินไป กรุณารอสักครู่" },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`🚨 Rate limit hit: ${req.ip} → ${req.path}`);
    res.status(429).json({ message: "คำขอมากเกินไป กรุณารอ 15 นาที" });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. IP Whitelist middleware สำหรับ Callback/Webhook
//    กำหนด GATEWAY_CALLBACK_IPS=1.2.3.4,5.6.7.8 ใน .env
// ─────────────────────────────────────────────────────────────────────────────
app.set("trust proxy", 1); // เชื่อ proxy 1 ชั้น (nginx)
const GATEWAY_IPS = (process.env.GATEWAY_CALLBACK_IPS || "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

function gatewayIpWhitelist(req, res, next) {
  // ถ้าไม่ได้กำหนด IP → ข้ามการเช็ค (dev mode)
  if (GATEWAY_IPS.length === 0) return next();

  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress;

  if (!GATEWAY_IPS.includes(clientIp)) {
    console.warn(`⛔ Callback blocked from IP: ${clientIp}`);
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Routes
//    Callback/Webhook — วางก่อน express.json() เพื่อรับ raw body
//    และล้อมด้วย IP whitelist
// ─────────────────────────────────────────────────────────────────────────────

// Webhooks (raw body, IP whitelist, ไม่มี rate limit เพราะ gateway เรียกมา)
app.use("/api/deposit/callback", gatewayIpWhitelist, depositRoutes);
app.use("/api/withdraw/callback", gatewayIpWhitelist, withdrawRoutes);

// Routes ทั่วไป (หลัง express.json())
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/totp", apiLimiter, totpRoutes);
app.use("/api/wallet", apiLimiter, walletRoutes);
app.use("/api/users", apiLimiter, userRoutes);
  
// Payment routes แยก limiter เข้มกว่า
app.use("/api/deposit", apiLimiter, depositRoutes);
app.use("/api/withdraw", apiLimiter, withdrawRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// 9. Global error handler
// ─────────────────────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  // CORS error
  if (err.message?.startsWith("CORS blocked")) {
    return res.status(403).json({ message: err.message });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
