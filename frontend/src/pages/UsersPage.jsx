import { useState, useEffect } from "react";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/users";
import { useAuth } from "../context/AuthContext";

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "admin",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers()
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (me?.role !== "superadmin")
    return <div style={s.forbidden}>ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;

  const openAdd = () => {
    setEditTarget(null);
    setForm({ username: "", password: "", role: "admin" });
    setError(null);
    setShowForm(true);
  };

  const openEdit = (user) => {
    setEditTarget(user);
    setForm({ username: user.username, password: "", role: user.role });
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      if (editTarget) {
        const res = await updateUser(editTarget._id, form);
        setUsers((u) =>
          u.map((x) => (x._id === editTarget._id ? res.data : x))
        );
      } else {
        const res = await createUser(form);
        setUsers((u) => [res.data, ...u]);
      }
      setShowForm(false);
      setEditTarget(null);
    } catch (e) {
      setError(e?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("ยืนยันลบผู้ใช้นี้?")) return;
    await deleteUser(id);
    setUsers((u) => u.filter((x) => x._id !== id));
  };

  const handleToggleActive = async (user) => {
    const res = await updateUser(user._id, { isActive: !user.isActive });
    setUsers((u) => u.map((x) => (x._id === user._id ? res.data : x)));
  };

  const initials = (name) => (name ?? "AD").slice(0, 2).toUpperCase();
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleString("th-TH", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "-";

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <div style={s.pageTitle}>จัดการ Admin</div>
          <div style={s.pageSub}>ผู้ดูแลระบบทั้งหมด</div>
        </div>
        <button style={{ ...s.btn, ...s.btnPrimary }} onClick={openAdd}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          เพิ่ม Admin
        </button>
      </div>

      {/* Stats */}
      <div style={s.stats}>
        <div style={s.stat}>
          <div style={s.statLabel}>ทั้งหมด</div>
          <div style={s.statValue}>{users.length}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>ใช้งานอยู่</div>
          <div style={{ ...s.statValue, color: GREEN_TEXT }}>{activeCount}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>ระงับแล้ว</div>
          <div style={s.statValue}>{inactiveCount}</div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={s.modalBg}>
          <div style={s.modal}>
            <div style={s.modalTitle}>
              {editTarget ? "แก้ไข Admin" : "เพิ่ม Admin ใหม่"}
            </div>

            <div style={s.fg}>
              <label style={s.label}>Username</label>
              <input
                style={s.input}
                value={form.username}
                placeholder="username"
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
              />
            </div>
            <div style={s.fg}>
              <label style={s.label}>
                Password{" "}
                {editTarget && (
                  <span style={{ color: "#aaa" }}>(เว้นว่างถ้าไม่เปลี่ยน)</span>
                )}
              </label>
              <input
                style={s.input}
                type="password"
                value={form.password}
                placeholder="••••••••"
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
            <div style={s.fg}>
              <label style={s.label}>Role</label>
              <select
                style={s.input}
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value }))
                }
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            {error && <div style={s.errorMsg}>{error}</div>}

            <div style={s.modalFooter}>
              <button style={s.btn} onClick={() => setShowForm(false)}>
                ยกเลิก
              </button>
              <button
                style={{ ...s.btn, ...s.btnPrimary }}
                onClick={handleSubmit}
              >
                {editTarget ? "บันทึก" : "เพิ่ม"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={s.card}>
        {loading ? (
          <div style={s.loadingRow}>กำลังโหลด...</div>
        ) : (
          <table style={s.table}>
            <colgroup>
              <col style={{ width: 200 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 180 }} />
            </colgroup>
            <thead>
              <tr>
                {["ผู้ใช้งาน", "Role", "สถานะ", "Login ล่าสุด", "จัดการ"].map(
                  (h) => (
                    <th key={h} style={s.th}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td style={s.td}>
                    <div style={s.avatarCell}>
                      <div style={s.avatar}>{initials(u.username)}</div>
                      <span>{u.username}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span
                      style={{
                        ...s.badge,
                        ...(u.role === "superadmin"
                          ? s.badgeSuperAdmin
                          : s.badgeAdmin),
                      }}
                    >
                      <span
                        style={{
                          ...s.dot,
                          background:
                            u.role === "superadmin" ? GREEN_TEXT : "#185FA5",
                        }}
                      />
                      {u.role === "superadmin" ? "Super Admin" : "Admin"}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span
                      style={{
                        ...s.badge,
                        ...(u.isActive ? s.badgeActive : s.badgeInactive),
                      }}
                    >
                      <span
                        style={{
                          ...s.dot,
                          background: u.isActive ? GREEN_TEXT : "#A32D2D",
                        }}
                      />
                      {u.isActive ? "ใช้งาน" : "ระงับ"}
                    </span>
                  </td>
                  <td style={{ ...s.td, color: "#888", fontSize: 12 }}>
                    {fmtDate(u.lastLoginAt)}
                  </td>
                  <td style={s.td}>
                    {u._id !== me._id ? (
                      <div style={s.actions}>
                        <button style={s.btnSm} onClick={() => openEdit(u)}>
                          แก้ไข
                        </button>
                        <button
                          style={s.btnSm}
                          onClick={() => handleToggleActive(u)}
                        >
                          {u.isActive ? "ระงับ" : "เปิดใช้"}
                        </button>
                        <button
                          style={{ ...s.btnSm, ...s.btnDanger }}
                          onClick={() => handleDelete(u._id)}
                        >
                          ลบ
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "#ccc" }}>
                        — ตัวเอง —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const GREEN = "#1D9E75";
const GREEN_BG = "#E1F5EE";
const GREEN_TEXT = "#0F6E56";

const s = {
  page: { padding: "1.5rem", maxWidth: 860 },
  forbidden: { padding: "2rem", color: "#A32D2D", textAlign: "center" },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.25rem",
  },
  pageTitle: { fontSize: 16, fontWeight: 500, color: "var(--color-text)" },
  pageSub: { fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: 10,
    marginBottom: "1.25rem",
  },
  stat: { background: "var(--color-surface)", borderRadius: 8, padding: 12 },
  statLabel: {
    fontSize: 11,
    color: "var(--color-text-secondary)",
    marginBottom: 4,
  },
  statValue: { fontSize: 20, fontWeight: 500, color: "var(--color-text)" },

  modalBg: {
    background: "var(--color-bg-overlay)",
    borderRadius: 12,
    padding: "2rem",
    marginBottom: "1.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "var(--color-surface)",
    border: "0.5px solid var(--color-border)",
    borderRadius: 12,
    padding: "1.25rem",
    width: "100%",
    maxWidth: 380,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: "1rem",
    color: "#111",
  },
  modalFooter: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 4,
  },

  fg: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 },
  label: { fontSize: 12, color: "var(--color-text-secondary)" },
  input: {
    height: 34,
    border: "0.5px solid var(--color-border)",
    borderRadius: 8,
    padding: "0 10px",
    fontSize: 13,
    background: "var(--color-surface)",
    color: "var(--color-text)",
    width: "100%",
    outline: "none",
  },
  errorMsg: {
    fontSize: 13,
    color: "var(--color-text-danger)",
    marginBottom: 10,
  },

  card: {
    background: "var(--color-surface)",
    border: "0.5px solid var(--color-border)",
    borderRadius: 12,
    overflow: "hidden",
  },
  loadingRow: {
    padding: "2rem",
    textAlign: "center",
    fontSize: 13,
    color: "var(--color-text-secondary)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
    tableLayout: "fixed",
  },
  th: {
    textAlign: "left",
    padding: "10px 14px",
    fontSize: 11,
    color: "var(--color-text-secondary)",
    fontWeight: 500,
    borderBottom: "0.5px solid var(--color-border)",
    background: "var(--color-surface)",
  },
  td: {
    padding: "11px 14px",
    borderBottom: "0.5px solid var(--color-border)",
    color: "var(--color-text)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },

  avatarCell: { display: "flex", alignItems: "center", gap: 8 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: GREEN_BG,
    color: GREEN_TEXT,
    fontSize: 11,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 99,
    fontWeight: 500,
  },
  badgeSuperAdmin: { background: GREEN_BG, color: GREEN_TEXT },
  badgeAdmin: { background: "#E6F1FB", color: "#185FA5" },
  badgeActive: { background: GREEN_BG, color: GREEN_TEXT },
  badgeInactive: { background: "#FCEBEB", color: "#A32D2D" },
  dot: { width: 5, height: 5, borderRadius: "50%", flexShrink: 0 },

  actions: { display: "flex", gap: 6, alignItems: "center" },
  btn: {
    height: 34,
    padding: "0 14px",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
    border: "0.5px solid var(--color-border)",
    background: "var(--color-surface)",
    color: "var(--color-text)",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  btnPrimary: { background: GREEN, color: "#fff", borderColor: "transparent" },
  btnSm: {
    height: 28,
    padding: "0 10px",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    border: "0.5px solid var(--color-border)",
    background: "var(--color-surface)",
    color: "var(--color-text)",
  },
  btnDanger: {
    color: "var(--color-text-danger)",
    borderColor: "var(--color-border-danger)",
    background: "var(--color-surface)",
  },
};
