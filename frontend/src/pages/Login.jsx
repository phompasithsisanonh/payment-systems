import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

/* ─── Inline styles ───────────────────────────────────────────────── */
const S = {
  root: {
    minHeight: "100vh",
    background: "#0A0A0F",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    fontFamily: "'Sora', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  orb1: {
    position: "fixed",
    width: 360,
    height: 360,
    borderRadius: "50%",
    background: "rgba(83,74,183,0.18)",
    filter: "blur(90px)",
    top: -80,
    right: -100,
    pointerEvents: "none",
    zIndex: 0,
  },
  orb2: {
    position: "fixed",
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "rgba(29,158,117,0.12)",
    filter: "blur(80px)",
    bottom: -40,
    left: -60,
    pointerEvents: "none",
    zIndex: 0,
  },
  wrap: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 420,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "0.5px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: "2.5rem 2.25rem",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: "0.4rem",
  },
  logoHex: {
    width: 34,
    height: 34,
    background: "linear-gradient(135deg, #7F77DD, #1D9E75)",
    clipPath:
      "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 15,
    fontWeight: 500,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: "0.04em",
  },
  subtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "1.75rem",
    paddingLeft: 44,
  },
  divider: {
    height: 0.5,
    background: "rgba(255,255,255,0.08)",
    marginBottom: "1.75rem",
  },
  stepIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: "1.75rem",
  },
  stepDone: {
    width: 28,
    height: 3,
    borderRadius: 2,
    background: "#1D9E75",
  },
  stepActive: {
    width: 28,
    height: 3,
    borderRadius: 2,
    background: "#7F77DD",
  },
  stepIdle: {
    width: 28,
    height: 3,
    borderRadius: 2,
    background: "rgba(255,255,255,0.1)",
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: "'DM Mono', monospace",
    color: "rgba(255,255,255,0.35)",
    marginLeft: 4,
    letterSpacing: "0.05em",
  },
  field: {
    marginBottom: "1.25rem",
  },
  label: {
    display: "block",
    fontSize: 11,
    fontFamily: "'DM Mono', monospace",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "0.5rem",
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "0.5px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "0.75rem 1rem",
    fontSize: 14,
    fontFamily: "'Sora', sans-serif",
    color: "rgba(255,255,255,0.9)",
    outline: "none",
    boxSizing: "border-box",
  },
  inputOtp: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "0.5px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "0.75rem 1rem",
    fontSize: 22,
    fontFamily: "'DM Mono', monospace",
    color: "rgba(255,255,255,0.9)",
    outline: "none",
    boxSizing: "border-box",
    letterSpacing: "0.35em",
    textAlign: "center",
  },
  pwWrap: {
    position: "relative",
  },
  pwInputWithBtn: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "0.5px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "0.75rem 3rem 0.75rem 1rem",
    fontSize: 14,
    fontFamily: "'Sora', sans-serif",
    color: "rgba(255,255,255,0.9)",
    outline: "none",
    boxSizing: "border-box",
  },
  pwToggle: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "rgba(255,255,255,0.3)",
    fontSize: 15,
    lineHeight: 1,
    padding: 4,
  },
  error: {
    background: "rgba(226,75,74,0.12)",
    border: "0.5px solid rgba(226,75,74,0.3)",
    borderRadius: 8,
    padding: "0.6rem 0.9rem",
    fontSize: 12.5,
    color: "#F09595",
    marginBottom: "1.25rem",
  },
  submitBtn: {
    width: "100%",
    padding: "0.875rem",
    background: "linear-gradient(135deg, #534AB7, #1D9E75)",
    border: "none",
    borderRadius: 10,
    fontFamily: "'Sora', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "#fff",
    cursor: "pointer",
    marginTop: "0.25rem",
    letterSpacing: "0.01em",
  },
  submitBtnDisabled: {
    width: "100%",
    padding: "0.875rem",
    background: "linear-gradient(135deg, #534AB7, #1D9E75)",
    border: "none",
    borderRadius: 10,
    fontFamily: "'Sora', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "#fff",
    cursor: "not-allowed",
    marginTop: "0.25rem",
    opacity: 0.45,
    letterSpacing: "0.01em",
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: "'DM Mono', monospace",
    color: "rgba(255,255,255,0.2)",
    marginTop: "2rem",
    letterSpacing: "0.05em",
  },
};

/* ─── Google Fonts loader (idempotent) ──────────────────────────── */
if (typeof document !== "undefined" && !document.getElementById("login-fonts")) {
  const link = document.createElement("link");
  link.id = "login-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@300;400;500;600&display=swap";
  document.head.appendChild(link);
}

/* ─── Component ─────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login, verify2FA } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [otp, setOtp] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  const handleChange = (k, v) => {
    setError(null);
    if (!requires2FA) setForm((f) => ({ ...f, [k]: v }));
    else if (k === "otp") setOtp(v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!requires2FA) {
      if (!form.username || !form.password) {
        setError("กรุณากรอก Username และ Password");
        return;
      }
      setLoading(true);
      try {
        const res = await login(form.username, form.password);
        if (res.requiresTwoFactor) {
          setRequires2FA(true);
        } else {
          navigate("/");
        }
      } catch (err) {
        setError(
          err?.response?.data?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
        );
      } finally {
        setLoading(false);
      }
    } else {
      if (!otp) {
        setError("กรุณากรอก OTP");
        return;
      }
      setLoading(true);
      try {
        await verify2FA(otp);
        navigate("/");
      } catch (err) {
        console.log(err);
        setError(err?.response?.data?.message || "OTP ไม่ถูกต้อง");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={S.root}>
      {/* Ambient glow orbs */}
      <div style={S.orb1} aria-hidden />
      <div style={S.orb2} aria-hidden />

      <div style={S.wrap}>
        <div style={S.card}>

          {/* Brand */}
          <div style={S.brand}>
            <div style={S.logoHex} aria-hidden />
            <span style={S.logoText}>Payment Admin</span>
          </div>
          <p style={S.subtitle}>Admin Payout Portal</p>
          <div style={S.divider} />

          {/* Step indicator for 2FA */}
          {requires2FA && (
            <div style={S.stepIndicator}>
              <div style={S.stepDone} />
              <div style={S.stepActive} />
              <span style={S.stepLabel}>ยืนยันตัวตน 2FA</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {!requires2FA && (
              <>
                <div style={S.field}>
                  <label htmlFor="username" style={S.label}>Username</label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="admin"
                    value={form.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    disabled={loading}
                    style={S.input}
                  />
                </div>

                <div style={S.field}>
                  <label htmlFor="password" style={S.label}>Password</label>
                  <div style={S.pwWrap}>
                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      disabled={loading}
                      style={S.pwInputWithBtn}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "ซ่อน password" : "แสดง password"}
                      tabIndex={-1}
                      style={S.pwToggle}
                    >
                      {showPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {requires2FA && (
              <div style={S.field}>
                <label htmlFor="otp" style={S.label}>รหัส 2FA (OTP)</label>
                <input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => handleChange("otp", e.target.value)}
                  disabled={loading}
                  style={S.inputOtp}
                />
              </div>
            )}

            {error && <div style={S.error}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={loading ? S.submitBtnDisabled : S.submitBtn}
            >
              {loading
                ? "กำลังดำเนินการ…"
                : requires2FA
                ? "ยืนยัน OTP"
                : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p style={S.footer}>Payment Admin · เฉพาะผู้ดูแลระบบเท่านั้น</p>
        </div>
      </div>
    </div>
  );
}