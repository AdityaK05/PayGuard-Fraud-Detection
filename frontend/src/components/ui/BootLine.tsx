import React, { useEffect, useState } from "react";

interface BootLineProps {
  lines: string[];
  loop?: boolean;
}

export function BootLine({ lines, loop = true }: BootLineProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let i = 0;
    const currentLine = lines[currentLineIndex];
    setDisplayedText("");
    setIsTyping(true);

    const typingInterval = setInterval(() => {
      setDisplayedText(currentLine.slice(0, i));
      i++;
      if (i > currentLine.length) {
        clearInterval(typingInterval);
        setIsTyping(false);
        if (loop || currentLineIndex < lines.length - 1) {
          setTimeout(() => {
            setCurrentLineIndex((prev) => (prev + 1) % lines.length);
          }, 1400);
        }
      }
    }, 34);

    return () => clearInterval(typingInterval);
  }, [currentLineIndex, lines, loop]);

  return (
    <div className="text-[11.5px] text-sentinel-text-muted my-[18px] border-l-2 border-sentinel-green pl-2.5 min-h-[16px] flex items-center">
      {displayedText}
      <span className={isTyping ? "animate-blink" : ""}>_</span>
    </div>
  );
}
