import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

const STATUS_MAP = {
  processing: [1, 2, 3, 11],
  success: [4, 5],
  failed: [6, 7, 8],
};

function getStatusLabel(s) {
  const n = Number(s);
  if (STATUS_MAP.success.includes(n))
    return { label: "สำเร็จ", color: "#1D9E75" };
  if (STATUS_MAP.failed.includes(n))
    return { label: "ล้มเหลว", color: "#E24B4A" };
  return { label: "รอดำเนินการ", color: "#BA7517" };
}

export default function DepositQR() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderNumber = params.get("orderNumber");

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(true);
  async function fetchQR() {
    try {
      const res = await fetch(`/api/deposit/qr?orderNumber=${orderNumber}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setData(json);

      const n = Number(json.status);
      if ([...STATUS_MAP.success, ...STATUS_MAP.failed].includes(n)) {
        setPolling(false);
      }
    } catch (e) {
      setError(e.message);
      setPolling(false);
    }
  }

  useEffect(() => {
    if (!orderNumber) return;
    fetchQR();
  }, [orderNumber]);

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(fetchQR, 5000);
    return () => clearInterval(id);
  }, [polling]);

  if (error)
    return (
      <div style={s.center}>
        <p style={{ color: "#E24B4A" }}>เกิดข้อผิดพลาด: {error}</p>
        <button style={s.backBtn} onClick={() => navigate(-1)}>
          กลับ
        </button>
      </div>
    );

  if (!data)
    return (
      <div style={s.center}>
        <p style={{ color: "#999" }}>กำลังโหลด...</p>
      </div>
    );

  const st = getStatusLabel(data.status);

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <p style={s.title}>สแกน QR เพื่อชำระเงิน</p>

        {/* ── QR Code ── */}
        {data.qrcode_url ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <QRCodeSVG
              value={data.qrcode_url}
              size={220}
              level="M"
              includeMargin={true}
            />
          </div>
        ) : (
          <div style={s.noQr}>ไม่พบ QR Code</div>
        )}

        {/* ── จำนวนเงิน ── */}
        <div style={s.amountRow}>
          <span style={s.amountLabel}>จำนวนเงิน</span>
          <span style={s.amount}>
            ฿
            {Number(data.amount).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* ── Status ── */}
        <div
          style={{
            ...s.statusBadge,
            background: st.color + "22",
            color: st.color,
          }}
        >
          {polling && <span style={s.dot} />}
          {st.label}
        </div>

        {/* ── ข้อมูลเพิ่มเติม ── */}
        <div style={s.meta}>
          <Row label="Order" value={data.order_number} />
          <Row label="ธนาคาร" value={data.receiver_bank_name ?? "-"} />
          <Row label="ชื่อบัญชี" value={data.receiver_name ?? "-"} />
          <Row label="เลขบัญชี" value={data.receiver_account ?? "-"} />
        </div>

        {/* ── ปุ่มเสร็จสิ้น ── */}
        {STATUS_MAP.success.includes(Number(data.status)) && (
          <button style={s.successBtn} onClick={() => navigate("/")}>
            เสร็จสิ้น
          </button>
        )}

        {/* ── ปุ่มกลับ ── */}
        {STATUS_MAP.failed.includes(Number(data.status)) && (
          <button style={s.backBtn} onClick={() => navigate(-1)}>
            ลองใหม่
          </button>
        )}
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
        padding: "6px 0",
        borderBottom: "0.5px solid #eee",
        fontSize: 13,
      }}
    >
      <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      <span style={{ color: "var(--color-text)" }}>{value}</span>
    </div>
  );
}

const s = {
  wrap: { display: "flex", justifyContent: "center", padding: "2rem 1rem" },
  card: {
    background: "var(--color-surface)",
    border: "0.5px solid var(--color-border)",
    borderRadius: 16,
    padding: "1.5rem",
    maxWidth: 400,
    width: "100%",
    textAlign: "center",
  },
  title: { fontSize: 18, fontWeight: 500, marginBottom: "1rem", color: "var(--color-text)" },
  noQr: {
    width: 220,
    height: 220,
    margin: "0 auto 1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--color-surface)",
    borderRadius: 8,
    color: "var(--color-text-tertiary)",
    fontSize: 14,
  },
  amountRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "1rem 0 .75rem",
  },
  amountLabel: { fontSize: 14, color: "var(--color-text-secondary)" },
  amount: { fontSize: 22, fontWeight: 500, color: "var(--color-text)" },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    margin: "0 auto .75rem",
  },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "currentColor" },
  meta: { textAlign: "left", marginTop: ".5rem", marginBottom: "1rem" ,color: "var(--color-text)"},
  successBtn: {
    width: "100%",
    padding: "11px",
    border: "none",
    borderRadius: 10,
    background: "#1D9E75",
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  backBtn: {
    width: "100%",
    padding: "11px",
    border: "0.5px solid var(--color-border)",
    borderRadius: 10,
    background: "transparent",
    fontSize: 14,
    cursor: "pointer",
    marginTop: 8,
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
    gap: 12,
  },
};
