import { useEffect, useState, useRef } from "react";

export default function TotpSetup() {
  const [status, setStatus] = useState(null); // null=loading, {totpEnabled}
  const [view, setView] = useState("main"); // main | setup | disable
  const [qrUrl, setQrUrl] = useState(null);
  const [secret, setSecret] = useState(null);
  const [token, setToken] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const refs = useRef([]);

  // ── โหลดสถานะ 2FA ──
  useEffect(() => {
    fetch("/api/totp/status", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => setError("โหลดข้อมูลไม่สำเร็จ"));
  }, []);

  // ── เริ่ม setup — ดึง QR ──
  const startSetup = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/totp/setup", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setQrUrl(json.qrUrl);
      setSecret(json.secret);
      setView("setup");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...token];
    next[i] = val.slice(-1);
    setToken(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !token[i] && i > 0)
      refs.current[i - 1]?.focus();
  };

  const resetOtp = () => setToken(["", "", "", "", "", ""]);

  // ── Enable ──
  const handleEnable = async () => {
    const code = token.join("");
    if (code.length < 6) return setError("กรุณากรอกรหัส 6 หลัก");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/totp/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setStatus({ totpEnabled: true });
      setSuccess("เปิดใช้ 2FA สำเร็จแล้ว");
      setView("main");
      resetOtp();
    } catch (e) {
      setError(e.message);
      resetOtp();
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Disable ──
  const handleDisable = async () => {
    const code = token.join("");
    if (code.length < 6) return setError("กรุณากรอกรหัส 6 หลัก");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setStatus({ totpEnabled: false });
      setSuccess("ปิด 2FA สำเร็จแล้ว");
      setView("main");
      resetOtp();
    } catch (e) {
      setError(e.message);
      resetOtp();
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Input ──
  const OtpInput = () => (
    <div style={s.otpRow}>
      {token.map((v, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
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
  );

  if (!status)
    return (
      <div style={s.center}>
        <p style={{ color: "#999" }}>กำลังโหลด...</p>
      </div>
    );

  // ── หน้าหลัก — แสดงสถานะ ──
  if (view === "main")
    return (
      <div style={s.wrap}>
        <div style={s.card}>
          <div style={s.row}>
            <div>
              <p style={s.title}>Google Authenticator</p>
              <p style={s.sub}>ยืนยันตัวตน 2 ขั้นตอนสำหรับการ โอน/ถอนเงิน</p>
            </div>
            <div
              style={{
                ...s.badge,
                background: status.totpEnabled ? "#E1F5EE" : "#f5f5f5",
                color: status.totpEnabled ? "#0F6E56" : "#aaa",
              }}
            >
              {status.totpEnabled ? "เปิดอยู่" : "ปิดอยู่"}
            </div>
          </div>

          {success && <p style={s.successMsg}>{success}</p>}
          {error && <p style={s.error}>{error}</p>}

          <div style={s.divider} />

          {status.totpEnabled ? (
            <button
              style={s.btnDanger}
              onClick={() => {
                setView("disable");
                setError(null);
                resetOtp();
              }}
            >
              ปิดใช้งาน 2FA
            </button>
          ) : (
            <button
              style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}
              disabled={loading}
              onClick={startSetup}
            >
              {loading ? "กำลังโหลด..." : "เปิดใช้งาน 2FA"}
            </button>
          )}
        </div>
      </div>
    );

  // ── หน้า Setup — scan QR ──
  if (view === "setup")
    return (
      <div style={s.wrap}>
        <div style={s.card}>
          <button
            style={s.back}
            onClick={() => {
              setView("main");
              setError(null);
              resetOtp();
            }}
          >
            ← กลับ
          </button>
          <p style={s.title}>ตั้งค่า Google Authenticator</p>
          <p style={s.sub}>
            สแกน QR ด้วยแอป Google Authenticator แล้วกรอกรหัส 6 หลักเพื่อยืนยัน
          </p>

          {qrUrl ? (
            <img src={qrUrl} alt="QR" style={s.qr} />
          ) : (
            <div style={s.qrPlaceholder}>กำลังโหลด QR...</div>
          )}

          {secret && (
            <div style={s.secretBox}>
              <p style={s.secretLabel}>secret key (สำรองไว้)</p>
              <p style={s.secretCode}>{secret}</p>
            </div>
          )}

          <OtpInput />
          {error && <p style={s.error}>{error}</p>}

          <button
            style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}
            disabled={loading}
            onClick={handleEnable}
          >
            {loading ? "กำลังยืนยัน..." : "ยืนยันและเปิดใช้ 2FA"}
          </button>
        </div>
      </div>
    );

  // ── หน้า Disable — กรอก OTP ──
  if (view === "disable")
    return (
      <div style={s.wrap}>
        <div style={s.card}>
          <button
            style={s.back}
            onClick={() => {
              setView("main");
              setError(null);
              resetOtp();
            }}
          >
            ← กลับ
          </button>
          <p style={s.title}>ปิดใช้งาน 2FA</p>
          <p style={s.sub}>
            กรอกรหัส 6 หลักจาก Google Authenticator เพื่อยืนยันการปิด
          </p>

          <OtpInput />
          {error && <p style={s.error}>{error}</p>}

          <button
            style={{ ...s.btnDanger, ...(loading ? s.btnDisabled : {}) }}
            disabled={loading}
            onClick={handleDisable}
          >
            {loading ? "กำลังดำเนินการ..." : "ยืนยันปิด 2FA"}
          </button>
        </div>
      </div>
    );
}

const s = {
  wrap: { maxWidth: 440, margin: "0 auto", padding: "1.5rem 1rem" },
  card: {
    background: "var(--color-surface)",
    border: "0.5px solid var(--color-border)",
    borderRadius: 16,
    padding: "1.5rem",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: 500,
    color: "var(--color-text)",
    marginBottom: 3,
  },
  sub: { fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 },
  badge: {
    fontSize: 12,
    fontWeight: 500,
    padding: "3px 10px",
    borderRadius: 999,
    flexShrink: 0,
  },
  divider: {
    height: "0.5px",
    background: "var(--color-border)",
    margin: "1rem 0",
  },
  successMsg: {
    fontSize: 13,
    color: "#0F6E56",
    background: "var(--color-surface)",
    border: "0.5px solid #0F6E56",
    padding: "8px 12px",
    borderRadius: 8,
    marginTop: 10,
  },
  error: { fontSize: 13, color: "#E24B4A", marginTop: 8, marginBottom: 4 },
  back: {
    border: "none",
    background: "transparent",
    color: "var(--color-text-tertiary)",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    marginBottom: 12,
  },
  qr: {
    width: 200,
    height: 200,
    margin: "1rem auto",
    display: "block",
    border: "0.5px solid var(--color-border)",
    borderRadius: 8,
    padding: 8,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    margin: "1rem auto",
    background: "var(--color-surface)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--color-text-tertiary)",
    fontSize: 13,
  },
  secretBox: {
    background: "var(--color-surface)",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: "1rem",
    textAlign: "center",
  },
  secretLabel: {
    fontSize: 11,
    color: "var(--color-text-secondary)",
    marginBottom: 4,
  },
  secretCode: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "var(--color-text)",
    wordBreak: "break-all",
    letterSpacing: 1,
  },
  otpRow: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
    margin: "1rem 0",
  },
  otpBox: {
    width: 42,
    height: 50,
    textAlign: "center",
    fontSize: 20,
    fontWeight: 500,
    border: "0.5px solid var(--color-border)",
    borderRadius: 10,
    outline: "none",
    color: "var(--color-text)",
  },
  btn: {
    width: "100%",
    padding: "12px",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--color-text)",
    border: "none",
    borderRadius: 10,
    background: "#1D9E75",
    cursor: "pointer",
  },
  btnDanger: {
    width: "100%",
    padding: "12px",
    fontSize: 14,
    fontWeight: 500,
    border: "0.5px solid var(--color-border-danger)",
    borderRadius: 10,
    background: "transparent",
    color: "var(--color-text-danger)",
    cursor: "pointer",
  },
  btnDisabled: {
    background: "var(--color-surface)",
    color: "var(--color-text-tertiary)",
    cursor: "not-allowed",
    border: "none",
  },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
};
