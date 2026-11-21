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
  let borderStyle = "border-white/[0.08]"
  let bgStyle = "bg-pg-surface"

  if (variant === "danger") {
    borderStyle = "border-rose-500/30 shadow-[0_8px_24px_rgba(255,51,102,0.10)]"
  } else if (variant === "success") {
    borderStyle = "border-emerald-500/30 shadow-[0_8px_24px_rgba(0,240,170,0.10)]"
  } else if (variant === "subtle") {
    bgStyle = "bg-pg-surface-2/60"
  }

  const hoverClass = variant === "hover" ? "hover:border-white/20 hover:-translate-y-0.5" : ""

  return (
    <div
      className={`
        relative rounded-xl border ${borderStyle} ${bgStyle}
        backdrop-blur-xl p-5 sm:p-6 transition-all duration-200
        ${glow ? "shadow-[0_0_24px_rgba(0,210,255,0.18)] border-sky-400/30" : ""}
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
