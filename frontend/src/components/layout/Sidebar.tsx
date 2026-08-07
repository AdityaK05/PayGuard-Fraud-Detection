import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"

/* ── Inline SVG icons ────────────────────── */
const I = {
  shield:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 2L4 6v6c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V6l-8-4z"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>,
  grid:    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5"/><rect x="10.5" y="1.5" width="6" height="6" rx="1.5"/><rect x="1.5" y="10.5" width="6" height="6" rx="1.5"/><rect x="10.5" y="10.5" width="6" height="6" rx="1.5"/></svg>,
  plus:    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-[17px] h-[17px]"><circle cx="9" cy="9" r="7"/><path d="M9 6v6M6 9h6"/></svg>,
  clock:   <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-[17px] h-[17px]"><circle cx="9" cy="9" r="7"/><path d="M9 5.5v3.5l2.5 2.5"/></svg>,
  person:  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-[17px] h-[17px]"><circle cx="9" cy="6.5" r="3"/><path d="M3 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  hex:     <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-[17px] h-[17px]"><path d="M9 1.5l6 3.5v7L9 16.5 3 12V5l6-3.5z"/></svg>,
  chart:   <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-[17px] h-[17px]"><path d="M2 14l4-6 4 3 6-8"/></svg>,
  users:   <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-[17px] h-[17px]"><circle cx="6.5" cy="6" r="2.5"/><path d="M1.5 16c0-2.8 2.2-5 5-5"/><circle cx="12.5" cy="6" r="2.5"/><path d="M9 16c0-2.8 2.2-5 5-5"/></svg>,
  cpu:     <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-[17px] h-[17px]"><rect x="4" y="4" width="10" height="10" rx="1.5"/><path d="M7 1v3M11 1v3M7 14v3M11 14v3M1 7h3M14 7h3M1 11h3M14 11h3"/></svg>,
  moon:    <svg viewBox="0 0 18 18" fill="currentColor" className="w-3.5 h-3.5"><path d="M15.5 11.5A7.5 7.5 0 016.5 2.5a7.5 7.5 0 109 9z"/></svg>,
  sun:     <svg viewBox="0 0 18 18" fill="currentColor" className="w-3.5 h-3.5"><circle cx="9" cy="9" r="3.5"/><path stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" d="M9 1v2M9 15v2M1 9h2M15 9h2M3.1 3.1l1.4 1.4M13.5 13.5l1.4 1.4M3.1 14.9l1.4-1.4M13.5 4.5l1.4-1.4"/></svg>,
  out:     <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6.5 3H4a1 1 0 00-1 1v10a1 1 0 001 1h2.5M12 5.5L15.5 9 12 12.5M15.5 9H7"/></svg>,
}

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: I.grid },
  { to: "/new-transaction", label: "New Transaction", icon: I.plus },
  { to: "/history", label: "History", icon: I.clock },
  { to: "/profile", label: "Profile", icon: I.person },
]
const ADMIN = [
  { to: "/admin", label: "Overview", icon: I.hex },
  { to: "/admin/analytics", label: "Analytics", icon: I.chart },
  { to: "/admin/users", label: "Users", icon: I.users },
  { to: "/admin/models", label: "ML Models", icon: I.cpu },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const isDark = theme === "dark"
  const isAdmin = user?.role === "admin"

  const cls = (active: boolean) =>
    `flex items-center gap-[10px] px-3 py-[9px] rounded-[10px] text-[13px] font-medium transition-all duration-150 no-underline select-none cursor-pointer ` +
    (active
      ? `text-[var(--t1)] bg-[var(--nav-active)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`
      : `text-[var(--t3)] hover:text-[var(--t2)] hover:bg-[var(--nav-hover)]`)

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--card-border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--card-border)", color: "var(--t1)" }}>
            {I.shield}
          </div>
          <div>
            <p className="text-[14px] font-bold tracking-tight" style={{ color: "var(--t1)" }}>PayGuard</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--t3)" }}>Fraud Detection</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--t3)" }}>Main</p>
        <div className="flex flex-col gap-[2px]">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => cls(isActive)}>
              {n.icon}<span>{n.label}</span>
            </NavLink>
          ))}
        </div>
        {isAdmin && (
          <>
            <p className="px-3 mt-6 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--t3)" }}>Admin</p>
            <div className="flex flex-col gap-[2px]">
              {ADMIN.map(n => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => cls(isActive)}>
                  {n.icon}<span>{n.label}</span>
                </NavLink>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 pt-3 flex flex-col gap-2" style={{ borderTop: "1px solid var(--card-border)" }}>
        {/* Theme */}
        <div className="flex items-center justify-between px-3 py-[10px] rounded-[10px]"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--card-border)" }}>
          <div className="flex items-center gap-2" style={{ color: "var(--t3)" }}>
            {isDark ? I.moon : I.sun}
            <span className="text-[12px] font-medium" style={{ color: "var(--t2)" }}>{isDark ? "Dark" : "Light"}</span>
          </div>
          <button onClick={toggleTheme} className={`toggle-track ${isDark ? "active" : ""}`} aria-label="Toggle theme">
            <div className="toggle-thumb" />
          </button>
        </div>
        {/* User */}
        <div className="flex items-center gap-[10px] px-3 py-[10px] rounded-[10px]"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--card-border)" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--t1)" }}>
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold truncate" style={{ color: "var(--t1)" }}>{user?.name}</p>
            <p className="text-[10px] capitalize" style={{ color: "var(--t3)" }}>{user?.role}</p>
          </div>
          <button onClick={() => { logout(); navigate("/login") }} title="Sign out"
            className="p-1.5 rounded-md" style={{ color: "var(--t3)", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--t1)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--t3)")}>
            {I.out}
          </button>
        </div>
      </div>
    </aside>
  )
}
