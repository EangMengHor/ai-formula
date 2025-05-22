import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";

export default function AnimatedMarkdown({ finalResponse }) {
  const [visibleText, setVisibleText] = useState("");
  const [bufferedText, setBufferedText] = useState("");

  useEffect(() => {
    if (!finalResponse) return;

    let index = visibleText.length; // Start from the current length of visibleText
    const interval = setInterval(() => {
      if (index < finalResponse.length) {
        setVisibleText((prev) => prev + finalResponse[index]); // Append the next character
        index++;
      } else {
        clearInterval(interval);
      }
    }, 20); // Adjust the speed of the animation here

    return () => clearInterval(interval);
  }, [finalResponse, visibleText]);

  // Buffer the content to ensure valid Markdown syntax
  useEffect(() => {
    const timeout = setTimeout(() => {
      setBufferedText(visibleText); // Update the buffered text after a short delay
    }, 100); // Adjust the delay to control buffering

    return () => clearTimeout(timeout);
  }, [visibleText]);

  return (
    <div className="text-stream">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
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
          {bufferedText}
        </ReactMarkdown>
      </motion.div>
    </div>
  );
}
