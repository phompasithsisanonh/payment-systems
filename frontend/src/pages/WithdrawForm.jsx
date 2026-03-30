import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BANKS = [
  { code: "BANGKOK BANK", name: "กรุงเทพ (BBL)" },
  { code: "Kasikornbank", name: "กสิกรไทย (KBANK)" },
  { code: "Krung Thai Bank", name: "กรุงไทย (KTB)" },
  { code: "The Siam Commercial Bank", name: "ไทยพาณิชย์ (SCB)" },
  { code: "Krungsri", name: "กรุงศรีอยุธยา (BAY)" },
  { code: "TMBThanachart Bank", name: "ทหารไทยธนชาต (TTB)" },
  { code: "Government Savings Bank", name: "ออมสิน (GSB)" },
  { code: "Government Housing Bank", name: "อาคารสงเคราะห์ (GHB)" },
  {
    code: "Bank for Agriculture and Agricultural Cooperatives",
    name: "ธ.ก.ส. (BAAC)",
  },
  { code: "CIMB Thai Bank", name: "ซีไอเอ็มบี (CIMB)" },
];

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

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

function validate(form) {
  const amt = Number(form.amount);
  if (!form.bankName) return "กรุณาเลือกธนาคาร";
  if (!form.bankCardNumber) return "กรุณากรอกเลขบัญชี";
  if (!/^\d{10,15}$/.test(form.bankCardNumber.replace(/-/g, "")))
    return "เลขบัญชีไม่ถูกต้อง (10–15 หลัก)";
  if (!form.bankCardHolder.trim()) return "กรุณากรอกชื่อเจ้าของบัญชี";
  if (!form.amount || amt <= 0) return "กรุณากรอกจำนวนเงินที่ถูกต้อง";
  if (amt < 1) return "จำนวนเงินขั้นต่ำ ฿1";
  return null;
}

// ── Icons ──────────────────────────────────────────────────────────────────
const IconWallet = () => (
  <svg
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const IconCard = () => (
  <svg
    width="14"
    height="14"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const IconCoin = () => (
  <svg
    width="14"
    height="14"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconUser = () => (
  <svg
    width="15"
    height="15"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
const IconAlert = () => (
  <svg
    width="14"
    height="14"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
    />
  </svg>
);
const IconArrow = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 8l4 4m0 0l-4 4m4-4H3"
    />
  </svg>
);

// ── Sub-components ─────────────────────────────────────────────────────────
function StepBar({ current = 1 }) {
  const steps = ["กรอกข้อมูล", "ยืนยัน", "สำเร็จ"];
  return (
    <div style={s.stepBar}>
      {steps.map((label, i) => {
        const idx = i + 1;
        const active = idx === current;
        const done = idx < current;
        return (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < steps.length - 1 ? "1" : "0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  ...s.stepDot,
                  ...(active ? s.stepDotActive : done ? s.stepDotDone : {}),
                }}
              >
                {done ? "✓" : idx}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: active ? "#1D9E75" : "#aaa",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <div style={s.stepLine} />}
          </div>
        );
      })}
    </div>
  );
}

function Card({ icon, label, children }) {
  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardIcon}>{icon}</div>
        <span style={s.cardLabel}>{label}</span>
      </div>
      <div style={s.cardBody}>{children}</div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <p style={s.fieldLabel}>{children}</p>;
}

function AccountPreview({ bankLabel, bankCardHolder, bankCardNumber }) {
  if (!bankCardHolder && !bankCardNumber) return null;
  const initials = bankCardHolder
    ? bankCardHolder
        .trim()
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "—";
  return (
    <div style={s.accountPreview}>
      <div style={s.accountAvatar}>
        {initials ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1D9E75" }}>
            {initials}
          </span>
        ) : (
          <IconUser />
        )}
      </div>
      <div>
        <p style={s.accountName}>{bankCardHolder || "—"}</p>
        <p style={s.accountSub}>
          {bankLabel || "ธนาคาร"} · {bankCardNumber || "—"}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function WithdrawForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    amount: "",
    bankName: "",
    bankCardNumber: "",
    bankCardHolder: "",
    note: "",
  });
  const [error, setError] = useState(null);

  const set = (k, v) => {
    setError(null);
    setForm((p) => ({ ...p, [k]: v }));
  };

  const handleNext = () => {
    const err = validate(form);
    if (err) return setError(err);
    navigate("/withdraw/confirm", {
      state: {
        amount: Number(form.amount),
        bankName: form.bankName,
        bankCardNumber: form.bankCardNumber.replace(/-/g, "").trim(),
        bankCardHolder: form.bankCardHolder.trim(),
        bankLabel:
          BANKS.find((b) => b.code === form.bankName)?.name ?? form.bankName,
        note: form.note.trim(),
      },
    });
  };

  const bankLabel = BANKS.find((b) => b.code === form.bankName)?.name ?? "";
  const showPreview = form.bankCardHolder || form.bankCardNumber;

  return (
    <div style={s.wrap}>
      {/* Page Header */}
      <div style={s.pageHeader}>
        <div style={s.pageHeaderIcon}>
          <IconWallet />
        </div>
        <div>
          <p style={s.pageTitle}>โอน/ถอนเงิน</p>
          <p style={s.pageSubtitle}>โอนเงินเข้าบัญชีธนาคาร</p>
        </div>
      </div>

      {/* Step Bar */}
      <StepBar current={1} />

      {/* Amount Card */}
      <Card icon={<IconCoin />} label="จำนวนเงิน">
        <div style={s.amountRow}>
          <span style={s.currencyBadge}>THB</span>
          <input
            style={s.amountInput}
            type="number"
            min="1"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
          />
        </div>
        <div style={s.quickAmounts}>
          {QUICK_AMOUNTS.map((v) => (
            <button
              key={v}
              style={{
                ...s.qaBtn,
                ...(Number(form.amount) === v ? s.qaBtnActive : {}),
              }}
              onClick={() => set("amount", String(v))}
            >
              ฿{v.toLocaleString()}
            </button>
          ))}
        </div>
      </Card>

      {/* Account Card */}
      <Card icon={<IconCard />} label="บัญชีปลายทาง">
        <FieldLabel>ธนาคาร</FieldLabel>
        <div style={s.selectWrap}>
          <select
            style={s.select}
            value={form.bankName}
            onChange={(e) => set("bankName", e.target.value)}
          >
            <option value="">— เลือกธนาคาร —</option>
            {BANKS.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
          <span style={s.selectChevron}>▾</span>
        </div>

        <FieldLabel>เลขบัญชี</FieldLabel>
        <input
          style={s.input}
          type="text"
          placeholder="0000000000"
          maxLength={20}
          value={form.bankCardNumber}
          onChange={(e) =>
            set("bankCardNumber", e.target.value.replace(/[^\d-]/g, ""))
          }
        />

        <FieldLabel>ชื่อเจ้าของบัญชี</FieldLabel>
        <input
          style={s.input}
          type="text"
          placeholder="ชื่อ นามสกุล"
          value={form.bankCardHolder}
          onChange={(e) => set("bankCardHolder", e.target.value)}
        />

        {showPreview && (
          <AccountPreview
            bankLabel={bankLabel}
            bankCardHolder={form.bankCardHolder}
            bankCardNumber={form.bankCardNumber}
          />
        )}

        <div style={s.noteDivider} />
        <FieldLabel>หมายเหตุ (ถ้ามี)</FieldLabel>
        <input
          style={s.input}
          type="text"
          placeholder="เช่น ชำระค่าสินค้า"
          maxLength={100}
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
        />
      </Card>

      {/* Error */}
      {error && (
        <div style={s.error}>
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button style={s.btn} onClick={handleNext}>
        ถัดไป
        <IconArrow />
      </button>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const GREEN = "#1D9E75";
const GREEN_DARK = "#0F6E56";
const GREEN_LIGHT = "#E1F5EE";

const s = {
  wrap: {
    maxWidth: 440,
    margin: "0 auto",
    padding: "1.5rem 1rem 2rem",
    fontFamily: "'Sarabun', sans-serif",
  },

  // Header
  pageHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: "1.25rem",
    paddingBottom: "1rem",
    borderBottom: "0.5px solid #e8e8e8",
  },
  pageHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "var(--color-surface)",
    border: "0.5px solid var(--color-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: GREEN,
    flexShrink: 0,
  },
  pageTitle: { fontSize: 17, fontWeight: 600, color: "#111", margin: 0 },
  pageSubtitle: { fontSize: 12, color: "#999", margin: 0, marginTop: 1 },

  // Steps
  stepBar: {
    display: "flex",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "1.5px solid #ddd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 600,
    color: "#bbb",
    flexShrink: 0,
  },
  stepDotActive: {
    background: "var(--color-surface)",
    borderColor: GREEN,
    color: "#fff",
  },
  stepDotDone: {
    background: "var(--color-surface)",

    borderColor: GREEN,
    color: GREEN,
  },
  stepLine: {
    flex: 1,
    height: "0.5px",
    background: "var(--color-surface)",
    margin: "0 6px",
  },

  // Card
  card: {
    background: "var(--color-surface)",
    border: "0.5px solid #e8e8e8",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
  },
  cardHeader: {
    padding: "11px 16px 10px",
    borderBottom: "0.5px solid #f0f0f0",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "var(--color-surface)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: GREEN,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#888",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  },
  cardBody: { padding: "14px 16px" },

  // Amount
  amountRow: { display: "flex", alignItems: "center", gap: 8 },
  currencyBadge: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
    color: "#888",
    background: "var(--color-surface)",
    border: "0.5px solid var(--color-border)",
    borderRadius: 6,
    padding: "5px 9px",
    flexShrink: 0,
    letterSpacing: "0.5px",
  },
  amountInput: {
    flex: 1,
    fontSize: 30,
    fontWeight: 400,
    fontFamily: "'IBM Plex Mono', monospace",
    border: "none",
 background: "var(--color-surface)",
    outline: "none",
   color:"var(--color-text)",
    minWidth: 0,
  },
  quickAmounts: {
    display: "flex",
    gap: 6,
    marginTop: 12,
    flexWrap: "wrap",
  },
  qaBtn: {
    padding: "4px 12px",
    fontSize: 12,
    fontFamily: "'Sarabun', sans-serif",
    fontWeight: 500,
    border: "0.5px solid #ddd",
    borderRadius: 20,
background: "var(--color-surface)",
    color: "#666",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  qaBtnActive: {
    borderColor: GREEN,
    color: GREEN,
    background: "var(--color-surface)",
  },

  // Fields
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#aaa",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    marginBottom: 5,
    marginTop: 12,
  },
  selectWrap: { position: "relative" },
  select: {
    width: "100%",
    padding: "9px 32px 9px 12px",
    fontSize: 14,
    fontFamily: "'Sarabun', sans-serif",
    borderRadius: 8,
    border: "0.5px solid #ddd",
    background: "#fafafa",
    color: "#111",
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
  },
  selectChevron: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 12,
    color: "#aaa",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    fontSize: 14,
    fontFamily: "'Sarabun', sans-serif",
    borderRadius: 8,
    border: "0.5px solid #ddd",
    background: "#fafafa",
    outline: "none",
    color: "#111",
    boxSizing: "border-box",
  },

  // Account preview
  accountPreview: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    padding: "10px 12px",
    background: "var(--color-surface)",
    borderRadius: 8,
    border: `0.5px solid #9FE1CB`,
  },
  accountAvatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: `1px solid #9FE1CB`,
  },
  accountName: { fontSize: 13, fontWeight: 600, color: "#0F6E56", margin: 0 },
  accountSub: { fontSize: 11, color: "#5DCAA5", margin: 0, marginTop: 2 },

  noteDivider: {
    margin: "14px -16px 0",
    borderBottom: "0.5px solid #f0f0f0",
    paddingBottom: 0,
  },

  // Error
  error: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#FCEBEB",
    color: "#A32D2D",
    fontSize: 13,
    fontFamily: "'Sarabun', sans-serif",
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 12,
  },

  // Button
  btn: {
    width: "100%",
    padding: "13px",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'Sarabun', sans-serif",
    border: "none",
    borderRadius: 12,
    background: GREEN,
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    letterSpacing: "0.2px",
  },
};
