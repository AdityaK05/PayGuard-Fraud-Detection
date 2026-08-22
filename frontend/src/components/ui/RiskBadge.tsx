type RiskLevel = "safe" | "review" | "block";

interface RiskBadgeProps {
  level: RiskLevel;
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const styles = {
    safe: "text-sentinel-green border-[rgba(0,255,150,0.4)]",
    review: "text-sentinel-amber border-[rgba(255,193,92,0.4)]",
    block: "text-sentinel-red border-[rgba(255,92,92,0.4)]",
  };

  const labels = {
    safe: "SAFE",
    review: "REVIEW",
    block: "BLOCKED",
  };

  return (
    <span className={`inline-block text-[9px] px-2 py-0.5 tracking-[0.05em] border ${styles[level]} font-mono`}>
      {labels[level]}
    </span>
  );
}
