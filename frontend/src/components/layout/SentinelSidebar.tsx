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
    <aside className="fixed left-4 top-[72px] bottom-4 w-[230px] z-40 hidden md:flex flex-col rounded-2xl border border-white/[0.08] bg-pg-surface/80 backdrop-blur-2xl shadow-[var(--glass-shadow)] p-3 transition-colors duration-200">
      {/* Navigation Group */}
      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-3 pt-2 pb-2">
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
                group relative flex items-center justify-between px-3 py-2 rounded-xl text-[13px]
                transition-all duration-150 cursor-pointer select-none
                ${
                  isActive
                    ? "bg-white/[0.06] text-white font-medium border border-white/[0.12] shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                }
              `}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors duration-150 ${
                    isActive ? "text-[#3b82f6]" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}
                  strokeWidth={1.75}
                />
                <span>{link.name}</span>
              </div>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User & Sign Out */}
      <div className="pt-2 border-t border-white/[0.08] flex flex-col gap-1">
        {user && (
          <div className="px-3 py-1 text-left">
            <div className="text-[12px] font-medium text-white truncate">
              {user.name}
            </div>
            <div className="text-[10px] text-zinc-400 truncate">
              {user.email}
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-all duration-150 cursor-pointer w-full text-left"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
