import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

export default function SentinelShell() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      setTime(`${hh}:${mm}:${ss}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="relative min-h-screen bg-pg-base text-pg-text font-sans overflow-hidden">
      {/* Subtle gradient background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(99, 102, 241, 0.04), transparent)
          `,
        }}
      />

      {/* Top Status Bar */}
      <div className="fixed top-0 left-0 right-0 h-[52px] flex items-center justify-between px-8 text-[11px] tracking-wide text-pg-text-muted border-b border-pg-border bg-pg-surface/80 backdrop-blur-xl z-40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pg-green animate-pulse-soft" />
          <span className="font-medium text-pg-text">SYSTEM ACTIVE</span>
          <span className="text-pg-text-muted">·</span>
          <span>AP-SOUTH-1</span>
        </div>
        <div className="font-mono text-pg-text-muted">{time}</div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 h-screen overflow-y-auto pt-[52px]">
        <Outlet />
      </div>
    </div>
  );
}
