import React from "react";

interface TerminalPanelProps {
  children: React.ReactNode;
  className?: string;
  danger?: boolean;
}

export function TerminalPanel({ children, className = "", danger = false }: TerminalPanelProps) {
  const borderClass = danger
    ? "border-pg-red/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
    : "border-pg-border hover:border-pg-border-hover";

  return (
    <div
      className={`
        relative rounded-xl border ${borderClass}
        bg-pg-surface/60 backdrop-blur-sm
        p-6 transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}
