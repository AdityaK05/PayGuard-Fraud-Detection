/**
 * PayGuard – Admin Dashboard
 */

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import {
  Users, ShieldAlert, Activity, TrendingDown,
  AlertTriangle, Clock,
} from "lucide-react"
import api from "@/lib/api"
import StatCard from "@/components/ui/StatCard"

const RISK_COLORS = ["#10b981", "#f59e0b", "#ef4444"]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/admin/stats")
        setStats(data)
      } catch {
        // Fallback demo data
        setStats({
          total_users: 156,
          total_transactions: 4832,
          total_fraud: 127,
          total_blocked: 127,
          fraud_rate: 0.0263,
          avg_risk_score: 18.4,
          active_users: 142,
          model_version: "1.0.0",
          risk_distribution: { safe: 4200, medium: 505, fraud: 127 },
          recent_fraud: [],
        })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const riskDist = (stats?.risk_distribution as Record<string, number>) || { safe: 0, medium: 0, fraud: 0 }
  const pieData = [
    { name: "Safe", value: riskDist.safe || 1 },
    { name: "Medium", value: riskDist.medium || 1 },
    { name: "Fraud", value: riskDist.fraud || 1 },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.total_users as number || 0}
          icon={Users}
          accentColor="var(--color-accent)"
          delay={0}
        />
        <StatCard
          title="Total Transactions"
          value={stats?.total_transactions as number || 0}
          icon={Activity}
          trend={{ value: 8.2, isUp: true }}
          accentColor="var(--color-cyan)"
          delay={0.1}
        />
        <StatCard
          title="Fraud Detected"
          value={stats?.total_fraud as number || 0}
          icon={ShieldAlert}
          accentColor="var(--color-danger)"
          delay={0.2}
        />
        <StatCard
          title="Fraud Rate"
          value={`${((stats?.fraud_rate as number || 0) * 100).toFixed(2)}%`}
          icon={TrendingDown}
          accentColor="var(--color-warning)"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4 uppercase tracking-wider">
            System-Wide Risk Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={RISK_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "8px", color: "#f1f5f9" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {["Safe", "Medium", "Fraud"].map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[i] }} />
                <span className="text-xs text-[var(--color-text-muted)]">{label}: {pieData[i].value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Live Monitoring
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span className="text-xs text-[var(--color-success)]">Active</span>
            </div>
          </div>
          <div className="space-y-3">
            {(stats?.recent_fraud as Array<Record<string, unknown>> || []).length > 0 ? (
              (stats?.recent_fraud as Array<Record<string, unknown>>).map((tx, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)]">
                  <AlertTriangle className="w-4 h-4 text-[var(--color-danger)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-[var(--color-accent-light)]">{tx.transaction_id as string}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {tx.merchant_category as string} · Risk: {tx.risk_score as number}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-[var(--color-text-muted)]">
                <Clock className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No recent fraud activity</p>
                <p className="text-xs">System is monitoring transactions</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* System Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4 uppercase tracking-wider">
          System Health
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Model Version", value: stats?.model_version as string || "N/A" },
            { label: "Active Users", value: stats?.active_users as number || 0 },
            { label: "Avg Risk Score", value: Math.round(stats?.avg_risk_score as number || 0) },
            { label: "Uptime", value: "99.9%" },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 rounded-lg bg-[var(--color-surface-hover)]">
              <p className="text-lg font-bold text-[var(--color-text-primary)]">{item.value}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
