import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { TerminalPanel } from "@/components/ui/TerminalPanel"
import { RiskBadge } from "@/components/ui/RiskBadge"
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

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/transactions?page=${page}&per_page=15`)
        setTransactions(data.transactions)
        setTotal(data.total)
      } catch {
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [page])

  const filtered = search
    ? transactions.filter(
        (t) =>
          t.transaction_id.toLowerCase().includes(search.toLowerCase()) ||
          t.merchant_category.toLowerCase().includes(search.toLowerCase()) ||
          t.merchant_id.toLowerCase().includes(search.toLowerCase()) ||
          t.bank_name.toLowerCase().includes(search.toLowerCase())
      )
    : transactions

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold font-sans tracking-tight text-pg-text-white">
          Transaction Ledger
        </h1>
        <div className="text-[12px] font-medium text-pg-text-muted">
          Total Records: {total.toLocaleString()}
        </div>
      </div>

      <TerminalPanel className="flex flex-col flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pg-text-muted" />
            <input
              type="text"
              placeholder="Search by ID, Merchant, or Bank..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-pg-surface-2 border border-pg-border rounded-lg p-2.5 pl-10 text-pg-text-bright text-[13px] outline-none transition-all placeholder:text-pg-text-muted focus:border-pg-accent"
            />
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-pg-text-muted text-[13px] animate-pulse">
            Fetching Ledger Data...
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-pg-text-muted text-[13px]">
            No matching records found
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-pg-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-pg-border bg-pg-surface-2/50 text-[10px] tracking-wider font-semibold text-pg-text-muted uppercase">
                  <th className="py-3 px-4">TX ID</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Risk</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <HistoryRow key={tx.id} tx={tx} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 15 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-[12px] text-pg-text-muted">
              Page {page} of {Math.ceil(total / 15)}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="text-[13px] font-medium text-pg-text hover:text-pg-text-bright disabled:opacity-30 disabled:hover:text-pg-text transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / 15)}
                className="text-[13px] font-medium text-pg-text hover:text-pg-text-bright disabled:opacity-30 disabled:hover:text-pg-text transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </TerminalPanel>
    </div>
  )
}

function HistoryRow({ tx }: { tx: Transaction }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr 
        onClick={() => setExpanded(!expanded)}
        className="border-b border-pg-border/30 text-[12px] hover:bg-pg-surface-2/30 transition-colors cursor-pointer"
      >
        <td className="py-3 px-4 text-pg-accent font-mono text-[11px]">{tx.transaction_id.slice(0, 16)}...</td>
        <td className="py-3 px-4 uppercase text-pg-text-bright font-medium">{tx.merchant_category} <span className="text-pg-text-muted font-normal">({tx.merchant_id.slice(0, 4)})</span></td>
        <td className="py-3 px-4 text-pg-text-muted uppercase">{tx.payment_type}</td>
        <td className="py-3 px-4 text-right font-sans font-semibold text-pg-text-bright">₹{tx.amount.toLocaleString()}</td>
        <td className="py-3 px-4 text-center">
          {tx.risk_level ? (
             <span className={`font-mono font-bold ${tx.risk_level === 'high' || tx.risk_level === 'fraud' ? 'text-pg-red' : tx.risk_level === 'medium' ? 'text-pg-amber' : 'text-pg-green'}`}>
               {tx.risk_score}
             </span>
          ) : (
             <span className="text-pg-text-muted">—</span>
          )}
        </td>
        <td className="py-3 px-4">
          <RiskBadge level={tx.status === "blocked" ? "block" : tx.status === "approved" ? "safe" : "review"} />
        </td>
        <td className="py-3 px-4 text-pg-text-muted">{new Date(tx.timestamp).toLocaleString()}</td>
      </tr>
      {expanded && tx.shap_explanation && (
        <tr className="bg-pg-surface-2/20 border-b border-pg-border/30">
          <td colSpan={7} className="p-5">
            <div className="rounded-lg border border-pg-border p-4">
              <h4 className="text-[11px] font-semibold text-pg-text-muted uppercase tracking-wider mb-3">SHAP Feature Importance (Explainability)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[11px]">
                {Object.entries(tx.shap_explanation)
                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                  .slice(0, 8)
                  .map(([feature, impact], i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="text-pg-text-muted">{feature}</span>
                        <span className={impact > 0 ? "text-pg-red font-medium" : "text-pg-green font-medium"}>
                          {impact > 0 ? "+" : ""}{impact.toFixed(3)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-pg-surface-3 rounded-full overflow-hidden flex">
                          <div className="w-1/2 flex justify-end">
                            {impact < 0 && <div className="h-full bg-pg-green rounded-full" style={{ width: `${Math.min(100, Math.abs(impact) * 30)}%` }} />}
                          </div>
                          <div className="w-1/2 flex justify-start">
                            {impact > 0 && <div className="h-full bg-pg-red rounded-full" style={{ width: `${Math.min(100, impact * 30)}%` }} />}
                          </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

