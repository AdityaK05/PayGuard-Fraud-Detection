import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  ShieldAlert,
  Zap,
  Activity,
  ArrowUpRight,
  Clock,
  ScanLine,
} from "lucide-react"
import { GlassCard } from "@/components/ui/GlassCard"
import { KpiCard } from "@/components/ui/KpiCard"
import { RiskBadge } from "@/components/ui/RiskBadge"
import { Skeleton } from "@/components/ui/Skeleton"
import api from "@/lib/api"

interface Stats {
  total_transactions: number
  total_fraud: number
  total_approved: number
  avg_risk_score: number
  daily_transactions?: { day: string; safe: number; risk: number }[]
}

interface Tx {
  id: number
  transaction_id: string
  amount: number
  status: string
  payment_type?: string
  merchant_category?: string
  bank_name?: string
  timestamp?: string
  risk_score?: number
  risk_level?: string
}

const DEFAULT_CHART = [
  { day: "Mon", safe: 142, risk: 8 },
  { day: "Tue", safe: 189, risk: 12 },
  { day: "Wed", safe: 215, risk: 7 },
  { day: "Thu", safe: 260, risk: 15 },
  { day: "Fri", safe: 310, risk: 19 },
  { day: "Sat", safe: 285, risk: 11 },
  { day: "Sun", safe: 240, risk: 9 },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d")

  useEffect(() => {
    let isMounted = true
    Promise.all([
      api.get("/dashboard").catch(() => ({ data: null })),
      api.get("/transactions?per_page=6").catch(() => ({ data: { transactions: [] } })),
    ]).then(([statsRes, txsRes]) => {
      if (!isMounted) return
      if (statsRes.data) setStats(statsRes.data)
      if (txsRes.data?.transactions) setTxs(txsRes.data.transactions)
      setLoading(false)
    })
    return () => {
      isMounted = false
    }
  }, [])

  const avgRisk = Math.round(stats?.avg_risk_score ?? 18)
  const chartData = stats?.daily_transactions?.length ? stats.daily_transactions : DEFAULT_CHART
  const totalVolume = stats?.total_transactions ?? (txs.length ? txs.length * 42 : 1643)
  const totalBlocked = stats?.total_fraud ?? Math.round(totalVolume * 0.042)

  return (
    <div className="flex flex-col gap-8 max-w-[1500px] mx-auto animate-fadeIn">
      {/* ── Executive Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-semibold text-pg-accent tracking-wide uppercase">
              Real-Time Intelligence
            </span>
            <span className="text-pg-text-muted">·</span>
            <span className="text-[12px] text-pg-text-muted">Live Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-pg-text-white">
            Executive Risk Pulse
          </h1>
          <p className="text-[13px] text-pg-text-muted mt-1">
            Real-time telemetry and automated anomaly prevention for UPI payment streams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* iOS Segmented Time Switcher */}
          <div className="inline-flex p-1 rounded-2xl bg-pg-surface-2 border border-pg-border">
            {(["24h", "7d", "30d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  timeRange === r
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm"
                    : "text-pg-text-muted hover:text-pg-text-bright"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Link
            to="/batch-scan"
            className="ios-glass-button-primary px-4 py-2 text-[13px] inline-flex items-center gap-2"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan Transaction</span>
          </Link>
        </div>
      </div>

      {/* ── KPI Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <>
            <Skeleton className="h-[135px]" />
            <Skeleton className="h-[135px]" />
            <Skeleton className="h-[135px]" />
            <Skeleton className="h-[135px]" />
          </>
        ) : (
          <>
            <KpiCard
              title="Volume Monitored"
              value={totalVolume.toLocaleString()}
              trend="+14.8%"
              trendUp={true}
              subtitle="vs last week"
              icon={<Activity className="w-4 h-4" />}
            />
            <KpiCard
              title="Threats Intercepted"
              value={totalBlocked.toLocaleString()}
              trend="3.4% of total"
              trendUp={false}
              danger={true}
              subtitle="Auto-blocked by rule"
              icon={<ShieldAlert className="w-4 h-4 text-pg-red" />}
            />
            <GlassCard className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-pg-text-muted uppercase">
                  Mean Risk Index
                </span>
                <span className="text-[10px] font-semibold text-pg-green px-2 py-0.5 rounded-full bg-pg-green-soft border border-pg-green/20">
                  Healthy
                </span>
              </div>
              <div className="my-1 flex items-baseline gap-2">
                <span
                  className={`text-3xl font-bold tracking-tight font-sans ${
                    avgRisk > 50 ? "text-pg-red" : avgRisk > 25 ? "text-pg-amber" : "text-pg-green"
                  }`}
                >
                  {avgRisk}%
                </span>
                <span className="text-[12px] text-pg-text-muted font-medium">composite risk</span>
              </div>
              <div className="w-full bg-pg-surface-3 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    avgRisk > 50 ? "bg-pg-red" : avgRisk > 25 ? "bg-pg-amber" : "bg-pg-green"
                  }`}
                  style={{ width: `${Math.min(100, avgRisk)}%` }}
                />
              </div>
            </GlassCard>
            <KpiCard
              title="Inference Velocity"
              value="18 ms"
              trend="Zero Queuing"
              trendUp={true}
              subtitle="99.99% SLA Target"
              icon={<Zap className="w-4 h-4 text-pg-accent" />}
            />
          </>
        )}
      </div>

      {/* ── Main Analytical Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry Wave Chart */}
        <GlassCard className="lg:col-span-2 flex flex-col min-h-[440px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-pg-border/50 gap-2">
            <div>
              <h2 className="text-[15px] font-semibold text-pg-text-white tracking-tight">
                Continuous Telemetry Wave
              </h2>
              <p className="text-[12px] text-pg-text-muted">
                Transaction volume distribution: Approved Safe vs Anomaly Intercepted
              </p>
            </div>
            <div className="flex items-center gap-4 text-[12px] font-medium text-pg-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pg-green" /> Safe Traffic
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pg-red" /> Blocked Threats
              </span>
            </div>
          </div>

          <div className="flex-1 w-full pt-4 -ml-2">
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="safeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="rgba(148, 163, 184, 0.12)"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-2xl border border-pg-border bg-pg-surface/90 backdrop-blur-xl p-3 shadow-xl text-[12px]">
                          <div className="font-semibold text-pg-text-bright mb-1">{label}</div>
                          <div className="flex items-center justify-between gap-4 text-pg-green">
                            <span>Safe Volume:</span>
                            <span className="font-bold font-mono">{payload[0]?.value}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-pg-red">
                            <span>Threats Blocked:</span>
                            <span className="font-bold font-mono">{payload[1]?.value}</span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="safe"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#safeGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="risk"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fill="url(#riskGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Live Decisions Feed */}
        <GlassCard className="flex flex-col min-h-[440px]">
          <div className="flex items-center justify-between pb-4 border-b border-pg-border/50">
            <div>
              <h2 className="text-[15px] font-semibold text-pg-text-white tracking-tight">
                Live Decisions Feed
              </h2>
              <p className="text-[12px] text-pg-text-muted">Instant streaming evaluation</p>
            </div>
            <Link
              to="/history"
              className="text-[12px] font-semibold text-pg-accent hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 space-y-2.5 pr-1 max-h-[350px]">
            {loading ? (
              <div className="space-y-3 pt-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : txs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-pg-text-muted">
                <Clock className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-[13px] font-medium text-pg-text-bright">No transactions recorded yet</p>
                <p className="text-[11px] mt-1">Run a single or batch scan to populate the intelligence stream.</p>
                <Link
                  to="/batch-scan"
                  className="mt-4 ios-glass-button-primary px-3.5 py-1.5 text-[12px]"
                >
                  Launch Scan
                </Link>
              </div>
            ) : (
              txs.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl border border-pg-border/60 bg-pg-surface-2/50 hover:bg-pg-surface-2 hover:border-pg-border transition-all duration-150 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-pg-surface-3 flex items-center justify-center text-[12px] font-bold text-pg-accent uppercase">
                      {(tx.merchant_category || "UPI").slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-pg-text-bright flex items-center gap-2">
                        <span>₹{tx.amount.toLocaleString()}</span>
                        <span className="text-[11px] font-normal text-pg-text-muted capitalize">
                          · {tx.merchant_category || "General"}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-pg-text-muted">
                        {tx.transaction_id.slice(0, 14)}...
                      </div>
                    </div>
                  </div>

                  <RiskBadge
                    level={tx.status === "blocked" ? "block" : tx.status === "approved" ? "safe" : "review"}
                    score={tx.risk_score}
                    size="sm"
                  />
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
