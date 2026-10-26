import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  ScanLine,
  ReceiptText,
  ShieldAlert,
  Settings,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function SentinelSidebar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  const links = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Scan & Simulate",
      path: "/batch-scan",
      icon: ScanLine,
    },
    {
      name: "Audit Ledger",
      path: "/history",
      icon: ReceiptText,
    },
    {
      name: "Review Queue",
      path: "/review",
      icon: ShieldAlert,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ]

  return (
    <aside className="fixed left-4 top-[76px] bottom-4 w-[240px] z-40 hidden md:flex flex-col rounded-3xl border border-pg-border bg-pg-surface/75 backdrop-blur-2xl shadow-[var(--glass-shadow)] p-3 transition-colors duration-200">
      {/* Navigation Group */}
      <div className="text-[11px] font-semibold text-pg-text-muted uppercase tracking-wider px-3 pt-2 pb-1.5">
        Platform
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {links.map((link) => {
          const isActive =
            pathname === link.path || (link.path !== "/dashboard" && pathname.startsWith(link.path))
          const Icon = link.icon

          return (
            <Link
              key={link.name}
              to={link.path}
              className={`
                group relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-medium
                transition-all duration-150 cursor-pointer select-none
                ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_4px_14px_rgba(79,70,229,0.35)]"
                    : "text-pg-text hover:text-pg-text-white hover:bg-pg-surface-2/80"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-[18px] h-[18px] transition-transform duration-150 ${
                    isActive ? "text-white scale-105" : "text-pg-text-muted group-hover:text-pg-accent"
                  }`}
                />
                <span>{link.name}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User & Sign Out */}
      <div className="pt-2 border-t border-pg-border/60 flex flex-col gap-1">
        {user && (
          <div className="px-3 py-1.5 text-left">
            <div className="text-[12px] font-semibold text-pg-text-bright truncate">
              {user.name}
            </div>
            <div className="text-[10px] text-pg-text-muted truncate">
              {user.email}
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium text-pg-red/80 hover:text-pg-red hover:bg-pg-red-soft transition-all duration-150 cursor-pointer w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
