/**
 * PayGuard – Top Bar
 */

import { Bell, Search } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

interface TopbarProps {
  title?: string
}

export default function Topbar({ title }: TopbarProps) {
  const { user } = useAuth()

  return (
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Title */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {title || "Dashboard"}
        </h2>
      </div>

      {/* Right: Search + Notifications + Avatar */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="input-field pl-10 w-64 bg-[var(--color-background)] text-sm"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-danger)]" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-3 border-l border-[var(--color-border)]">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {user?.name}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] capitalize">
              {user?.role}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </header>
  )
}
