/**
 * PayGuard – New Transaction Page
 * Two-panel layout matching the screenshots (Inputs left, Confidence right).
 */

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import api from "@/lib/api"
import RiskGauge from "@/components/ui/RiskGauge"

interface PredictionResult {
  transaction_id: string
  fraud_probability: number
  risk_score: number
  risk_level: "low" | "medium" | "high" | "critical"
  prediction: "safe" | "fraud"
  confidence: number
  shap_explanation: any
}

export default function NewTransactionPage() {
  const [formData, setFormData] = useState({
    upi_id: "merchant@upi",
    amount: "5000",
    merchant_category: "electronics",
    merchant_id: "M123",
    location_city: "Mumbai",
    location_lat: "19.0760",
    location_lng: "72.8777",
    payment_type: "p2m",
    device_type: "mobile",
    ip_address: "192.168.1.1",
    os_type: "android",
    bank_name: "HDFC",
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const { data } = await api.post("/predict", {
        ...formData,
        amount: parseFloat(formData.amount),
        location_lat: parseFloat(formData.location_lat),
        location_lng: parseFloat(formData.location_lng),
      })
      
      // Add artificial delay to show the smooth gauge animation
      setTimeout(() => {
        setResult(data)
        setLoading(false)
      }, 600)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to process transaction.")
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">New Transaction</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8"
        >
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-6">Input Transaction Details</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">UPI ID</label>
                <input required type="text" name="upi_id" value={formData.upi_id} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">Amount (₹)</label>
                <input required type="number" name="amount" value={formData.amount} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">Merchant Category</label>
                <input required type="text" name="merchant_category" value={formData.merchant_category} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">Location (City)</label>
                <input type="text" name="location_city" value={formData.location_city} onChange={handleChange} className="input-field" />
              </div>
            </div>

            {error && <div className="text-[var(--color-danger)] text-sm mt-4">{error}</div>}

            <div className="pt-6">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Transaction"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Right Side: Prediction Result */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 flex flex-col items-center justify-center relative overflow-hidden"
        >
          {loading ? (
            <div className="flex flex-col items-center text-[var(--color-text-muted)]">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-[var(--color-accent)]" />
              <p>Analyzing transaction...</p>
            </div>
          ) : result ? (
            <AnimatePresence>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center w-full"
              >
                <div className={`px-6 py-2 rounded-md border text-sm font-semibold mb-8 uppercase tracking-widest ${
                  result.prediction === "approved" 
                    ? "bg-[var(--color-success)]/10 border-[var(--color-success)] text-[var(--color-success)]" 
                    : "bg-[var(--color-danger)]/10 border-[var(--color-danger)] text-[var(--color-danger)]"
                }`}>
                  {result.prediction === "approved" ? "Transaction Successful" : "Transaction Blocked (Fraud Detected)"}
                </div>
                
                {/* Confidence is 100% minus the fraud probability for Safe, or just fraud_prob for Fraud */}
                <RiskGauge 
                  score={result.prediction === "approved" ? Math.round((1 - result.fraud_probability) * 100) : Math.round(result.fraud_probability * 100)} 
                  size={240} 
                  label="Confidence" 
                />
              </motion.div>
            </AnimatePresence>
          ) : (
             <div className="flex flex-col items-center opacity-30">
               <RiskGauge score={0} size={240} label="Confidence" />
             </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
