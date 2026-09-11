import { useState, useEffect } from "react"
import { TerminalPanel } from "@/components/ui/TerminalPanel"
import { RiskBadge } from "@/components/ui/RiskBadge"
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
}

export default function ReviewQueuePage() {
  const [queue, setQueue] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app we would have an endpoint for transactions needing review.
    // Here we'll just fetch transactions and filter for "review" or "blocked" to simulate the queue.
    const fetchQueue = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/transactions?page=1&per_page=20`)
        const flagged = data.transactions.filter((t: any) => t.status === "blocked" || t.risk_level === "high" || t.risk_level === "medium")
        setQueue(flagged)
      } catch {
        setQueue([])
      } finally {
        setLoading(false)
      }
    }
    fetchQueue()
  }, [])

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold font-sans tracking-tight text-pg-text-white">
          Review Queue
        </h1>
        <div className="text-[12px] font-medium text-pg-text-muted">
          Pending Approvals: {queue.length}
        </div>
      </div>

      {loading ? (
        <TerminalPanel className="h-64 flex items-center justify-center text-pg-text-muted text-[13px] animate-pulse">
          Fetching Flag Queue...
        </TerminalPanel>
      ) : queue.length === 0 ? (
        <TerminalPanel className="h-64 flex items-center justify-center text-pg-text-muted text-[13px]">
          Queue Empty — No Action Required
        </TerminalPanel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {queue.map((tx) => (
            <TerminalPanel key={tx.id} danger={tx.risk_level === "high"} className="flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[11px] font-mono text-pg-text-muted mb-1">TX_{tx.transaction_id.slice(0, 8)}</div>
                  <div className="font-sans font-semibold text-lg text-pg-text-bright">₹{tx.amount.toLocaleString()}</div>
                </div>
                <RiskBadge level={tx.risk_level === "high" ? "block" : "review"} />
              </div>
              
              <div className="flex flex-col gap-2 text-[12px] text-pg-text-muted mb-6 flex-1">
                <div className="flex justify-between border-b border-pg-border/50 pb-1">
                  <span>Merchant</span>
                  <span className="text-pg-text-bright uppercase font-medium">{tx.merchant_category}</span>
                </div>
                <div className="flex justify-between border-b border-pg-border/50 pb-1">
                  <span>Merchant ID</span>
                  <span className="text-pg-text-bright">{tx.merchant_id}</span>
                </div>
                <div className="flex justify-between border-b border-pg-border/50 pb-1">
                  <span>Risk Score</span>
                  <span className={`font-mono font-bold ${tx.risk_level === "high" ? "text-pg-red" : "text-pg-amber"}`}>{tx.risk_score} / 100</span>
                </div>
                <div className="flex justify-between border-b border-pg-border/50 pb-1">
                  <span>Timestamp</span>
                  <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 rounded-lg border border-pg-green text-pg-green font-medium text-[13px] py-2 hover:bg-pg-green hover:text-white transition-colors cursor-pointer">
                  Approve
                </button>
                <button className="flex-1 rounded-lg border border-pg-red text-pg-red font-medium text-[13px] py-2 hover:bg-pg-red hover:text-white transition-colors cursor-pointer">
                  Block
                </button>
              </div>
            </TerminalPanel>
          ))}
        </div>
      )}
    </div>
  )
}
