
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
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  }

  const textSizes = {
    sm: "text-[13px]",
    md: "text-[15px]",
    lg: "text-[18px]",
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Minimalist Professional Security Monogram */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Subtle background shield plate */}
          <path
            d="M16 2.5L5 7V15.5C5 22.5 9.7 28.5 16 30C22.3 28.5 27 22.5 27 15.5V7L16 2.5Z"
            fill="#05070a"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1.2"
          />
          {/* Left shield facet - Obsidian Glass */}
          <path
            d="M16 4.2L6.8 8V15.5C6.8 21.6 10.8 26.8 16 28.2V4.2Z"
            fill="rgba(255, 255, 255, 0.03)"
          />
          {/* Right shield facet - Matte Blue Gradient */}
          <path
            d="M16 4.2L25.2 8V15.5C25.2 21.6 21.2 26.8 16 28.2V4.2Z"
            fill="url(#minimalBlueGrad)"
            opacity="0.9"
          />
          {/* Central Precision Security Node */}
          <circle cx="16" cy="15.5" r="2.5" fill="#ffffff" />
          <path
            d="M16 11V13M16 18V20M11.5 15.5H13.5M18.5 15.5H20.5"
            stroke="#3b82f6"
            strokeWidth="1.4"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient
              id="minimalBlueGrad"
              x1="16"
              y1="4"
              x2="26"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#3b82f6" stopOpacity="0.9" />
              <stop offset="1" stopColor="#1d4ed8" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-semibold tracking-tight text-white font-sans ${textSizes[size]}`}>
            Pay<span className="text-[#3b82f6] font-bold">Guard</span>
          </div>
          <span className="text-[9px] text-zinc-400 font-medium tracking-wider uppercase mt-0.5">
            Security Core
          </span>
        </div>
      )}
    </div>
  )
}
