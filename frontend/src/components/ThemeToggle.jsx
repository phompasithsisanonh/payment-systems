// components/ThemeToggle.jsx
export function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      title={isDark ? "Switch to Light" : "Switch to Dark"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        border: "0.5px solid var(--color-border)",
        borderRadius: 8,
        background: "var(--color-surface)",
        color: "var(--color-text-sub)",
        cursor: "pointer",
        fontSize: 12,
        fontFamily: "inherit",
        transition: "all .15s",
      }}
    >
      {isDark ? "☀️" : "🌙"}
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
