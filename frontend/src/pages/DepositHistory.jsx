import { useEffect, useState, useCallback } from "react";

// ── Constants ───────────────────────────────────────────────────────────────
const STATUS = {
  processing: { label: "รอดำเนินการ", color: "#BA7517", bg: "#FAEEDA" },
  success:    { label: "สำเร็จ",       color: "#0F6E56", bg: "#E1F5EE" },
  failed:     { label: "ล้มเหลว",      color: "#A32D2D", bg: "#FCEBEB" },
};

function getStatus(s) {
  const n = Number(s);
  if ([4, 5].includes(n)) return STATUS.success;
  if ([6, 7, 8].includes(n)) return STATUS.failed;
  return STATUS.processing;
}

const GREEN       = "#1D9E75";
const GREEN_DARK  = "#0F6E56";
const GREEN_LIGHT = "#E1F5EE";
const LIMIT       = 20;

// ── Icons ───────────────────────────────────────────────────────────────────
const IconSearch   = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>;
const IconFilter   = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 10h10M11 16h2"/></svg>;
const IconDown     = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>;
const IconUp       = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 15l-6-6-6 6"/></svg>;
const IconEmpty    = () => <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{color:"#ccc"}}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2h-2m-4 4H9m4 0h-4m4 0v-4m-4 4v-4"/></svg>;
const IconAlert    = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>;
const IconChevronL = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const IconChevronR = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>;
const IconDeposit  = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>;
const IconWithdraw = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/></svg>;

// ── FilterBar ───────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, isAdmin }) {
  const [open, setOpen] = useState(false);

  const activeCount = [
    filters.status,
    filters.userId,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  return (
    <div style={s.filterWrap}>
      {/* Search */}
      <div style={s.searchBox}>
        <span style={s.searchIcon}><IconSearch /></span>
        <input
          style={s.searchInput}
          placeholder="ค้นหาเลข Order, บัญชี, ชื่อ..."
          value={filters.q}
          onChange={(e) => onChange("q", e.target.value)}
        />
      </div>

      {/* Toggle advanced */}
      <button
        style={{ ...s.filterToggle, ...(open ? s.filterToggleActive : {}) }}
        onClick={() => setOpen((v) => !v)}
      >
        <IconFilter />
        ตัวกรอง
        {activeCount > 0 && <span style={s.filterBadge}>{activeCount}</span>}
        {open ? <IconUp /> : <IconDown />}
      </button>

      {/* Advanced panel */}
      {open && (
        <div style={s.filterPanel}>
          <div style={s.filterGrid}>
            {/* Status */}
            <div style={s.filterField}>
              <p style={s.filterLabel}>สถานะ</p>
              <div style={s.statusGroup}>
                {[
                  { v: "", l: "ทั้งหมด" },
                  { v: "processing", l: "รอดำเนินการ" },
                  { v: "success",    l: "สำเร็จ" },
                  { v: "failed",     l: "ล้มเหลว" },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    style={{
                      ...s.statusPill,
                      ...(filters.status === v ? s.statusPillActive(v) : {}),
                    }}
                    onClick={() => onChange("status", v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div style={s.filterField}>
              <p style={s.filterLabel}>วันที่เริ่มต้น</p>
              <input
                style={s.filterInput}
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onChange("dateFrom", e.target.value)}
              />
            </div>

            <div style={s.filterField}>
              <p style={s.filterLabel}>วันที่สิ้นสุด</p>
              <input
                style={s.filterInput}
                type="date"
                value={filters.dateTo}
                onChange={(e) => onChange("dateTo", e.target.value)}
              />
            </div>

            {/* userId — superadmin only */}
            {isAdmin && (
              <div style={s.filterField}>
                <p style={s.filterLabel}>User ID</p>
                <input
                  style={s.filterInput}
                  type="text"
                  placeholder="กรอก User ID"
                  value={filters.userId}
                  onChange={(e) => onChange("userId", e.target.value)}
                />
              </div>
            )}
          </div>

          {activeCount > 0 && (
            <button
              style={s.clearBtn}
              onClick={() =>
                onChange("__reset__", null)
              }
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ ...s.row, opacity: 0.5 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={s.shimmer(120, 13)} />
            <div style={s.shimmer(80, 11)} />
            <div style={s.shimmer(60, 11)} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            <div style={s.shimmer(70, 15)} />
            <div style={s.shimmer(50, 11)} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AccountChip ───────────────────────────────────────────────────────────────
function AccountChip({ bankName, bankNumber, holderName, accent }) {
  const color  = accent ? GREEN_DARK : "#444";
  const bgCol  = accent ? GREEN_LIGHT : "#f5f5f5";
  const border = accent ? `0.5px solid #9FE1CB` : "0.5px solid #e8e8e8";
  return (
    <div style={{ background: bgCol, border, borderRadius: 8, padding: "7px 10px", minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {holderName || "—"}
      </p>
      <p style={{ fontSize: 10, color: accent ? "#5DCAA5" : "#aaa", margin: "2px 0 0", fontFamily: "'IBM Plex Mono', monospace" }}>
        {bankName || "—"} · {bankNumber || "—"}
      </p>
    </div>
  );
}

// ── HistoryItem ───────────────────────────────────────────────────────────────
function HistoryItem({ item, type }) {
  const [expanded, setExpanded] = useState(false);
  const st = getStatus(item.status);

  const amount = Number(item.amount || 0);
  const fee    = Number(item.fee    || 0);
  const net    = amount - fee;

  // บัญชีต้นทาง (ลูกค้า) — จาก bank_name / bank_card_number
  const srcBank   = item.bank_name            || "-";
  const srcNumber = item.bank_card_number     || "-";
  const srcHolder = item.bank_card_holder_name|| "-";

  // บัญชีปลายทาง — จาก bankName / bankCardNumber (camelCase จาก Withdraw model)
  const dstBank   = item.bankName        || "-";
  const dstNumber = item.bankCardNumber  || "-";
  const dstHolder = item.bankCardHolder  || "-";

  // deposit ใช้ src เป็น primary display
  const displayBank   = type === "withdraw" ? srcBank   : (item.bank_name   || item.bankName   || "-");
  const displayNumber = type === "withdraw" ? srcNumber : (item.bank_card_number || item.bankCardNumber || "-");

  return (
    <div style={s.row}>
      <div style={s.rowMain} onClick={() => setExpanded((v) => !v)}>
        {/* Left */}
        <div style={s.left}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ color: type === "withdraw" ? "#A32D2D" : GREEN }}>
              {type === "withdraw" ? <IconWithdraw /> : <IconDeposit />}
            </span>
            <p style={s.order}>{item.order_number}</p>
          </div>
          <p style={s.sub}>
            {displayBank} · <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>{displayNumber}</span>
          </p>
          {item.username && (
            <p style={s.sub}>ผู้ทำรายการ: <strong style={{ color: "#555" }}>{item.username}</strong></p>
          )}
          <p style={s.date}>{new Date(item.created_at).toLocaleString("th-TH")}</p>
        </div>

        {/* Right */}
        <div style={s.right}>
          <p style={{ ...s.amount, color: type === "withdraw" ? "#A32D2D" : GREEN_DARK }}>
            {type === "withdraw" ? "−" : "+"}฿{amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </p>
          <span style={{ ...s.badge, color: st.color, background: st.bg }}>{st.label}</span>
          <div style={{ marginTop: 6, color: "#bbb" }}>
            {expanded ? <IconUp /> : <IconDown />}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={s.detail}>

          {/* Withdraw: ต้นทาง → ปลายทาง */}
          {type === "withdraw" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* ต้นทาง */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={s.chipLabel}>ต้นทาง (ลูกค้า)</p>
                  <AccountChip bankName={srcBank} bankNumber={srcNumber} holderName={srcHolder} />
                </div>

                {/* Arrow */}
                <div style={s.flowArrow}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>

                {/* ปลายทาง */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...s.chipLabel, color: GREEN_DARK }}>ปลายทาง</p>
                  <AccountChip bankName={dstBank} bankNumber={dstNumber} holderName={dstHolder} accent />
                </div>
              </div>
            </div>
          )}

          {/* Detail rows */}
          <div style={s.detailGrid}>
            {type === "withdraw" && (
              <>
                <DetailRow label="เลขระบบ" value={item.system_order_number || "-"} mono />
                {fee > 0 && <DetailRow label="ค่าธรรมเนียม" value={`฿${fee.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} />}
                {fee > 0 && <DetailRow label="รับสุทธิ"     value={`฿${net.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} highlight />}
                {item.confirmed_at && (
                  <DetailRow label="ยืนยันเมื่อ" value={new Date(item.confirmed_at).toLocaleString("th-TH")} />
                )}
              </>
            )}
            {type === "deposit" && item.channelCode && (
              <DetailRow label="ช่องทาง" value={item.channelCode} />
            )}
            {item.note    && <DetailRow label="หมายเหตุ" value={item.note} />}
            {item.message && <DetailRow label="ข้อความ"  value={item.message} danger />}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono, highlight, danger }) {
  return (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>{label}</span>
      <span style={{
        ...s.detailValue,
        ...(mono      ? { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 } : {}),
        ...(highlight ? { color: GREEN_DARK, fontWeight: 600 } : {}),
        ...(danger    ? { color: "#E24B4A" } : {}),
      }}>
        {value}
      </span>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || i === totalPages ||
      (i >= page - 1 && i <= page + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div style={s.pagination}>
      <button
        style={{ ...s.pageBtn, ...(page <= 1 ? s.pageBtnDisabled : {}) }}
        onClick={() => page > 1 && onChange(page - 1)}
        disabled={page <= 1}
      >
        <IconChevronL />
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} style={s.pageEllipsis}>…</span>
        ) : (
          <button
            key={p}
            style={{ ...s.pageBtn, ...(p === page ? s.pageBtnActive : {}) }}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        style={{ ...s.pageBtn, ...(page >= totalPages ? s.pageBtnDisabled : {}) }}
        onClick={() => page < totalPages && onChange(page + 1)}
        disabled={page >= totalPages}
      >
        <IconChevronR />
      </button>

      <span style={s.pageInfo}>
        {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} / {total} รายการ
      </span>
    </div>
  );
}

// ── HistoryList ────────────────────────────────────────────────────────────────
function HistoryList({ type, isAdmin }) {
  const [list,    setList]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [filters, setFilters] = useState({
    q:        "",
    status:   "",
    userId:   "",
    dateFrom: "",
    dateTo:   "",
  });

  const handleFilter = useCallback((key, value) => {
    if (key === "__reset__") {
      setFilters({ q: "", status: "", userId: "", dateFrom: "", dateTo: "" });
      setPage(1);
      return;
    }
    setFilters((p) => ({ ...p, [key]: value }));
    setPage(1);
  }, []);

  // Build URL
  const buildUrl = useCallback(() => {
    const base = type === "deposit" ? "/api/deposit/history" : "/api/withdraw/history";
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (filters.userId)   params.set("userId",   filters.userId);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo)   params.set("dateTo",   filters.dateTo);
    return `${base}?${params.toString()}`;
  }, [type, page, filters]);

  // Fetch
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(buildUrl(), { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setList(data.data ?? []); setTotal(data.total ?? 0); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [buildUrl]);

  // Client-side filter (q + status)
  const filtered = list.filter((item) => {
    const q = filters.q.toLowerCase();
    if (q) {
      const haystack = [
        item.order_number, item.bank_name, item.bankName,
        item.bank_card_number, item.bankCardNumber,
        item.bank_card_holder_name, item.bankCardHolder,
        item.username,
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.status) {
      const st = getStatus(item.status);
      const key = Object.keys(STATUS).find((k) => STATUS[k] === st);
      if (key !== filters.status) return false;
    }
    return true;
  });

  return (
    <div>
      <FilterBar filters={filters} onChange={handleFilter} isAdmin={isAdmin} type={type} />

      {loading ? (
        <Skeleton />
      ) : error ? (
        <div style={s.center}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <IconAlert />
            <p style={{ color: "#E24B4A", fontSize: 13 }}>{error}</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={s.center}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <IconEmpty />
            <p style={{ color: "#bbb", fontSize: 13 }}>ไม่พบรายการ</p>
          </div>
        </div>
      ) : (
        <>
          <div style={s.resultMeta}>
            <span style={{ fontSize: 11, color: "#aaa" }}>
              แสดง {filtered.length} รายการ
              {filters.q || filters.status ? " (กรองแล้ว)" : ""}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((item, i) => (
              <HistoryItem key={item.order_number ?? i} item={item} type={type} />
            ))}
          </div>
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}
    </div>
  );
}

// ── History (main) ─────────────────────────────────────────────────────────────
export default function History({ isAdmin = false }) {
  const [tab, setTab] = useState("deposit");

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.pageHeader}>
        <p style={s.pageTitle}>ประวัติรายการ</p>
        <p style={s.pageSubtitle}>ฝากเงิน และ ถอนเงิน/โอนเงิน</p>
      </div>

      {/* Tabs */}
      <div style={s.tabRow}>
        {[
          { v: "deposit",  l: "ฝากเงิน",         icon: <IconDeposit /> },
          { v: "withdraw", l: "ถอนเงิน / โอนเงิน", icon: <IconWithdraw /> },
        ].map(({ v, l, icon }) => (
          <button
            key={v}
            style={{ ...s.tab, ...(tab === v ? s.tabActive : {}) }}
            onClick={() => setTab(v)}
          >
            <span style={{ color: tab === v ? GREEN : "#aaa" }}>{icon}</span>
            {l}
          </button>
        ))}
      </div>

      <HistoryList type={tab} isAdmin={isAdmin} />
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────
const s = {
  wrap: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "1.5rem 1rem 3rem",
    fontFamily: "'Sarabun', sans-serif",
  },

  // Header
  pageHeader: { marginBottom: "1.25rem" },
  pageTitle: { fontSize: 18, fontWeight: 600, color: "var(--color-text)", margin: 0 },
  pageSubtitle: { fontSize: 12, color: "var(--color-text-secondary)", margin: "2px 0 0" },

  // Tabs
  tabRow: { display: "flex", gap: 8, marginBottom: "1.25rem" },
  tab: {
    flex: 1,
    padding: "9px 0",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "'Sarabun', sans-serif",
    border: "0.5px solid var(--color-border)",
    borderRadius: 10,
    background: "var(--color-surface)",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "all .15s",
  },
  tabActive: {
    background: GREEN_LIGHT,
    color: GREEN_DARK,
    borderColor: GREEN,
    fontWeight: 600,
  },

  // Filter
  filterWrap: { marginBottom: 14 },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--color-surface)",
    border: "0.5px solid var(--color-border)",
    borderRadius: 10,
    padding: "8px 12px",
    marginBottom: 8,
  },
  searchIcon: { color: "var(--color-text-secondary)", flexShrink: 0, display: "flex" },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 13,
    fontFamily: "'Sarabun', sans-serif",
    color: "var(--color-text)",
    background: "transparent",
  },
  filterToggle: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "'Sarabun', sans-serif",
    border: "0.5px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-surface)",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    position: "relative",
  },
  filterToggleActive: {
    borderColor: GREEN,
    color: GREEN,
    background: GREEN_LIGHT,
  },
  filterBadge: {
    background: GREEN,
    color: "var(--color-text)",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
    padding: "1px 5px",
    lineHeight: 1.4,
  },
  filterPanel: {
    marginTop: 8,
    background: "var(--color-surface)",
    border: "0.5px solid var(--color-border)  ",
    borderRadius: 12,
    padding: "14px 16px",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 14px",
  },
  filterField: {},
  filterLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--color-text-secondary)",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  filterInput: {
    width: "100%",
    padding: "8px 10px",
    fontSize: 13,
    fontFamily: "'Sarabun', sans-serif",
    border: "0.5px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-surface)",
    outline: "none",
    color: "var(--color-text)",
    boxSizing: "border-box",
  },
  statusGroup: { display: "flex", flexWrap: "wrap", gap: 5 },
  statusPill: {
    padding: "4px 10px",
    fontSize: 11,
    fontFamily: "'Sarabun', sans-serif",
    fontWeight: 500,
    border: "0.5px solid var(--color-border)",
    borderRadius: 999,
    background: "var(--color-surface)",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
  },
  statusPillActive: (v) => ({
    background: v === "success" ? GREEN_LIGHT : v === "failed" ? "#FCEBEB" : "#FAEEDA",
    color:      v === "success" ? GREEN_DARK  : v === "failed" ? "#A32D2D" : "#BA7517",
    borderColor:v === "success" ? GREEN       : v === "failed" ? "#E24B4A" : "#EF9F27",
    fontWeight: 600,
  }),
  clearBtn: {
    marginTop: 12,
    padding: "6px 14px",
    fontSize: 12,
    fontFamily: "'Sarabun', sans-serif",
    border: "0.5px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-surface)",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
  },

  // Result meta
  resultMeta: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 8,
  },

  // Row
  row: {
    background: "var(--color-surface)",
    border: "0.5px solid var(--color-border)",
    borderRadius: 12,
    overflow: "hidden",
  },
  rowMain: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "12px 16px",
    cursor: "pointer",
  },
  left: { flex: 1 },
  right: { textAlign: "right", flexShrink: 0, paddingLeft: 12 },
  order: { fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0 },
  sub:   { fontSize: 11, color: "var(--color-text-secondary)", margin: "2px 0 0" },
  date:  { fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" },
  amount:{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "'IBM Plex Mono', monospace" },
  badge: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 500,
    padding: "2px 9px",
    borderRadius: 999,
    marginTop: 4,
  },

  // Detail expanded
  detail: {
    borderTop: "0.5px solid var(--color-border)",
    padding: "10px 16px 12px",
    background: "var(--color-surface)",
  },
  detailGrid: { display: "flex", flexDirection: "column", gap: 5 },
  detailRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  detailLabel:{ fontSize: 11, color: "var(--color-text-secondary)" },
  detailValue:{ fontSize: 12, color: "var(--color-text)", fontWeight: 500 },

  chipLabel: { fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", letterSpacing: "0.4px", textTransform: "uppercase", margin: "0 0 4px" },
  flowArrow: { flexShrink: 0, color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", paddingTop: 18 },

  // Skeleton shimmer
  shimmer: (w, h) => ({
    width: w,
    height: h,
    borderRadius: 4,
    background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.2s infinite",
  }),

  // Pagination
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    flexWrap: "wrap",
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "0.5px solid #ddd",
    background: "#fff",
    color: "#555",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "'Sarabun', sans-serif",
  },
  pageBtnActive: {
    background: GREEN,
    borderColor: GREEN,
    color: "#fff",
    fontWeight: 700,
  },
  pageBtnDisabled: {
    opacity: 0.35,
    cursor: "default",
  },
  pageEllipsis: { fontSize: 13, color: "#bbb", padding: "0 2px" },
  pageInfo: { fontSize: 11, color: "#aaa", marginLeft: 4 },

  // Center empty/error
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
};