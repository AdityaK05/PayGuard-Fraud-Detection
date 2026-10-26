import { ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react"

interface RiskBadgeProps {
  level: "safe" | "review" | "block" | "high" | "medium" | "low" | string
  score?: number | null
  className?: string
  size?: "sm" | "md" | "lg"
}

export function RiskBadge({ level, score, className = "", size = "md" }: RiskBadgeProps) {
  const norm = level.toLowerCase()

  let colorClasses = "bg-pg-green-soft text-pg-green border-pg-green/25"
  let label = "Approved"
  let Icon = ShieldCheck
  let dotColor = "bg-pg-green"

  if (norm === "block" || norm === "high" || norm === "fraud" || norm === "blocked") {
    colorClasses = "bg-pg-red-soft text-pg-red border-pg-red/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
    label = "Blocked"
    Icon = ShieldAlert
    dotColor = "bg-pg-red"
  } else if (norm === "review" || norm === "medium" || norm === "flagged" || norm === "suspicious") {
    colorClasses = "bg-pg-amber-soft text-pg-amber border-pg-amber/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
    label = "Review"
    Icon = AlertTriangle
    dotColor = "bg-pg-amber"
  } else if (norm === "safe" || norm === "low" || norm === "approved") {
    colorClasses = "bg-pg-green-soft text-pg-green border-pg-green/30"
    label = "Safe"
    Icon = CheckCircle2
    dotColor = "bg-pg-green"
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1.5 font-medium"
      : size === "lg"
      ? "text-[13px] px-3.5 py-1.5 gap-2 font-semibold"
      : "text-[12px] px-2.5 py-1 gap-1.5 font-medium"

  return (
    <span
      className={`
        inline-flex items-center rounded-full border backdrop-blur-md
        transition-all duration-150 select-none
        ${colorClasses}
        ${sizeClasses}
        ${className}
      `}
      style={{
        boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)",
      }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
      <Icon className="w-3.5 h-3.5 opacity-90" />
      <span>{label}</span>
      {score !== undefined && score !== null && (
        <span className="font-mono text-[11px] opacity-80 pl-0.5 font-semibold">
          {score}
        </span>
      )}
    </span>
  )
}
