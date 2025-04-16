"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function AnimatedBadge({ children, onClick }) {
  const [pulse, setPulse] = useState(false)

  // Toggle pulse state every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => !prev)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Badge
      variant="outline"
      onClick={onClick}
      className={cn(
        "relative cursor-pointer transition-all duration-500 ease-in-out",
        "bg-blue-950 text-blue-100 border-blue-500/50",
        "px-4 py-2 text-sm font-medium tracking-wide",
        "shadow-[0_0_10px_rgba(59,130,246,0.3)]",
        "hover:shadow-[0_0_25px_rgba(59,130,246,0.8)]",
        "hover:border-blue-400 hover:scale-[1.05]",
        "after:absolute after:inset-0 after:border after:border-blue-400/30",
        "after:animate-pulse",
        pulse ? "scale-[1.03]" : "scale-100",
        // Unique hover effect
        "group overflow-hidden",
      )}
      style={{
        // Add keyframes for the gradient animation directly in the component
        "--gradient-animation": "gradient 8s ease infinite",
      }}
    >
      {/* Main content */}
      <span className="relative z-10 flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-blue-400 animate-ping" />
        {children}
      </span>

      {/* Unique hover effect - ripple */}
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="absolute -inset-1 rounded-full bg-blue-500/20"></span>
        <span
          className="absolute -inset-1 rounded-full bg-blue-500/10 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"
          style={{ animationDelay: "0.2s" }}
        ></span>
        <span
          className="absolute -inset-1 rounded-full bg-blue-500/10 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"
          style={{ animationDelay: "0.6s" }}
        ></span>
      </span>

      {/* Subtle gradient effect */}
      <span
        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-900/20 to-blue-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          animation: "var(--gradient-animation)",
          backgroundSize: "200% 200%",
        }}
      />

      {/* Enhanced shine effect on hover */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-blue-100/20 to-transparent" />
    </Badge>
  )
}



