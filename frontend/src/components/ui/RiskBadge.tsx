import { ShieldCheck, ShieldX, AlertTriangle } from "lucide-react"

interface RiskBadgeProps {
  level: "safe" | "review" | "block" | string
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const config: Record<string, { label: string; classes: string; Icon: typeof ShieldCheck }> = {
    safe: {
      label: "Approved",
      classes: "bg-pg-green-soft text-pg-green border-pg-green/20",
      Icon: ShieldCheck,
    },
    review: {
      label: "Review",
      classes: "bg-pg-amber-soft text-pg-amber border-pg-amber/20",
      Icon: AlertTriangle,
    },
    block: {
      label: "Blocked",
      classes: "bg-pg-red-soft text-pg-red border-pg-red/20",
      Icon: ShieldX,
    },
  }

  const { label, classes, Icon } = config[level] || config.review

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border ${classes}`}>
      <Icon className="w-3 h-3" />
      {label.toUpperCase()}
    </span>
  )
}
