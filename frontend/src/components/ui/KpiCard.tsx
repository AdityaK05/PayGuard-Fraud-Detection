import React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  trend?: string
  trendUp?: boolean
  subtitle?: string
  danger?: boolean
  badge?: string
  icon?: React.ReactNode
}

export function KpiCard({
  title,
  value,
  trend,
  trendUp,
  subtitle,
  danger,
  badge,
  icon,
}: KpiCardProps) {
  return (
    <div
      className={`
        relative rounded-2xl border bg-pg-surface backdrop-blur-2xl p-5 flex flex-col justify-between
        transition-all duration-200 hover:border-pg-border-hover hover:-translate-y-0.5
        ${danger ? "border-pg-red/25 shadow-[0_8px_30px_rgba(244,63,94,0.08)]" : "border-pg-border"}
      `}
      style={{
        boxShadow: "var(--glass-shadow), var(--glass-specular)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold tracking-wider text-pg-text-muted uppercase">
          {title}
        </span>
        {icon && <div className="text-pg-text-muted/80">{icon}</div>}
        {badge && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-pg-accent-soft text-pg-accent border border-pg-accent/20">
            {badge}
          </span>
        )}
      </div>

      <div className="my-1">
        <div
          className={`text-3xl font-bold tracking-tight font-sans ${
            danger ? "text-pg-red" : "text-pg-text-white"
          }`}
        >
          {value}
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-pg-border/40 text-[12px]">
          {trend && (
            <div
              className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-md ${
                trendUp
                  ? "bg-pg-green-soft text-pg-green"
                  : danger
                  ? "bg-pg-red-soft text-pg-red"
                  : "bg-pg-surface-3 text-pg-text-muted"
              }`}
            >
              {trendUp ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trend}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-pg-text-muted text-[11px] truncate">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  )
}
