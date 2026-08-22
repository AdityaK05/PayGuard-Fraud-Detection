import React, { useEffect, useState } from "react";
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
    <div className="relative min-h-screen bg-sentinel-base text-sentinel-text font-mono overflow-hidden">
      {/* Background Layers */}
      <div 
        className="fixed left-0 right-0 bottom-0 h-[55vh] opacity-50 z-0 origin-bottom"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,140,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,140,0.14) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          transform: "perspective(400px) rotateX(72deg)",
          maskImage: "linear-gradient(to top, black, transparent)",
          animation: "floorMove 6s linear infinite"
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none z-10"
        style={{ background: "radial-gradient(ellipse at 50% 30%, transparent 30%, #060706 90%)" }}
      />
      <div 
        className="fixed left-0 right-0 h-[2px] z-20 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,255,150,0.5), transparent)",
          animation: "scan 4.5s linear infinite"
        }}
      />
      <div 
        className="fixed inset-0 z-30 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Persistent Top Bar */}
      <div className="fixed top-0 left-0 right-0 flex justify-between px-8 py-4 text-[11px] tracking-[0.12em] text-sentinel-text-muted border-b border-sentinel-border z-40">
        <div><span className="text-sentinel-green animate-blink">●</span> SYS.STATUS — MONITORING ACTIVE</div>
        <div>NODE / <span className="text-sentinel-green">AP-SOUTH-1</span> — <span>{time}</span></div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-50 h-screen overflow-y-auto pt-[60px]">
        <Outlet />
      </div>
    </div>
  );
}
