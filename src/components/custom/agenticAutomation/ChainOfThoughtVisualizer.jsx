"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Workflow,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ParseMd from "../ParseMd";

export default function ChainOfThoughtVisualizer({ data }) {
  const [activeView, setActiveView] = useState("workflow"); // Default to workflow view
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedItems, setExpandedItems] = useState([]);
  const contentRef = useRef(null);
  const singleViewRef = useRef(null);
  const expandRefs = useRef([]);

  // Initialize refs array for expand animations
  useEffect(() => {
    expandRefs.current = Array(data.length)
      .fill()
      .map(() => React.createRef());
  }, [data.length]);

  // Parse the content if it's a string
  const parseContent = (content) => {
    try {
      if (typeof content === "string") {
        // Try to parse JSON content if it's a string
        const parsedContent = JSON.parse(content);
        if (
          Array.isArray(parsedContent) &&
          parsedContent.length > 0 &&
          parsedContent[0].output
        ) {
          return parsedContent[0].output;
        }
      }
      return content;
    } catch (e) {
      return content;
    }
  };

  const toggleExpand = (index) => {
    if (expandedItems.includes(index)) {
      setExpandedItems(expandedItems.filter((i) => i !== index));
    } else {
      setExpandedItems([...expandedItems, index]);
    }
  };

  const goToNext = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex((prevIndex) => {
        // Add animation class
        if (singleViewRef.current) {
          singleViewRef.current.classList.add("animate-slide-left");
          setTimeout(() => {
            singleViewRef.current.classList.remove("animate-slide-left");
          }, 300);
        }
        return prevIndex + 1;
      });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => {
        // Add animation class
        if (singleViewRef.current) {
          singleViewRef.current.classList.add("animate-slide-right");
          setTimeout(() => {
            singleViewRef.current.classList.remove("animate-slide-right");
          }, 300);
        }
        return prevIndex - 1;
      });
    }
  };

  const truncateContent = (content, isExpanded) => {
    const parsedContent = parseContent(content);
    if (!parsedContent) return "";

    if (isExpanded) return parsedContent;

    // Show approximately 30% of the content
    const contentLength = parsedContent.length;
    const visibleLength = Math.floor(contentLength * 0.3);
    return parsedContent.substring(0, visibleLength) + "...";
  };

  // Scroll to top when changing steps in single view
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentIndex]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-800 text-slate-100 p-4">
      {/* View toggle switch with educational note */}
      <div className="mb-6">
        <div className="flex justify-center mb-2">
          <div className="bg-slate-900 p-1 rounded-full flex items-center">
            <button
              onClick={() => setActiveView("workflow")}
              className={`flex items-center px-3 py-1.5 rounded-full transition-all ${activeView === "workflow"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <Workflow className="h-4 w-4 mr-2" />
              Workflow View
            </button>
            <button
              onClick={() => setActiveView("single")}
              className={`flex items-center px-3 py-1.5 rounded-full transition-all ${activeView === "single"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <Eye className="h-4 w-4 mr-2" />
              Single View
            </button>
          </div>
        </div>
        <p className="text-center text-sm text-slate-400 max-w-md mx-auto">
          Both views represent the same chain of thought content, but in
          different formats for different analysis needs.
        </p>
      </div>

      {activeView === "single" ? (
        <div className="relative">
          {/* Single view content with animation */}
          <div
            ref={singleViewRef}
            className="transition-all duration-300 ease-in-out max-w-3xl mx-auto"
          >
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-700 text-white font-bold mr-4">
                {currentIndex + 1}
              </div>
              <h2 className="text-xl font-bold">
                {data[currentIndex].cotGoal}
              </h2>
            </div>

            <div
              ref={contentRef}
              className="bg-slate-900 rounded-lg p-6 max-h-[70vh] overflow-y-auto"
            >
              <div className="whitespace-pre-wrap">
                {parseContent(data[currentIndex].content)}
              </div>
            </div>

            <div className="mt-4 text-center text-slate-400">
              Step {currentIndex + 1} of {data.length}
            </div>
            {/* Fixed navigation buttons */}
            <div className="flex w-full items-center justify-center space-x-4 z-10 mt-6">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="p-3 rounded-full bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:bg-slate-600 transition-colors"
                aria-label="Previous step"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex === data.length - 1}
                className="p-3 rounded-full bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:bg-slate-600 transition-colors"
                aria-label="Next step"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="workflow-container relative max-w-6xl mx-auto overflow-y-auto">
          {/* Workflow view with connected circles */}
          <div className="workflow-steps">
            {data.map((item, index) => (
              <div key={index} className="workflow-step relative mb-10">
                <div className="flex">
                  {/* Circle with step number */}
                  <div className="step-circle-container relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-700 text-white font-bold z-10 relative">
                      {index + 1}
                    </div>

                    {/* Connecting line to next step */}
                    {index < data.length - 1 && (
                      <div className="absolute top-10 left-1/2 w-0.5 h-[calc(100%+1.5rem)] bg-slate-600 -z-0 transform -translate-x-1/2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-bold mb-2">{item.cotGoal}</h3>

                    <div
                      ref={(el) => (expandRefs.current[index] = el)}
                      className={`relative bg-slate-900 p-4 rounded-lg transition-all duration-300 ease-in-out ${expandedItems.includes(index)
                          ? "h-fit"
                          : "max-h-32 overflow-hidden"
                        }`}
                    >
                      <div className="whitespace-pre-wrap text-sm ">
                        <ParseMd text={item.content} />
                      </div>

                      {!expandedItems.includes(index) && (
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-800/90 to-transparent"></div>
                      )}

                      <button
                        onClick={() => toggleExpand(index)}
                        className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                        aria-label={
                          expandedItems.includes(index)
                            ? "Show less"
                            : "Show more"
                        }
                      >
                        {expandedItems.includes(index) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
