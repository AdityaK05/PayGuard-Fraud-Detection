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
        relative rounded-xl border bg-pg-surface/80 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between
        transition-all duration-200 hover:border-white/[0.16] hover:-translate-y-0.5
        ${danger ? "border-rose-500/30" : "border-white/[0.08]"}
      `}
      style={{
        boxShadow: "var(--glass-shadow)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
          {title}
        </span>
        {icon && <div className="text-[#3b82f6] opacity-90">{icon}</div>}
        {badge && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/25">
            {badge}
          </span>
        )}
      </div>

      <div className="my-0.5">
        <div
          className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
            danger ? "text-rose-400" : "text-white"
          }`}
        >
          {value}
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/[0.06] text-[12px]">
          {trend && (
            <div
              className={`inline-flex items-center gap-1 font-medium text-[11px] px-1.5 py-0.5 rounded ${
                trendUp
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : danger
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-white/[0.04] text-neutral-400 border border-white/[0.06]"
              }`}
            >
              {trendUp ? (
                <TrendingUp className="w-3 h-3" strokeWidth={1.75} />
              ) : (
                <TrendingDown className="w-3 h-3" strokeWidth={1.75} />
              )}
              <span>{trend}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-neutral-400 text-[11px] truncate">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  )
}
