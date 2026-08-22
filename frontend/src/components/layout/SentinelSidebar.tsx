import { Link, useLocation } from "react-router-dom"
import { Shield, Activity, List, Kanban, Settings, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function SentinelSidebar() {
  const { pathname } = useLocation()
  const { logout } = useAuth()

  const links = [
    { name: "COMMAND DECK", path: "/dashboard", icon: Activity },
    { name: "TRANSACTIONS", path: "/history", icon: List },
    { name: "REVIEW QUEUE", path: "/review", icon: Kanban },
    { name: "SETTINGS", path: "/settings", icon: Settings },
  ]

  return (
    <aside className="fixed left-0 top-[60px] bottom-0 w-[240px] border-r border-sentinel-border bg-[#030805]/90 backdrop-blur-sm z-40 flex flex-col font-mono text-[11px] tracking-[0.1em]">
      <div className="p-6 border-b border-sentinel-border/50 mb-4">
        <div className="flex items-center gap-2 text-sentinel-green mb-1">
          <Shield className="w-4 h-4" />
          <span className="font-sans font-bold text-[14px]">PAYGUARD</span>
        </div>
        <div className="text-sentinel-text-muted text-[9px]">L3 ANALYST TERMINAL</div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-4">
        {links.map((link) => {
          const isActive = pathname === link.path || pathname.startsWith(link.path + "/")
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                isActive
                  ? "bg-sentinel-green-dim text-sentinel-green border-l-2 border-sentinel-green"
                  : "text-sentinel-text-muted hover:text-sentinel-text-bright hover:bg-sentinel-border/20 border-l-2 border-transparent"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sentinel-border/50">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-sentinel-red/80 hover:text-sentinel-red hover:bg-sentinel-red/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          TERMINATE SESSION
        </button>
      </div>
    </aside>
  )
}
