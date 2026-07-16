/**
 * PayGuard – Stat Card Component
 */

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; isUp: boolean }
  accentColor?: string
  delay?: number
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "var(--color-accent)",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="stat-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${accentColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isUp
                ? "bg-[var(--color-success-muted)] text-[var(--color-success)]"
                : "bg-[var(--color-danger-muted)] text-[var(--color-danger)]"
            }`}
          >
            {trend.isUp ? "+" : "-"}{Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-[var(--color-text-primary)]">
        {value}
      </p>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">{title}</p>
      {subtitle && (
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
