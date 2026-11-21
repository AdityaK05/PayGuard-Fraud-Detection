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
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[11px] font-semibold text-amber-400 tracking-wider uppercase">
              Human-in-the-Loop
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-[11px] text-neutral-400 font-medium">Triage Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Incident Review Queue
          </h1>
          <p className="text-[13px] text-neutral-400 mt-1">
            Suspicious anomaly transactions requiring operational review or automated policy override.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-neutral-300 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            Pending Review: <strong className="text-[#3b82f6] font-semibold ml-1">{queue.length}</strong>
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[280px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
        </div>
      ) : queue.length === 0 ? (
        <GlassCard className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h3 className="text-[15px] font-semibold text-white">Queue Cleared & Clean</h3>
          <p className="text-[12px] text-neutral-400 max-w-sm mt-1">
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
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
                  <span className="font-mono text-[12px] font-medium text-[#3b82f6]">
                    {tx.transaction_id.slice(0, 14)}...
                  </span>
                  <RiskBadge
                    level={tx.risk_level === "high" ? "block" : "review"}
                    score={tx.risk_score}
                    size="sm"
                  />
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-semibold text-white tracking-tight">
                    ₹{tx.amount.toLocaleString()}
                  </div>
                  <div className="text-[12px] text-neutral-400 capitalize mt-0.5">
                    {tx.merchant_category} · {tx.location_city || "Unknown Location"}
                  </div>
                </div>

                <div className="space-y-2 text-[12px] py-3 border-t border-white/[0.06]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Merchant Ref:</span>
                    <span className="font-medium text-white font-mono">{tx.merchant_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Bank Network:</span>
                    <span className="font-medium text-white">{tx.bank_name || "HDFC Bank"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Timestamp:</span>
                    <span className="text-neutral-500 font-mono text-[11px]">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex gap-3 mt-4">
                <button
                  onClick={() => handleDecision(tx.id, "approved")}
                  disabled={actionInProgress === tx.id}
                  className="flex-1 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-medium text-[12px] hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleDecision(tx.id, "blocked")}
                  disabled={actionInProgress === tx.id}
                  className="flex-1 py-2 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 font-medium text-[12px] hover:bg-rose-500/20 hover:border-rose-500/30 transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} />
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
