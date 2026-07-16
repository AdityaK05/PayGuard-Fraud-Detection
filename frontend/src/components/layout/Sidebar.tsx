/**
 * PayGuard – Sidebar Navigation
 */

import { NavLink, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Send,
  History,
  Shield,
  BarChart3,
  Users,
  Brain,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"

const userLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/new-transaction", label: "New Transaction", icon: Send },
  { to: "/history", label: "Transaction History", icon: History },
  { to: "/profile", label: "Profile", icon: Settings },
]

const adminLinks = [
  { to: "/admin", label: "Admin Dashboard", icon: Shield },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/users", label: "User Management", icon: Users },
  { to: "/admin/models", label: "Model Management", icon: Brain },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isAdmin = user?.role === "admin"

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-cyan)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--color-text-primary)]">
              PayGuard
            </h1>
            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
              Fraud Detection
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
          Main
        </p>
        {userLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)] shadow-[inset_4px_0_0_var(--color-accent)]" 
                  : "text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)]"
              }`
            }
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{link.label}</span>
            {location.pathname === link.to && (
              <motion.div
                layoutId="sidebar-indicator"
                className="ml-auto flex-shrink-0"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="my-4 border-t border-[var(--color-border)]" />
            <p className="px-3 mb-2 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
              Administration
            </p>
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)] shadow-[inset_4px_0_0_var(--color-accent)]" 
                      : "text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)]"
                  }`
                }
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{link.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="px-3 py-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {user?.name}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] capitalize">
              {user?.role}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
