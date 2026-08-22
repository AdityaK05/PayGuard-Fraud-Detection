import { TerminalPanel } from "./TerminalPanel"

interface KpiCardProps {
  title: string
  value: string | number
  trend?: string
  trendUp?: boolean
  subtitle?: string
  danger?: boolean
}

export function KpiCard({ title, value, trend, trendUp, subtitle, danger = false }: KpiCardProps) {
  return (
    <TerminalPanel danger={danger} className="h-full flex flex-col justify-between">
      <div className="text-[10px] tracking-[0.1em] text-sentinel-text-muted uppercase mb-4">
        {title}
      </div>
      
      <div>
        <div className={`text-3xl font-mono mb-2 ${danger ? "text-sentinel-red drop-shadow-[0_0_8px_rgba(255,92,92,0.4)]" : "text-sentinel-green drop-shadow-[0_0_8px_rgba(0,255,150,0.4)]"}`}>
          {value}
        </div>
        
        <div className="flex items-center justify-between text-[10px] font-mono">
          {subtitle && <span className="text-[#3B5C48]">{subtitle}</span>}
          {trend && (
            <span className={trendUp ? (danger ? "text-sentinel-red" : "text-sentinel-green") : "text-sentinel-text-muted"}>
              {trendUp ? "▲" : "▼"} {trend}
            </span>
          )}
        </div>
      </div>
    </TerminalPanel>
  )
}
