import { useState, useEffect } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TerminalPanel } from "@/components/ui/TerminalPanel"
import { KpiCard } from "@/components/ui/KpiCard"
import { RiskBadge } from "@/components/ui/RiskBadge"
import api from "@/lib/api"

interface Stats { total_transactions:number; total_fraud:number; avg_risk_score:number; daily_transactions?:{day:string;safe:number;risk:number}[] }
interface Tx { id:number; transaction_id:string; amount:number; status:string; payment_type?:string; merchant_category?:string; timestamp?:string }

const CHART_SEED = [{day:"Mon",safe:18,risk:3},{day:"Tue",safe:25,risk:5},{day:"Wed",safe:14,risk:2},{day:"Thu",safe:30,risk:8},{day:"Fri",safe:22,risk:4},{day:"Sat",safe:10,risk:1},{day:"Sun",safe:16,risk:2}]

export default function DashboardPage() {
  const [s, setS] = useState<Stats|null>(null)
  const [txs, setTxs] = useState<Tx[]>([])
  const [ok, setOk] = useState(false)

  useEffect(() => {
    Promise.all([api.get("/dashboard"), api.get("/transactions?per_page=8")])
      .then(([a,b]) => { setS(a.data); setTxs(b.data.transactions) })
      .catch(() => {})
      .finally(() => setOk(true))
  }, [])

  if (!ok) return (
    <div className="h-[60vh] flex items-center justify-center text-pg-text-muted font-sans text-sm animate-pulse">
      Loading Telemetry Data...
    </div>
  )

  const risk = Math.round(s?.avg_risk_score ?? 0)
  const chart = s?.daily_transactions?.length ? s.daily_transactions : CHART_SEED

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold font-sans tracking-tight text-pg-text-white">
          Command Deck
        </h1>
        <div className="text-[12px] font-medium text-pg-text-muted">
          Last sync: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[120px]">
        <KpiCard title="TOTAL ANALYZED (24H)" value={(s?.total_transactions ?? 0).toLocaleString()} trend="12%" trendUp={true} subtitle="vs prev 24h" />
        <KpiCard title="BLOCKED EVENTS" value={(s?.total_fraud ?? 0).toLocaleString()} trend="3%" trendUp={false} danger={true} />
        <KpiCard title="SYS LATENCY" value="28ms" trend="1ms" trendUp={false} />
        <TerminalPanel className="h-full flex items-center justify-center p-0">
          <div className="flex flex-col items-center">
            <div className="text-[12px] font-medium text-pg-text-muted uppercase mb-2">AVG RISK INDEX</div>
            <div className={`text-4xl font-bold font-mono ${risk > 50 ? "text-pg-red" : "text-pg-text-white"}`}>{risk}%</div>
          </div>
        </TerminalPanel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry Chart */}
        <TerminalPanel className="lg:col-span-2 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold text-pg-text-bright">Live Telemetry (7D)</h2>
            <div className="flex gap-4 font-medium text-[11px] text-pg-text-muted">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pg-green" /> SAFE</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pg-red" /> BLOCKED</span>
            </div>
          </div>
          <div className="flex-1 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{top:10, right:10, left:0, bottom:0}}>
                <defs>
                  <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)"/>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:"#94a3b8", fontSize:11, fontFamily:"Inter"}} dy={10}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:"#94a3b8", fontSize:11, fontFamily:"Inter"}}/>
                <Tooltip 
                  contentStyle={{backgroundColor:"#1e2436", borderColor:"rgba(148, 163, 184, 0.1)", borderRadius:"8px", fontFamily:"Inter", fontSize:12, color:"#f8fafc"}}
                  itemStyle={{color:"#e2e8f0"}}
                  cursor={{stroke: 'rgba(148, 163, 184, 0.2)'}}
                />
                <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                <Area type="monotone" dataKey="safe" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorSafe)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TerminalPanel>

        {/* Recent Transactions Queue */}
        <TerminalPanel className="flex flex-col h-[400px] overflow-hidden p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-pg-text-bright">Active Queue</h2>
            <div className="w-2 h-2 bg-pg-green rounded-full animate-pulse-soft" />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {txs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[12px] font-medium text-pg-text-muted">
                No recent events
              </div>
            ) : (
              txs.map(tx => (
                <div key={tx.id} className="p-3 rounded-lg border border-pg-border bg-pg-surface-2 flex items-center justify-between hover:border-pg-border-hover transition-colors">
                  <div>
                    <div className="font-mono text-[11px] text-pg-text-muted mb-1">
                      {tx.transaction_id.slice(0, 12)}...
                    </div>
                    <div className="font-sans text-[14px] font-semibold text-pg-text-bright">
                      ₹{tx.amount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <RiskBadge level={tx.status === "blocked" ? "block" : tx.status === "approved" ? "safe" : "review"} />
                  </div>
                </div>
              ))
            )}
          </div>
        </TerminalPanel>
      </div>
    </div>
  )
}

