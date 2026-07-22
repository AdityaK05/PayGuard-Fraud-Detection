/**
 * PayGuard – Transaction History Page
 */

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { History, Download, Search } from "lucide-react"
import api from "@/lib/api"
import { formatINR, formatDate, getRiskBadgeClass } from "@/lib/utils"

interface Transaction {
  id: number
  transaction_id: string
  type: string
  amount: number
  nameOrig: string
  nameDest: string
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
          t.nameOrig.toLowerCase().includes(search.toLowerCase()) ||
          t.nameDest.toLowerCase().includes(search.toLowerCase())
      )
    : transactions

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-muted)] flex items-center justify-center">
            <History className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Transaction History
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {total} total transactions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-48"
            />
          </div>
          <button className="btn-secondary text-xs">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-muted)]">
            <History className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Origin</th>
                  <th>Dest</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="font-mono text-xs text-[var(--color-accent-light)]">
                      {tx.transaction_id}
                    </td>
                    <td className="text-xs font-semibold">{tx.type}</td>
                    <td className="font-semibold text-[var(--color-text-primary)]">
                      {formatINR(tx.amount)}
                    </td>
                    <td className="font-mono text-xs">{tx.nameOrig}</td>
                    <td className="font-mono text-xs">{tx.nameDest}</td>
                    <td>
                      {tx.risk_level ? (
                        <span className={getRiskBadgeClass(tx.risk_level)}>
                          {tx.risk_score}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`text-xs font-semibold capitalize ${
                          tx.status === "approved"
                            ? "text-[var(--color-success)]"
                            : tx.status === "blocked"
                            ? "text-[var(--color-danger)]"
                            : "text-[var(--color-warning)]"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="text-xs whitespace-nowrap">
                      {formatDate(tx.timestamp)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              Page {page} of {Math.ceil(total / 15)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs disabled:opacity-30"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / 15)}
                className="btn-secondary text-xs disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
