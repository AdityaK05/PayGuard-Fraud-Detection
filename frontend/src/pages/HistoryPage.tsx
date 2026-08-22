import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { TerminalPanel } from "@/components/ui/TerminalPanel"
import { RiskBadge } from "@/components/ui/RiskBadge"
import { TerminalButton } from "@/components/ui/TerminalButton"
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
        <h1 className="text-xl font-bold font-sans tracking-wide text-sentinel-text-bright">
          TRANSACTION <span className="text-sentinel-green">LEDGER</span>
        </h1>
        <div className="text-[10px] font-mono text-sentinel-text-muted">
          TOTAL RECORDS: {total.toLocaleString()}
        </div>
      </div>

      <TerminalPanel className="flex flex-col flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-green" />
            <input
              type="text"
              placeholder="QUERY BY ID / MERCHANT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#030805] border border-sentinel-border p-2 pl-10 text-sentinel-text-bright font-mono text-[11px] outline-none transition-all placeholder:text-[#2C4536] focus:border-sentinel-green"
            />
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-sentinel-green font-mono text-[11px] animate-pulse">
            [FETCHING LEDGER DATA...]
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sentinel-text-muted font-mono text-[11px]">
            [NO MATCHING RECORDS FOUND]
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="border-b border-sentinel-border/50 text-[10px] tracking-[0.1em] text-sentinel-text-muted uppercase">
                  <th className="pb-3 px-4 font-normal">TX_ID</th>
                  <th className="pb-3 px-4 font-normal">MERCHANT</th>
                  <th className="pb-3 px-4 font-normal">TYPE</th>
                  <th className="pb-3 px-4 font-normal text-right">AMOUNT</th>
                  <th className="pb-3 px-4 font-normal text-center">RISK</th>
                  <th className="pb-3 px-4 font-normal">STATUS</th>
                  <th className="pb-3 px-4 font-normal">TIME</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id} className="border-b border-sentinel-border/30 text-[11px] hover:bg-sentinel-border/10 transition-colors">
                    <td className="py-3 px-4 text-sentinel-green">{tx.transaction_id.slice(0, 16)}...</td>
                    <td className="py-3 px-4 uppercase text-sentinel-text-bright">{tx.merchant_category} <span className="text-sentinel-text-muted">({tx.merchant_id.slice(0, 4)})</span></td>
                    <td className="py-3 px-4 text-sentinel-text-muted">{tx.payment_type}</td>
                    <td className="py-3 px-4 text-right font-sans font-bold">₹{tx.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      {tx.risk_level ? (
                         <span className={tx.risk_level === 'high' ? 'text-sentinel-red' : tx.risk_level === 'medium' ? 'text-sentinel-amber' : 'text-sentinel-green'}>
                           {tx.risk_score}
                         </span>
                      ) : (
                         <span className="text-sentinel-text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={tx.status === "blocked" ? "block" : tx.status === "approved" ? "safe" : "review"} />
                    </td>
                    <td className="py-3 px-4 text-sentinel-text-muted">{new Date(tx.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 15 && (
          <div className="flex items-center justify-between mt-6 font-mono">
            <div className="text-[10px] text-sentinel-text-muted">
              PAGE {page} OF {Math.ceil(total / 15)}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="text-[11px] text-sentinel-green hover:text-white disabled:opacity-30 disabled:hover:text-sentinel-green uppercase transition-colors"
              >
                &lt; PREV
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / 15)}
                className="text-[11px] text-sentinel-green hover:text-white disabled:opacity-30 disabled:hover:text-sentinel-green uppercase transition-colors"
              >
                NEXT &gt;
              </button>
            </div>
          </div>
        )}
      </TerminalPanel>
    </div>
  )
}
