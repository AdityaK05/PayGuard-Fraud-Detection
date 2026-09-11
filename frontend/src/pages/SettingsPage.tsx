import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { TerminalPanel } from "@/components/ui/TerminalPanel"
import { AlertCircle, User, Shield, Key } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  
  // Dummy state for toggles
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [strictMode, setStrictMode] = useState(false)

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold font-sans tracking-tight text-pg-text-white">
          System Settings
        </h1>
        <div className="text-[12px] font-medium text-pg-text-muted">
          Operator ID: {user?.id}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile / Clearance */}
        <TerminalPanel className="flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-pg-border/50 pb-4">
            <User className="w-5 h-5 text-pg-accent" />
            <span className="text-[14px] font-semibold tracking-wide text-pg-text-bright">Operator Profile</span>
          </div>
          
          <div className="flex flex-col gap-4 text-[13px] text-pg-text-muted">
            <div>
              <div className="font-medium mb-1">Name</div>
              <div className="text-pg-text-bright font-semibold">{user?.name || "Unidentified"}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Email</div>
              <div className="text-pg-text-bright font-semibold">{user?.email || "Unknown"}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Clearance Level</div>
              <div className="inline-block mt-1 px-3 py-1 rounded-lg border border-pg-accent/30 text-pg-accent bg-pg-accent-soft font-semibold text-[11px] uppercase tracking-wider">
                {user?.role || "L3 Analyst"}
              </div>
            </div>
          </div>
        </TerminalPanel>

        {/* Security & Alerts */}
        <TerminalPanel className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-pg-border/50 pb-4">
            <Shield className="w-5 h-5 text-pg-accent" />
            <span className="text-[14px] font-semibold tracking-wide text-pg-text-bright">Security & Thresholds</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center justify-between mb-2 text-[13px]">
                  <span className="text-pg-text-bright font-medium">Real-Time Alerts</span>
                  <button 
                    onClick={() => setAlertsEnabled(!alertsEnabled)}
                    className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors cursor-pointer ${alertsEnabled ? "bg-pg-accent justify-end" : "bg-pg-surface-3 justify-start"}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
                <div className="text-[12px] text-pg-text-muted">Push notifications for high-risk anomalies (Score &gt; 80)</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 text-[13px]">
                  <span className="text-pg-text-bright font-medium">Strict Mode</span>
                  <button 
                    onClick={() => setStrictMode(!strictMode)}
                    className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors cursor-pointer ${strictMode ? "bg-pg-red justify-end" : "bg-pg-surface-3 justify-start"}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
                <div className="text-[12px] text-pg-text-muted">Automatically block medium-risk transactions (Score &gt; 50). Use with caution.</div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-5 rounded-xl border border-pg-border bg-pg-surface-2">
                <div className="flex items-center gap-2 text-pg-text-bright font-semibold text-[13px] mb-2">
                  <Key className="w-4 h-4 text-pg-accent" /> API Keys
                </div>
                <div className="text-[12px] text-pg-text-muted mb-4">
                  Manage your access keys for external system integrations.
                </div>
                <button className="rounded-lg border border-pg-border text-pg-text font-medium hover:border-pg-accent hover:text-pg-accent text-[12px] py-2 px-4 transition-colors cursor-pointer">
                  Generate New Key
                </button>
              </div>

              <div className="p-5 rounded-xl border border-pg-red/20 bg-pg-red-soft">
                <div className="flex items-center gap-2 text-pg-red font-semibold text-[13px] mb-2">
                  <AlertCircle className="w-4 h-4" /> Danger Zone
                </div>
                <button className="rounded-lg border border-pg-red/50 text-pg-red font-medium hover:bg-pg-red hover:text-white text-[12px] py-2 px-4 transition-colors cursor-pointer mt-2">
                  Reset Model Weights
                </button>
              </div>
            </div>
          </div>
        </TerminalPanel>

      </div>
    </div>
  )
}
