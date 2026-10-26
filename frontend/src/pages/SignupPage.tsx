import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Shield, ArrowRight, Lock, Mail, User, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { GlassCard } from "@/components/ui/GlassCard"

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
      <GlassCard className="w-full max-w-[460px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border-pg-border/80">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-[1px] shadow-md flex items-center justify-center mb-3">
            <div className="w-full h-full bg-pg-surface rounded-[15px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-pg-accent" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-pg-text-white">Create Operator Account</h2>
          <p className="text-[13px] text-pg-text-muted mt-1">
            Request credentials for PayGuard risk intelligence.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-pg-text-bright mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pg-text-muted" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full ios-glass-input pl-10 pr-4 py-3 text-[13px] text-pg-text-bright"
                placeholder="Rohan Sharma"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-pg-text-bright mb-1.5">
              Enterprise Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pg-text-muted" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full ios-glass-input pl-10 pr-4 py-3 text-[13px] text-pg-text-bright"
                placeholder="rohan@bank.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-pg-text-bright mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pg-text-muted" />
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full ios-glass-input pl-10 pr-4 py-3 text-[13px] text-pg-text-bright"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-pg-red-soft text-pg-red text-[12px] border border-pg-red/20 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="ios-glass-button-primary w-full py-3.5 text-[14px] flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-pg-border/50 text-[12px] text-pg-text-muted">
          Already registered?{" "}
          <Link to="/login" className="text-pg-accent font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
