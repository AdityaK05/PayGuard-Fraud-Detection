import { TrendingUp, TrendingDown } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  trend?: string
  trendUp?: boolean
  subtitle?: string
  danger?: boolean
}

export function KpiCard({ title, value, trend, trendUp, subtitle, danger }: KpiCardProps) {
  return (
    <div
      className={`
        relative rounded-xl border bg-pg-surface/60 backdrop-blur-sm p-5 flex flex-col justify-between
        transition-all duration-300 hover:border-pg-border-hover
        ${danger ? "border-pg-red/20" : "border-pg-border"}
      `}
    >
      <div className="text-[10px] font-medium tracking-wider text-pg-text-muted uppercase mb-2">
        {title}
      </div>
      <div className={`text-2xl font-bold font-mono ${danger ? "text-pg-red" : "text-pg-text-white"}`}>
        {value}
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 mt-2">
          {trendUp ? (
            <TrendingUp className="w-3 h-3 text-pg-green" />
          ) : (
            <TrendingDown className="w-3 h-3 text-pg-red" />
          )}
          <span className={`text-[11px] font-medium ${trendUp ? "text-pg-green" : "text-pg-red"}`}>
            {trend}
          </span>
          {subtitle && (
            <span className="text-[10px] text-pg-text-muted ml-1">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  )
}
