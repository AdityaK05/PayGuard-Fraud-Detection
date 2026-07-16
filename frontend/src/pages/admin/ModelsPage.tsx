/**
 * PayGuard – Model Management Page (Admin)
 */

import { useState } from "react"
import { motion } from "framer-motion"
import { Brain, Upload, RefreshCcw, CheckCircle, Loader2 } from "lucide-react"
import api from "@/lib/api"

export default function ModelsPage() {
  const [retraining, setRetraining] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")

  const handleRetrain = async () => {
    setRetraining(true)
    setMessage("")
    try {
      const { data } = await api.post("/admin/retrain")
      setMessage(data.message)
    } catch {
      setMessage("Retrain request failed.")
    } finally {
      setRetraining(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMessage("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const { data } = await api.post("/admin/upload-dataset", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setMessage(data.message)
    } catch {
      setMessage("Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-purple-muted)] flex items-center justify-center">
          <Brain className="w-5 h-5 text-[var(--color-purple)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Model Management</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Upload datasets and retrain models</p>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-success-muted)] text-[var(--color-success)] text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          {message}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Dataset */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-4 h-4 text-[var(--color-accent)]" />
            <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">Upload Dataset</h4>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Upload a CSV file with labeled transaction data for model retraining.
          </p>
          <label className="btn-secondary w-full cursor-pointer justify-center">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading..." : "Choose CSV File"}
            <input type="file" accept=".csv" onChange={handleUpload} className="hidden" />
          </label>
        </motion.div>

        {/* Retrain */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <RefreshCcw className="w-4 h-4 text-[var(--color-cyan)]" />
            <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">Retrain Model</h4>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Trigger a full model retraining cycle with the latest dataset and feedback.
          </p>
          <button onClick={handleRetrain} disabled={retraining} className="btn-primary w-full disabled:opacity-50">
            {retraining ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            {retraining ? "Retraining..." : "Start Retrain"}
          </button>
        </motion.div>
      </div>

      {/* Model Version Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4 uppercase tracking-wider">
          Model Registry
        </h4>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Model</th>
                <th>Accuracy</th>
                <th>F1</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-mono text-xs text-[var(--color-accent-light)]">v1.0.0</td>
                <td>XGBoost + Isolation Forest</td>
                <td>99.85%</td>
                <td>99.65%</td>
                <td><span className="badge-safe">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
