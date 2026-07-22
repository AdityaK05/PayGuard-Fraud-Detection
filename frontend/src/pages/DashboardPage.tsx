import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import api from "@/lib/api"
import RiskGauge from "@/components/ui/RiskGauge"

interface DashboardData {
  total_transactions: number
  total_fraud: number
  avg_risk_score: number
  daily_transactions: Array<{ day: string, safe: number, risk: number }>
}

interface Transaction {
  id: number
  transaction_id: string
  amount: number
  status: string
  risk_score?: number
  risk_level?: string
  type?: string
  nameOrig?: string
  nameDest?: string
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, txRes] = await Promise.all([
          api.get("/dashboard"),
          api.get("/transactions?per_page=5")
        ])
        setData(dashRes.data)
        setTransactions(txRes.data.transactions)
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Fallback for empty chart data
  const chartData = data?.daily_transactions?.length 
    ? data.daily_transactions 
    : [{ day: "1", safe: 0, risk: 0 }]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Section - Chart & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Gauge */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 h-[400px] flex flex-col"
          >
            <h3 className="text-sm font-semibold text-white mb-6">Prioritize Overview</h3>
            <div className="flex-1 flex items-center justify-center">
              <RiskGauge
                score={100 - Math.round(data?.avg_risk_score || 0)} 
                size={220}
                label="System Health"
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Analyzed <span className="text-white font-semibold">{data?.total_transactions || 0}</span> transactions
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Large Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 lg:col-span-2 h-[400px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white">System Security (30 Days)</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                <span className="text-xs text-[var(--color-text-secondary)]">Safe</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-danger)]" />
                <span className="text-xs text-[var(--color-text-secondary)]">Fraud Risk</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0B1B2D",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Area type="monotone" dataKey="safe" stroke="var(--color-success)" fill="url(#colorSafe)" strokeWidth={3} />
                <Area type="monotone" dataKey="risk" stroke="var(--color-danger)" fill="url(#colorRisk)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-[var(--color-text-muted)] text-sm">
              No transactions yet. Submit one from the New Transaction tab!
            </div>
          ) : (
              <table className="data-table w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                    <th className="pb-4 font-semibold">Transaction ID</th>
                    <th className="pb-4 font-semibold">Type</th>
                    <th className="pb-4 font-semibold">Amount</th>
                    <th className="pb-4 font-semibold">Origin</th>
                    <th className="pb-4 font-semibold">Dest</th>
                    <th className="pb-4 font-semibold">Status</th>
                    <th className="pb-4 font-semibold">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                      <td className="py-4 font-mono text-xs text-[var(--color-text-primary)]">
                        {tx.transaction_id}
                      </td>
                      <td className="py-4 font-mono text-xs font-semibold text-[var(--color-accent)]">
                        {tx.type}
                      </td>
                      <td className="py-4 text-sm text-[var(--color-text-secondary)] font-medium">
                        ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 font-mono text-xs text-[var(--color-text-muted)]">
                        {tx.nameOrig}
                      </td>
                      <td className="py-4 font-mono text-xs text-[var(--color-text-muted)]">
                        {tx.nameDest}
                      </td>
                      <td className="py-4">
                        {tx.status === "blocked" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-[var(--color-danger-muted)] text-[var(--color-danger)] border border-[var(--color-danger)]/20 shadow-[0_0_10px_rgba(244,67,54,0.1)]">
                            Blocked
                          </span>
                        ) : tx.status === "approved" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-[var(--color-success-muted)] text-[var(--color-success)] border border-[var(--color-success)]/20 shadow-[0_0_10px_rgba(76,175,80,0.1)]">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-[var(--color-accent-muted)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
                            {tx.status}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className={`text-sm font-bold ${
                          (tx.risk_score || 0) > 70 
                            ? "text-[var(--color-danger)] drop-shadow-[0_0_5px_rgba(244,67,54,0.5)]" 
                            : (tx.risk_score || 0) > 30 
                              ? "text-[var(--color-warning)] drop-shadow-[0_0_5px_rgba(255,152,0,0.5)]" 
                              : "text-[var(--color-success)] drop-shadow-[0_0_5px_rgba(76,175,80,0.5)]"
                        }`}>
                          {tx.risk_score ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
        </div>
      </motion.div>

    </div>
  )
}
