import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { Shield, Loader2, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [formData, setFormData] = useState({ email: "", password: "" })
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
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || "Validation error");
      } else {
        setError(detail || "Invalid credentials");
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] font-sans p-4 lg:p-0">
      <div className="w-full max-w-6xl flex shadow-2xl rounded-3xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] min-h-[700px]">
        
        {/* Left Side: Premium Image Background */}
        <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
          {/* We use the newly generated abstract auth background */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 mix-blend-screen scale-105 hover:scale-100 transition-transform duration-1000"
            style={{ backgroundImage: 'url("/auth_background.png")' }}
          />
          {/* Overlay to ensure text readability if added, and to blend with the dark theme */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--color-surface)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06111C] via-transparent to-transparent" />
          
          <div className="relative z-10 max-w-md p-10 mt-auto mb-20 text-white">
            <h2 className="text-3xl font-bold mb-4">Enterprise-grade fraud prevention</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Detect and block fraudulent UPI transactions in real-time with sub-50ms latency using our hybrid machine learning pipeline and explainable AI insights.
            </p>
          </div>
        </div>

        {/* Right Side: Neumorphic Glass Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-12 sm:p-20 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-surface)] to-[#06111C]" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="flex items-center gap-4 mb-12 justify-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-muted)] flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <Shield className="w-6 h-6 text-[var(--color-accent)]" />
              </div>
              <span className="text-3xl font-bold text-white tracking-wide">
                FraudGuard <span className="text-[var(--color-accent)]">AI</span>
              </span>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Welcome Back</h1>
              <p className="text-[var(--color-text-secondary)] text-sm">Sign in to your dashboard to monitor transactions.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@payguard.ai"
                  className="input-field w-full h-14 text-base px-5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">Password</label>
                  <a href="#" className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-semibold transition-colors">Forgot Password?</a>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field w-full h-14 text-base px-5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {error && (
                <div className="p-4 text-sm text-[var(--color-danger)] bg-[var(--color-danger-muted)] border border-[var(--color-danger)]/20 rounded-xl flex items-center justify-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center h-14 mt-6 text-base tracking-wide rounded-xl"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-10 text-center text-sm text-[var(--color-text-secondary)]">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[var(--color-accent)] font-semibold hover:underline transition-all">
                Request Access
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
