import { Briefcase, Target } from "lucide-react";
import React, { memo, useState, useRef, useEffect, useCallback } from "react";

function AgentCitationsHoverCard({ agentData = {} }) {
  const {
    citationAgentName,
    citationAgentGoal,
    citationAgentInitialText,
    team = [],
    citationIdx,
  } = agentData;

  const [isHovering, setIsHovering] = useState(false);
  const hoverCardRef = useRef(null);
  const hoverTimerRef = useRef(null);

  const displayName = citationAgentName || `Agent ${citationIdx || ""}`;

  // Helper to truncate text with ellipsis
  const truncate = (text, maxLength = 80) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  };

  // Handle mouse events with debounce to prevent flickering
  const handleMouseEnter = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsHovering(true);
    }, 50);
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsHovering(false);
    }, 100);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Handle clicks outside to close the hover card
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        hoverCardRef.current &&
        !hoverCardRef.current.contains(event.target)
      ) {
        setIsHovering(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <span className="relative inline-block ml-1 mr-1 mt-2" ref={hoverCardRef}>
      {/* Trigger superscript or inline badge */}
      <span
        className="cursor-pointer bg-g1 hover:bg-g2 text-white text-sm leading-none px-[15px] py-[6px] rounded-full font-medium flex gap-2 items-center"
        tabIndex={0}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Briefcase className="w-3 h-3" />
        {"Agent " + displayName}
      </span>

      {/* Hover card content */}
      <div
        className={`absolute z-30 transition-all duration-300 ease-out bg-g2 text-white p-4 rounded-2xl shadow-xl w-96 mt-2 origin-top-left ${isHovering ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        {/* Title */}
        <div className="border-b border-slate-700 pb-2 flex items-center gap-2 mb-2">
          <Briefcase className="w-5 h-5 text-gray-400" />
          <span className="font-semibold text-sm">
            {"Agent " + displayName}
          </span>
        </div>

        {/* Goal */}
        {citationAgentGoal && (
          <div className="text-xs mb-2 text-gray-200 leading-snug">
            <div className="flex gap-1 items-center">
              <Target className="w-4 h-4 inline mr-1 text-gray-400" />
              <span className="">Goal:</span>
            </div>
            <span title={citationAgentGoal} className="font-semibold text-xs">
              {truncate(citationAgentGoal, 120)}
            </span>
          </div>
        )}

        {/* Initial Thought */}
        {citationAgentInitialText && (
          <p className="text-xs mb-2 text-gray-300 leading-snug line-clamp-3  opacity-60">
            <span title={citationAgentInitialText}>
              {truncate(citationAgentInitialText, 80).replaceAll(",,", "")}
            </span>
          </p>
        )}

        {/* Team */}
        {team.length > 0 && (
          <p className="text-xs text-gray-300 leading-snug">
            <span className="font-semibold">Team:</span> {team.join(", ")}
          </p>
        )}
      </div>
    </span>
  );
}

export default memo(AgentCitationsHoverCard);
