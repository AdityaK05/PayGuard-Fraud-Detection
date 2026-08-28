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
      <TerminalPanel className="w-full max-w-[480px] shrink-0">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-[26px] h-[26px] flex items-center justify-center border border-sentinel-green text-[13px] text-sentinel-green">
            ◈
          </div>
          <div className="font-sans font-bold text-[17px] tracking-[0.02em] text-sentinel-text-bright">
            PAY<span className="text-sentinel-green">GUARD</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label className="block text-[10px] tracking-[0.12em] text-sentinel-text-muted mb-1.5 before:content-['>_'] before:text-sentinel-green before:mr-1">
              operator id
            </label>
            <input
              type="email"
              required
              placeholder="admin@payguard.ai"
              className="w-full bg-sentinel-green-dim border border-sentinel-border p-3 text-sentinel-text-bright font-mono text-[13px] outline-none transition-all placeholder:text-[#2C4536] focus:bg-[rgba(0,255,150,0.07)] focus:border-sentinel-green focus:shadow-[0_0_0_3px_rgba(0,255,150,0.1),_0_0_20px_rgba(0,255,150,0.15)]"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="block text-[10px] tracking-[0.12em] text-sentinel-text-muted mb-1.5 before:content-['>_'] before:text-sentinel-green before:mr-1">
              access key
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••••"
              className="w-full bg-sentinel-green-dim border border-sentinel-border p-3 text-sentinel-text-bright font-mono text-[13px] outline-none transition-all placeholder:text-[#2C4536] focus:bg-[rgba(0,255,150,0.07)] focus:border-sentinel-green focus:shadow-[0_0_0_3px_rgba(0,255,150,0.1),_0_0_20px_rgba(0,255,150,0.15)]"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && (
            <div className="text-sentinel-red text-[11px] mb-2 font-mono mt-4">
              [ERROR] {error}
            </div>
          )}

          <div className="mt-6">
            <TerminalButton type="submit" disabled={loading}>
              {loading ? "AUTHENTICATING..." : "AUTHENTICATE →"}
            </TerminalButton>
          </div>
        </form>

        <div className="flex flex-col sm:flex-row justify-between mt-[18px] text-[10.5px] text-[#3B5C48] gap-2">
          <span>AES-256 · JWT</span>
          <span>clearance: <b className="text-sentinel-green">L3 ANALYST</b></span>
        </div>

        <div className="h-[1px] bg-sentinel-border mt-[22px] mb-[16px]" />

        <div className="text-[10px] text-[#2C4536] tracking-[0.02em]">
          Don't have an account? <Link to="/signup" className="text-sentinel-green hover:underline">Request Access</Link>
        </div>
      </TerminalPanel>
    </div>
  )
}
