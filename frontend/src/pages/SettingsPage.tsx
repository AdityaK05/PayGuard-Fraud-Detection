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
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            <span className="text-[11px] font-semibold text-[#3b82f6] tracking-wider uppercase">
              Engine Governance
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-[11px] text-neutral-400 font-medium">System Policies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            System & Model Configuration
          </h1>
          <p className="text-[13px] text-neutral-400 mt-1">
            Configure risk decision boundaries, automated rules, and security clearance.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="ios-glass-button-primary px-4 py-1.5 text-[12px] flex items-center gap-2 cursor-pointer"
        >
          {saved ? (
            <>
              <Check className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Saved Successfully</span>
            </>
          ) : (
            <span>Save Configuration</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <GlassCard className="flex flex-col gap-5">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
              <div className="w-9 h-9 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] flex items-center justify-center font-medium">
                <User className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-white">{user?.name || "Admin Operator"}</div>
                <div className="text-[11px] text-neutral-400">{user?.email || "admin@payguard.ai"}</div>
              </div>
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <span className="text-neutral-400 text-[11px] uppercase tracking-wider font-medium block mb-1">
                  Security Clearance
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/25 text-[11px] font-medium uppercase tracking-wider">
                  {user?.role || "Risk Operations Director"}
                </span>
              </div>

              <div>
                <span className="text-neutral-400 text-[11px] uppercase tracking-wider font-medium block mb-1">
                  Organization
                </span>
                <span className="font-medium text-white">PayGuard Global Sentinel</span>
              </div>

              <div>
                <span className="text-neutral-400 text-[11px] uppercase tracking-wider font-medium block mb-1">
                  Operational Node
                </span>
                <span className="font-mono text-[12px] text-white">ap-south-mumbai-01</span>
              </div>
            </div>
          </GlassCard>

          {/* Engine Platform Specs */}
          <GlassCard className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
              <Cpu className="w-4 h-4 text-[#3b82f6]" strokeWidth={1.75} />
              <h3 className="text-[13px] font-semibold text-white">Engine Specifications</h3>
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Detection Engine:</span>
                <span className="font-medium text-white">PayGuard Core v2.4</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Behavioral Profiler:</span>
                <span className="font-medium text-white">Continuous Real-Time</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Explainability:</span>
                <span className="font-medium text-white">Deep Signal Attribution</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Inference Target:</span>
                <span className="font-mono text-emerald-400 font-medium">&lt; 20ms</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Policy & Sensitivity Controls */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <GlassCard className="flex flex-col gap-6">
            <div className="flex items-center gap-2 pb-4 border-b border-white/[0.06]">
              <Sliders className="w-4 h-4 text-[#3b82f6]" strokeWidth={1.75} />
              <div>
                <h3 className="text-[15px] font-semibold text-white">Fraud Threshold Governance</h3>
                <p className="text-[12px] text-neutral-400">
                  Fine-tune sensitivity between false positive avoidance and strict fraud blocking.
                </p>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-medium text-white">
                    Automatic Block Cutoff Score
                  </span>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Transactions scoring above this composite index are immediately halted.
                  </p>
                </div>
                <div className="text-2xl font-semibold font-mono text-rose-400">{threshold} / 100</div>
              </div>

              <input
                type="range"
                min="30"
                max="90"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="w-full accent-[#3b82f6] cursor-pointer h-1.5 bg-white/[0.08] rounded-lg"
              />

              <div className="flex justify-between text-[11px] text-neutral-500 font-mono pt-1">
                <span>30 (Strict / Low False Negatives)</span>
                <span>65 (Balanced Enterprise)</span>
                <span>90 (Permissive)</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <div className="text-[13px] font-medium text-white">
                    Real-time Telemetry Push
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Notify operators immediately on high-risk outlier anomalies.
                  </div>
                </div>
                <button
                  onClick={() => setAlertsEnabled(!alertsEnabled)}
                  className={`w-10 h-5 rounded-full transition-all duration-200 relative cursor-pointer ${
                    alertsEnabled ? "bg-[#3b82f6]" : "bg-white/[0.1] border border-white/[0.12]"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${
                      alertsEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <div className="text-[13px] font-medium text-white">
                    Enforce Automated Decision Gateway
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Automatically write decision outcomes directly to core banking ledger.
                  </div>
                </div>
                <button
                  onClick={() => setAutoBlockHighRisk(!autoBlockHighRisk)}
                  className={`w-10 h-5 rounded-full transition-all duration-200 relative cursor-pointer ${
                    autoBlockHighRisk ? "bg-[#3b82f6]" : "bg-white/[0.1] border border-white/[0.12]"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${
                      autoBlockHighRisk ? "translate-x-5" : "translate-x-0.5"
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
