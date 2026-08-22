import React from "react";

interface RadarSweepProps {
  txAnalyzed?: string | number;
}

export function RadarSweep({ txAnalyzed = "2,481,904" }: RadarSweepProps) {
  return (
    <div className="relative w-[440px] h-[440px] shrink-0">
      {/* Radar Rings */}
      <div className="absolute inset-0 border border-sentinel-border rounded-full" />
      <div className="absolute inset-[55px] border border-sentinel-border rounded-full" />
      <div className="absolute inset-[110px] border border-sentinel-border rounded-full" />
      <div className="absolute inset-[165px] border border-sentinel-border rounded-full" />
      
      {/* Crosshair */}
      <div className="absolute inset-0">
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-sentinel-border" />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-sentinel-border" />
      </div>
      
      {/* Sweep Effect */}
      <div className="absolute inset-0 rounded-full animate-radar-sweep mix-blend-screen pointer-events-none"
           style={{ background: "conic-gradient(from 0deg, rgba(0,255,150,0.45), transparent 28%)" }} />
      
      {/* Blips */}
      <div className="absolute w-1.5 h-1.5 rounded-full bg-sentinel-green shadow-[0_0_8px_#00FF96] animate-blip-fade top-[30%] left-[62%]" />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-sentinel-green shadow-[0_0_8px_#00FF96] animate-blip-fade top-[68%] left-[38%]" style={{ animationDelay: "1.6s" }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-sentinel-green shadow-[0_0_8px_#00FF96] animate-blip-fade top-[46%] left-[78%]" style={{ animationDelay: "2.4s" }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-sentinel-green shadow-[0_0_8px_#00FF96] animate-blip-fade top-[20%] left-[22%]" style={{ animationDelay: "0.8s" }} />
      
      {/* Center Shield Glyph */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-[30px] drop-shadow-[0_0_10px_rgba(0,255,150,0.6)] text-sentinel-green">◈</div>
      </div>
      
      {/* Readout */}
      <div className="absolute -bottom-[46px] left-1/2 -translate-x-1/2 text-[10.5px] text-sentinel-text-muted tracking-[0.08em] whitespace-nowrap">
        SCANNING &nbsp;·&nbsp; <b className="text-sentinel-green">{txAnalyzed}</b> TX ANALYZED TODAY
      </div>
    </div>
  );
}
