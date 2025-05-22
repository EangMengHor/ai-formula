"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Search,
  Database,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "./ExecutionTimeline.css";
import "katex/dist/katex.min.css";
// Process thinking text to separate multiple thinking steps
const processThinkingSteps = (text) => {
  if (!text) return [];
  // Split by periods that are followed by a space or end of string
  return text.split(/\.(?=\s|$)/).filter((step) => step.trim().length > 0);
};

// Truncate text with read more functionality
const TruncatedText = ({ text, maxLength = 150 }) => {
  const [expanded, setExpanded] = useState(false);

  // If text is not a string (e.g., it's a React element), render it directly
  if (typeof text !== "string") {
    return <div>{text}</div>;
  }

  // For strings, apply the truncation logic
  if (text.length <= maxLength) return <div>{text}</div>;

  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        className="module"
        components={{
          p: ({ children }) => <p>{children}</p>,
          table: ({ children }) => (
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                color: "#e0e0e0",
              }}
            >
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th
              style={{
                border: "1px solid #444",
                padding: "8px",
                backgroundColor: "#333",
                color: "#e0e0e0",
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                border: "1px solid #444",
                padding: "8px",
                backgroundColor: "#222",
                color: "#e0e0e0",
              }}
            >
              {children}
            </td>
          ),
        }}
      >
        {expanded ? text : `${text.substring(0, maxLength)}...`}
      </ReactMarkdown>
      <button
        onClick={() => setExpanded(!expanded)}
        className="ml-1 text-slate-400 hover:text-slate-300 text-sm font-medium"
      >
        {expanded ? "Read less" : "Read more"}
      </button>
    </div>
  );
};

// Search result component with favicon and metadata
const SearchResult = ({ url, delay } = {}) => {
  console.log(url, "urls");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.2 + 0.3 }}
      className="border border-slate-700 rounded-lg p-3 bg-slate-900 hover:bg-slate-800 transition-colors"
    >
      {url && typeof url == "object" && Object.keys(url) > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="h-4 w-4 rounded-full bg-slate-700 mr-2 animate-pulse" />
            <div className="h-4 bg-slate-700 w-3/4 rounded animate-pulse" />
          </div>
          <div className="h-3 bg-slate-700 w-full rounded animate-pulse" />
          <div className="h-3 bg-slate-700 w-5/6 rounded animate-pulse" />
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center">
            {url?.favicon ? (
              <div className="h-4 w-4 mr-2 relative">
                <img
                  src={url.favicon}
                  alt=""
                  width={16}
                  height={16}
                  className="rounded-sm"
                  onError={(e) => e.target.parentNode.remove()}
                />
              </div>
            ) : null}
            <div className="text-sm font-bold text-white truncate">
              {url?.title}
            </div>
          </div>
          <div className="text-xs text-slate-400 line-clamp-2">
            {url?.description}
          </div>
          <a
            href={`${url.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            <span className="truncate max-w-[180px]">{url.url}</span>
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      )}
    </motion.div>
  );
};

// Search results dialog component
const SearchResultsDialog = ({ isOpen, onClose, urls }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0a0c14] rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#0a0c14] z-10 py-2">
          <h3 className="text-lg font-semibold text-white">
            All Internet Search Results
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {urls.map((url, index) => (
            <SearchResult key={index} url={url} delay={index % 4} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// Simulate typing effect for the latest step
const TypeWriter = ({ text, isCoT = false }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 5); // Typing speed

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <div className="mb-2 ">
      {isCoT
        ? displayText.split(".").map((line, index) => (
            <div key={index} className="mb-2">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                className="module bolder"
                components={{
                  p: ({ children }) => (
                    <p className="text-purple-50">{children}</p>
                  ),
                  table: ({ children }) => (
                    <table
                      style={{
                        borderCollapse: "collapse",
                        width: "100%",
                        color: "#e0e0e0",
                      }}
                    >
                      {children}
                    </table>
                  ),
                  th: ({ children }) => (
                    <th
                      style={{
                        border: "1px solid #444",
                        padding: "8px",
                        backgroundColor: "#333",
                        color: "#e0e0e0",
                      }}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td
                      style={{
                        border: "1px solid #444",
                        padding: "8px",
                        backgroundColor: "#222",
                        color: "#e0e0e0",
                      }}
                    >
                      {children}
                    </td>
                  ),

                  b: ({ children }) => (
                    <b className="text-purple-500">{children}</b>
                  ),
                  strong: ({ children }) => (
                    <b className="text-purple-500">{children}</b>
                  ),
                }}
              >
                {line}
              </ReactMarkdown>
            </div>
          ))
        : displayText}
    </div>
  );
};

// Thinking steps component with animation
const ThinkingSteps = ({ text, isLatest }) => {
  const steps = processThinkingSteps(text);
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new steps are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [steps]);

  return (
    <div ref={containerRef} className="overflow-y-auto pr-2">
      {steps.map((step, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="mb-2 border-l-2 pl-2  border-slate-700"
        >
          <div className="text-slate-300 italic">
            {isLatest && idx === steps.length - 1 ? (
              <TypeWriter text={step.trim()} isCoT={true} />
            ) : (
              step
                .trim()
                .split(".")
                .map((line, index) => (
                  <div key={index} className="mb-2">
                    {line.trim()}
                  </div>
                ))
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Knowledge base item with animation
const KnowledgeBaseItem = ({ item, index, isLatest }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="border border-slate-800 rounded-lg p-3 bg-slate-900"
    >
      <div className="text-sm font-bold mb-1 text-white">{item.name}</div>
      <div className="text-xs text-slate-400">
        <TruncatedText
          text={isLatest ? <TypeWriter text={item.text} /> : item.text}
          maxLength={120}
        />
      </div>
    </motion.div>
  );
};

// Knowledge base skeleton loader
const KnowledgeBaseSkeleton = () => {
  return (
    <div className="border border-slate-800 rounded-lg p-3 bg-slate-900">
      <div className="h-4 bg-slate-800 w-1/2 rounded mb-2 animate-pulse"></div>
      <div className="space-y-1">
        <div className="h-3 bg-slate-800 w-full rounded animate-pulse"></div>
        <div className="h-3 bg-slate-800 w-5/6 rounded animate-pulse"></div>
        <div className="h-3 bg-slate-800 w-4/5 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

// Search results skeleton loader
const SearchResultsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border border-slate-700 rounded-lg p-3 bg-slate-900"
        >
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-slate-700 mr-2 animate-pulse" />
              <div className="h-4 bg-slate-700 w-3/4 rounded animate-pulse" />
            </div>
            <div className="h-3 bg-slate-700 w-full rounded animate-pulse" />
            <div className="h-3 bg-slate-700 w-5/6 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Internet Search Results component with "View All" functionality
const InternetSearchResults = ({ urls, isLatest, isLoading }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasMoreThanThree = urls && urls.length > 3;

  // Only show first 3 results initially
  const visibleUrls = urls ? urls.slice(0, 3) : [];

  if (isLoading) {
    return <SearchResultsSkeleton />;
  }

  return (
    <>
      <div className="relative">
        {hasMoreThanThree && (
          <button
            onClick={() => setDialogOpen(true)}
            className="absolute -top-8 right-0 flex items-center text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            <span>View all {urls.length} sources</span>
            <Plus className="h-3 w-3 ml-1" />
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {visibleUrls.map((url, searchIndex) => (
            <SearchResult key={searchIndex} url={url} delay={searchIndex} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {dialogOpen && (
          <SearchResultsDialog
            isOpen={dialogOpen}
            onClose={() => setDialogOpen(false)}
            urls={urls}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Step component that handles different step types
const Step = ({ step, isLast, isLatest, isNew }) => {
  // Get edge style based on step type
  const getEdgeStyle = (type) => {
    if (type === "stepAgent") {
      return "border-l-[4px] border-dashed border-slate-700"; // Dotted gray for executing
    } else if (type === "reEvaluating") {
      return "border-l-[4px] border-dashed border-purple-700"; // Dotted purple for re-evaluating
    } else {
      return "border-l-[4px] border-slate-700"; // Solid for others (defineGoal, thinking)
    }
  };

  const edgeStyle = getEdgeStyle(step.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative pl-16 ${isNew ? "highlight-new" : ""}`}
    >
      {/* Timeline node */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="absolute left-0 top-1.5"
      >
        <div
          className={`h-6 w-6 rounded-full flex items-center justify-center ${
            step.type === "finish" ? "bg-purple-700" : "bg-slate-800"
          }`}
        >
          {step.type === "finish" && (
            <CheckCircle className="h-3 w-3 text-white" />
          )}
        </div>
      </motion.div>

      {/* Edge line to next node - only if not the last item */}
      {!isLast && (
        <div
          className={`absolute left-3 top-7 bottom-0 mt-1  w-[2px] ${edgeStyle}`}
          style={{
            height: "calc(100% + 10px)",
            transform: "translateX(-50%)",
          }}
        ></div>
      )}

      {/* Content */}
      <div>
        {step.type === "defineGoal" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-4"
          >
            <h3 className="text-lg font-semibold mb-2 text-white">
              Defining End Goal
            </h3>
            <div className="text-slate-300 mb-2 bolder">
              <TruncatedText
                text={
                  isLatest ? (
                    <TypeWriter text={step.text || ""} />
                  ) : (
                    step.text || ""
                  )
                }
                maxLength={80}
              />
            </div>
            {step.estimatedSteps && step.estimatedTime && (
              <div className="text-sm text-slate-400">
                <div>estimated steps: {step.estimatedSteps}</div>
                <div>estimated time: {step.estimatedTime} Minutes</div>
              </div>
            )}
          </motion.div>
        )}

        {step.type === "thinking" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-4"
          >
            <h3 className="text-lg font-semibold mb-2 text-white">
              Thinking...
            </h3>
            <ThinkingSteps text={step.text || ""} isLatest={isLatest} />
          </motion.div>
        )}

        {step.type === "stepAgent" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-4"
          >
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-semibold text-white">Executing</h3>
            </div>

            {step.goal && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-slate-900 rounded-lg p-4 mb-4 border border-slate-800"
              >
                <div className="text-sm text-slate-400 mb-1">Goal</div>
                <div className="text-slate-300">
                  <TruncatedText
                    text={
                      isLatest ? (
                        <TypeWriter text={step.goal} isCoT={true} />
                      ) : (
                        step.goal
                      )
                    }
                    maxLength={100}
                  />
                </div>
              </motion.div>
            )}

            {(step.knowledgeBase || step.isLoadingKnowledge) && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="mb-4"
              >
                <div className="flex items-center text-sm text-slate-400 mb-2">
                  <Database className="h-3 w-3 mr-1" />
                  <span>Knowledge base</span>
                </div>

                <div className="space-y-2">
                  {step.isLoadingKnowledge ? (
                    <KnowledgeBaseSkeleton />
                  ) : (
                    step.knowledgeBase &&
                    step.knowledgeBase.map((item, kbIndex) => (
                      <KnowledgeBaseItem
                        key={kbIndex}
                        item={item}
                        index={kbIndex}
                        isLatest={isLatest}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {(step.search || step.isLoadingSearch) && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <div className="flex items-center text-sm text-slate-400 mb-2">
                  <Search className="h-3 w-3 mr-1" />
                  <span>Internet Search</span>
                </div>

                <InternetSearchResults
                  urls={step.search}
                  isLatest={isLatest}
                  isLoading={step.isLoadingSearch}
                />
              </motion.div>
            )}
          </motion.div>
        )}

        {step.type === "reEvaluating" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-4"
          >
            <h3 className="text-lg font-semibold mb-2 text-white">
              Re-evaluating
            </h3>
            <div className="text-slate-300 italic">
              {isLatest ? (
                <TypeWriter text={step.text || ""} />
              ) : (
                step.text || ""
              )}
            </div>
          </motion.div>
        )}

        {step.type === "finish" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-4"
          >
            <h3 className="text-lg font-semibold text-purple-400">
              Writing Response...
            </h3>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Main ExecutionTimeline component that accepts steps and state as props
export default function ExecutionTimeline({
  steps = [],
  isComplete = false,
  isLoading = false,
  newStepIndex = null,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const timelineRef = useRef(null);
  const stepRefs = useRef({});

  // Auto-collapse after 2 seconds when writing response starts
  useEffect(() => {
    if (isComplete) {
      const timeout = setTimeout(() => {
        setCollapsed(true);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [isComplete]);

  // Auto-scroll to center the new step when it's added
  useEffect(() => {
    if (newStepIndex !== null && stepRefs.current[newStepIndex]) {
      // Scroll the new step into view with smooth behavior and center it
      stepRefs.current[newStepIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [newStepIndex, steps.length]);

  // Store refs for each step
  const setStepRef = (index) => (el) => {
    if (el) {
      stepRefs.current[index] = el;
    }
  };

  return (
    <div className="flex justify-center items-center bg-black border border-slate-700 rounded-lg">
      <div className="w-full bg-[#0a0c14] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">AI Execution</h2>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div
                ref={timelineRef}
                className="relative p-6 max-h-[80vh] overflow-y-auto"
              >
                <div className="space-y-10">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      ref={setStepRef(index)}
                      className={`${index === newStepIndex ? "highlight-new" : ""}`}
                    >
                      <Step
                        step={step}
                        isLast={index === steps.length - 1}
                        isLatest={index === steps.length - 1}
                        isNew={index === newStepIndex}
                      />
                    </div>
                  ))}
                </div>

                {/* Add padding at the bottom to ensure new content is visible */}
                <div className="h-20"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="p-4 flex items-center text-purple-400"
          >
            <div className="h-6 w-6 rounded-full bg-purple-700 flex items-center justify-center mr-2">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
            <span>AI execution completed.</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ChevronUp icon component
function ChevronUp(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}
