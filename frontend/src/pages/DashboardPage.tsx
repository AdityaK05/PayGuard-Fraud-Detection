import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import api from "@/lib/api"

interface Stats { total_transactions:number; total_fraud:number; avg_risk_score:number; daily_transactions?:{day:string;safe:number;risk:number}[] }
interface Tx { id:number; transaction_id:string; amount:number; status:string; payment_type?:string; merchant_category?:string }

const CHART_SEED = [{day:"Mon",safe:18,risk:3},{day:"Tue",safe:25,risk:5},{day:"Wed",safe:14,risk:2},{day:"Thu",safe:30,risk:8},{day:"Fri",safe:22,risk:4},{day:"Sat",safe:10,risk:1},{day:"Sun",safe:16,risk:2}]

const ic = {
  empty: <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-14 h-14" style={{color:"var(--t3)"}}><rect x="6" y="10" width="36" height="24" rx="4"/><path d="M6 18h36"/><circle cx="14" cy="26" r="2"/></svg>,
}

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
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh"}}>
      <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid var(--card-border)",borderTopColor:"var(--t1)",animation:"spin .6s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const risk  = Math.round(s?.avg_risk_score ?? 0)
  const chart = s?.daily_transactions?.length ? s.daily_transactions : CHART_SEED

  const radius = 64
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference - (risk / 100) * circumference

  return (
    <div style={{maxWidth:1280,margin:"0 auto",padding:"0"}}>
      
      {/* Top Grid: Risk Index & Weekly Activity */}
      <div style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:24,marginBottom:24}}>
        
        {/* Risk Index */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="card" style={{padding:24, display:"flex", flexDirection:"column"}}>
          <h2 style={{fontSize:12,fontWeight:600,color:"var(--t1)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:32}}>Risk Index</h2>
          <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center"}}>
            <div style={{position:"relative", width:160, height:160}}>
              <svg width="160" height="160" viewBox="0 0 160 160" style={{transform:"rotate(-90deg)"}}>
                <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--card-border)" strokeWidth="12" />
                <circle 
                  cx="80" cy="80" r={radius} 
                  fill="none" 
                  stroke="var(--t1)" 
                  strokeWidth="12" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={strokeOffset} 
                  strokeLinecap="round" 
                  style={{transition:"stroke-dashoffset 1s ease-in-out"}}
                />
              </svg>
              <div style={{position:"absolute", top:0, left:0, right:0, bottom:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
                <span style={{fontSize:32, fontWeight:700, color:"var(--t1)", letterSpacing:"-0.02em"}}>{risk}%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Weekly Activity */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.05}} className="card" style={{padding:24, display:"flex", flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
            <h2 style={{fontSize:12,fontWeight:600,color:"var(--t1)", textTransform:"uppercase", letterSpacing:"0.05em"}}>Weekly Activity</h2>
            <div style={{display:"flex",gap:16}}>
              <span style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"var(--t3)",fontWeight:500}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:"var(--t1)",display:"inline-block"}}/> Safe
              </span>
              <span style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"var(--t3)",fontWeight:500}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:"var(--t3)",display:"inline-block"}}/> Fraud
              </span>
            </div>
          </div>
          <div style={{flex:1, minHeight: 240, marginLeft:-20}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{left:0,bottom:0,top:10}}>
                <defs>
                  <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--t1)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--t1)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--t3)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--t3)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--card-border)"/>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:"var(--t3)",fontSize:11}} dy={10}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:"var(--t3)",fontSize:11}}/>
                <Tooltip 
                  contentStyle={{background:"var(--card-bg)",border:"1px solid var(--card-border)",borderRadius:8,color:"var(--t1)",fontSize:12,boxShadow:"0 10px 15px -3px rgba(0,0,0,0.5)"}} 
                  itemStyle={{color:"var(--t1)"}}
                  cursor={{stroke: 'var(--card-border)'}}
                />
                <Area type="monotone" dataKey="risk" stroke="var(--t3)" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                <Area type="monotone" dataKey="safe" stroke="var(--t1)" strokeWidth={2} fillOpacity={1} fill="url(#colorSafe)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* Bottom Grid: Recent Transactions */}
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="card" style={{padding:0,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"24px 24px 16px", display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h2 style={{fontSize:12,fontWeight:600,color:"var(--t1)", textTransform:"uppercase", letterSpacing:"0.05em"}}>Recent Transactions</h2>
        </div>
        {txs.length===0 ? (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,paddingTop:40,paddingBottom:60}}>
            {ic.empty}
            <p style={{fontSize:13,color:"var(--t3)"}}>No transactions yet</p>
          </div>
        ) : (
          <div style={{flex:1,overflowX:"auto"}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{paddingLeft:24}}>Transaction ID</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th style={{textAlign:"right", paddingRight:24}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {txs.map(tx=>(
                  <tr key={tx.id}>
                    <td style={{fontFamily:"monospace",fontSize:12,color:"var(--t2)", paddingLeft:24}}>{tx.transaction_id}</td>
                    <td style={{fontWeight:500,color:"var(--t1)"}}>{tx.merchant_category||tx.payment_type||"—"}</td>
                    <td><span className={tx.status==="blocked"?"badge-fraud":tx.status==="approved"?"badge-safe":"badge-medium"}>{tx.status}</span></td>
                    <td style={{textAlign:"right",fontWeight:600,color:"var(--t1)", paddingRight:24}}>₹{tx.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

    </div>
  )
}

