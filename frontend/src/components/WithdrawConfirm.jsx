import { useState } from "react";
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

export default function WithdrawConfirm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!state) return navigate("/withdraw");

  const rows = [
    { label: "จำนวนเงิน", value: `฿${Number(state.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}` },
    { label: "ธนาคาร",    value: state.bankName },
    { label: "เลขบัญชี",  value: state.bankCardNumber },
    { label: "ชื่อบัญชี", value: state.bankCardHolder },
    { label: "หมายเหตุ",  value: state.note },
  ];

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/withdraw/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(state),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(ERROR_MESSAGES[json.error_code] || json.message || "ถอนเงินไม่สำเร็จ");
      navigate("/withdraw/status", { state: json });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <p style={s.title}>ยืนยันการถอนเงิน</p>
        {rows.map(r => (
          <div key={r.label} style={s.row}>
            <span style={s.rowLabel}>{r.label}</span>
            <span style={s.rowValue}>{r.value}</span>
          </div>
        ))}
      </div>

      {error && (
        <div style={s.error}>{error}</div>
      )}

      <div style={s.btnRow}>
        <button style={s.btnBack} onClick={() => navigate(-1)}>แก้ไข</button>
        <button
          style={{ ...s.btnNext, ...(loading ? s.btnDisabled : {}) }}
          disabled={loading}
          onClick={handleConfirm}
        >
          {loading ? "กำลังดำเนินการ..." : "ยืนยัน →"}
        </button>
      </div>
    </div>
  );
}

const s = {
  wrap:       { maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem" },
  card:       { background: "var(--color-surface)", border: "0.5px solid var(--color-border)",
                borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" },
  title:      { fontSize: 16, fontWeight: 500, marginBottom: "1rem", color: "var(--color-text)" },
  row:        { display: "flex", justifyContent: "space-between", padding: "10px 0",
                borderBottom: "0.5px solid var(--color-border)", fontSize: 14 },
  rowLabel:   { color: "var(--color-text-secondary)" },
  rowValue:   { fontWeight: 500, color: "var(--color-text)" },
  error:      { background: "#FCEBEB", color: "#A32D2D", fontSize: 13,
                padding: "10px 14px", borderRadius: 8, marginBottom: 12 },
  btnRow:     { display: "flex", gap: 10 },
  btnBack:    { flex: 1, padding: "12px", border: "0.5px solid var(--color-border)",
                borderRadius: 10, background: "transparent", fontSize: 14, cursor: "pointer" },
  btnNext:    { flex: 2, padding: "12px", border: "none", borderRadius: 10,
                background: "#1D9E75", color: "#fff", fontSize: 14,
                fontWeight: 500, cursor: "pointer" },
  btnDisabled: { background: "#e0e0e0", color: "gray", cursor: "not-allowed" },
};