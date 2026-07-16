import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { Shield, Loader2, ArrowRight } from "lucide-react"

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
      await register(formData.email, formData.name, formData.password, "user")
      navigate("/dashboard")
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || "Validation error");
      } else {
        setError(detail || "Registration failed");
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] font-sans p-4 lg:p-0">
      <div className="w-full max-w-6xl flex flex-row-reverse shadow-2xl rounded-3xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] min-h-[700px]">
        
        {/* Right Side: Premium Image Background */}
        <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 mix-blend-screen scale-105 hover:scale-100 transition-transform duration-1000"
            style={{ backgroundImage: 'url("/auth_background.png")' }}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[var(--color-surface)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06111C] via-transparent to-transparent" />
          
          <div className="relative z-10 max-w-md p-10 mt-auto mb-20 text-white text-right ml-auto">
            <h2 className="text-3xl font-bold mb-4">Secure your ecosystem</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Join thousands of financial institutions trusting FraudGuard AI to drastically reduce false positives and block fraudulent attacks before they happen.
            </p>
          </div>
        </div>

        {/* Left Side: Neumorphic Glass Signup Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-12 sm:p-20 relative">
          <div className="absolute inset-0 bg-gradient-to-bl from-[var(--color-surface)] to-[#06111C]" />
          
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
              <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Create an Account</h1>
              <p className="text-[var(--color-text-secondary)] text-sm">Get started with real-time fraud monitoring.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="input-field w-full h-14 text-base px-5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="input-field w-full h-14 text-base px-5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">Password</label>
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
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-10 text-center text-sm text-[var(--color-text-secondary)]">
              Already have an account?{" "}
              <Link to="/login" className="text-[var(--color-accent)] font-semibold hover:underline transition-all">
                Sign In
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
