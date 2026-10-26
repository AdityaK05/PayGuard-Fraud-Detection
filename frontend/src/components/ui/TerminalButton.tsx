import React from "react"

interface TerminalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "danger" | "ghost"
  className?: string
}

export function TerminalButton({
  children,
  variant = "primary",
  className = "",
  disabled,
  ...props
}: TerminalButtonProps) {
  let baseStyle = "ios-glass-button-primary px-4 py-2.5 text-[13px]"

  if (variant === "secondary") {
    baseStyle =
      "ios-glass-button text-pg-text-bright px-4 py-2.5 text-[13px] hover:border-pg-border-hover"
  } else if (variant === "danger") {
    baseStyle =
      "bg-pg-red/90 hover:bg-pg-red text-white border border-pg-red/40 shadow-[0_4px_14px_rgba(244,63,94,0.3)] px-4 py-2.5 text-[13px] rounded-xl font-semibold"
  } else if (variant === "ghost") {
    baseStyle =
      "text-pg-text-muted hover:text-pg-text-bright hover:bg-pg-surface-2 px-3 py-2 text-[13px] rounded-xl font-medium"
  }

  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl
        transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none
        ${baseStyle}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

export const GlassButton = TerminalButton
