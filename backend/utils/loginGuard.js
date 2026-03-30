// utils/loginGuard.js
// ─── per-username brute-force protection (in-memory) ─────────────────────────
// ถ้ามี Redis ในระบบให้เปลี่ยนไปใช้ Redis แทนเพื่อให้ทำงานได้ใน multi-process

const MAX_ATTEMPTS = 5; // ผิดได้สูงสุด 5 ครั้ง
const LOCK_MS = 15 * 60 * 1000; // ล็อค 15 นาที
const WINDOW_MS = 15 * 60 * 1000; // นับภายใน 15 นาที

// { username: { count, firstAt, lockedUntil } }
const store = new Map();

// ── ล้าง entry ที่หมดอายุแล้วทุก 10 นาที (ป้องกัน memory leak) ──────────────
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (val.lockedUntil && now > val.lockedUntil) store.delete(key);
    else if (now - val.firstAt > WINDOW_MS) store.delete(key);
  }
}, 10 * 60 * 1000);

export function loginGuard(username) {
  const now = Date.now();
  const key = username.toLowerCase();
  let entry = store.get(key);

  // ── ตรวจว่าถูกล็อคอยู่ไหม ─────────────────────────────────────────────
  if (entry?.lockedUntil) {
    if (now < entry.lockedUntil) {
      const remainSec = Math.ceil((entry.lockedUntil - now) / 1000);
      return {
        blocked: true,
        message: `ล็อคชั่วคราว กรุณารอ ${remainSec} วินาที`,
      };
    }
    // ล็อคหมดอายุแล้ว → reset
    store.delete(key);
    entry = undefined;
  }

  return { blocked: false };
}

export function loginFailed(username) {
  const now = Date.now();
  const key = username.toLowerCase();
  let entry = store.get(key) ?? { count: 0, firstAt: now };

  // reset ถ้าเกิน window
  if (now - entry.firstAt > WINDOW_MS) {
    entry = { count: 0, firstAt: now };
  }

  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_MS;
  }

  store.set(key, entry);
  return entry.count;
}

export function loginSuccess(username) {
  store.delete(username.toLowerCase());
}
