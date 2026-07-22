/**
 * PayGuard – New Transaction Page
 * Beautiful glassmorphic UI to simulate real-world transactions.
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
    type: "PAYMENT",
    amount: "9839.64",
    nameOrig: "C1231006815",
    oldbalanceOrg: "170136.00",
    newbalanceOrig: "160296.36",
    nameDest: "M1979787155",
    oldbalanceDest: "0.00",
    newbalanceDest: "0.00"
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
        type: formData.type,
        amount: parseFloat(formData.amount),
        nameOrig: formData.nameOrig,
        oldbalanceOrg: parseFloat(formData.oldbalanceOrg),
        newbalanceOrig: parseFloat(formData.newbalanceOrig),
        nameDest: formData.nameDest,
        oldbalanceDest: parseFloat(formData.oldbalanceDest),
        newbalanceDest: parseFloat(formData.newbalanceDest),
      })
      
      setTimeout(() => {
        setResult(data)
        setLoading(false)
      }, 600)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || "Validation error")
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
    <div className="max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 text-[var(--color-accent)]" />
          Fraud Simulator
        </h2>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          Test the XGBoost ML Pipeline against the PaySim financial dataset.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 glass-card p-8 rounded-2xl relative overflow-hidden group"
        >
          {/* Subtle animated background gradient */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[var(--color-accent)]/10 rounded-full blur-3xl group-hover:bg-[var(--color-accent)]/20 transition-all duration-700"></div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-[11px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wider">Transaction Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="input-field appearance-none">
                  <option value="PAYMENT">PAYMENT</option>
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="CASH_OUT">CASH_OUT</option>
                  <option value="CASH_IN">CASH_IN</option>
                  <option value="DEBIT">DEBIT</option>
                </select>
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-[11px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wider">Amount (₹)</label>
                <input required type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-black/20 border border-white/5">
              <div className="space-y-1 sm:col-span-3 pb-2 border-b border-white/5 mb-2">
                <h4 className="text-xs font-semibold text-white/70 uppercase tracking-widest">Origin Details</h4>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wider">Account ID</label>
                <input required type="text" name="nameOrig" value={formData.nameOrig} onChange={handleChange} className="input-field text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wider">Old Balance</label>
                <input required type="number" step="0.01" name="oldbalanceOrg" value={formData.oldbalanceOrg} onChange={handleChange} className="input-field text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wider">New Balance</label>
                <input required type="number" step="0.01" name="newbalanceOrig" value={formData.newbalanceOrig} onChange={handleChange} className="input-field text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-black/20 border border-white/5">
              <div className="space-y-1 sm:col-span-3 pb-2 border-b border-white/5 mb-2">
                <h4 className="text-xs font-semibold text-white/70 uppercase tracking-widest">Destination Details</h4>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wider">Account ID</label>
                <input required type="text" name="nameDest" value={formData.nameDest} onChange={handleChange} className="input-field text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wider">Old Balance</label>
                <input required type="number" step="0.01" name="oldbalanceDest" value={formData.oldbalanceDest} onChange={handleChange} className="input-field text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wider">New Balance</label>
                <input required type="number" step="0.01" name="newbalanceDest" value={formData.newbalanceDest} onChange={handleChange} className="input-field text-sm" />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-lg text-[var(--color-danger)] text-sm flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <div className="pt-4">
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base rounded-xl shadow-[0_0_20px_rgba(33,150,243,0.3)] hover:shadow-[0_0_30px_rgba(33,150,243,0.5)] transition-all">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Run AI Prediction"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Right Side: Prediction Result */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 glass-card p-8 rounded-2xl flex flex-col items-center justify-center relative min-h-[400px]"
        >
          {loading ? (
            <div className="flex flex-col items-center text-[var(--color-text-muted)]">
              <Loader2 className="w-12 h-12 animate-spin mb-6 text-[var(--color-accent)] drop-shadow-[0_0_15px_rgba(33,150,243,0.5)]" />
              <p className="animate-pulse tracking-widest uppercase text-xs font-semibold">Running XGBoost Model...</p>
            </div>
          ) : result ? (
            <AnimatePresence>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center w-full"
              >
                <div className={`flex items-center gap-2 px-6 py-2.5 rounded-full border text-sm font-bold mb-10 uppercase tracking-widest shadow-lg ${
                  result.prediction === "approved" 
                    ? "bg-[var(--color-success)]/10 border-[var(--color-success)]/50 text-[var(--color-success)] shadow-[0_0_20px_rgba(76,175,80,0.2)]" 
                    : "bg-[var(--color-danger)]/10 border-[var(--color-danger)]/50 text-[var(--color-danger)] shadow-[0_0_20px_rgba(244,67,54,0.2)]"
                }`}>
                  {result.prediction === "approved" ? <ShieldCheck className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
                  {result.prediction === "approved" ? "Safe Transaction" : "Fraud Detected"}
                </div>
                
                <RiskGauge 
                  score={result.prediction === "approved" ? Math.round((1 - result.fraud_probability) * 100) : Math.round(result.fraud_probability * 100)} 
                  size={260} 
                  label="Confidence" 
                />
                
                <div className="mt-8 text-center space-y-1">
                  <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Risk Score</p>
                  <p className="text-2xl font-bold text-white">{result.risk_score} <span className="text-sm font-normal text-white/50">/ 100</span></p>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
             <div className="flex flex-col items-center opacity-20">
               <RiskGauge score={0} size={260} label="Awaiting Input" />
             </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
