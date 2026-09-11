import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { TerminalPanel } from "@/components/ui/TerminalPanel"
import { TerminalButton } from "@/components/ui/TerminalButton"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  // Pre-filling with mock credentials as requested
  const [formData, setFormData] = useState({ email: "admin@payguard.ai", password: "admin123!" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      await login(formData.email, formData.password)
      navigate("/dashboard")
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(detail ? `[ACCESS DENIED] ${detail.toUpperCase()}` : "ACCESS DENIED: NETWORK OR SERVER ERROR")
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 lg:p-10 font-mono">
      {/* Auth Panel */}
      <TerminalPanel className="w-full max-w-[480px] shrink-0 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-pg-accent-soft border border-pg-accent/30 flex items-center justify-center text-pg-accent">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div className="font-sans font-bold text-2xl tracking-tight text-pg-text-white">
            PayGuard
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label className="block text-[12px] font-medium text-pg-text-bright mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="admin@payguard.ai"
              className="w-full bg-pg-surface-2 border border-pg-border rounded-lg p-3.5 text-pg-text-bright text-[14px] outline-none transition-all placeholder:text-pg-text-muted/50 focus:bg-pg-surface-2/80 focus:border-pg-accent focus:ring-2 focus:ring-pg-accent/20"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="mb-6">
            <label className="block text-[12px] font-medium text-pg-text-bright mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••••"
              className="w-full bg-pg-surface-2 border border-pg-border rounded-lg p-3.5 text-pg-text-bright text-[14px] outline-none transition-all placeholder:text-pg-text-muted/50 focus:bg-pg-surface-2/80 focus:border-pg-accent focus:ring-2 focus:ring-pg-accent/20"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && (
            <div className="text-pg-red text-[13px] bg-pg-red-soft border border-pg-red/20 rounded-lg p-3 font-medium mb-2 mt-4">
              {error}
            </div>
          )}

          <div className="mt-8">
            <TerminalButton type="submit" disabled={loading} className="w-full">
              {loading ? "Authenticating..." : "Sign In"}
            </TerminalButton>
          </div>
        </form>

        <div className="flex justify-center mt-6">
          <div className="text-[13px] text-pg-text-muted font-sans">
            Don't have an account? <Link to="/signup" className="text-pg-accent hover:text-pg-accent/80 font-medium ml-1">Request Access</Link>
          </div>
        </div>
      </TerminalPanel>
    </div>
  )
}
