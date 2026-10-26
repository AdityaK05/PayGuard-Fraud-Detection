import { Outlet, Navigate, Link, useLocation } from "react-router-dom"
import { LayoutDashboard, ScanLine, ReceiptText, ShieldAlert, Settings } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import SentinelSidebar from "./SentinelSidebar"

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const { pathname } = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-pg-accent border-t-transparent animate-spin" />
          <span className="text-sm font-medium text-pg-text-muted">Loading PayGuard...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const mobileNav = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Scan", path: "/batch-scan", icon: ScanLine },
    { name: "Ledger", path: "/history", icon: ReceiptText },
    { name: "Review", path: "/review", icon: ShieldAlert },
    { name: "Settings", path: "/settings", icon: Settings },
  ]

  return (
    <div className="relative min-h-screen">
      {/* Desktop Floating Glass Sidebar */}
      <SentinelSidebar />

      {/* Main Content Viewport */}
      <main className="md:ml-[268px] p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 relative z-10 max-w-[1600px] transition-all duration-200">
        <Outlet />
      </main>

      {/* Mobile Floating iOS Bottom Glass Dock */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 z-50 rounded-2xl border border-pg-border bg-pg-surface/85 backdrop-blur-2xl shadow-xl flex items-center justify-around py-2 px-1">
        {mobileNav.map((item) => {
          const isActive = pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-medium transition-colors ${
                isActive ? "text-pg-accent font-semibold" : "text-pg-text-muted hover:text-pg-text-bright"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
