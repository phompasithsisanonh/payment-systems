import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CHANNELS = [
  { code: "PROMPTPAY", label: "PromptPay", desc: "QR code ทันที" },
  // { code: "BANK_CARD", label: "โอนธนาคาร", desc: "Card to Card" },
  // { code: "TRUEMONEY", label: "TrueMoney", desc: "TrueMoney Wallet" },
  // { code: "E_BANK_CARD", label: "E-Banking", desc: "แนบสลิปยืนยัน" },
];

const QUICK = [100, 500, 1000, 5000];

export default function DepositForm() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [channel, setChannel] = useState("PROMPTPAY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuick = (val) => setAmount(String(val));

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/deposit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: Number(amount), channelCode: channel }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "สร้าง order ไม่สำเร็จ");
      navigate(`/deposit/qr?orderNumber=${json.orderNumber}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const valid = Number(amount) > 0;

  return (
    <div style={s.wrap}>
      {/* ── จำนวนเงิน ── */}
      <div style={s.card}>
        <p style={s.label}>จำนวนเงิน (บาท)</p>
        <div style={s.amountRow}>
          <span style={s.currency}>฿</span>
          <input
            style={s.amountInput}
            type="number"
            min="1"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div style={s.divider} />
        <div style={s.quickRow}>
          {QUICK.map((q) => (
            <button
              key={q}
              style={{
                ...s.quickBtn,
                ...(amount === String(q) ? s.quickBtnActive : {}),
              }}
              onClick={() => handleQuick(q)}
            >
              {q.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* ── ช่องทาง ── */}
      <div style={s.card}>
        <p style={s.sectionTitle}>ช่องทางการฝาก</p>
        <div style={s.channelGrid}>
          {CHANNELS.map((ch) => (
            <button
              key={ch.code}
              style={{
                ...s.ch,
                ...(channel === ch.code ? s.chActive : {}),
              }}
              onClick={() => setChannel(ch.code)}
            >
              <div style={s.chText}>
                <span style={s.chName}>{ch.label}</span>
                <span style={s.chDesc}>{ch.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      {error && <p style={s.error}>{error}</p>}

      {/* ── Submit ── */}
      <button
        style={{
          ...s.submitBtn,
          ...(!valid || loading ? s.submitDisabled : {}),
        }}
        disabled={!valid || loading}
        onClick={handleSubmit}
      >
        {loading
          ? "กำลังสร้าง order..."
          : valid
          ? `ฝาก ฿${Number(amount).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}`
          : "ระบุจำนวนเงิน"}
      </button>
      <p style={s.note}>ไม่มีค่าธรรมเนียม · ยอดเข้าภายใน 1–5 นาที</p>
    </div>
  );
}

const GREEN = "#1D9E75";
const GREEN_BG = "#E1F5EE";
const GREEN_TEXT = "#0F6E56";

const s = {
  wrap: { maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem" },
  card: {
    background: "var(--color-surface)",
    border: "0.5px solid var(--color-border)",
    borderRadius: 12,
    padding: "1.25rem",
    marginBottom: "1rem",
  },
  label: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
    letterSpacing: ".03em",
  },
  amountRow: { display: "flex", alignItems: "center", gap: 8 },
  currency: { fontSize: 20, fontWeight: 500, color: "var(--color-text-secondary)" },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 500,
    border: "none",
    background: "transparent",
    outline: "none",
    color: "var(--color-text)",
    width: "100%",
  },
  divider: { height: "0.5px", background: "var(--color-border)", margin: "12px 0" },
  quickRow: { display: "flex", gap: 8 },
  quickBtn: {
    flex: 1,
    padding: "6px 0",
    fontSize: 13,
    fontWeight: 500,
    border: "0.5px solid var(--color-border)",
    borderRadius: 8,
    background: " var(--color-surface)",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
  },
  quickBtnActive: {
    borderColor: GREEN,
    color: GREEN_TEXT,
    background: GREEN_BG,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: "#666",
    marginBottom: 10,
  },
  channelGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  ch: {
    border: "0.5px solid #e5e5e5",
    borderRadius: 8,
    padding: "10px 12px",
    cursor: "pointer",
    textAlign: "left",
    background: "#fff",
    display: "flex",
    alignItems: "center",
  },
  chActive: { borderColor: GREEN, background: GREEN_BG },
  chText: { display: "flex", flexDirection: "column", gap: 2 },
  chName: { fontSize: 13, fontWeight: 500, color: "#111" },
  chDesc: { fontSize: 11, color: "#999" },
  error: {
    fontSize: 13,
    color: "#E24B4A",
    marginBottom: 8,
    textAlign: "center",
  },
  submitBtn: {
    width: "100%",
    padding: "13px",
    fontSize: 15,
    fontWeight: 500,
    border: "none",
    borderRadius: 10,
    background: GREEN,
    color: "#fff",
    cursor: "pointer",
  },
  submitDisabled: {
    background: "#e0e0e0",
    color: "#aaa",
    cursor: "not-allowed",
  },
  note: { fontSize: 12, color: "#bbb", textAlign: "center", marginTop: 8 },
};
