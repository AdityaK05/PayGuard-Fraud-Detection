import React from "react";

interface TerminalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function TerminalButton({ children, className = "", ...props }: TerminalButtonProps) {
  return (
    <button 
      className={`relative w-full mt-1.5 p-[13px] bg-sentinel-green text-[#05130C] font-sans font-bold text-[13px] tracking-[0.06em] uppercase cursor-pointer overflow-hidden border-none group ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute top-0 -left-[60%] w-[40%] h-full bg-gradient-to-r from-transparent via-white/55 to-transparent animate-shimmer" />
    </button>
  );
}
