import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
const ERROR_MESSAGES = {
  1: "ยอดเงินใน wallet ไม่เพียงพอ",
  2: "ฟังก์ชันถอนเงินไม่ได้เปิดใช้งาน",
  5: "Signature ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ",
  6: "มีรายการซ้ำ กรุณารอสักครู่",
  8: "เลข Order ซ้ำ กรุณารีเฟรชหน้า",
  9: "ระบบถอนเงินปิดอยู่",
  10: "จำนวนเงินต่ำกว่าขั้นต่ำ",
  11: "จำนวนเงินเกินวงเงินสูงสุด",
  13: "ช่องทางอยู่ระหว่างปิดปรับปรุง",
  18: "IP ไม่ได้รับอนุญาต กรุณาติดต่อผู้ดูแลระบบ",
  22: "ไม่รองรับธนาคารนี้",
};
export default function WithdrawOTP() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  if (!state) return navigate("/withdraw");

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const totpCode = otp.join("");
    if (totpCode.length < 6) return setError("กรุณากรอกรหัส 6 หลัก");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/withdraw/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...state, totpCode }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(
          ERROR_MESSAGES[json.error_code] || json.message || "ถอนเงินไม่สำเร็จ"
        );
      navigate("/withdraw/status", { state: json });
    } catch (e) {
      setError(e.message);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <p style={s.title}>ยืนยันตัวตน</p>
        <p style={s.sub}>กรอกรหัส 6 หลักจาก Google Authenticator</p>

        <div style={s.otpRow}>
          {otp.map((v, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              style={s.otpBox}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={v}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </div>

        {error && <p style={s.error}>{error}</p>}

        <button
          style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "กำลังดำเนินการ..." : "ยืนยัน"}
        </button>
      </div>
    </div>
  );
}

const s = {
  wrap: { maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem" },
  card: {
    background: "#fff",
    border: "0.5px solid #e5e5e5",
    borderRadius: 12,
    padding: "1.5rem",
    textAlign: "center",
  },
  title: { fontSize: 18, fontWeight: 500, marginBottom: 6, color: "#111" },
  sub: { fontSize: 13, color: "#999", marginBottom: "1.5rem" },
  otpRow: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    marginBottom: "1.25rem",
  },
  otpBox: {
    width: 44,
    height: 52,
    textAlign: "center",
    fontSize: 22,
    fontWeight: 500,
    border: "0.5px solid #ddd",
    borderRadius: 10,
    outline: "none",
    color: "#111",
  },
  error: { fontSize: 13, color: "#E24B4A", marginBottom: 12 },
  btn: {
    width: "100%",
    padding: "13px",
    fontSize: 15,
    fontWeight: 500,
    border: "none",
    borderRadius: 10,
    background: "#1D9E75",
    color: "red",
    cursor: "pointer",
  },
  btnDisabled: { background: "#e0e0e0", color: "gray", cursor: "not-allowed" },
};
