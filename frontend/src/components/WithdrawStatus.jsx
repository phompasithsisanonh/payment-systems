import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STATUS_MAP = {
  processing: [1, 2, 3, 11],
  success: [4, 5],
  failed: [6, 7, 8],
};

function getStatus(s) {
  const n = Number(s);
  if ([4, 5].includes(n))
    return { label: "สำเร็จ", color: "#1D9E75", bg: "#E1F5EE" };
  if ([6, 7, 8].includes(n))
    return { label: "ล้มเหลว", color: "#E24B4A", bg: "#FCEBEB" };
  return { label: "กำลังดำเนินการ", color: "#BA7517", bg: "#FAEEDA" };
}

export default function WithdrawStatus() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [data, setData] = useState(state);
  const [polling, setPolling] = useState(true);

  async function fetchStatus() {
    try {
      const res = await fetch(
        `/api/withdraw/status?orderNumber=${state.orderNumber}`,
        {
          credentials: "include",
        }
      );
      const json = await res.json();
      if (!res.ok) return;
      setData((prev) => ({ ...prev, ...json }));
      const n = Number(json.status);
      if ([...STATUS_MAP.success, ...STATUS_MAP.failed].includes(n))
        setPolling(false);
    } catch {
      // ignore errors
      console.error("Error fetching withdraw status");
    }
  }

  useEffect(() => {
    if (!state?.orderNumber) return;
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, [polling]);

  if (!data) return navigate("/withdraw");

  const st = getStatus(data.status);

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={{ ...s.badge, color: st.color, background: st.bg }}>
          {polling && <span style={{ ...s.dot, background: st.color }} />}
          {st.label}
        </div>

        <p style={s.amount}>
          ฿
          {Number(data.amount).toLocaleString("th-TH", {
            minimumFractionDigits: 2,
          })}
        </p>
        <p style={s.fee}>
          ค่าธรรมเนียม ฿
          {Number(data.fee ?? 0).toLocaleString("th-TH", {
            minimumFractionDigits: 2,
          })}
        </p>

        <div style={s.meta}>
          <Row label="Order" value={data.orderNumber} />
          <Row label="ธนาคาร" value={data.bankName} />
          <Row label="เลขบัญชี" value={data.bankCardNumber} />
          <Row label="ชื่อบัญชี" value={data.bankCardHolder} />
        </div>

        <button style={s.btn} onClick={() => navigate("/")}>
          กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "0.5px solid #eee",
        fontSize: 13,
      }}
    >
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ color: "#111" }}>{value}</span>
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
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    marginBottom: "1rem",
  },
  dot: { width: 6, height: 6, borderRadius: "50%" },
  amount: { fontSize: 32, fontWeight: 500, color: "#111", margin: "0 0 4px" },
  fee: { fontSize: 12, color: "#aaa", marginBottom: "1.25rem" },
  meta: { textAlign: "left", marginBottom: "1.25rem" },
  btn: {
    width: "100%",
    padding: "12px",
    border: "0.5px solid #ddd",
    borderRadius: 10,
    background: "transparent",
    fontSize: 14,
    cursor: "pointer",
  },
};
