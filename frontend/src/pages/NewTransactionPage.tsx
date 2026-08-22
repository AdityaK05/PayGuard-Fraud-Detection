import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Fingerprint, Crosshair, AlertTriangle } from "lucide-react"
import { TerminalPanel } from "@/components/ui/TerminalPanel"
import { RiskBadge } from "@/components/ui/RiskBadge"
import api from "@/lib/api"

interface PredictionResult {
  transaction_id: string
  fraud_probability: number
  risk_score: number
  risk_level: "safe" | "medium" | "high" | "fraud"
  prediction: "approved" | "blocked"
  confidence: number
  is_anomaly: boolean
  shap_explanation?: Record<string, number>
}

export default function NewTransactionPage() {
  const [formData, setFormData] = useState({
    payment_type: "p2m",
    amount: "9839.64",
    merchant_category: "electronics",
    merchant_id: "MER1234",
    bank_name: "HDFC",
    location_city: "Mumbai",
    device_type: "android",
    os_type: "android_14",
    ip_address: "103.1.2.3",
    time_of_day: "day"
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    const fakeDate = new Date()
    if (formData.time_of_day === "late_night") {
      fakeDate.setUTCHours(2, 0, 0, 0)
    } else {
      fakeDate.setUTCHours(14, 0, 0, 0)
    }

    try {
      const { data } = await api.post("/predict", {
        payment_type: formData.payment_type,
        amount: parseFloat(formData.amount),
        merchant_category: formData.merchant_category,
        merchant_id: formData.merchant_id,
        bank_name: formData.bank_name,
        location_city: formData.location_city,
        location_lat: 19.076,
        location_lng: 72.877,
        device_type: formData.device_type,
        os_type: formData.os_type,
        ip_address: formData.ip_address,
        timestamp: fakeDate.toISOString()
      })
      
      setTimeout(() => {
        setResult(data)
        setLoading(false)
      }, 600)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(`${detail[0]?.loc[1]}: ${detail[0]?.msg}`)
      } else {
        setError(detail || "Failed to process transaction.")
      }
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold font-sans tracking-wide text-sentinel-text-bright">
          MANUAL <span className="text-sentinel-green">SCAN</span>
        </h1>
        <div className="text-[10px] font-mono text-sentinel-text-muted">
          PIPELINE: ISOLATION_FOREST &rarr; XGBOOST
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Input Form */}
        <TerminalPanel className="lg:col-span-7 flex flex-col">
          <div className="flex items-center gap-3 border-b border-sentinel-border/50 pb-4 mb-6">
            <Fingerprint className="w-5 h-5 text-sentinel-green" />
            <span className="font-mono text-[13px] tracking-[0.1em] text-sentinel-text-bright">INJECT TRANSACTION PAYLOAD</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 flex-1 font-mono text-[11px]">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2 col-span-3 sm:col-span-1">
                <label className="text-[#3B5C48]">PAYMENT_TYPE</label>
                <select name="payment_type" value={formData.payment_type} onChange={handleChange} className="w-full bg-[#030805] border border-sentinel-border p-2.5 text-sentinel-text-bright outline-none focus:border-sentinel-green appearance-none rounded-none">
                  <option value="p2p" className="bg-[#030805]">P2P</option>
                  <option value="p2m" className="bg-[#030805]">P2M</option>
                  <option value="bill_payment" className="bg-[#030805]">BILL_PAYMENT</option>
                </select>
              </div>
              <div className="space-y-2 col-span-3 sm:col-span-1">
                <label className="text-[#3B5C48]">AMOUNT (INR)</label>
                <input required type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} className="w-full bg-[#030805] border border-sentinel-border p-2.5 text-sentinel-text-bright outline-none focus:border-sentinel-green rounded-none" />
              </div>
              <div className="space-y-2 col-span-3 sm:col-span-1">
                <label className="text-[#3B5C48]">TIME_OF_DAY</label>
                <select name="time_of_day" value={formData.time_of_day} onChange={handleChange} className="w-full bg-[#030805] border border-sentinel-border p-2.5 text-sentinel-text-bright outline-none focus:border-sentinel-green appearance-none rounded-none">
                  <option value="day" className="bg-[#030805]">DAY (14:00)</option>
                  <option value="late_night" className="bg-[#030805]">NIGHT (02:00)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-sentinel-border/50 bg-[#030805]">
              <div className="space-y-2">
                <label className="text-[#3B5C48]">MERCHANT_CAT</label>
                <input required type="text" name="merchant_category" value={formData.merchant_category} onChange={handleChange} className="w-full bg-transparent border-b border-sentinel-border p-2 text-sentinel-text-bright outline-none focus:border-sentinel-green rounded-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[#3B5C48]">MERCHANT_ID</label>
                <input required type="text" name="merchant_id" value={formData.merchant_id} onChange={handleChange} className="w-full bg-transparent border-b border-sentinel-border p-2 text-sentinel-text-bright outline-none focus:border-sentinel-green rounded-none" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[#3B5C48]">BANK_NAME</label>
                <input required type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className="w-full bg-transparent border-b border-sentinel-border p-2 text-sentinel-text-bright outline-none focus:border-sentinel-green rounded-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-sentinel-border/50 bg-[#030805]">
              <div className="space-y-2">
                <label className="text-[#3B5C48]">CITY</label>
                <input required type="text" name="location_city" value={formData.location_city} onChange={handleChange} className="w-full bg-transparent border-b border-sentinel-border p-2 text-sentinel-text-bright outline-none focus:border-sentinel-green rounded-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[#3B5C48]">IP_ADDRESS</label>
                <input required type="text" name="ip_address" value={formData.ip_address} onChange={handleChange} className="w-full bg-transparent border-b border-sentinel-border p-2 text-sentinel-text-bright outline-none focus:border-sentinel-green rounded-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[#3B5C48]">DEVICE</label>
                <select name="device_type" value={formData.device_type} onChange={handleChange} className="w-full bg-transparent border-b border-sentinel-border p-2 text-sentinel-text-bright outline-none focus:border-sentinel-green appearance-none rounded-none">
                  <option value="android" className="bg-[#030805]">ANDROID</option>
                  <option value="ios" className="bg-[#030805]">IOS</option>
                  <option value="web" className="bg-[#030805]">WEB</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[#3B5C48]">OS_VER</label>
                <input required type="text" name="os_type" value={formData.os_type} onChange={handleChange} className="w-full bg-transparent border-b border-sentinel-border p-2 text-sentinel-text-bright outline-none focus:border-sentinel-green rounded-none" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-sentinel-red/10 border border-sentinel-red text-sentinel-red text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full border border-sentinel-green text-sentinel-green hover:bg-sentinel-green hover:text-[#05130C] py-3 text-[12px] uppercase font-bold tracking-[0.1em] transition-colors disabled:opacity-50">
                {loading ? "ANALYZING PAYLOAD..." : "EXECUTE SCAN"}
              </button>
            </div>
          </form>
        </TerminalPanel>

        {/* Right Side: Prediction Result */}
        <TerminalPanel danger={result?.prediction === "blocked"} className="lg:col-span-5 flex flex-col relative min-h-[500px]">
          <div className="flex items-center gap-3 border-b border-sentinel-border/50 pb-4 mb-6">
            <Crosshair className={`w-5 h-5 ${result?.prediction === "blocked" ? "text-sentinel-red" : "text-sentinel-green"}`} />
            <span className="font-mono text-[13px] tracking-[0.1em] text-sentinel-text-bright">ML TELEMETRY</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sentinel-green font-mono text-[11px] animate-pulse">
              [RUNNING ISOLATION FOREST & XGBOOST...]
            </div>
          ) : result ? (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1">
                
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-[10px] font-mono text-sentinel-text-muted mb-1">RISK INDEX</div>
                    <div className={`text-4xl font-mono ${result.risk_score > 50 ? "text-sentinel-red" : "text-sentinel-green"}`}>
                      {result.risk_score}%
                    </div>
                  </div>
                  <RiskBadge level={result.prediction === "blocked" ? "block" : "safe"} />
                </div>

                <div className="space-y-4 font-mono text-[11px] mb-8">
                  <div className="flex justify-between border-b border-sentinel-border/50 pb-1">
                    <span className="text-[#3B5C48]">FRAUD PROBABILITY</span>
                    <span className="text-sentinel-text-bright">{(result.fraud_probability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between border-b border-sentinel-border/50 pb-1">
                    <span className="text-[#3B5C48]">MODEL CONFIDENCE</span>
                    <span className="text-sentinel-text-bright">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between border-b border-sentinel-border/50 pb-1">
                    <span className="text-[#3B5C48]">ANOMALY DETECTED</span>
                    <span className={result.is_anomaly ? "text-sentinel-red" : "text-sentinel-green"}>
                      {result.is_anomaly ? "TRUE" : "FALSE"}
                    </span>
                  </div>
                </div>

                {/* SHAP Explanations */}
                {result.shap_explanation && (
                  <div className="mt-auto border border-sentinel-border/50 p-4 bg-[#030805]">
                    <h4 className="text-[10px] text-sentinel-text-muted tracking-[0.1em] mb-4 uppercase">SHAP Feature Importance (Explainability)</h4>
                    <div className="space-y-3 font-mono text-[10px]">
                      {Object.entries(result.shap_explanation)
                        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                        .slice(0, 5)
                        .map(([feature, impact], i) => (
                          <div key={i} className="flex flex-col gap-1">
                            <div className="flex justify-between text-[#3B5C48]">
                              <span>{feature.toUpperCase()}</span>
                              <span className={impact > 0 ? "text-sentinel-red" : "text-sentinel-green"}>
                                {impact > 0 ? "+" : ""}{impact.toFixed(3)}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-[#050C08] rounded-full overflow-hidden flex">
                               {/* Render bar originating from center */}
                               <div className="w-1/2 flex justify-end">
                                 {impact < 0 && <div className="h-full bg-sentinel-green" style={{ width: `${Math.min(100, Math.abs(impact) * 30)}%` }} />}
                               </div>
                               <div className="w-1/2 flex justify-start">
                                 {impact > 0 && <div className="h-full bg-sentinel-red" style={{ width: `${Math.min(100, impact * 30)}%` }} />}
                               </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sentinel-text-muted font-mono text-[11px] opacity-50">
              [SYSTEM IDLE — AWAITING PAYLOAD]
            </div>
          )}
        </TerminalPanel>
      </div>
    </div>
  )
}
