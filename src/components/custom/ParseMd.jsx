import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";

export default function ParseMd({ text }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]} // Added remarkGfm for table support
            rehypePlugins={[rehypeKatex]}
            className="module flex flex-col gap-2 text-slate-400 p-2 rounded-md "
            components={{
                // Handle potential rendering issues
                p: ({ children }) => <p>{children}</p>,
                table: ({ children }) => (
                    <table style={{ borderCollapse: "collapse", width: "100%", color: "#e0e0e0" }}>
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
            {`${text}`}
        </ReactMarkdown>
    )
}