// utils/validate.js
// ─── reusable input validators ───────────────────────────────────────────────

export function validateAmount(amount) {
  const n = Number(amount);
  if (!amount || isNaN(n) || n <= 0) return "จำนวนเงินต้องมากกว่า 0";
  if (n > 10_000_000) return "จำนวนเงินเกินกำหนด";
  if (!/^\d+(\.\d{1,2})?$/.test(String(amount)))
    return "รูปแบบจำนวนเงินไม่ถูกต้อง";
  return null;
}

export function validateNote(note) {
  if (note && note.length > 200) return "หมายเหตุยาวเกิน 200 ตัวอักษร";
  return null;
}

export function validatePassword(password) {
  if (!password || password.length < 8)
    return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  if (password.length > 64) return "รหัสผ่านยาวเกิน 64 ตัวอักษร";
  if (!/[A-Z]/.test(password))
    return "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว";
  if (!/[a-z]/.test(password))
    return "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว";
  if (!/[0-9]/.test(password)) return "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว";
  return null;
}

export function validateBankCard(number) {
  const clean = String(number).replace(/\s/g, "");
  if (!/^\d{10,20}$/.test(clean)) return "เลขบัญชีต้องเป็นตัวเลข 10-20 หลัก";
  return null;
}
