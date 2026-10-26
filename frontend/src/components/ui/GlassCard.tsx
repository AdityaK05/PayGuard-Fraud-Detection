import React from "react"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  variant?: "default" | "hover" | "subtle" | "danger" | "success"
  glow?: boolean
}

export function GlassCard({
  children,
  className = "",
  variant = "default",
  glow = false,
  ...props
}: GlassCardProps) {
  let borderStyle = "border-pg-border"
  let bgStyle = "bg-pg-surface"

  if (variant === "danger") {
    borderStyle = "border-pg-red/30 shadow-[0_8px_30px_rgba(244,63,94,0.08)]"
  } else if (variant === "success") {
    borderStyle = "border-pg-green/30 shadow-[0_8px_30px_rgba(16,185,129,0.08)]"
  } else if (variant === "subtle") {
    bgStyle = "bg-pg-surface-2/60"
  }

  const hoverClass = variant === "hover" ? "hover:border-pg-border-hover hover:-translate-y-0.5" : ""

  return (
    <div
      className={`
        relative rounded-2xl border ${borderStyle} ${bgStyle}
        backdrop-blur-2xl p-6 transition-all duration-200
        ${glow ? "shadow-[0_12px_40px_rgba(99,102,241,0.12)]" : ""}
        ${hoverClass}
        ${className}
      `}
      style={{
        boxShadow: "var(--glass-shadow), var(--glass-specular)",
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// Backward-compatible alias for existing imports
export const TerminalPanel = GlassCard
