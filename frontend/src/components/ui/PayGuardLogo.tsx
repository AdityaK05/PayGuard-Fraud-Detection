
interface PayGuardLogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function PayGuardLogo({
  className = "",
  showText = true,
  size = "md",
}: PayGuardLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }

  const textSizes = {
    sm: "text-[14px]",
    md: "text-[16px]",
    lg: "text-[20px]",
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Bespoke Modern Geometric Fintech Shield Mark */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_10px_rgba(99,102,241,0.35)]"
        >
          {/* Outer geometric shield facet */}
          <path
            d="M18 3L6 8.5V17C6 24.5 11.2 31.4 18 33C24.8 31.4 30 24.5 30 17V8.5L18 3Z"
            fill="url(#pgGradOuter)"
          />
          {/* Inner faceted reflective glass layer */}
          <path
            d="M18 6.2L9.2 10.2V17C9.2 22.8 13 28.2 18 29.8C23 28.2 26.8 22.8 26.8 17V10.2L18 6.2Z"
            fill="url(#pgGradInner)"
          />
          {/* Dynamic Payment Lock / Verified Notch */}
          <path
            d="M15.5 17.5L17.5 19.5L21.5 14.5"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Subtle specular top highlight */}
          <path
            d="M18 6.2L9.2 10.2V13.5L18 9.5L26.8 13.5V10.2L18 6.2Z"
            fill="rgba(255, 255, 255, 0.35)"
          />

          <defs>
            <linearGradient
              id="pgGradOuter"
              x1="6"
              y1="3"
              x2="30"
              y2="33"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#6366F1" />
              <stop offset="0.5" stopColor="#4F46E5" />
              <stop offset="1" stopColor="#3730A3" />
            </linearGradient>
            <linearGradient
              id="pgGradInner"
              x1="9.2"
              y1="6.2"
              x2="26.8"
              y2="29.8"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#1E1B4B" stopOpacity="0.85" />
              <stop offset="1" stopColor="#0F172A" stopOpacity="0.95" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-bold tracking-tight text-pg-text-white font-sans ${textSizes[size]}`}>
            Pay<span className="text-pg-accent">Guard</span>
          </div>
          <span className="text-[10px] text-pg-text-muted font-medium tracking-wide mt-0.5">
            Enterprise Security
          </span>
        </div>
      )}
    </div>
  )
}
