import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPw, setShowPw] = useState(false);
    const navigate = useNavigate();
  const set = (k, v) => {
    setError(null);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.username || !form.password) {
      setError("กรุณากรอก Username และ Password");
      return;
    }
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate("/")
    } catch (err) {
      setError(
        err?.response?.data?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      {/* geometric accent panels */}
      <div className="login-panel-left" aria-hidden />
      <div className="login-panel-right" aria-hidden />

      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <span className="login-logo-mark">⬡</span>
          <span className="login-logo-text">Payment Admin</span>
        </div>
        <p className="login-subtitle">Admin Payout Portal</p>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="admin"
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "ซ่อน password" : "แสดง password"}
                tabIndex={-1}
              >
                {showPw ? (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? (
              <span className="login-spinner-row">
                <span className="login-spinner" /> กำลังเข้าสู่ระบบ…
              </span>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>

        <p className="login-footer">
          Payment Admin · เฉพาะผู้ดูแลระบบเท่านั้น
        </p>
      </div>
    </div>
  );
}
