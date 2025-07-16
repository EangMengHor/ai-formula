import { useState, useEffect, useRef } from "react";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

export default function UserMessage({ content = "", isRetried = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const contentRef = useRef(null);
  const COLLAPSED_HEIGHT = 300;

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setIsOverflowing(el.scrollHeight > COLLAPSED_HEIGHT);
    }
  }, [content]);

  return (
    <div className="flex flex-col items-end w-full justify-end space-y-1">
      <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 max-w-[80%] px-4 py-3 rounded-2xl shadow transition-all duration-300">
        {content ? (
          <div className="relative">
            <div
              ref={contentRef}
              className={`whitespace-pre-wrap break-words transition-all duration-300 ${
                !isExpanded && isOverflowing
                  ? "max-h-[300px] overflow-hidden"
                  : ""
              }`}
              style={{
                WebkitMaskImage:
                  !isExpanded && isOverflowing
                    ? "linear-gradient(to bottom, black 85%, transparent 100%)"
                    : "none",
                maskImage:
                  !isExpanded && isOverflowing
                    ? "linear-gradient(to bottom, black 85%, transparent 100%)"
                    : "none",
              }}
            >
              {content}
            </div>

            {isOverflowing && (
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="mt-2 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white transition"
              >
                {isExpanded ? (
                  <>
                    Collapse <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Expand Prompt <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <p className="text-slate-400 italic">Message not found</p>
        )}
      </div>

      {isRetried && (
        <div className="flex items-center gap-1 text-sm text-slate-500 animate-pulse">
          <RotateCcw className="w-4 h-4" />
          <span>Retried</span>
        </div>
      )}
    </div>
  );
}
