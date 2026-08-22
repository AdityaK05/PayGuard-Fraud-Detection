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
        <h1 className="text-xl font-bold font-sans tracking-wide text-sentinel-text-bright">
          SYSTEM <span className="text-sentinel-green">SETTINGS</span>
        </h1>
        <div className="text-[10px] font-mono text-sentinel-text-muted">
          OPERATOR ID: {user?.id}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile / Clearance */}
        <TerminalPanel className="flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-sentinel-border/50 pb-4">
            <User className="w-5 h-5 text-sentinel-green" />
            <span className="font-mono text-[13px] tracking-[0.1em] text-sentinel-text-bright">OPERATOR PROFILE</span>
          </div>
          
          <div className="flex flex-col gap-4 font-mono text-[11px] text-sentinel-text-muted">
            <div>
              <div className="text-[#3B5C48] mb-1">NAME</div>
              <div className="text-sentinel-text-bright text-[13px]">{user?.name || "UNIDENTIFIED"}</div>
            </div>
            <div>
              <div className="text-[#3B5C48] mb-1">EMAIL</div>
              <div className="text-sentinel-text-bright text-[13px]">{user?.email || "UNKNOWN"}</div>
            </div>
            <div>
              <div className="text-[#3B5C48] mb-1">CLEARANCE LEVEL</div>
              <div className="inline-block mt-1 px-2 py-1 border border-sentinel-green text-sentinel-green bg-sentinel-green/10 uppercase">
                {user?.role || "L3 ANALYST"}
              </div>
            </div>
          </div>
        </TerminalPanel>

        {/* Security & Alerts */}
        <TerminalPanel className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-sentinel-border/50 pb-4">
            <Shield className="w-5 h-5 text-sentinel-green" />
            <span className="font-mono text-[13px] tracking-[0.1em] text-sentinel-text-bright">SECURITY & THRESHOLDS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center justify-between mb-2 text-[11px]">
                  <span className="text-sentinel-text-bright">REAL-TIME ALERTS</span>
                  <button 
                    onClick={() => setAlertsEnabled(!alertsEnabled)}
                    className={`w-10 h-5 border flex items-center p-0.5 transition-colors ${alertsEnabled ? "border-sentinel-green justify-end" : "border-sentinel-border justify-start"}`}
                  >
                    <div className={`w-3 h-3 ${alertsEnabled ? "bg-sentinel-green" : "bg-sentinel-border"}`} />
                  </button>
                </div>
                <div className="text-[10px] text-[#3B5C48]">Push notifications for high-risk anomalies (Score &gt; 80)</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 text-[11px]">
                  <span className="text-sentinel-text-bright">STRICT MODE</span>
                  <button 
                    onClick={() => setStrictMode(!strictMode)}
                    className={`w-10 h-5 border flex items-center p-0.5 transition-colors ${strictMode ? "border-sentinel-red justify-end" : "border-sentinel-border justify-start"}`}
                  >
                    <div className={`w-3 h-3 ${strictMode ? "bg-sentinel-red" : "bg-sentinel-border"}`} />
                  </button>
                </div>
                <div className="text-[10px] text-[#3B5C48]">Automatically block medium-risk transactions (Score &gt; 50). Use with caution.</div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-4 border border-sentinel-border bg-[#030805]">
                <div className="flex items-center gap-2 text-sentinel-text-bright text-[11px] mb-2">
                  <Key className="w-3 h-3" /> API KEYS
                </div>
                <div className="text-[10px] text-[#3B5C48] mb-4">
                  Manage your access keys for external system integrations.
                </div>
                <button className="border border-sentinel-border text-sentinel-text-muted hover:border-sentinel-green hover:text-sentinel-green text-[10px] py-1.5 px-3 transition-colors">
                  GENERATE NEW KEY
                </button>
              </div>

              <div className="p-4 border border-sentinel-red/30 bg-sentinel-red/5">
                <div className="flex items-center gap-2 text-sentinel-red text-[11px] mb-2">
                  <AlertCircle className="w-3 h-3" /> DANGER ZONE
                </div>
                <button className="border border-sentinel-red text-sentinel-red hover:bg-sentinel-red hover:text-white text-[10px] py-1.5 px-3 transition-colors">
                  RESET MODEL WEIGHTS
                </button>
              </div>
            </div>
          </div>
        </TerminalPanel>

      </div>
    </div>
  )
}
