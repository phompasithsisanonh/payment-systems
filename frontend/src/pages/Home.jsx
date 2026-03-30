import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WalletCard from "../components/WalletCard";
import WithdrawForm from "../pages/WithdrawForm";

import DepositForm from "../pages/DepositForm";
import DepositHistory from "../pages/DepositHistory";
import TotpSetup from "../components/TotpSetup";
import UsersPage from "./UsersPage";
import { ThemeToggle } from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";

const MENU = [
  {
    key: "dashboard",
    label: "แดชบอร์ด",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },

  {
    key: "withdraw",
    label: "โอนเงิน/ถอนเงิน",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 22v-20M7 17h4.5a3.5 3.5 0 0 0 0-7H7a3.5 3.5 0 0 1 0-7h5" />
      </svg>
    ),
  },
  {
    key: "deposit",
    label: "ฝากเงิน",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    key: "history",
    label: "ประวัติ",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "ตั้งค่า 2FA",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    key: "users",
    label: "จัดการผู้ใช้",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 0 0-3-3.87M9 21v-2a4 4 0 0 1 3-3.87M5 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" />
      </svg>
    ),
  },
];

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard"); // ✅ เริ่มที่ dashboard
  const { theme, toggle } = useTheme();
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = (user?.username ?? user?.name ?? "AD")
    .slice(0, 2)
    .toUpperCase();
  const currentLabel = MENU.find((m) => m.key === tab)?.label ?? "";

  return (
    <div style={s.shell}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.logo}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            >
              <polygon points="12 2 22 8 22 16 12 22 2 16 2 8" />
            </svg>
          </div>
          <span style={s.brandName}>ApexPay</span>
        </div>

        <nav style={s.nav}>
          {MENU.map((m) => (
            <button
              key={m.key}
              style={{
                ...s.navItem,
                ...(tab === m.key ? s.navItemActive : {}),
              }}
              onClick={() => setTab(m.key)}
            >
              <span style={{ color: tab === m.key ? "#0F6E56" : "#888" }}>
                {m.icon}
              </span>
              {m.label}
            </button>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.userRow}>
            <div style={s.avatar}>{initials}</div>
            <span style={s.username}>
              {user?.username ?? user?.name ?? "Admin"}
            </span>
            <button
              style={s.logoutBtn}
              onClick={handleLogout}
              title="ออกจากระบบ"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={s.main}>
        <header style={s.topbar}>
          <span style={s.topbarTitle}>ApexPay</span>
          <span style={s.topbarSep}>/</span>
          <span style={s.topbarSub}>{currentLabel}</span>

          <ThemeToggle theme={theme} onToggle={toggle} />
        </header>

        <main style={s.content}>
          {/* ✅ แก้ทุก tab ให้ถูกต้อง */}
          {tab === "dashboard" && <WalletCard />}
          {tab === "withdraw" && <WithdrawForm />}
          {tab === "deposit" && <DepositForm />}
          {tab === "history" && <DepositHistory />}
          {tab === "settings" && <TotpSetup />}
          {tab === "users" && <UsersPage />}
        </main>
      </div>
    </div>
  );
}

const GREEN = "#1D9E75";
const GREEN_BG = "#E1F5EE";
const GREEN_TEXT = "#0F6E56";

const s = {
  shell: {
    display: "flex",
    height: "100vh",
    background: "var(--surface)",
    border: "0.5px solid var(--border)",
    color: "var(--text)",
  },
  sidebar: {
    width: 220,
    background: "var(--surface)",
    border: "0.5px solid var(--border)",
    color: "var(--text)",
    borderRight: "0.5px solid #e5e5e5",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "18px 16px",
    borderBottom: "0.5px solid #e5e5e5",
  },
  logo: {
    width: 30,
    height: 30,
    background: GREEN,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandName: { fontSize: 15, fontWeight: 500, color: "var(--text)" },
  nav: {
    flex: 1,
    padding: "10px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 10px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    color: "#666",
    border: "none",
    background: "transparent",
    width: "100%",
    textAlign: "left",
    transition: "background .12s",
  },
  navItemActive: { background: GREEN_BG, color: GREEN_TEXT, fontWeight: 500 },
  sidebarFooter: { padding: "12px 8px", borderTop: "0.5px solid #e5e5e5" },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "var(--surface)",
    border: "0.5px solid var(--border)",
    color: "var(--text)",
    fontSize: 11,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  username: {
    fontSize: 12,
    color: "#666",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    padding: 6,
    border: "none",
    background: "var(--surface)",
    color: "var(--text)",
    cursor: "pointer",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    transition: "color .12s",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  topbar: {
    height: 52,
    background: "var(--surface)",
    border: "0.5px solid var(--border)",
    color: "var(--text)",
    borderBottom: "0.5px solid #e5e5e5",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: 8,
    flexShrink: 0,
  },
  topbarTitle: { fontSize: 14, fontWeight: 500, color: "var(--text)" },
  topbarSep: { fontSize: 13, color: "var(--text)" },
  topbarSub: { fontSize: 13, color: "var(--text)" },
  content: { flex: 1, overflowY: "auto", padding: "0" },
};
