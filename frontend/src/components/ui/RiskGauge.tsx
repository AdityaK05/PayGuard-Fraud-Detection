import { motion } from "framer-motion"

interface RiskGaugeProps {
  score: number // 0 to 100
  size?: number
  label?: string
}

export default function RiskGauge({ score, size = 180, label }: RiskGaugeProps) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  // High score = low risk usually (or high confidence). 
  // Let's assume the user screenshot shows "Confidence 97%" with green circle.
  // So we map the score to the circumference.
  const strokeDashoffset = circumference - (score / 100) * circumference

  // Color logic matching the new theme
  let color = "var(--color-success)" // Green
  if (score < 70) color = "var(--color-warning)" // Orange
  if (score < 40) color = "var(--color-danger)" // Red

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
        {/* Background Track */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Progress Ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${color}80)`
            }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-bold text-white tracking-tight">
            {score}%
          </span>
          {label && (
            <span className="text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-widest font-semibold">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
