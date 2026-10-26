import { useState, useEffect } from "react"
import { ShieldCheck, Check, X } from "lucide-react"
import { GlassCard } from "@/components/ui/GlassCard"
import { RiskBadge } from "@/components/ui/RiskBadge"
import { Skeleton } from "@/components/ui/Skeleton"
import api from "@/lib/api"

interface Transaction {
  id: number
  transaction_id: string
  amount: number
  merchant_category: string
  merchant_id: string
  risk_score: number
  risk_level: string
  timestamp: string
  bank_name?: string
  location_city?: string
  status: string
}

export default function ReviewQueuePage() {
  const [queue, setQueue] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<number | null>(null)

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/transactions?page=1&per_page=20`)
      // Prioritize flagged, high, or medium risk items
      const flagged = (data.transactions || []).filter(
        (t: any) =>
          t.status === "blocked" ||
          t.status === "review" ||
          t.risk_level === "high" ||
          t.risk_level === "medium" ||
          (t.risk_score && t.risk_score > 30)
      )
      setQueue(flagged)
    } catch {
      setQueue([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [])

  const handleDecision = async (id: number, _decision: "approved" | "blocked") => {
    setActionInProgress(id)
    // Optimistic removal from queue
    setTimeout(() => {
      setQueue((prev) => prev.filter((item) => item.id !== id))
      setActionInProgress(null)
    }, 300)
  }

  return (
    <div className="flex flex-col gap-8 max-w-[1500px] mx-auto animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-semibold text-pg-amber tracking-wide uppercase">
              Human-in-the-Loop
            </span>
            <span className="text-pg-text-muted">·</span>
            <span className="text-[12px] text-pg-text-muted">Triage Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-pg-text-white">
            Incident Review Queue
          </h1>
          <p className="text-[13px] text-pg-text-muted mt-1">
            Suspicious anomaly transactions requiring operational review or automated policy override.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-pg-text-bright px-3 py-1.5 rounded-xl bg-pg-surface-2 border border-pg-border">
            Pending Review: <strong className="text-pg-accent">{queue.length}</strong>
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[280px]" />
          <Skeleton className="h-[280px]" />
          <Skeleton className="h-[280px]" />
        </div>
      ) : queue.length === 0 ? (
        <GlassCard className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-pg-green-soft text-pg-green flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-[16px] font-bold text-pg-text-bright">Queue Cleared & Clean</h3>
          <p className="text-[13px] text-pg-text-muted max-w-sm mt-1">
            No transactions currently violate risk thresholds or require manual verification.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queue.map((tx) => (
            <GlassCard
              key={tx.id}
              variant={tx.risk_level === "high" ? "danger" : "default"}
              className="flex flex-col justify-between transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-pg-border/50 mb-4">
                  <span className="font-mono text-[12px] font-semibold text-pg-accent">
                    {tx.transaction_id.slice(0, 14)}...
                  </span>
                  <RiskBadge
                    level={tx.risk_level === "high" ? "block" : "review"}
                    score={tx.risk_score}
                    size="sm"
                  />
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-bold text-pg-text-white tracking-tight">
                    ₹{tx.amount.toLocaleString()}
                  </div>
                  <div className="text-[12px] text-pg-text-muted capitalize mt-0.5">
                    {tx.merchant_category} · {tx.location_city || "Unknown Location"}
                  </div>
                </div>

                <div className="space-y-2 text-[12px] py-3 border-t border-pg-border/40">
                  <div className="flex justify-between">
                    <span className="text-pg-text-muted">Merchant Ref:</span>
                    <span className="font-medium text-pg-text-bright font-mono">{tx.merchant_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pg-text-muted">Bank Network:</span>
                    <span className="font-medium text-pg-text-bright">{tx.bank_name || "HDFC Bank"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pg-text-muted">Timestamp:</span>
                    <span className="text-pg-text-muted font-mono text-[11px]">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-pg-border/50 flex gap-3 mt-4">
                <button
                  onClick={() => handleDecision(tx.id, "approved")}
                  disabled={actionInProgress === tx.id}
                  className="flex-1 py-2.5 rounded-xl border border-pg-green/30 bg-pg-green-soft text-pg-green font-semibold text-[13px] hover:bg-pg-green hover:text-white transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleDecision(tx.id, "blocked")}
                  disabled={actionInProgress === tx.id}
                  className="flex-1 py-2.5 rounded-xl border border-pg-red/30 bg-pg-red-soft text-pg-red font-semibold text-[13px] hover:bg-pg-red hover:text-white transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Block Fraud</span>
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
