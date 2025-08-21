import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import { Pre } from "@/components/custom/CodeBlock";

export default function MarkdownRenderer({ content }) {
  return (
    <div className="prose prose-invert max-w-none">
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
          pre: ({ children }) => <Pre children={children} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
