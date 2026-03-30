import jwt from "jsonwebtoken";
import { validateCsrfToken } from "../utils/csrf.js";

// GET ไม่ต้องเช็ค CSRF — แค่เช็ค JWT
export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token)
    return res.status(401).json({ message: "Unauthorized — กรุณาเข้าสู่ระบบ" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.clearCookie("token", { path: "/" });
    res.clearCookie("csrf_token", { path: "/" });
    return res.status(401).json({ message: "Session หมดอายุ" });
  }
}

// POST / PUT / DELETE ต้องเช็คทั้ง JWT + CSRF
export function requireAuthWithCsrf(req, res, next) {
  // 1. เช็ค JWT ก่อน
  const token = req.cookies?.token;
  if (!token)
    return res.status(401).json({ message: "Unauthorized — กรุณาเข้าสู่ระบบ" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.clearCookie("token", { path: "/" });
    res.clearCookie("csrf_token", { path: "/" });
    return res.status(401).json({ message: "Session หมดอายุ" });
  }

  // 2. เช็ค CSRF token
  if (!validateCsrfToken(req))
    return res
      .status(403)
      .json({ message: "CSRF token ไม่ถูกต้อง — request ถูกปฏิเสธ" });

  next();
}

// ✅ ใหม่ — เฉพาะ Super Admin เท่านั้น
export function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "superadmin")
      return res
        .status(403)
        .json({ message: "สิทธิ์ไม่เพียงพอ — ต้องเป็น Super Admin" });
    next();
  });
}
export function requireSuperAdminWithCsrf(req, res, next) {
  requireAuthWithCsrf(req, res, () => {
    if (req.user.role !== "superadmin")
      return res
        .status(403)
        .json({ message: "สิทธิ์ไม่เพียงพอ — ต้องเป็น Super Admin" });
    next();
  });
}
