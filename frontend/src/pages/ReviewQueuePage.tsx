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
        <h1 className="text-xl font-bold font-sans tracking-wide text-sentinel-text-bright">
          REVIEW <span className="text-sentinel-green">QUEUE</span>
        </h1>
        <div className="text-[10px] font-mono text-sentinel-text-muted">
          PENDING APPROVALS: {queue.length}
        </div>
      </div>

      {loading ? (
        <TerminalPanel className="h-64 flex items-center justify-center text-sentinel-green font-mono text-[11px] animate-pulse">
          [FETCHING FLAG QUEUE...]
        </TerminalPanel>
      ) : queue.length === 0 ? (
        <TerminalPanel className="h-64 flex items-center justify-center text-sentinel-text-muted font-mono text-[11px]">
          [QUEUE EMPTY — NO ACTION REQUIRED]
        </TerminalPanel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {queue.map((tx) => (
            <TerminalPanel key={tx.id} danger={tx.risk_level === "high"} className="flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] font-mono text-sentinel-text-muted mb-1">TX_{tx.transaction_id.slice(0, 8)}</div>
                  <div className="font-sans font-bold text-lg text-sentinel-text-bright">₹{tx.amount.toLocaleString()}</div>
                </div>
                <RiskBadge level={tx.risk_level === "high" ? "block" : "review"} />
              </div>
              
              <div className="flex flex-col gap-2 font-mono text-[11px] text-[#3B5C48] mb-6 flex-1">
                <div className="flex justify-between border-b border-sentinel-border/50 pb-1">
                  <span>MERCHANT</span>
                  <span className="text-sentinel-text-bright uppercase">{tx.merchant_category}</span>
                </div>
                <div className="flex justify-between border-b border-sentinel-border/50 pb-1">
                  <span>MERCHANT_ID</span>
                  <span className="text-sentinel-text-bright">{tx.merchant_id}</span>
                </div>
                <div className="flex justify-between border-b border-sentinel-border/50 pb-1">
                  <span>RISK SCORE</span>
                  <span className={tx.risk_level === "high" ? "text-sentinel-red drop-shadow-[0_0_5px_#FF5C5C]" : "text-sentinel-amber"}>{tx.risk_score} / 100</span>
                </div>
                <div className="flex justify-between border-b border-sentinel-border/50 pb-1">
                  <span>TIMESTAMP</span>
                  <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 border border-sentinel-green text-sentinel-green font-mono text-[11px] py-2 hover:bg-sentinel-green hover:text-[#05130C] transition-colors">
                  APPROVE
                </button>
                <button className="flex-1 border border-sentinel-red text-sentinel-red font-mono text-[11px] py-2 hover:bg-sentinel-red hover:text-white transition-colors">
                  BLOCK
                </button>
              </div>
            </TerminalPanel>
          ))}
        </div>
      )}
    </div>
  )
}
