import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowRight, Lock, Mail, User, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { GlassCard } from "@/components/ui/GlassCard"
import { PayGuardLogo } from "@/components/ui/PayGuardLogo"

export default function SignupPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await register(formData.email, formData.name, formData.password, "analyst")
      navigate("/dashboard")
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(detail || "Registration could not be completed.")
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-60px)] flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <GlassCard className="w-full max-w-[420px] p-8 sm:p-10 border-white/[0.08]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4">
            <PayGuardLogo size="lg" showText={false} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Operator Account</h2>
          <p className="text-[13px] text-neutral-400 mt-1">
            Request credentials for PayGuard risk intelligence.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-neutral-300 mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={1.75} />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full ios-glass-input pl-10 pr-4 py-2.5 text-[13px] text-white"
                placeholder="Rohan Sharma"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-neutral-300 mb-1.5">
              Enterprise Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={1.75} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full ios-glass-input pl-10 pr-4 py-2.5 text-[13px] text-white"
                placeholder="rohan@bank.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-neutral-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={1.75} />
              <input
                type="password"
                required
                minLength={8}
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-white/[0.06] text-[12px] text-neutral-400">
          Already registered?{" "}
          <Link to="/login" className="text-[#3b82f6] font-medium hover:underline">
            Sign In
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
