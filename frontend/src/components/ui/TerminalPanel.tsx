import React from "react";

interface TerminalPanelProps {
  children: React.ReactNode;
  className?: string;
  danger?: boolean;
}

export function TerminalPanel({ children, className = "", danger = false }: TerminalPanelProps) {
  const bracketColor = danger ? "border-sentinel-red" : "border-sentinel-green";
  const bgClass = "bg-[#050C08]/70";
  const borderClass = danger ? "border-sentinel-red/25" : "border-sentinel-border-focus";

  return (
    <div className={`relative border ${borderClass} ${bgClass} p-8 ${className}`}>
      {/* Top Left Bracket */}
      <div className={`absolute -top-[1px] -left-[1px] w-[18px] h-[18px] border-t-2 border-l-2 ${bracketColor}`} />
      {/* Top Right Bracket */}
      <div className={`absolute -top-[1px] -right-[1px] w-[18px] h-[18px] border-t-2 border-r-2 ${bracketColor}`} />
      {/* Bottom Left Bracket */}
      <div className={`absolute -bottom-[1px] -left-[1px] w-[18px] h-[18px] border-b-2 border-l-2 ${bracketColor}`} />
      {/* Bottom Right Bracket */}
      <div className={`absolute -bottom-[1px] -right-[1px] w-[18px] h-[18px] border-b-2 border-r-2 ${bracketColor}`} />
      
      {children}
    </div>
  );
}
