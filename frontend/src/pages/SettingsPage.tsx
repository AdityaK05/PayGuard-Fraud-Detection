import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { GlassCard } from "@/components/ui/GlassCard"
import { User, Sliders, Cpu, Check } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()

  const [threshold, setThreshold] = useState(65)
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [autoBlockHighRisk, setAutoBlockHighRisk] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-8 max-w-[1500px] mx-auto animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-semibold text-pg-accent tracking-wide uppercase">
              Engine Governance
            </span>
            <span className="text-pg-text-muted">·</span>
            <span className="text-[12px] text-pg-text-muted">System Policies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-pg-text-white">
            System & Model Configuration
          </h1>
          <p className="text-[13px] text-pg-text-muted mt-1">
            Configure risk decision boundaries, automated rules, and security clearance.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="ios-glass-button-primary px-5 py-2 text-[13px] flex items-center gap-2"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <span>Save Configuration</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <GlassCard className="flex flex-col gap-5">
            <div className="flex items-center gap-3 pb-4 border-b border-pg-border/50">
              <div className="w-10 h-10 rounded-xl bg-pg-accent-soft text-pg-accent flex items-center justify-center font-bold text-lg">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-pg-text-white">{user?.name || "Admin Operator"}</div>
                <div className="text-[11px] text-pg-text-muted">{user?.email || "admin@payguard.ai"}</div>
              </div>
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <span className="text-pg-text-muted text-[11px] uppercase tracking-wider font-semibold block mb-1">
                  Security Clearance
                </span>
                <span className="inline-block px-3 py-1 rounded-full bg-pg-accent-soft text-pg-accent border border-pg-accent/25 text-[11px] font-bold uppercase tracking-wider">
                  {user?.role || "Risk Operations Director"}
                </span>
              </div>

              <div>
                <span className="text-pg-text-muted text-[11px] uppercase tracking-wider font-semibold block mb-1">
                  Organization
                </span>
                <span className="font-medium text-pg-text-bright">PayGuard Global Sentinel</span>
              </div>

              <div>
                <span className="text-pg-text-muted text-[11px] uppercase tracking-wider font-semibold block mb-1">
                  Operational Node
                </span>
                <span className="font-mono text-[12px] text-pg-text-bright">ap-south-mumbai-01</span>
              </div>
            </div>
          </GlassCard>

          {/* Engine Platform Specs */}
          <GlassCard className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-pg-border/50">
              <Cpu className="w-4 h-4 text-pg-accent" />
              <h3 className="text-[13px] font-bold text-pg-text-bright">Engine Specifications</h3>
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="flex justify-between py-1 border-b border-pg-border/30">
                <span className="text-pg-text-muted">Detection Engine:</span>
                <span className="font-semibold text-pg-text-bright">PayGuard Core v2.4</span>
              </div>
              <div className="flex justify-between py-1 border-b border-pg-border/30">
                <span className="text-pg-text-muted">Behavioral Profiler:</span>
                <span className="font-semibold text-pg-text-bright">Continuous Real-Time</span>
              </div>
              <div className="flex justify-between py-1 border-b border-pg-border/30">
                <span className="text-pg-text-muted">Explainability:</span>
                <span className="font-semibold text-pg-text-bright">Deep Signal Attribution</span>
              </div>
              <div className="flex justify-between py-1 border-b border-pg-border/30">
                <span className="text-pg-text-muted">Inference Target:</span>
                <span className="font-mono text-pg-green font-semibold">&lt; 20ms</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Policy & Sensitivity Controls */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <GlassCard className="flex flex-col gap-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-pg-border/50">
              <Sliders className="w-5 h-5 text-pg-accent" />
              <div>
                <h3 className="text-[15px] font-bold text-pg-text-white">Fraud Threshold Governance</h3>
                <p className="text-[12px] text-pg-text-muted">
                  Fine-tune sensitivity between false positive avoidance and strict fraud blocking.
                </p>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-3 p-5 rounded-2xl bg-pg-surface-2 border border-pg-border/80">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-semibold text-pg-text-bright">
                    Automatic Block Cutoff Score
                  </span>
                  <p className="text-[11px] text-pg-text-muted mt-0.5">
                    Transactions scoring above this composite index are immediately halted.
                  </p>
                </div>
                <div className="text-2xl font-bold font-mono text-pg-red">{threshold} / 100</div>
              </div>

              <input
                type="range"
                min="30"
                max="90"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-pg-surface-3 rounded-lg"
              />

              <div className="flex justify-between text-[11px] text-pg-text-muted font-mono pt-1">
                <span>30 (Strict / Low False Negatives)</span>
                <span>65 (Balanced Enterprise)</span>
                <span>90 (Permissive)</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-pg-surface-2/60 border border-pg-border/60">
                <div>
                  <div className="text-[13px] font-semibold text-pg-text-bright">
                    Real-time Telemetry Push
                  </div>
                  <div className="text-[11px] text-pg-text-muted">
                    Notify operators immediately on high-risk outlier anomalies.
                  </div>
                </div>
                <button
                  onClick={() => setAlertsEnabled(!alertsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    alertsEnabled ? "bg-indigo-600" : "bg-pg-surface-3"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      alertsEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-pg-surface-2/60 border border-pg-border/60">
                <div>
                  <div className="text-[13px] font-semibold text-pg-text-bright">
                    Enforce Automated Decision Gateway
                  </div>
                  <div className="text-[11px] text-pg-text-muted">
                    Automatically write decision outcomes directly to core banking ledger.
                  </div>
                </div>
                <button
                  onClick={() => setAutoBlockHighRisk(!autoBlockHighRisk)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    autoBlockHighRisk ? "bg-indigo-600" : "bg-pg-surface-3"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      autoBlockHighRisk ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
