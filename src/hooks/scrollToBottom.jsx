"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollToBottom(containerRef, options = {}) {
  const { threshold = 200, scrollBehavior = "smooth" } = options;
  const [showScrollButton, setShowScrollButton] = useState(false);
  const endRef = useRef(null);

  // Check if user is near bottom
  const checkIfNearBottom = () => {
    if (!containerRef.current) return false;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    const isNearBottom = distanceFromBottom <= threshold;
    setShowScrollButton(!isNearBottom);
    return isNearBottom;
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: scrollBehavior });
    }
  };
  
  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Debounce function to improve performance
    let timeoutId;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkIfNearBottom, 100);
    };

    container.addEventListener("scroll", handleScroll);

    // Initial check
    checkIfNearBottom();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [containerRef, threshold]);

  return {
    showScrollButton,
    scrollToBottom,
    endRef,
    isNearBottom: !showScrollButton,
    checkIfNearBottom,
  };
}
