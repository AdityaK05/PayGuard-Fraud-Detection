import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Sparkles, ArrowRight, Lock, Mail, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { GlassCard } from "@/components/ui/GlassCard"
import { PayGuardLogo } from "@/components/ui/PayGuardLogo"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

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
      setError(detail || "Invalid credentials or authorization service unavailable.")
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-60px)] flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Centered Glass Modal */}
      <GlassCard className="w-full max-w-[420px] p-8 sm:p-10 border-white/[0.08]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4">
            <PayGuardLogo size="lg" showText={false} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">PayGuard Enterprise</h2>
          <p className="text-[13px] text-neutral-400 mt-1">
            Sign in to access real-time neural fraud intelligence.
          </p>

          {/* Quick Credential Helper Pill */}
          <button
            type="button"
            onClick={() => setFormData({ email: "admin@payguard.ai", password: "Admin@12345" })}
            className="mt-3 px-3 py-1 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/25 text-[11px] font-medium flex items-center gap-1.5 hover:bg-[#3b82f6]/15 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Fill Demo Admin Credentials</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-neutral-300 mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={1.75} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full ios-glass-input pl-10 pr-4 py-2.5 text-[13px] text-white"
                placeholder="operator@bank.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-neutral-300 mb-1.5">
              Security Token / Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={1.75} />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full ios-glass-input pl-10 pr-4 py-2.5 text-[13px] text-white"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400 text-[12px] border border-rose-500/20 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="ios-glass-button-primary w-full py-2.5 text-[13px] flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-white/[0.06] text-[12px] text-neutral-400">
          Need operator clearance?{" "}
          <Link to="/signup" className="text-[#3b82f6] font-medium hover:underline">
            Request Access
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
