"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

// const quotes = [
//   "Please hold on while we prepare...",
//   "Optimizing your experience...",
//   "Finalizing configurations...",
//   "Ensuring precision and quality...",
//   "Refining the process for excellence...",
//   "Engineering solutions in progress...",
//   "Delivering a seamless experience...",
//   "Innovation is taking shape...",
//   "Advancing towards completion...",
//   "Crafting a sophisticated solution...",
//   "Unveiling the next phase...",
//   "Your patience is valued...",
//   "Enhancing the experience for you...",
//   "Polishing the final details...",
//   "Shaping the future with care...",
//   "Building a reliable foundation...",
//   "Excellence is worth the wait...",
//   "Progressing with diligence...",
//   "Creating something exceptional...",
//   "Almost there, thank you for waiting...",
// ];
const quotes = [];
// Function to generate perfect hexagon points
const generateHexagonPoints = () => {
  const size = 40; // Size from center to corner
  const center = 50; // Center of the SVG viewBox
  const points = [];

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // Start at top (rotated 30 degrees)
    const x = center + size * Math.cos(angle);
    const y = center + size * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return points.join(" ");
};

export default function LoadingAnimation(
  { currentQuote: propQuote } = { currentQuote: "Loading..." },
) {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [displayedQuote, setDisplayedQuote] = useState(null);
  const rotationControls = useAnimation();
  const sizeControls = useAnimation();
  const mounted = useRef(false);

  useEffect(() => {
    // Update the displayed quote when propQuote changes
    if (propQuote) {
      setDisplayedQuote(propQuote);
    } else {
      setDisplayedQuote(quotes[currentQuote]);
    }
  }, [propQuote, currentQuote]);

  // Handle the variable speed rotation and size animation
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;

      // Initial slow rotation
      rotationControls
        .start({
          rotate: 60,
          transition: { duration: 0.5, ease: "easeInOut" },
        })
        .then(() => {
          // Faster continuous rotation after 500ms
          rotationControls.start({
            rotate: [60, 420],
            transition: {
              duration: 1.2,
              ease: "linear",
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
            },
          });
        });

      // Start the size animation
      sizeControls.start({
        scale: [1, 1.15, 0.95, 1.1, 1],
        transition: {
          duration: 1.5,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
        },
      });
    }
  }, [rotationControls, sizeControls]);

  const hexagonPoints = generateHexagonPoints();

  return (
    <div className="flex items-center justify-center space-x-4 mt-5 w-full">
      {/* Hexagon animation with dynamic speed and size */}
      <div className="relative w-10 h-10 flex items-center justify-center">
        <motion.div className="w-full h-full" animate={rotationControls}>
          <motion.div className="w-full h-full" animate={sizeControls}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Fill effect that pulses */}
              <motion.polygon
                points={hexagonPoints}
                initial={{ fillOpacity: 0 }}
                animate={{
                  fillOpacity: [0.1, 0.3, 0.1],
                }}
                fill="#4B5563"
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 1.5,
                  ease: "easeInOut",
                  repeatType: "loop",
                }}
              />

              {/* Outline that appears once and stays */}
              <motion.polygon
                points={hexagonPoints}
                fill="none"
                stroke="#6B7280"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                }}
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Center dot */}
        <motion.div
          className="absolute w-2 h-2 bg-gray-600 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 1.2,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Animated quote section - side by side */}
      <div className="h-10 w-full flex items-center">
        <motion.p
          key={displayedQuote || currentQuote}
          className="text-gray-200 text-md text-wrap  max-w-2xl font-semibold animate-pulse"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 5 }}
          transition={{ duration: 0.3 }}
        >
          {displayedQuote || quotes[currentQuote] || "Thinking"} . . .
        </motion.p>
      </div>
    </div>
  );
}
