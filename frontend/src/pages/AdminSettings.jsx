import { useState, useEffect, useCallback } from "react";

// ── Inline styles ─────────────────────────────────────────────────────────────
const css = {
  page: {
    minHeight: "100vh",
    background: "#0f1117",
    fontFamily: "'IBM Plex Sans', 'Noto Sans Thai', sans-serif",
    fontSize: 13,
    color: "#e2e8f0",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "#1a1d27",
    borderBottom: "1px solid #2d3148",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    padding: 16,
    alignItems: "start",
  },
  panel: {
    background: "#1a1d27",
    border: "1px solid #2d3148",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#94a3b8",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    paddingBottom: 10,
    borderBottom: "1px solid #2d3148",
  },
  sectionLabel: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 5,
    letterSpacing: "0.04em",
  },
  divider: { border: "none", borderTop: "1px solid #2d3148" },
  input: {
    width: "100%",
    height: 32,
    background: "#0f1117",
    border: "1px solid #2d3148",
    borderRadius: 6,
    color: "#e2e8f0",
    padding: "0 10px",
    fontSize: 13,
    outline: "none",
  },
  select: {
    width: "100%",
    height: 32,
    background: "#0f1117",
    border: "1px solid #2d3148",
    borderRadius: 6,
    color: "#e2e8f0",
    padding: "0 10px",
    fontSize: 13,
    outline: "none",
  },
  textarea: {
    width: "100%",
    height: 60,
    background: "#0f1117",
    border: "1px solid #2d3148",
    borderRadius: 6,
    color: "#e2e8f0",
    padding: 8,
    fontSize: 13,
    resize: "none",
    outline: "none",
  },
  btn: {
    height: 34,
    padding: "0 14px",
    borderRadius: 6,
    border: "1px solid #2d3148",
    background: "transparent",
    color: "#94a3b8",
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
  },
  btnSave: {
    height: 34,
    padding: "0 20px",
    borderRadius: 6,
    border: "none",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnRefresh: {
    height: 34,
    padding: "0 14px",
    borderRadius: 6,
    border: "1px solid #2d3148",
    background: "transparent",
    color: "#94a3b8",
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
};

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 38,
        height: 22,
        borderRadius: 11,
        background: checked ? "#6366f1" : "#2d3148",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background .2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          top: 3,
          left: checked ? 19 : 3,
          transition: "left .2s",
        }}
      />
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const colors = {
    active: { bg: "#14532d", color: "#4ade80" },
    maintenance: { bg: "#78350f", color: "#fbbf24" },
  };
  const c = colors[status] || colors.maintenance;
  return (
    <span
      style={{
        fontSize: 10,
        padding: "2px 8px",
        borderRadius: 20,
        background: c.bg,
        color: c.color,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}

// ── GW Logo ───────────────────────────────────────────────────────────────────
const GW_COLORS = {
  ANYPAY: { bg: "#14532d", color: "#4ade80", label: "AP" },
  APEXPAY: { bg: "#1e3a5f", color: "#60a5fa", label: "AX" },
  GM2PAY: { bg: "#4c1d95", color: "#c4b5fd", label: "G2" },
  MSOL: { bg: "#831843", color: "#f9a8d4", label: "MS" },
  P2WPAY: { bg: "#7c2d12", color: "#fb923c", label: "P2" },
  SANDSPAY: { bg: "#1c3148", color: "#7dd3fc", label: "SP" },
  VXPAY: { bg: "#3b0764", color: "#e879f9", label: "VX" },
};

function GwLogo({ name }) {
  const c = GW_COLORS[name] || {
    bg: "#1e293b",
    color: "#94a3b8",
    label: name.slice(0, 2),
  };
  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        background: c.bg,
        color: c.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {c.label}
    </div>
  );
}

// ── GATEWAYS default config ───────────────────────────────────────────────────
const DEFAULT_GW = [
  {
    name: "ANYPAY",
    status: "active",
    enabled: true,
    payin: 2.05,
    payout: 2.1,
    payinMin: 100,
    payinMax: 1000000,
    payoutMin: 100,
    payoutMax: 1000000,
    balance: 377.45,
    totalIn: 1100,
    totalOut: 700,
  },
  {
    name: "APEXPAY",
    status: "active",
    enabled: true,
    payin: 1.9,
    payout: 1.5,
    payinMin: 100,
    payinMax: 50000,
    payoutMin: 100,
    payoutMax: 50000,
    balance: 0,
    totalIn: 0,
    totalOut: 0,
  },
  {
    name: "GM2PAY",
    status: "active",
    enabled: true,
    payin: 1.85,
    payout: 1.5,
    payinMin: 300,
    payinMax: 100000,
    payoutMin: 300,
    payoutMax: 100000,
    balance: 0,
    totalIn: 0,
    totalOut: 0,
  },
  {
    name: "MSOL",
    status: "active",
    enabled: true,
    payin: 1.9,
    payout: 1.5,
    payinMin: 100,
    payinMax: 100000,
    payoutMin: 100,
    payoutMax: 100000,
    balance: 0,
    totalIn: 0,
    totalOut: 0,
  },
  {
    name: "P2WPAY",
    status: "active",
    enabled: true,
    payin: 1.9,
    payout: 1.5,
    payinMin: 100,
    payinMax: 1000000,
    payoutMin: 100,
    payoutMax: 500000,
    balance: 0,
    totalIn: 0,
    totalOut: 0,
  },
  {
    name: "SANDSPAY",
    status: "maintenance",
    enabled: false,
    payin: 1.85,
    payout: 1.5,
    payinMin: 300,
    payinMax: 2000000,
    payoutMin: 300,
    payoutMax: 2000000,
    balance: 0,
    totalIn: 0,
    totalOut: 0,
  },
  {
    name: "VXPAY",
    status: "maintenance",
    enabled: false,
    payin: 1.75,
    payout: 1.9,
    payinMin: 100,
    payinMax: 1000000,
    payoutMin: 100,
    payoutMax: 1000000,
    balance: 0,
    totalIn: 0,
    totalOut: 0,
  },
];

const HOURS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, "0")}:00`
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [pinInput, setPinInput] = useState("");

  // System
  const [sysEnabled, setSysEnabled] = useState(true);
  const [sysMessage, setSysMessage] = useState("");
  const [slipEnabled, setSlipEnabled] = useState(false);
  const [depositExpiry, setDepositExpiry] = useState(600);
  const [slipQuota, setSlipQuota] = useState(0);

  // Banks
  const [banks, setBanks] = useState({
    kasikorn: true,
    scb: true,
    ktb: false,
    krungthai: true,
    oomsin: false,
    ayudhya: false,
    truewallet: true,
  });

  // Gateways
  const [gateways, setGateways] = useState(DEFAULT_GW);

  // Deposit/Withdraw
  const [vip1Count, setVip1Count] = useState(5);
  const [vip2Count, setVip2Count] = useState(0);
  const [depositMin, setDepositMin] = useState(1);
  const [forceWithdraw, setForceWithdraw] = useState(true);
  const [withdrawMin, setWithdrawMin] = useState(100);
  const [withdrawLimit, setWithdrawLimit] = useState(10);
  const [withdrawInterval, setWithdrawInterval] = useState("3");
  const [limitWithdraw, setLimitWithdraw] = useState(true);
  const [hourLimits, setHourLimits] = useState(
    Object.fromEntries(HOURS.map((h) => [h, 100]))
  );

  // Extras
  const [pointsEnabled, setPointsEnabled] = useState(false);
  const [rankEnabled, setRankEnabled] = useState(false);
  const [manualMax, setManualMax] = useState(0);
  const [manualMaxCount, setManualMaxCount] = useState(0);
  const [affRates, setAffRates] = useState({
    casino: 0.2,
    slot: 0.2,
    sport: 0.2,
    lottery: 5,
    huay: 5,
  });
  const [saLimit, setSaLimit] = useState({
    dashboard: "ไม่มีการจำกัด",
    win: "ไม่มีการจำกัด",
  });
  const [sellLimit, setSellLimit] = useState({
    dashboard: "ไม่มีการจำกัด",
    win: "ไม่มีการจำกัด",
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load settings on mount
  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.sysEnabled !== undefined) setSysEnabled(data.sysEnabled);
        if (data.sysMessage) setSysMessage(data.sysMessage);
        if (data.depositMin) setDepositMin(data.depositMin);
        if (data.withdrawMin) setWithdrawMin(data.withdrawMin);
        if (data.withdrawLimit) setWithdrawLimit(data.withdrawLimit);
        if (data.gateways) setGateways(data.gateways);
        if (data.hourLimits) setHourLimits(data.hourLimits);
      })
      .catch(() => {});
  }, []);

  // Refresh gateway balances
  const refreshBalances = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/payment/balances", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGateways((prev) =>
          prev.map((gw) => {
            const found = data.data.find((d) => d.name === gw.name);
            if (!found || found.error) return gw;
            return {
              ...gw,
              balance: found.balance?.balance ?? 0,
              totalIn: found.balance?.in ?? 0,
              totalOut: found.balance?.out ?? 0,
            };
          })
        );
        showToast("รีเฟรช balance สำเร็จ");
      }
    } catch {
      showToast("รีเฟรช balance ไม่สำเร็จ", "error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Save all settings
  const handleSave = async () => {
    setSaving(true);
    const payload = {
      sysEnabled,
      sysMessage,
      slipEnabled,
      depositExpiry,
      slipQuota,
      banks,
      gateways,
      vip1Count,
      vip2Count,
      depositMin,
      forceWithdraw,
      withdrawMin,
      withdrawLimit,
      withdrawInterval,
      limitWithdraw,
      hourLimits,
      pointsEnabled,
      rankEnabled,
      manualMax,
      manualMaxCount,
      affRates,
      saLimit,
      sellLimit,
    };
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) showToast("บันทึกการตั้งค่าสำเร็จ");
      else showToast("บันทึกไม่สำเร็จ", "error");
    } catch {
      showToast("เกิดข้อผิดพลาด", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleGw = (name) => {
    setGateways((prev) =>
      prev.map((g) => (g.name === name ? { ...g, enabled: !g.enabled } : g))
    );
  };

  const toggleBank = (key) =>
    setBanks((prev) => ({ ...prev, [key]: !prev[key] }));

  const bankList = [
    { key: "kasikorn", label: "กสิกรไทย" },
    { key: "scb", label: "ไทยพาณิชย์" },
    { key: "ktb", label: "กรุงไทยธนชาต" },
    { key: "krungthai", label: "กรุงไทย" },
    { key: "oomsin", label: "ออมสิน" },
    { key: "ayudhya", label: "กรุงศรีอยุธยา" },
    { key: "truewallet", label: "กรุณมนี วอลเล็ท" },
  ];

  // Hours split into 2 columns
  const leftHours = HOURS.slice(0, 12);
  const rightHours = HOURS.slice(12);

  return (
    <div style={css.page}>
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 100,
            background: toast.type === "error" ? "#7f1d1d" : "#14532d",
            color: toast.type === "error" ? "#fca5a5" : "#86efac",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            border: `1px solid ${
              toast.type === "error" ? "#991b1b" : "#166534"
            }`,
            boxShadow: "0 4px 20px rgba(0,0,0,.4)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Top Bar */}
      <div style={css.topBar}>
        <button
          style={css.btnRefresh}
          onClick={refreshBalances}
          disabled={refreshing}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          >
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {refreshing ? "กำลังโหลด..." : "รีโหลด"}
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            style={{ ...css.input, width: 160 }}
            placeholder="รหัสป้องกัน"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            type="password"
          />
          <button style={css.btn}>ขอรหัสป้องกัน</button>
          <button style={css.btnSave} onClick={handleSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus,select:focus,textarea:focus{border-color:#6366f1!important} input[type=number]{-moz-appearance:textfield} input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}`}</style>

      <div style={css.grid}>
        {/* ── COL 1: ระบบ ──────────────────────────────────────────────── */}
        <div style={css.panel}>
          <div style={css.panelTitle}>ระบบ</div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                ระบบหน้าบ้าน
              </span>
              <Toggle checked={sysEnabled} onChange={setSysEnabled} />
            </div>
            <div style={css.sectionLabel}>ข้อความปิดระบบ</div>
            <textarea
              style={css.textarea}
              value={sysMessage}
              onChange={(e) => setSysMessage(e.target.value)}
              placeholder="ข้อความแสดงเมื่อปิดระบบ..."
            />
          </div>

          <hr style={css.divider} />

          <div>
            <div style={css.sectionLabel}>การฝาก</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>สลิป</span>
              <Toggle checked={slipEnabled} onChange={setSlipEnabled} />
            </div>
          </div>

          <div>
            <div style={css.sectionLabel}>ช่องทางการฝาก</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {bankList.map((b) => (
                <div
                  key={b.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{b.label}</span>
                  <Toggle
                    checked={banks[b.key]}
                    onChange={() => toggleBank(b.key)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={css.sectionLabel}>เวลาหมดอายุการฝาก</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                style={css.input}
                type="number"
                value={depositExpiry}
                onChange={(e) => setDepositExpiry(Number(e.target.value))}
              />
              <span style={{ color: "#64748b", whiteSpace: "nowrap" }}>
                วินาที
              </span>
            </div>
          </div>

          <div>
            <div style={css.sectionLabel}>โควต้าสแกนสลิป</div>
            <input
              style={css.input}
              type="number"
              value={slipQuota}
              onChange={(e) => setSlipQuota(Number(e.target.value))}
            />
          </div>

          <hr style={css.divider} />

          {/* Gateway section */}
          <div>
            <div style={{ ...css.sectionLabel, marginBottom: 10 }}>
              Payment Gateway
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {gateways.map((gw) => (
                <div
                  key={gw.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#0f1117",
                    borderRadius: 8,
                    padding: "8px 10px",
                    border: "1px solid #2d3148",
                  }}
                >
                  <GwLogo name={gw.name} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>
                    {gw.name}
                  </span>
                  <Badge status={gw.status} />
                  <Toggle
                    checked={gw.enabled}
                    onChange={() => toggleGw(gw.name)}
                  />
                </div>
              ))}
            </div>
          </div>

          <hr style={css.divider} />

          {/* Fee table */}
          <div>
            <div style={css.sectionLabel}>Fee & Limits</div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  fontSize: 11,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ color: "#64748b" }}>
                    <td style={{ padding: "4px 0" }}>Gateway</td>
                    <td style={{ padding: "4px 4px", textAlign: "right" }}>
                      Payin
                    </td>
                    <td style={{ padding: "4px 4px", textAlign: "right" }}>
                      Payout
                    </td>
                    <td style={{ padding: "4px 0", textAlign: "right" }}>
                      Max
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {gateways.map((gw) => (
                    <tr
                      key={gw.name}
                      style={{
                        borderTop: "1px solid #1e2235",
                        opacity: gw.enabled ? 1 : 0.4,
                      }}
                    >
                      <td style={{ padding: "4px 0", fontWeight: 500 }}>
                        {gw.name}
                      </td>
                      <td
                        style={{
                          padding: "4px 4px",
                          textAlign: "right",
                          color: "#4ade80",
                        }}
                      >
                        {gw.payin}%
                      </td>
                      <td
                        style={{
                          padding: "4px 4px",
                          textAlign: "right",
                          color: "#fb923c",
                        }}
                      >
                        {gw.payout}%
                      </td>
                      <td
                        style={{
                          padding: "4px 0",
                          textAlign: "right",
                          color: "#64748b",
                        }}
                      >
                        {gw.payinMax?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── COL 2: ฝาก-ถอน ───────────────────────────────────────────── */}
        <div style={css.panel}>
          <div style={css.panelTitle}>ฝาก-ถอน</div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div>
              <div style={css.sectionLabel}>
                จำนวนฝาก{" "}
                <span
                  style={{
                    background: "#1d4ed8",
                    color: "#93c5fd",
                    fontSize: 9,
                    padding: "1px 6px",
                    borderRadius: 20,
                    fontWeight: 700,
                  }}
                >
                  VIP1
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  style={css.input}
                  type="number"
                  value={vip1Count}
                  onChange={(e) => setVip1Count(Number(e.target.value))}
                />
                <span style={{ color: "#64748b", whiteSpace: "nowrap" }}>
                  ครั้ง
                </span>
              </div>
            </div>
            <div>
              <div style={css.sectionLabel}>
                จำนวนฝาก{" "}
                <span
                  style={{
                    background: "#7c3aed",
                    color: "#c4b5fd",
                    fontSize: 9,
                    padding: "1px 6px",
                    borderRadius: 20,
                    fontWeight: 700,
                  }}
                >
                  VIP2
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  style={css.input}
                  type="number"
                  value={vip2Count}
                  onChange={(e) => setVip2Count(Number(e.target.value))}
                />
                <span style={{ color: "#64748b", whiteSpace: "nowrap" }}>
                  ครั้ง
                </span>
              </div>
            </div>
          </div>

          <div>
            <div style={css.sectionLabel}>ฝากขั้นต่ำ</div>
            <input
              style={css.input}
              type="number"
              value={depositMin}
              onChange={(e) => setDepositMin(Number(e.target.value))}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>บังคับถอนทั้งหมด</span>
            <Toggle checked={forceWithdraw} onChange={setForceWithdraw} />
          </div>

          <div>
            <div style={css.sectionLabel}>ถอนขั้นต่ำ</div>
            <input
              style={css.input}
              type="number"
              value={withdrawMin}
              onChange={(e) => setWithdrawMin(Number(e.target.value))}
            />
          </div>

          <div>
            <div style={css.sectionLabel}>จำกัดการถอน ครั้ง/วัน</div>
            <input
              style={css.input}
              type="number"
              value={withdrawLimit}
              onChange={(e) => setWithdrawLimit(Number(e.target.value))}
            />
          </div>

          <div>
            <div style={css.sectionLabel}>หน่วยเวลาถอน</div>
            <select
              style={css.select}
              value={withdrawInterval}
              onChange={(e) => setWithdrawInterval(e.target.value)}
            >
              {["1", "3", "5", "10", "15", "30"].map((v) => (
                <option key={v} value={v}>
                  {v} นาที
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>จำกัดยอดถอน</span>
            <Toggle checked={limitWithdraw} onChange={setLimitWithdraw} />
          </div>

          {limitWithdraw && (
            <div>
              <div style={css.sectionLabel}>จำกัดยอดถอนรายชั่วโมง</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 4,
                }}
              >
                {leftHours.map((h, i) => (
                  <div key={h} style={{ display: "contents" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <label
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          width: 38,
                          flexShrink: 0,
                        }}
                      >
                        {h}
                      </label>
                      <input
                        style={{ ...css.input, height: 28, fontSize: 12 }}
                        type="number"
                        value={hourLimits[h]}
                        onChange={(e) =>
                          setHourLimits((p) => ({
                            ...p,
                            [h]: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <label
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          width: 38,
                          flexShrink: 0,
                        }}
                      >
                        {rightHours[i]}
                      </label>
                      <input
                        style={{ ...css.input, height: 28, fontSize: 12 }}
                        type="number"
                        value={hourLimits[rightHours[i]]}
                        onChange={(e) =>
                          setHourLimits((p) => ({
                            ...p,
                            [rightHours[i]]: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── COL 3: เพิ่มเติม ─────────────────────────────────────────── */}
        <div style={css.panel}>
          <div style={css.panelTitle}>เพิ่มเติม</div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>สะสมแต้ม</span>
            <Toggle checked={pointsEnabled} onChange={setPointsEnabled} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>การจัดอันดับ</span>
            <Toggle checked={rankEnabled} onChange={setRankEnabled} />
          </div>

          <hr style={css.divider} />

          <div>
            <div
              style={{ ...css.sectionLabel, marginBottom: 8, lineHeight: 1.5 }}
            >
              เงื่อนไขใช้มือ โดยไม่ผ่านรหัสป้องกัน
              <br />
              <span style={{ color: "#475569" }}>| นับรอบวันที่ 06:00 น.</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <div>
                <div style={css.sectionLabel}>จำนวนไม่เกิน</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    style={css.input}
                    type="number"
                    value={manualMax}
                    onChange={(e) => setManualMax(Number(e.target.value))}
                  />
                  <span
                    style={{
                      color: "#64748b",
                      whiteSpace: "nowrap",
                      fontSize: 11,
                    }}
                  >
                    เครดิต
                  </span>
                </div>
              </div>
              <div>
                <div style={css.sectionLabel}>จำนวนครั้ง/สมาชิก</div>
                <input
                  style={css.input}
                  type="number"
                  value={manualMaxCount}
                  onChange={(e) => setManualMaxCount(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <hr style={css.divider} />

          <div>
            <div style={{ ...css.sectionLabel, marginBottom: 10 }}>
              อัตราแนะนำเพื่อน
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
              }}
            >
              {[
                { key: "casino", label: "คาสิโน" },
                { key: "slot", label: "สล็อต" },
                { key: "sport", label: "กีฬา" },
                { key: "lottery", label: "ลอตเตอรี" },
                { key: "huay", label: "หวย" },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  style={{
                    background: "#0f1117",
                    border: "1px solid #2d3148",
                    borderRadius: 8,
                    padding: "8px 10px",
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}
                  >
                    {label}
                  </div>
                  <input
                    style={{
                      ...css.input,
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                    type="number"
                    step="0.1"
                    value={affRates[key]}
                    onChange={(e) =>
                      setAffRates((p) => ({
                        ...p,
                        [key]: parseFloat(e.target.value),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <hr style={css.divider} />

          <div>
            <div style={{ ...css.sectionLabel, marginBottom: 10 }}>
              จำกัดการเข้าถึงข้อมูล
            </div>
            {[
              { label: "ระบบ SA", state: saLimit, setState: setSaLimit },
              { label: "ระบบ SELL", state: sellLimit, setState: setSellLimit },
            ].map(({ label, state, setState }) => (
              <div
                key={label}
                style={{
                  background: "#0f1117",
                  border: "1px solid #2d3148",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: "#94a3b8",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={css.sectionLabel}>แดชบอร์ด</div>
                    <select
                      style={{ ...css.select, height: 28, fontSize: 12 }}
                      value={state.dashboard}
                      onChange={(e) =>
                        setState((p) => ({ ...p, dashboard: e.target.value }))
                      }
                    >
                      <option>ไม่มีการจำกัด</option>
                      <option>จำกัด</option>
                    </select>
                  </div>
                  <div>
                    <div style={css.sectionLabel}>ชนะ/แพ้</div>
                    <select
                      style={{ ...css.select, height: 28, fontSize: 12 }}
                      value={state.win}
                      onChange={(e) =>
                        setState((p) => ({ ...p, win: e.target.value }))
                      }
                    >
                      <option>ไม่มีการจำกัด</option>
                      <option>จำกัด</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <hr style={css.divider} />

          {/* Gateway Balances */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div style={css.sectionLabel}>Gateway Balance</div>
              <button
                style={{
                  ...css.btn,
                  height: 24,
                  padding: "0 10px",
                  fontSize: 11,
                }}
                onClick={refreshBalances}
              >
                รีเฟรช
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {gateways.map((gw) => (
                <div
                  key={gw.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#0f1117",
                    border: "1px solid #2d3148",
                    borderRadius: 8,
                    padding: "8px 12px",
                    opacity: gw.enabled ? 1 : 0.5,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <GwLogo name={gw.name} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {gw.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#475569" }}>
                        In: {gw.totalIn?.toLocaleString()} | Out:{" "}
                        {gw.totalOut?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: gw.balance > 0 ? "#4ade80" : "#64748b",
                      }}
                    >
                      ฿
                      {gw.balance?.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <Badge status={gw.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
