export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-pg-border/40 ${className}`}
      style={{
        backdropFilter: "blur(8px)",
      }}
    />
  )
}
