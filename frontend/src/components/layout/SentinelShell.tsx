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
      {/* ── Minimalist Atmospheric Backdrop ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full opacity-15 blur-[150px]"
          style={{
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 75%)",
          }}
        />
        <div
          className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full opacity-10 blur-[150px]"
          style={{
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Top Minimalist Header ── */}
      <header className="fixed top-0 left-0 right-0 h-[56px] z-50 flex items-center justify-between px-6 border-b border-white/[0.08] bg-pg-surface/80 backdrop-blur-2xl transition-colors duration-200">
        <div className="flex items-center gap-4">
          <PayGuardLogo size="md" />

          <div className="h-3.5 w-px bg-white/[0.12] hidden sm:block" />

          {/* Clean Protection Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-zinc-300 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            <span className="text-zinc-200 font-medium tracking-wide">Live Monitoring</span>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-[#3b82f6]" strokeWidth={1.75} /> : <Moon className="w-3.5 h-3.5 text-[#3b82f6]" strokeWidth={1.75} />}
          </button>

          {/* User Status Chip */}
          {user && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/[0.08]">
              <div className="w-7 h-7 rounded-lg bg-[#2563eb] text-white font-medium text-[11px] flex items-center justify-center shadow-sm border border-white/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-[12px] font-medium text-white leading-none truncate max-w-[120px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-zinc-400 capitalize leading-none mt-1">
                  {user.role}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Viewport ── */}
      <div className="relative z-10 min-h-screen pt-[56px]">
        <Outlet />
      </div>
    </div>
  )
}
