/**
 * PayGuard – New Transaction Page
 */

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ArrowRightLeft, ShieldCheck, AlertOctagon } from "lucide-react"
import api from "@/lib/api"
import RiskGauge from "@/components/ui/RiskGauge"

interface PredictionResult {
  transaction_id: string
  fraud_probability: number
  risk_score: number
  risk_level: "safe" | "medium" | "fraud"
  prediction: "approved" | "blocked"
  confidence: number
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

    // Generate a fake ISO string based on selected time
    const fakeDate = new Date()
    if (formData.time_of_day === "late_night") {
      fakeDate.setUTCHours(2, 0, 0, 0) // 2 AM UTC
    } else {
      fakeDate.setUTCHours(14, 0, 0, 0) // 2 PM UTC
    }

    try {
      const { data } = await api.post("/predict", {
        payment_type: formData.payment_type,
        amount: parseFloat(formData.amount),
        merchant_category: formData.merchant_category,
        merchant_id: formData.merchant_id,
        bank_name: formData.bank_name,
        location_city: formData.location_city,
        location_lat: 19.076, // Mocked for simplicity
        location_lng: 72.877, // Mocked for simplicity
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
    <div className="max-w-7xl mx-auto pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-xl font-bold text-[var(--t1)] tracking-wide flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-[var(--t2)]" />
          Fraud Simulator
        </h2>
        <p className="text-[var(--t3)] text-sm mt-1">
          Test the ML Pipeline against custom UPI transaction parameters.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 card p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1 col-span-3 sm:col-span-1">
                <label className="text-[11px] text-[var(--t2)] uppercase font-bold tracking-wider">Payment Type</label>
                <select name="payment_type" value={formData.payment_type} onChange={handleChange} className="input-field appearance-none">
                  <option value="p2p">Peer to Peer (P2P)</option>
                  <option value="p2m">Peer to Merchant (P2M)</option>
                  <option value="bill_payment">Bill Payment</option>
                </select>
              </div>
              <div className="space-y-1 col-span-3 sm:col-span-1">
                <label className="text-[11px] text-[var(--t2)] uppercase font-bold tracking-wider">Amount (₹)</label>
                <input required type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1 col-span-3 sm:col-span-1">
                <label className="text-[11px] text-[var(--t2)] uppercase font-bold tracking-wider">Time of Day</label>
                <select name="time_of_day" value={formData.time_of_day} onChange={handleChange} className="input-field appearance-none">
                  <option value="day">Daytime (2:00 PM)</option>
                  <option value="late_night">Late Night (2:00 AM)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.02)]">
              <div className="space-y-1 sm:col-span-2 pb-2 mb-2 border-b border-[var(--card-border)]">
                <h4 className="text-[11px] font-bold text-[var(--t1)] uppercase tracking-widest">Merchant Details</h4>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--t3)] uppercase font-bold tracking-wider">Category</label>
                <input required type="text" name="merchant_category" value={formData.merchant_category} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--t3)] uppercase font-bold tracking-wider">Merchant ID</label>
                <input required type="text" name="merchant_id" value={formData.merchant_id} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-[var(--t3)] uppercase font-bold tracking-wider">Bank Name</label>
                <input required type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.02)]">
              <div className="space-y-1 sm:col-span-2 pb-2 mb-2 border-b border-[var(--card-border)]">
                <h4 className="text-[11px] font-bold text-[var(--t1)] uppercase tracking-widest">Device & Location</h4>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--t3)] uppercase font-bold tracking-wider">City</label>
                <input required type="text" name="location_city" value={formData.location_city} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--t3)] uppercase font-bold tracking-wider">IP Address</label>
                <input required type="text" name="ip_address" value={formData.ip_address} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--t3)] uppercase font-bold tracking-wider">Device</label>
                <select name="device_type" value={formData.device_type} onChange={handleChange} className="input-field appearance-none">
                  <option value="android">Android</option>
                  <option value="ios">iOS</option>
                  <option value="web">Web</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--t3)] uppercase font-bold tracking-wider">OS Version</label>
                <input required type="text" name="os_type" value={formData.os_type} onChange={handleChange} className="input-field" />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[13px] font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Run AI Prediction"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Right Side: Prediction Result */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 card p-8 flex flex-col items-center justify-center relative min-h-[400px]"
        >
          {loading ? (
            <div className="flex flex-col items-center text-[var(--t3)]">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-[var(--t1)]" />
              <p className="animate-pulse tracking-widest uppercase text-[10px] font-bold">Analyzing Transaction...</p>
            </div>
          ) : result ? (
            <AnimatePresence>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center w-full"
              >
                <div className={`flex items-center gap-2 px-5 py-2 rounded-full border text-xs font-bold mb-8 uppercase tracking-widest ${
                  result.prediction === "approved" 
                    ? "bg-green-500/10 border-green-500/30 text-green-400" 
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                  {result.prediction === "approved" ? <ShieldCheck className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                  {result.prediction === "approved" ? "Safe Transaction" : "Fraud Detected"}
                </div>
                
                <RiskGauge 
                  score={result.risk_score} 
                  size={220} 
                  label="Risk Score" 
                />
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 text-center space-y-1"
                >
                  <p className="text-[10px] text-[var(--t3)] uppercase tracking-wider font-bold">Confidence</p>
                  <p className="text-2xl font-bold text-[var(--t1)]">
                    {result.prediction === "approved" ? Math.round((1 - result.fraud_probability) * 100) : Math.round(result.fraud_probability * 100)}%
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          ) : (
             <div className="flex flex-col items-center opacity-30">
               <RiskGauge score={0} size={220} label="Awaiting Input" />
             </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
