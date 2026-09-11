import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Upload, History, ShieldAlert, Settings, LogOut, Shield, Moon, Sun } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"

export default function SentinelSidebar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const links = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Batch Scan", path: "/batch-scan", icon: Upload },
    { name: "Transactions", path: "/history", icon: History },
    { name: "Review Queue", path: "/review", icon: ShieldAlert },
    { name: "Settings", path: "/settings", icon: Settings },
  ]

  return (
    <aside className="fixed left-0 top-[52px] bottom-0 w-[240px] border-r border-pg-border bg-pg-surface/70 backdrop-blur-xl z-40 flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-pg-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-pg-accent/15 flex items-center justify-center">
            <Shield className="w-4 h-4 text-pg-accent" />
          </div>
          <div>
            <div className="font-bold text-[14px] text-pg-text-white tracking-tight">PayGuard</div>
            <div className="text-[10px] text-pg-text-muted font-medium">Fraud Detection AI</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4">
        {links.map((link) => {
          const isActive = pathname === link.path || pathname.startsWith(link.path + "/")
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-pg-accent/10 text-pg-accent"
                  : "text-pg-text-muted hover:text-pg-text-bright hover:bg-pg-surface-2"
              }`}
            >
              <link.icon className="w-[18px] h-[18px]" />
              {link.name}
            </Link>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-pg-border">
        {user && (
          <div className="px-3 py-2 mb-2">
            <div className="text-[12px] font-medium text-pg-text-bright truncate">{user.name}</div>
            <div className="text-[10px] text-pg-text-muted truncate">{user.email}</div>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 mb-1 w-full text-left rounded-lg text-[13px] font-medium text-pg-text-muted hover:text-pg-text-bright hover:bg-pg-surface-2 transition-all duration-200 cursor-pointer"
        >
          {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-lg text-[13px] font-medium text-pg-red/70 hover:text-pg-red hover:bg-pg-red-soft transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
