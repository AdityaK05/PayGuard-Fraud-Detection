import { AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react"

interface RiskBadgeProps {
  level: "safe" | "review" | "block" | "high" | "medium" | "low" | string
  score?: number | null
  className?: string
  size?: "sm" | "md" | "lg"
}

export function RiskBadge({ level, score, className = "", size = "md" }: RiskBadgeProps) {
  const norm = level.toLowerCase()

  let colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  let label = "Safe"
  let Icon = CheckCircle2
  let dotColor = "bg-emerald-400"

  if (norm === "block" || norm === "high" || norm === "fraud" || norm === "blocked") {
    colorClasses = "bg-rose-500/10 text-rose-400 border-rose-500/25"
    label = "Blocked"
    Icon = ShieldAlert
    dotColor = "bg-rose-400"
  } else if (norm === "review" || norm === "medium" || norm === "flagged" || norm === "suspicious") {
    colorClasses = "bg-amber-500/10 text-amber-400 border-amber-500/25"
    label = "Review"
    Icon = AlertTriangle
    dotColor = "bg-amber-400"
  } else if (norm === "safe" || norm === "low" || norm === "approved") {
    colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    label = "Safe"
    Icon = CheckCircle2
    dotColor = "bg-emerald-400"
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1.5 font-medium"
      : size === "lg"
      ? "text-[13px] px-3.5 py-1.5 gap-2 font-medium"
      : "text-[12px] px-2.5 py-1 gap-1.5 font-medium"

  return (
    <span
      className={`
        inline-flex items-center rounded-full border backdrop-blur-sm
        transition-all duration-150 select-none
        ${colorClasses}
        ${sizeClasses}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <Icon className="w-3.5 h-3.5 opacity-90" strokeWidth={1.75} />
      <span>{label}</span>
      {score !== undefined && score !== null && (
        <span className="font-mono text-[11px] opacity-80 pl-0.5 font-semibold">
          {score}
        </span>
      )}
    </span>
  )
}
