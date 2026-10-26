import { useState, useCallback, useRef, Fragment } from "react"
import {
  Upload,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  Sliders,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react"
import { GlassCard } from "@/components/ui/GlassCard"
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

const DEFAULT_VALUES = {
  payment_type: "p2m",
  location_lat: 19.076,
  location_lng: 72.877,
  device_type: "android",
  ip_address: "192.168.1.10",
  os_type: "android_14",
  bank_name: "HDFC",
  merchant_id: "MERCH_DEMO_01",
  merchant_category: "food",
  location_city: "Mumbai",
}

const PRESET_DEMOS = [
  {
    name: "Legitimate Dinner Order",
    desc: "₹450 food delivery in Mumbai at 7:30 PM from regular phone",
    data: {
      amount: 450,
      merchant_category: "food",
      merchant_id: "SWIGGY_BLR_09",
      payment_type: "p2m",
      location_city: "Mumbai",
      location_lat: 19.076,
      location_lng: 72.877,
      device_type: "android",
      ip_address: "103.21.124.50",
      os_type: "android_14",
      bank_name: "HDFC",
      timestamp: "2026-10-26T19:30:00.000Z",
    },
  },
  {
    name: "Late-Night Luxury Electronics",
    desc: "₹85,000 electronics purchase at 3:15 AM from unusual device",
    data: {
      amount: 85000,
      merchant_category: "electronics",
      merchant_id: "CHROME_APPLE_DEL",
      payment_type: "ecommerce",
      location_city: "Delhi",
      location_lat: 28.613,
      location_lng: 77.209,
      device_type: "web",
      ip_address: "198.51.100.44",
      os_type: "windows",
      bank_name: "SBI",
      timestamp: "2026-10-26T03:15:00.000Z",
    },
  },
  {
    name: "Mid-Value P2P Transfer",
    desc: "₹14,500 peer-to-peer transfer during afternoon",
    data: {
      amount: 14500,
      merchant_category: "general",
      merchant_id: "UPI_FRIEND_TRANSFER",
      payment_type: "p2p",
      location_city: "Bangalore",
      location_lat: 12.971,
      location_lng: 77.594,
      device_type: "ios",
      ip_address: "49.207.210.88",
      os_type: "ios_17",
      bank_name: "ICICI",
      timestamp: "2026-10-26T15:20:00.000Z",
    },
  },
]

export default function BatchScanPage() {
  const [activeTab, setActiveTab] = useState<"simulator" | "batch">("simulator")

  // Simulator State
  const [simForm, setSimForm] = useState<ParsedTransaction>({
    amount: 850,
    merchant_category: "food",
    merchant_id: "ZOMATO_MUMBAI",
    payment_type: "p2m",
    location_city: "Mumbai",
    location_lat: 19.076,
    location_lng: 72.877,
    device_type: "android",
    ip_address: "192.168.1.10",
    os_type: "android_14",
    bank_name: "HDFC",
    timestamp: new Date().toISOString(),
  })
  const [simResult, setSimResult] = useState<any | null>(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState("")

  // Batch Scanner State
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([])
  const [results, setResults] = useState<PredictionResult[]>([])
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("")
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Simulator Run ───────────────────────────────────────────
  const runSimulator = async (formData = simForm) => {
    setSimLoading(true)
    setSimError("")
    try {
      const { data } = await api.post("/predict", formData)
      setSimResult(data)
    } catch (err: any) {
      setSimError(err.response?.data?.detail || "Simulation failed. Please verify API connection.")
    } finally {
      setSimLoading(false)
    }
  }

  // ── CSV Parsing ─────────────────────────────────────────────
  function parseCSVContent(content: string): ParsedTransaction[] {
    const lines = content.trim().split("\n")
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""))
    const transactions: ParsedTransaction[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/["']/g, ""))
      if (values.length < 2) continue

      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx] || ""
      })

      const amount = parseFloat(
        row["amount"] || row["txn_amount"] || row["transaction_amount"] || "0"
      )
      if (amount <= 0) continue

      transactions.push({
        payment_type: row["payment_type"] || row["type"] || DEFAULT_VALUES.payment_type,
        amount,
        merchant_category: row["merchant_category"] || row["category"] || DEFAULT_VALUES.merchant_category,
        merchant_id: row["merchant_id"] || row["merchant"] || DEFAULT_VALUES.merchant_id,
        location_city: row["location_city"] || row["city"] || DEFAULT_VALUES.location_city,
        location_lat: parseFloat(row["location_lat"] || String(DEFAULT_VALUES.location_lat)),
        location_lng: parseFloat(row["location_lng"] || String(DEFAULT_VALUES.location_lng)),
        device_type: row["device_type"] || row["device"] || DEFAULT_VALUES.device_type,
        ip_address: row["ip_address"] || row["ip"] || DEFAULT_VALUES.ip_address,
        os_type: row["os_type"] || row["os"] || DEFAULT_VALUES.os_type,
        bank_name: row["bank_name"] || row["bank"] || DEFAULT_VALUES.bank_name,
        timestamp: row["timestamp"] || new Date().toISOString(),
      })
    }
    return transactions
  }

  // ── File Handlers ───────────────────────────────────────────
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
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let fullText = ""
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n"
        }
        // Extract amounts with contextual inference
        const amountPattern = /(?:₹|Rs\.?|INR)\s*([\d,]+\.?\d*)/gi
        let lineIdx = 0
        for (const line of fullText.split("\n")) {
          const matches = [...line.matchAll(amountPattern)]
          for (const m of matches) {
            const amt = parseFloat(m[1].replace(/,/g, ""))
            if (amt > 0 && amt < 10000000) {
              const lower = line.toLowerCase()
              const isHigh = amt >= 45000 || lower.includes("dubai") || lower.includes("crypto") || lower.includes("intl")
              const d = new Date()
              d.setHours(isHigh ? 2 + Math.floor(Math.random() * 3) : 10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 59), 0, 0)

              transactions.push({
                ...DEFAULT_VALUES,
                amount: amt,
                payment_type: isHigh ? "ecommerce" : (amt > 15000 ? "p2p" : "p2m"),
                merchant_category: isHigh ? "electronics" : (amt < 800 ? "food" : (amt < 3000 ? "grocery" : (amt < 10000 ? "retail" : "travel"))),
                location_city: isHigh ? "Dubai / Foreign" : "Mumbai",
                device_type: isHigh ? "web" : "android",
                os_type: isHigh ? "windows" : "android_14",
                ip_address: isHigh ? "185.220.10.5" : `103.21.${lineIdx % 20}.1`,
                timestamp: new Date(d.getTime() - lineIdx * 1800000).toISOString(),
              })
              lineIdx++
            }
          }
        }
      } else {
        setError(`Unsupported file format .${ext}. Please upload a CSV or PDF file.`)
        setParsing(false)
        return
      }

      if (transactions.length === 0) {
        setError("No valid transaction records detected in the document.")
        setParsing(false)
        return
      }

      setParsedData(transactions.slice(0, 500))
    } catch (err: any) {
      setError(`Failed to read document: ${err.message}`)
    } finally {
      setParsing(false)
    }
  }, [])

  const loadSampleBatch = (count = 15, attack = false) => {
    const banks = ["HDFC", "SBI", "ICICI", "Axis", "Kotak"]
    const cities = ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Chennai", "Kolkata"]
    const sample: ParsedTransaction[] = []

    const safeProfiles = [
      { cat: "food", minAmt: 60, maxAmt: 450, type: "p2m", hourRange: [9, 14], device: "android", os: "android_14" },
      { cat: "grocery", minAmt: 450, maxAmt: 2800, type: "p2m", hourRange: [11, 20], device: "android", os: "android_14" },
      { cat: "retail", minAmt: 1200, maxAmt: 5400, type: "p2m", hourRange: [14, 21], device: "ios", os: "ios_17" },
      { cat: "utilities", minAmt: 1500, maxAmt: 4200, type: "bill_payment", hourRange: [10, 18], device: "android", os: "android_14" },
      { cat: "travel", minAmt: 2400, maxAmt: 8500, type: "p2m", hourRange: [12, 19], device: "ios", os: "ios_17" },
      { cat: "food_delivery", minAmt: 220, maxAmt: 980, type: "p2m", hourRange: [19, 22], device: "android", os: "android_14" },
      { cat: "p2p", minAmt: 2000, maxAmt: 14000, type: "p2p", hourRange: [11, 20], device: "android", os: "android_14" },
    ]

    const attackProfiles = [
      { cat: "electronics", amt: 68500, type: "ecommerce", city: "Dubai / Foreign", lat: 25.204, lng: 55.27, dev: "web", os: "windows", ip: "185.220.10.5", hour: 3, merch: "UNVERIFIED_INTL_TECH" },
      { cat: "crypto", amt: 94000, type: "ecommerce", city: "Dubai / Foreign", lat: 25.204, lng: 55.27, dev: "web", os: "linux", ip: "185.100.12.8", hour: 2, merch: "OFFSHORE_CRYPTO_GATE" },
      { cat: "real_estate", amt: 145000, type: "p2p", city: "Moscow", lat: 55.75, lng: 37.61, dev: "web", os: "windows", ip: "194.26.29.14", hour: 4, merch: "SUSPECT_ACCT_DRAIN" },
      { cat: "electronics", amt: 52000, type: "ecommerce", city: "Jaipur", lat: 26.91, lng: 75.78, dev: "web", os: "windows", ip: "185.220.1.99", hour: 1, merch: "UNVERIFIED_MERCH_NIGHT" },
      { cat: "utilities", amt: 26500, type: "p2p", city: "Pune", lat: 18.52, lng: 73.85, dev: "android", os: "android_14", ip: "103.21.44.12", hour: 23, merch: "PEER_TRANSFER_LATE" },
    ]

    for (let i = 0; i < count; i++) {
      const isAttackIndex = attack && (i % 3 === 0)
      const attackCase = isAttackIndex ? attackProfiles[Math.floor(i / 3) % attackProfiles.length] : null

      if (attackCase) {
        const d = new Date()
        d.setHours(attackCase.hour, Math.floor(Math.random() * 59), 0, 0)
        sample.push({
          payment_type: attackCase.type,
          amount: attackCase.amt + Math.floor((Math.random() - 0.5) * 4000),
          merchant_category: attackCase.cat,
          merchant_id: attackCase.merch,
          location_city: attackCase.city,
          location_lat: attackCase.lat,
          location_lng: attackCase.lng,
          device_type: attackCase.dev,
          ip_address: attackCase.ip,
          os_type: attackCase.os,
          bank_name: banks[i % banks.length],
          timestamp: new Date(d.getTime() - i * 1800000).toISOString(),
        })
      } else {
        const profile = safeProfiles[i % safeProfiles.length]
        const amt = Math.floor(profile.minAmt + Math.random() * (profile.maxAmt - profile.minAmt))
        const hour = profile.hourRange[0] + Math.floor(Math.random() * (profile.hourRange[1] - profile.hourRange[0]))
        const d = new Date()
        d.setHours(hour, Math.floor(Math.random() * 59), 0, 0)

        sample.push({
          payment_type: profile.type,
          amount: amt,
          merchant_category: profile.cat,
          merchant_id: `VERIFIED_M_${i + 10}`,
          location_city: cities[i % cities.length],
          location_lat: 19.076 + (i * 0.02),
          location_lng: 72.877 + (i * 0.02),
          device_type: profile.device,
          ip_address: `103.21.${i + 1}.1`,
          os_type: profile.os,
          bank_name: banks[i % banks.length],
          timestamp: new Date(d.getTime() - i * 1800000).toISOString(),
        })
      }
    }

    setFileName(attack ? "Simulated_Attack_Stream.csv" : "Standard_Statement_Sample.csv")
    setParsedData(sample)
    setResults([])
    setSummary(null)
  }

  const runBatchScan = async () => {
    setBatchLoading(true)
    setError("")
    try {
      const { data } = await api.post("/predict/batch", { transactions: parsedData })
      setSummary(data.summary)
      setResults(data.results)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Batch scan execution failed. Check system logs.")
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-[1500px] mx-auto animate-fadeIn">
      {/* ── Mode Switcher & Title ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-semibold text-pg-accent tracking-wide uppercase">
              Decision Laboratory
            </span>
            <span className="text-pg-text-muted">·</span>
            <span className="text-[12px] text-pg-text-muted">Instant Inference Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-pg-text-white">
            Scan & Simulate
          </h1>
          <p className="text-[13px] text-pg-text-muted mt-1">
            Test single transactions interactively or upload bulk banking statements for neural risk scoring.
          </p>
        </div>

        {/* iOS Segmented Pill Switcher */}
        <div className="inline-flex p-1 rounded-2xl bg-pg-surface-2 border border-pg-border shadow-sm">
          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === "simulator"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm"
                : "text-pg-text-muted hover:text-pg-text-bright"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Interactive Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab("batch")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === "batch"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm"
                : "text-pg-text-muted hover:text-pg-text-bright"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Batch File Scanner</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: INTERACTIVE SIMULATOR ── */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Side */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Quick Demo Preset Chips */}
            <GlassCard className="p-4 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-pg-text-muted uppercase tracking-wider">
                Quick Scenario Presets
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PRESET_DEMOS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSimForm(p.data as any)
                      runSimulator(p.data as any)
                    }}
                    className="p-3 rounded-xl border border-pg-border/60 bg-pg-surface-2/60 hover:bg-pg-surface-2 hover:border-pg-accent/40 text-left transition-all duration-150 cursor-pointer group"
                  >
                    <div className="text-[12px] font-bold text-pg-text-bright group-hover:text-pg-accent">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-pg-text-muted mt-1 line-clamp-2 leading-relaxed">
                      {p.desc}
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Parameter Inputs */}
            <GlassCard className="flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-pg-border/50">
                <h3 className="text-[14px] font-semibold text-pg-text-bright">
                  Transaction Parameters
                </h3>
                <span className="text-[11px] text-pg-text-muted">ISO-8583 Aligned</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-pg-text-bright mb-1.5">
                    Amount (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={simForm.amount}
                    onChange={(e) => setSimForm({ ...simForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full ios-glass-input p-3 text-pg-text-bright text-[14px] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-pg-text-bright mb-1.5">
                    Merchant Category
                  </label>
                  <select
                    value={simForm.merchant_category}
                    onChange={(e) => setSimForm({ ...simForm, merchant_category: e.target.value })}
                    className="w-full ios-glass-input p-3 text-pg-text-bright text-[14px] cursor-pointer"
                  >
                    <option value="food">Food & Dining</option>
                    <option value="retail">Retail & Shopping</option>
                    <option value="electronics">Luxury Electronics</option>
                    <option value="utilities">Utility Bills</option>
                    <option value="travel">Travel & Aviation</option>
                    <option value="general">General Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-pg-text-bright mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={simForm.payment_type}
                    onChange={(e) => setSimForm({ ...simForm, payment_type: e.target.value })}
                    className="w-full ios-glass-input p-3 text-pg-text-bright text-[14px] cursor-pointer"
                  >
                    <option value="p2m">P2M (Person to Merchant)</option>
                    <option value="p2p">P2P (Peer to Peer)</option>
                    <option value="ecommerce">Online / E-Commerce</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-pg-text-bright mb-1.5">
                    Issuing Bank
                  </label>
                  <select
                    value={simForm.bank_name}
                    onChange={(e) => setSimForm({ ...simForm, bank_name: e.target.value })}
                    className="w-full ios-glass-input p-3 text-pg-text-bright text-[14px] cursor-pointer"
                  >
                    <option value="HDFC">HDFC Bank</option>
                    <option value="SBI">State Bank of India</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="Axis">Axis Bank</option>
                    <option value="Kotak">Kotak Mahindra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-pg-text-bright mb-1.5">
                    Client Device
                  </label>
                  <select
                    value={simForm.device_type}
                    onChange={(e) => setSimForm({ ...simForm, device_type: e.target.value })}
                    className="w-full ios-glass-input p-3 text-pg-text-bright text-[14px] cursor-pointer"
                  >
                    <option value="android">Android (Mobile App)</option>
                    <option value="ios">iOS (Apple iPhone)</option>
                    <option value="web">Web Browser</option>
                    <option value="desktop">Desktop Emulator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-pg-text-bright mb-1.5">
                    Originating City
                  </label>
                  <input
                    type="text"
                    value={simForm.location_city}
                    onChange={(e) => setSimForm({ ...simForm, location_city: e.target.value })}
                    className="w-full ios-glass-input p-3 text-pg-text-bright text-[14px]"
                  />
                </div>
              </div>

              {simError && (
                <div className="p-3 rounded-xl bg-pg-red-soft text-pg-red text-[12px] border border-pg-red/20">
                  {simError}
                </div>
              )}

              <button
                onClick={() => runSimulator()}
                disabled={simLoading}
                className="ios-glass-button-primary w-full py-3.5 text-[14px] flex items-center justify-center gap-2 mt-2"
              >
                {simLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Transaction Risk...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Run Real-Time Risk Analysis</span>
                  </>
                )}
              </button>
            </GlassCard>
          </div>

          {/* Results Side */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <GlassCard className="flex flex-col p-6 min-h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-pg-border/50 mb-6">
                <div>
                  <h3 className="text-[15px] font-semibold text-pg-text-bright">
                    Risk Assessment & Decision
                  </h3>
                  <span className="text-[11px] text-pg-text-muted">Automated Fraud Screening</span>
                </div>
                {simResult && <RiskBadge level={simResult.prediction} size="lg" />}
              </div>

              {!simResult && !simLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-pg-text-muted">
                  <Sparkles className="w-10 h-10 text-pg-accent/60 mb-3" />
                  <h4 className="text-[14px] font-semibold text-pg-text-bright">
                    Awaiting Simulation Input
                  </h4>
                  <p className="text-[12px] mt-1 max-w-[280px]">
                    Select a preset scenario or click &ldquo;Run Real-Time Risk Analysis&rdquo; to test the evaluation.
                  </p>
                </div>
              ) : simLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-12 h-12 rounded-full border-2 border-pg-accent border-t-transparent animate-spin mb-4" />
                  <p className="text-[13px] font-semibold text-pg-text-bright">
                    Evaluating Risk Factors & Deviation...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  {/* Gauge Metric */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-pg-surface-2 to-pg-surface-3 border border-pg-border/80 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-pg-text-muted uppercase tracking-wider">
                        Risk Probability
                      </div>
                      <div
                        className={`text-4xl font-extrabold tracking-tight mt-1 ${
                          simResult.risk_score >= 50
                            ? "text-pg-red"
                            : simResult.risk_score >= 25
                            ? "text-pg-amber"
                            : "text-pg-green"
                        }`}
                      >
                        {simResult.risk_score}%
                      </div>
                      <div className="text-[11px] text-pg-text-muted mt-1">
                        Assessed Risk Level: <strong className="capitalize">{simResult.risk_level}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-pg-text-muted uppercase tracking-wider">
                        Deviation Factor
                      </div>
                      <div className="text-[14px] font-bold font-mono text-pg-text-bright mt-1">
                        {simResult.anomaly_score?.toFixed(3)}
                      </div>
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          simResult.is_anomaly
                            ? "bg-pg-red-soft text-pg-red"
                            : "bg-pg-green-soft text-pg-green"
                        }`}
                      >
                        {simResult.is_anomaly ? "Outlier Pattern" : "Normal Cluster"}
                      </span>
                    </div>
                  </div>

                  {/* Feature Impact */}
                  {simResult.shap_explanation && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-pg-text-bright">
                          Primary Risk Factors
                        </span>
                        <span className="text-[10px] text-pg-text-muted">Signal Impact</span>
                      </div>

                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {Object.entries(simResult.shap_explanation)
                          .sort((a: any, b: any) => Math.abs(b[1]) - Math.abs(a[1]))
                          .slice(0, 6)
                          .map(([feat, imp]: [string, any], idx) => (
                            <div key={idx} className="flex flex-col gap-1 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-pg-text-muted font-medium truncate max-w-[180px]">
                                  {feat}
                                </span>
                                <span
                                  className={`font-semibold font-mono ${
                                    imp > 0 ? "text-pg-red" : "text-pg-green"
                                  }`}
                                >
                                  {imp > 0 ? `+${imp.toFixed(3)} (Threat)` : `${imp.toFixed(3)} (Safe)`}
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-pg-surface-3 overflow-hidden flex">
                                <div className="w-1/2 flex justify-end">
                                  {imp < 0 && (
                                    <div
                                      className="h-full bg-pg-green rounded-full"
                                      style={{ width: `${Math.min(100, Math.abs(imp) * 30)}%` }}
                                    />
                                  )}
                                </div>
                                <div className="w-1/2 flex justify-start">
                                  {imp > 0 && (
                                    <div
                                      className="h-full bg-pg-red rounded-full"
                                      style={{ width: `${Math.min(100, imp * 30)}%` }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-pg-surface-2 border border-pg-border/60 text-[11px] text-pg-text-muted flex items-center justify-between">
                    <span>Transaction Token:</span>
                    <span className="font-mono text-pg-accent font-semibold">{simResult.transaction_id}</span>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}

      {/* ── TAB 2: BATCH FILE SCANNER ── */}
      {activeTab === "batch" && (
        <div className="flex flex-col gap-6">
          {/* Dropzone Card */}
          <GlassCard className="p-8 flex flex-col items-center justify-center text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />

            <div
              onDrop={(e) => {
                e.preventDefault()
                setDragActive(false)
                const f = e.dataTransfer.files?.[0]
                if (f) handleFile(f)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`
                w-full max-w-[700px] border-2 border-dashed rounded-3xl p-10
                flex flex-col items-center justify-center gap-3 cursor-pointer
                transition-all duration-200
                ${
                  dragActive
                    ? "border-pg-accent bg-pg-accent-soft/30 shadow-lg scale-[1.01]"
                    : "border-pg-border hover:border-pg-border-hover bg-pg-surface-2/40"
                }
              `}
            >
              <div className="w-14 h-14 rounded-2xl bg-pg-accent-soft text-pg-accent flex items-center justify-center mb-1">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-[16px] font-semibold text-pg-text-white">
                {fileName ? fileName : "Drop bank statement or transaction CSV here"}
              </h3>
              <p className="text-[12px] text-pg-text-muted max-w-[420px]">
                Accepts standard CSV statement exports and PDF bank account transaction records up to 500 rows.
              </p>
              <span className="mt-2 ios-glass-button-primary px-4 py-2 text-[12px] flex items-center gap-1.5">
                {parsing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{parsing ? "Parsing File..." : "Browse Document"}</span>
              </span>
            </div>

            {/* Quick Demo Batch Loaders */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <span className="text-[11px] font-semibold text-pg-text-muted uppercase tracking-wider">
                Or Try Sample Statements:
              </span>
              <button
                onClick={() => loadSampleBatch(15, false)}
                className="ios-glass-button px-3.5 py-1.5 text-[12px] text-pg-text-bright hover:border-pg-accent"
              >
                Sample Bank Statement (15 txs)
              </button>
              <button
                onClick={() => loadSampleBatch(20, true)}
                className="ios-glass-button px-3.5 py-1.5 text-[12px] text-pg-red hover:border-pg-red"
              >
                Simulated Attack Stream (20 txs)
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-pg-red-soft text-pg-red text-[12px] border border-pg-red/20 max-w-[600px]">
                {error}
              </div>
            )}
          </GlassCard>

          {/* Action Row when data parsed */}
          {parsedData.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-pg-surface border border-pg-border shadow-sm">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-pg-accent" />
                <div>
                  <div className="text-[13px] font-bold text-pg-text-bright">
                    {parsedData.length} Transactions Staged for Analysis
                  </div>
                  <div className="text-[11px] text-pg-text-muted">Source: {fileName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setParsedData([])
                    setResults([])
                    setSummary(null)
                  }}
                  className="ios-glass-button text-pg-text-muted px-3 py-2 text-[12px]"
                >
                  Clear
                </button>
                <button
                  onClick={runBatchScan}
                  disabled={batchLoading}
                  className="ios-glass-button-primary px-5 py-2 text-[13px] flex items-center gap-2"
                >
                  {batchLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Batch Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Execute Batch Inference</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn">
              <GlassCard className="p-4">
                <span className="text-[11px] text-pg-text-muted uppercase font-semibold">Analyzed</span>
                <div className="text-2xl font-bold text-pg-text-white mt-1">{summary.total_analyzed}</div>
              </GlassCard>
              <GlassCard className="p-4">
                <span className="text-[11px] text-pg-green uppercase font-semibold">Approved</span>
                <div className="text-2xl font-bold text-pg-green mt-1">{summary.total_approved}</div>
              </GlassCard>
              <GlassCard className="p-4">
                <span className="text-[11px] text-pg-red uppercase font-semibold">Threats Blocked</span>
                <div className="text-2xl font-bold text-pg-red mt-1">{summary.total_blocked}</div>
              </GlassCard>
              <GlassCard className="p-4">
                <span className="text-[11px] text-pg-accent uppercase font-semibold">Mean Risk Score</span>
                <div className="text-2xl font-bold text-pg-accent mt-1">{summary.avg_risk_score}%</div>
              </GlassCard>
            </div>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <GlassCard className="p-0 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-pg-border flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-pg-text-bright">Inference Results</h3>
                <span className="text-[11px] text-pg-text-muted">{results.length} rows evaluated</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-pg-border bg-pg-surface-2/60 text-[11px] font-semibold text-pg-text-muted uppercase tracking-wider">
                      <th className="py-3 px-4">TX ID</th>
                      <th className="py-3 px-4 text-center">Risk Score</th>
                      <th className="py-3 px-4 text-center">Anomaly Flag</th>
                      <th className="py-3 px-4 text-center">Decision</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <Fragment key={i}>
                        <tr
                          onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                          className="border-b border-pg-border/30 text-[12px] hover:bg-pg-surface-2/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-mono text-pg-accent font-semibold">{r.transaction_id}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`font-mono font-bold ${
                                r.risk_score >= 60
                                  ? "text-pg-red"
                                  : r.risk_score >= 25
                                  ? "text-pg-amber"
                                  : "text-pg-green"
                              }`}
                            >
                              {r.risk_score}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                r.is_anomaly
                                  ? "bg-pg-red-soft text-pg-red border border-pg-red/20"
                                  : "bg-pg-green-soft text-pg-green border border-pg-green/20"
                              }`}
                            >
                              {r.is_anomaly ? "Outlier" : "Normal"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <RiskBadge level={r.prediction} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="text-pg-text-muted hover:text-pg-text-bright">
                              {expandedRow === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>

                        {expandedRow === i && r.shap_explanation && (
                          <tr className="bg-pg-surface-2/30 border-b border-pg-border/50">
                            <td colSpan={5} className="p-4">
                              <div className="rounded-xl border border-pg-border p-4 bg-pg-surface/80">
                                <div className="text-[11px] font-semibold text-pg-text-muted uppercase tracking-wider mb-2">
                                  Primary Risk Factors
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                                  {Object.entries(r.shap_explanation)
                                    .slice(0, 6)
                                    .map(([f, v], idx) => (
                                      <div key={idx} className="flex justify-between">
                                        <span className="text-pg-text-muted">{f}:</span>
                                        <span className={v > 0 ? "text-pg-red font-semibold" : "text-pg-green font-semibold"}>
                                          {v > 0 ? `+${v.toFixed(3)}` : v.toFixed(3)}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  )
}
