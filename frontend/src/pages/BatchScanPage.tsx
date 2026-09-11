import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Download, Loader2, Trash2 } from "lucide-react"
import { TerminalPanel } from "@/components/ui/TerminalPanel"
import { TerminalButton } from "@/components/ui/TerminalButton"
import { RiskBadge } from "@/components/ui/RiskBadge"
import api from "@/lib/api"

interface ParsedTransaction {
  payment_type: string
  amount: number
  merchant_category: string
  merchant_id: string
  location_city: string
  location_lat: number
  location_lng: number
  device_type: string
  ip_address: string
  os_type: string
  bank_name: string
  timestamp?: string
}

interface PredictionResult {
  transaction_id: string
  fraud_probability: number
  risk_score: number
  risk_level: string
  prediction: string
  confidence: number
  is_anomaly: boolean
  anomaly_score: number
  shap_explanation?: Record<string, number>
  timestamp: string
}

interface BatchSummary {
  total_analyzed: number
  total_approved: number
  total_blocked: number
  total_flagged: number
  avg_risk_score: number
  max_risk_score: number
  fraud_rate: number
}

const RANDOM_BANKS = ["HDFC", "SBI", "ICICI", "Axis", "Kotak", "PNB"]
const RANDOM_CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai"]
const RANDOM_DEVICES = ["android", "ios", "desktop", "mobile_web"]
const RANDOM_OS = ["android_14", "ios_17", "windows_11", "macos_14", "android_13"]
const RANDOM_TYPES = ["p2m", "p2p", "ecommerce"]
const RANDOM_CATEGORIES = ["food", "retail", "utilities", "travel", "entertainment"]

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getJitteredLat() { return 19.076 + (Math.random() * 4 - 2) }
function getJitteredLng() { return 72.877 + (Math.random() * 4 - 2) }
function getMockIP() { return `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}` }

const DEFAULT_VALUES: Record<string, string | number> = {
  payment_type: "p2m",
  location_lat: 19.076,
  location_lng: 72.877,
  device_type: "android",
  ip_address: "0.0.0.0",
  os_type: "android_14",
  bank_name: "unknown",
  merchant_id: "unknown",
  merchant_category: "unknown",
  location_city: "unknown",
}

function parseCSVContent(content: string): ParsedTransaction[] {
  const lines = content.trim().split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["']/g, ""))
  const transactions: ParsedTransaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/["']/g, ""))
    if (values.length < 2) continue

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] || "" })

    const amount = parseFloat(row["amount"] || row["txn_amount"] || row["transaction_amount"] || "0")
    if (amount <= 0) continue

    transactions.push({
      payment_type: row["payment_type"] || row["type"] || row["txn_type"] || String(DEFAULT_VALUES.payment_type),
      amount,
      merchant_category: row["merchant_category"] || row["category"] || row["mcc"] || String(DEFAULT_VALUES.merchant_category),
      merchant_id: row["merchant_id"] || row["merchant"] || String(DEFAULT_VALUES.merchant_id),
      location_city: row["location_city"] || row["city"] || row["location"] || String(DEFAULT_VALUES.location_city),
      location_lat: parseFloat(row["location_lat"] || row["lat"] || String(DEFAULT_VALUES.location_lat)),
      location_lng: parseFloat(row["location_lng"] || row["lng"] || row["lon"] || String(DEFAULT_VALUES.location_lng)),
      device_type: row["device_type"] || row["device"] || String(DEFAULT_VALUES.device_type),
      ip_address: row["ip_address"] || row["ip"] || String(DEFAULT_VALUES.ip_address),
      os_type: row["os_type"] || row["os"] || String(DEFAULT_VALUES.os_type),
      bank_name: row["bank_name"] || row["bank"] || String(DEFAULT_VALUES.bank_name),
      timestamp: row["timestamp"] || row["date"] || row["time"] || new Date().toISOString(),
    })
  }
  return transactions
}

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist")
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ""

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(" ")
    fullText += pageText + "\n"
  }
  return fullText
}

function parsePDFText(text: string): ParsedTransaction[] {
  // Try to detect tabular data from PDF text
  const lines = text.split("\n").filter(l => l.trim().length > 0)
  const transactions: ParsedTransaction[] = []

  // Look for amount patterns (₹ or Rs. or numbers that look like amounts)
  const amountPattern = /(?:₹|Rs\.?|INR)\s*([\d,]+\.?\d*)/gi

  for (const line of lines) {
    const amounts = [...line.matchAll(amountPattern)]
    if (amounts.length > 0) {
      for (const match of amounts) {
        const amount = parseFloat(match[1].replace(/,/g, ""))
        if (amount > 0 && amount < 10000000) {
          // Try to extract merchant info from the same line
          const words = line.split(/\s+/).filter(w => w.length > 2 && !/[\d₹]/.test(w))
          const merchant = words.slice(0, 2).join(" ") || "unknown"

          transactions.push({
            payment_type: getRandom(RANDOM_TYPES),
            amount,
            merchant_category: getRandom(RANDOM_CATEGORIES),
            merchant_id: merchant.substring(0, 20),
            location_city: getRandom(RANDOM_CITIES),
            location_lat: getJitteredLat(),
            location_lng: getJitteredLng(),
            device_type: getRandom(RANDOM_DEVICES),
            ip_address: getMockIP(),
            os_type: getRandom(RANDOM_OS),
            bank_name: getRandom(RANDOM_BANKS),
          })
        }
      }
    }
  }

  // If no currency-prefixed amounts found, try CSV-like structure
  if (transactions.length === 0) {
    const csvLike = lines.find(l => l.includes(",") && l.split(",").length >= 3)
    if (csvLike) {
      return parseCSVContent(lines.join("\n"))
    }
  }

  return transactions
}

export default function BatchScanPage() {
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([])
  const [results, setResults] = useState<PredictionResult[]>([])
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("")
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setError("")
    setResults([])
    setSummary(null)
    setParsing(true)
    setFileName(file.name)

    try {
      let transactions: ParsedTransaction[] = []
      const ext = file.name.split(".").pop()?.toLowerCase()

      if (ext === "csv") {
        const text = await file.text()
        transactions = parseCSVContent(text)
      } else if (ext === "pdf") {
        const text = await extractTextFromPDF(file)
        transactions = parsePDFText(text)
      } else {
        setError(`Unsupported file type: .${ext}. Please upload a CSV or PDF file.`)
        setParsing(false)
        return
      }

      if (transactions.length === 0) {
        setError("No valid transactions found in the file. Ensure the file contains transaction data with at least an amount column.")
        setParsing(false)
        return
      }

      if (transactions.length > 500) {
        transactions = transactions.slice(0, 500)
      }

      setParsedData(transactions)
    } catch (err: any) {
      setError(`Failed to parse file: ${err.message}`)
    } finally {
      setParsing(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragActive(false), [])

  const runBatchScan = async () => {
    setLoading(true)
    setError("")
    try {
      const { data } = await api.post("/predict/batch", { transactions: parsedData })
      setSummary(data.summary)
      setResults(data.results)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(typeof detail === "string" ? detail : "Batch scan failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (results.length === 0) return
    const headers = ["transaction_id", "risk_score", "risk_level", "prediction", "fraud_probability", "confidence"]
    const rows = results.map(r => [r.transaction_id, r.risk_score, r.risk_level, r.prediction, r.fraud_probability.toFixed(4), r.confidence.toFixed(4)])
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payguard_batch_results_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setParsedData([])
    setResults([])
    setSummary(null)
    setError("")
    setFileName("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-pg-text-white tracking-tight">Batch Scan</h1>
          <p className="text-sm text-pg-text-muted mt-1">Upload transaction files for bulk fraud analysis</p>
        </div>
        {results.length > 0 && (
          <div className="flex gap-3">
            <TerminalButton variant="ghost" onClick={exportCSV}>
              <Download className="w-4 h-4" /> Export CSV
            </TerminalButton>
            <TerminalButton variant="ghost" onClick={reset}>
              <Trash2 className="w-4 h-4" /> Clear
            </TerminalButton>
          </div>
        )}
      </div>

      {/* Upload Zone — shown when no data parsed yet */}
      {parsedData.length === 0 && !results.length && (
        <TerminalPanel>
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-12
              flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer
              ${dragActive
                ? "border-pg-accent bg-pg-accent-soft"
                : "border-pg-border hover:border-pg-border-hover hover:bg-pg-surface-2/50"
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            {parsing ? (
              <>
                <Loader2 className="w-10 h-10 text-pg-accent animate-spin" />
                <div className="text-sm text-pg-text-muted">Parsing {fileName}...</div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-pg-accent/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-pg-accent" />
                </div>
                <div className="text-center">
                  <p className="text-pg-text-bright font-medium">Drop your transaction file here</p>
                  <p className="text-sm text-pg-text-muted mt-1">
                    Supports <span className="text-pg-accent font-medium">CSV</span> and <span className="text-pg-accent font-medium">PDF</span> files · Max 500 transactions per batch
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-pg-text-muted bg-pg-surface-2 px-3 py-1.5 rounded-full">
                    <FileText className="w-3 h-3" /> .csv
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-pg-text-muted bg-pg-surface-2 px-3 py-1.5 rounded-full">
                    <FileText className="w-3 h-3" /> .pdf
                  </span>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-pg-red-soft border border-pg-red/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-pg-red shrink-0 mt-0.5" />
              <p className="text-sm text-pg-red">{error}</p>
            </div>
          )}
        </TerminalPanel>
      )}

      {/* Preview Table — shown after parsing, before running scan */}
      {parsedData.length > 0 && results.length === 0 && (
        <TerminalPanel>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-pg-text-bright">Parsed Transactions</h2>
              <p className="text-xs text-pg-text-muted mt-0.5">
                {parsedData.length} transaction{parsedData.length !== 1 ? "s" : ""} from {fileName}
              </p>
            </div>
            <div className="flex gap-3">
              <TerminalButton variant="ghost" onClick={reset}>
                <Trash2 className="w-4 h-4" /> Clear
              </TerminalButton>
              <TerminalButton onClick={runBatchScan} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Analyzing..." : `Run Scan (${parsedData.length} txns)`}
              </TerminalButton>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-lg bg-pg-red-soft border border-pg-red/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-pg-red shrink-0 mt-0.5" />
              <p className="text-sm text-pg-red">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-pg-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-pg-border bg-pg-surface-2/50">
                  <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase">#</th>
                  <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase">Type</th>
                  <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase text-right">Amount</th>
                  <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase">Merchant</th>
                  <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase">City</th>
                  <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase">Bank</th>
                  <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase">Device</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 50).map((tx, i) => (
                  <tr key={i} className="border-b border-pg-border/50 text-[12px] hover:bg-pg-surface-2/30 transition-colors">
                    <td className="py-2.5 px-4 text-pg-text-muted font-mono">{i + 1}</td>
                    <td className="py-2.5 px-4 text-pg-text uppercase">{tx.payment_type}</td>
                    <td className="py-2.5 px-4 text-pg-text-bright font-semibold text-right font-mono">₹{tx.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-pg-text">{tx.merchant_category}</td>
                    <td className="py-2.5 px-4 text-pg-text-muted">{tx.location_city}</td>
                    <td className="py-2.5 px-4 text-pg-text-muted">{tx.bank_name}</td>
                    <td className="py-2.5 px-4 text-pg-text-muted">{tx.device_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 50 && (
              <div className="py-3 text-center text-xs text-pg-text-muted bg-pg-surface-2/30">
                Showing 50 of {parsedData.length} transactions
              </div>
            )}
          </div>
        </TerminalPanel>
      )}

      {/* Loading State */}
      {loading && (
        <TerminalPanel>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-pg-accent/20" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-pg-accent border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-pg-text-bright font-medium">Running ML Pipeline</p>
              <p className="text-sm text-pg-text-muted mt-1">Isolation Forest → XGBoost → SHAP Analysis</p>
            </div>
          </div>
        </TerminalPanel>
      )}

      {/* Results */}
      {summary && results.length > 0 && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard label="Total Analyzed" value={summary.total_analyzed} icon={<FileText className="w-5 h-5" />} color="accent" />
              <SummaryCard label="Approved" value={summary.total_approved} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
              <SummaryCard label="Flagged" value={summary.total_flagged} icon={<AlertTriangle className="w-5 h-5" />} color="amber" />
              <SummaryCard label="Blocked" value={summary.total_blocked} icon={<XCircle className="w-5 h-5" />} color="red" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TerminalPanel>
                <div className="text-xs text-pg-text-muted mb-1 uppercase tracking-wider font-medium">Avg Risk Score</div>
                <div className="text-3xl font-bold font-mono text-pg-text-white">{summary.avg_risk_score}%</div>
              </TerminalPanel>
              <TerminalPanel>
                <div className="text-xs text-pg-text-muted mb-1 uppercase tracking-wider font-medium">Max Risk Score</div>
                <div className={`text-3xl font-bold font-mono ${summary.max_risk_score > 60 ? "text-pg-red" : "text-pg-text-white"}`}>{summary.max_risk_score}%</div>
              </TerminalPanel>
              <TerminalPanel>
                <div className="text-xs text-pg-text-muted mb-1 uppercase tracking-wider font-medium">Fraud Rate</div>
                <div className="text-3xl font-bold font-mono text-pg-text-white">{(summary.fraud_rate * 100).toFixed(1)}%</div>
              </TerminalPanel>
            </div>

            {/* Results Table */}
            <TerminalPanel>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-pg-text-bright">Detailed Results</h2>
                <span className="text-xs text-pg-text-muted">{results.length} transactions analyzed</span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-pg-border">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-pg-border bg-pg-surface-2/50">
                      <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase">TX ID</th>
                      <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase text-right">Amount</th>
                      <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase text-center">Risk Score</th>
                      <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase text-center">Fraud Prob</th>
                      <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase text-center">Confidence</th>
                      <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase">Status</th>
                      <th className="py-3 px-4 text-[10px] font-semibold tracking-wider text-pg-text-muted uppercase" />
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <ResultRow
                        key={i}
                        result={r}
                        amount={parsedData[i]?.amount}
                        isExpanded={expandedRow === i}
                        onToggle={() => setExpandedRow(expandedRow === i ? null : i)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </TerminalPanel>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    accent: "text-pg-accent bg-pg-accent-soft",
    green: "text-pg-green bg-pg-green-soft",
    amber: "text-pg-amber bg-pg-amber-soft",
    red: "text-pg-red bg-pg-red-soft",
  }

  return (
    <TerminalPanel>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-pg-text-white">{value}</div>
          <div className="text-[10px] text-pg-text-muted uppercase tracking-wider font-medium">{label}</div>
        </div>
      </div>
    </TerminalPanel>
  )
}

function ResultRow({ result, amount, isExpanded, onToggle }: {
  result: PredictionResult
  amount?: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const riskColor = result.risk_score > 60 ? "text-pg-red" : result.risk_score > 30 ? "text-pg-amber" : "text-pg-green"

  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-pg-border/30 text-[12px] hover:bg-pg-surface-2/30 transition-colors cursor-pointer"
      >
        <td className="py-3 px-4 font-mono text-pg-accent text-[11px]">{result.transaction_id}</td>
        <td className="py-3 px-4 text-right font-semibold font-mono text-pg-text-bright">
          {amount ? `₹${amount.toLocaleString()}` : "—"}
        </td>
        <td className="py-3 px-4 text-center">
          <span className={`font-mono font-bold ${riskColor}`}>{result.risk_score}</span>
        </td>
        <td className="py-3 px-4 text-center font-mono text-pg-text">
          {(result.fraud_probability * 100).toFixed(1)}%
        </td>
        <td className="py-3 px-4 text-center font-mono text-pg-text">
          {(result.confidence * 100).toFixed(1)}%
        </td>
        <td className="py-3 px-4">
          <RiskBadge level={result.prediction === "blocked" ? "block" : result.risk_level === "medium" ? "review" : "safe"} />
        </td>
        <td className="py-3 px-4 text-pg-text-muted">
          {result.shap_explanation && (
            isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
          )}
        </td>
      </tr>
      {isExpanded && result.shap_explanation && (
        <tr className="bg-pg-surface-2/20 border-b border-pg-border/30">
          <td colSpan={7} className="p-5">
            <div className="rounded-lg border border-pg-border p-4">
              <h4 className="text-[11px] font-semibold text-pg-text-muted uppercase tracking-wider mb-3">SHAP Feature Importance</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(result.shap_explanation)
                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                  .slice(0, 8)
                  .map(([feature, impact], i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px]">
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
