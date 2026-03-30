import { useNavigate, useLocation } from "react-router-dom";

export default function WithdrawConfirm() {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state) return navigate("/withdraw");

  const rows = [
    { label: "จำนวนเงิน", value: `฿${Number(state.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}` },
    { label: "ธนาคาร",    value: state.bankName },
    { label: "เลขบัญชี",  value: state.bankCardNumber },
    { label: "ชื่อบัญชี", value: state.bankCardHolder },
    { label: "หมายเหตุ",   value: state.note },
  ];

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

      <div style={s.btnRow}>
        <button style={s.btnBack} onClick={() => navigate(-1)}>แก้ไข</button>
        <button style={s.btnNext}
          onClick={() => navigate("/withdraw/otp", { state })}>
          ยืนยัน →
        </button>
      </div>
    </div>
  );
}

const s = {
  wrap:     { maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem" },
  card:     { background: "var(--color-surface)", border: "0.5px solid var(--color-border)", borderRadius: 12,
              padding: "1.25rem", marginBottom: "1rem" },
  title:    { fontSize: 16, fontWeight: 500, marginBottom: "1rem", color: "var(--color-text)" },
  row:      { display: "flex", justifyContent: "space-between", padding: "10px 0",
              borderBottom: "0.5px solid var(--color-border)", fontSize: 14 },
  rowLabel: { color: "var(--color-text-secondary)" },
  rowValue: { fontWeight: 500, color: "var(--color-text)" },
  btnRow:   { display: "flex", gap: 10 },
  btnBack:  { flex: 1, padding: "12px", border: "0.5px solid var(--color-border)", borderRadius: 10,
              background: "transparent", fontSize: 14, cursor: "pointer" },
  btnNext:  { flex: 2, padding: "12px", border: "none", borderRadius: 10,
              background: "#1D9E75", color: "#fff", fontSize: 14,
              fontWeight: 500, cursor: "pointer" },
};