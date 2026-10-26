import { Outlet } from "react-router-dom"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { PayGuardLogo } from "@/components/ui/PayGuardLogo"

export default function SentinelShell() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()

  return (
    <div className="relative min-h-screen bg-pg-base text-pg-text font-sans antialiased selection:bg-pg-accent-soft selection:text-pg-accent">
      {/* ── Apple Liquid Glass Ambient Light Mesh ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-[15%] -right-[10%] w-[650px] h-[650px] rounded-full opacity-40 dark:opacity-30 blur-[120px]"
          style={{
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, rgba(79, 70, 229, 0.15) 70%, transparent 100%)",
          }}
        />
        <div
          className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full opacity-30 dark:opacity-20 blur-[130px]"
          style={{
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(6, 182, 212, 0.12) 70%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Top Apple Glass Header ── */}
      <header className="fixed top-0 left-0 right-0 h-[60px] z-50 flex items-center justify-between px-6 border-b border-pg-border bg-pg-surface/75 backdrop-blur-2xl transition-colors duration-200">
        <div className="flex items-center gap-4">
          <PayGuardLogo size="md" />

          <div className="h-4 w-px bg-pg-border hidden sm:block" />

          {/* Clean Protection Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-[12px] font-medium text-pg-text-muted px-3 py-1 rounded-full bg-pg-surface-2/60 border border-pg-border/60">
            <span className="w-2 h-2 rounded-full bg-pg-green shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
            <span className="text-pg-text-bright font-medium">Live Protection Active</span>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl border border-pg-border bg-pg-surface-2/60 hover:bg-pg-surface-2 text-pg-text-muted hover:text-pg-text-bright flex items-center justify-center transition-all duration-150 cursor-pointer"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Status Chip */}
          {user && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-pg-border">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-semibold text-[12px] flex items-center justify-center shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-[12px] font-semibold text-pg-text-bright leading-none truncate max-w-[120px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-pg-text-muted capitalize leading-none mt-1">
                  {user.role}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Viewport ── */}
      <div className="relative z-10 min-h-screen pt-[60px]">
        <Outlet />
      </div>
    </div>
  )
}
