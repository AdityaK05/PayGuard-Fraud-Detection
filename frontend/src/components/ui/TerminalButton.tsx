import React from "react"

interface TerminalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "primary" | "danger" | "ghost"
}

export function TerminalButton({ children, variant = "primary", className = "", ...props }: TerminalButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[13px] font-semibold tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"

  const variants: Record<string, string> = {
    primary: "bg-pg-accent text-white hover:bg-pg-accent/90 shadow-lg shadow-pg-accent/20 hover:shadow-pg-accent/30",
    danger: "bg-pg-red text-white hover:bg-pg-red/90 shadow-lg shadow-pg-red/20",
    ghost: "border border-pg-border text-pg-text hover:bg-pg-surface-2 hover:text-pg-text-bright hover:border-pg-border-hover",
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
