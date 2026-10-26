import { useState, useEffect } from "react"
import { Search, RefreshCw } from "lucide-react"
import { GlassCard } from "@/components/ui/GlassCard"
import { RiskBadge } from "@/components/ui/RiskBadge"
import { Skeleton } from "@/components/ui/Skeleton"
import api from "@/lib/api"

interface Transaction {
  id: number
  transaction_id: string
  payment_type: string
  amount: number
  merchant_category: string
  merchant_id: string
  bank_name: string
  location_city: string
  status: string
  timestamp: string
  risk_score: number | null
  risk_level: string | null
  shap_explanation?: Record<string, number>
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "blocked" | "review">("all")

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/transactions?page=${page}&per_page=15`)
      setTransactions(data.transactions || [])
      setTotal(data.total || 0)
    } catch {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [page])

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      !search ||
      t.transaction_id.toLowerCase().includes(search.toLowerCase()) ||
      t.merchant_category.toLowerCase().includes(search.toLowerCase()) ||
      t.merchant_id.toLowerCase().includes(search.toLowerCase()) ||
      t.bank_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.location_city?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "approved" && t.status === "approved") ||
      (filterStatus === "blocked" && (t.status === "blocked" || t.risk_level === "high")) ||
      (filterStatus === "review" && (t.status === "review" || t.risk_level === "medium"))

    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex flex-col gap-8 max-w-[1500px] mx-auto animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-semibold text-pg-accent tracking-wide uppercase">
              Compliance & Forensics
            </span>
            <span className="text-pg-text-muted">·</span>
            <span className="text-[12px] text-pg-text-muted">Immutable History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-pg-text-white">
            Audit Ledger
          </h1>
          <p className="text-[13px] text-pg-text-muted mt-1">
            Complete historical transaction audit ledger with real-time risk scores and signal factors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchHistory()}
            className="ios-glass-button px-3.5 py-2 text-[12px] flex items-center gap-1.5"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Table Card ── */}
      <GlassCard className="p-0 overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-pg-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pg-text-muted" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Merchant, City, or Bank..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ios-glass-input pl-10 pr-4 py-2 text-[13px] text-pg-text-bright"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-pg-surface-2 border border-pg-border text-[12px]">
            {(["all", "approved", "review", "blocked"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-all duration-150 cursor-pointer ${
                  filterStatus === st
                    ? "bg-pg-surface-3 text-pg-text-white shadow-sm font-semibold"
                    : "text-pg-text-muted hover:text-pg-text-bright"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-pg-text-muted flex flex-col items-center">
            <p className="text-[14px] font-semibold text-pg-text-bright">No ledger records match the query</p>
            <p className="text-[12px] mt-1">Try resetting the search terms or status filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-pg-border bg-pg-surface-2/60 text-[11px] font-semibold text-pg-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-5">Transaction Token</th>
                  <th className="py-3.5 px-4">Merchant / City</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Risk Score</th>
                  <th className="py-3.5 px-4 text-center">Decision</th>
                  <th className="py-3.5 px-5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <LedgerRow key={tx.id} tx={tx} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div className="p-4 border-t border-pg-border flex items-center justify-between text-[12px] text-pg-text-muted">
            <div>
              Showing {filtered.length} of {total.toLocaleString()} transactions
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="ios-glass-button px-3 py-1.5 text-[12px] disabled:opacity-30"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / 15)}
                className="ios-glass-button px-3 py-1.5 text-[12px] disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

function LedgerRow({ tx }: { tx: Transaction }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="border-b border-pg-border/30 text-[13px] hover:bg-pg-surface-2/50 transition-colors cursor-pointer group"
      >
        <td className="py-3.5 px-5 font-mono text-[12px] font-semibold text-pg-accent">
          {tx.transaction_id}
        </td>
        <td className="py-3.5 px-4">
          <div className="font-semibold text-pg-text-bright capitalize">
            {tx.merchant_category}{" "}
            <span className="text-[11px] font-normal text-pg-text-muted">({tx.merchant_id.slice(0, 8)})</span>
          </div>
          <div className="text-[11px] text-pg-text-muted">{tx.location_city || "Unknown City"}</div>
        </td>
        <td className="py-3.5 px-4 text-pg-text-muted uppercase text-[11px] font-semibold">
          {tx.payment_type}
        </td>
        <td className="py-3.5 px-4 text-right font-sans font-bold text-pg-text-bright">
          ₹{tx.amount.toLocaleString()}
        </td>
        <td className="py-3.5 px-4 text-center">
          {tx.risk_score !== null && tx.risk_score !== undefined ? (
            <span
              className={`font-mono font-bold text-[13px] ${
                tx.risk_score >= 60
                  ? "text-pg-red"
                  : tx.risk_score >= 25
                  ? "text-pg-amber"
                  : "text-pg-green"
              }`}
            >
              {tx.risk_score}%
            </span>
          ) : (
            <span className="text-pg-text-muted">—</span>
          )}
        </td>
        <td className="py-3.5 px-4 text-center">
          <RiskBadge
            level={tx.status === "blocked" ? "block" : tx.status === "approved" ? "safe" : "review"}
            size="sm"
          />
        </td>
        <td className="py-3.5 px-5 text-right text-pg-text-muted text-[11px]">
          {new Date(tx.timestamp).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </td>
      </tr>

      {/* Expanded SHAP Explainability Drawer */}
      {expanded && (
        <tr className="bg-pg-surface-2/40 border-b border-pg-border/60">
          <td colSpan={7} className="p-5">
            <div className="rounded-2xl border border-pg-border p-5 bg-pg-surface/90 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-pg-border/40">
                <div>
                  <h4 className="text-[13px] font-bold text-pg-text-bright">
                    Forensic Risk Factor Breakdown
                  </h4>
                  <p className="text-[11px] text-pg-text-muted">
                    Signal contributions driving the assessed risk level.
                  </p>
                </div>
                <RiskBadge
                  level={tx.status === "blocked" ? "block" : tx.status === "approved" ? "safe" : "review"}
                  score={tx.risk_score}
                />
              </div>

              {tx.shap_explanation ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[12px]">
                  {Object.entries(tx.shap_explanation)
                    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                    .slice(0, 8)
                    .map(([feature, impact], i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-pg-text-muted font-medium">{feature}</span>
                          <span
                            className={`font-semibold font-mono ${
                              impact > 0 ? "text-pg-red" : "text-pg-green"
                            }`}
                          >
                            {impact > 0 ? `+${impact.toFixed(3)} (Threat)` : `${impact.toFixed(3)} (Safe)`}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-pg-surface-3 rounded-full overflow-hidden flex">
                          <div className="w-1/2 flex justify-end">
                            {impact < 0 && (
                              <div
                                className="h-full bg-pg-green rounded-full"
                                style={{ width: `${Math.min(100, Math.abs(impact) * 35)}%` }}
                              />
                            )}
                          </div>
                          <div className="w-1/2 flex justify-start">
                            {impact > 0 && (
                              <div
                                className="h-full bg-pg-red rounded-full"
                                style={{ width: `${Math.min(100, impact * 35)}%` }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-[12px] text-pg-text-muted italic">
                  Signal factor breakdown is computed dynamically for evaluated transactions.
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
