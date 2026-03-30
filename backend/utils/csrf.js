import crypto from "crypto";

// สร้าง CSRF token แบบ random
export function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ตรวจสอบ token จาก cookie vs header
export function validateCsrfToken(req) {
  const fromCookie = req.cookies?.csrf_token;
  const fromHeader = req.headers["x-csrf-token"];

  if (!fromCookie || !fromHeader) return false;

  // ใช้ timingSafeEqual กัน timing attack
  try {
    const a = Buffer.from(fromCookie);
    const b = Buffer.from(fromHeader);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
