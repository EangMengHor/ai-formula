import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import ExecutionTimeline from "./ExecutionTimeline";
import { Mermaid } from "../../../../../components/custom/Mermaid";
import ChatSimulation from "../../../../../components/custom/AiInteraction/ChatSimulation";
import { StreamingResponse } from "./StreamingRendered";
import LoadingAnimation from "@/components/custom/Loading";
// ...import other needed components (e.g. PollStatus)...
import PollStatus from "../../../../../components/custom/PolledStatus";
import { RotateCcw } from "lucide-react";

function Conversation({
    conversation,
    isNextChatLoading,
    isShowInteractionLogs,
    chatContainerRef,
    bottomRef,
    scrollTimeoutRef,
    sidebarStack,
    id,
    handleBlockSidebar,
    renderMermaidChart,
    currentLoadingMessage,
    interactionLogs,
    isChanged
}) {
    console.log(conversation, "interactionLogs");
    return (
        <div style={{
            backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('./Frame2.png')",
            backgroundSize: "cover",
            backgroundPosition: "center"
        }} className={`flex-1 overflow-y-auto font-figtree p-4 space-y-2 w-full ${sidebarStack.length > 0 ? "max-w-2xl" : "max-w-4xl"} mx-auto`}>
            {conversation.map((item, index) => {
                if (item.role === "human") {
                    return (
                        <div className="flex flex-col items-end w-full justify-end">
                            <div
                                ref={index === conversation.length - 1 ? chatContainerRef : null}
                                className="bg-gradient-to-r from-slate-700 to-slate-800 max-w-[80%] border-2 border-slate-800 px-3 py-4 rounded-lg shadow break-words whitespace-pre-wrap"
                            >
                                {item.message
                                    ? item.message.replaceAll("Provided Document : No document provided", "")
                                    : "{Message Not found}"}

                            </div>
                            {
                                item.isRetry && (
                                    <div className="flex gap-1 items-center text-slate-500">
                                        <RotateCcw className="w-4 h-4  " />
                                        <p>Retried</p>
                                    </div>
                                )
                            }
                        </div>

                    );
                } else if (item.type === "deepThink") {
                    return (
                        <div
                            key={`ai-deep-${index}`}
                            className="text-slate-300 rounded shadow space-y-4"
                        >
                            {
                                item?.steps && item.steps.length > 0 && (
                                    <ExecutionTimeline
                                        steps={item.steps || []}
                                        isComplete={item.isComplete}
                                        isLoading={item.isLoading}
                                        newStepIndex={item.steps && item.steps.length > 0 ? item.steps.length - 1 : null}
                                    />
                                )
                            }

                            {item.markdownBuffer && (
                                <div className="final-response p-4 border border-gray-800 rounded-lg bg-gray-900 shadow-lg w-full items-center">
                                    <h2 className="text-xl font-bold mb-4 flex items-center">
                                        Final Response
                                        {item.isStreaming && (
                                            <span className="ml-2 inline-flex">
                                                <span className="h-2 w-2 bg-purple-600 rounded-full animate-pulse mx-0.5"></span>
                                                <span className="h-2 w-2 bg-purple-600 rounded-full animate-pulse mx-0.5" style={{ animationDelay: "0.2s" }}></span>
                                                <span className="h-2 w-2 bg-purple-600 rounded-full animate-pulse mx-0.5" style={{ animationDelay: "0.4s" }}></span>
                                            </span>
                                        )}
                                    </h2>
                                    <div className="text-stream flex w-full items-center justify-center">
                                        <div className="prose prose-invert max-w-3xl">
                                            <StreamingResponse content={item.markdownBuffer} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {Array.isArray(item.message) &&
                                item.message.map((block, blockIdx) => {
                                    if (block.type === "simulation") {
                                        return (
                                            <ChatSimulation
                                                key={`simulation-${blockIdx}`}
                                                personas={block.items}
                                                isLoading={false}
                                            />
                                        );
                                    }
                                    else if (block.type === "text") {
                                        return (
                                            <div key={`text-${blockIdx}`}>
                                                <ReactMarkdown
                                                    className="module font-figtree"
                                                    children={block.content.replace('undefined', '')}
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                    components={{
                                                        table: ({ children }) => (
                                                            <table>
                                                                {children}
                                                            </table>
                                                        ),
                                                        th: ({ children }) => (
                                                            <th>
                                                                {children}
                                                            </th>
                                                        ),
                                                        td: ({ children }) => (
                                                            <td>
                                                                {children}
                                                            </td>
                                                        )
                                                    }}
                                                />
                                            </div>
                                        );
                                    } else if (block.type === "mermaid") {
                                        const sanitizedContent = renderMermaidChart(block.content);
                                        return (
                                            <div key={`mermaid-${blockIdx}`} className="overflow-auto flex items-center justify-center">
                                                <Mermaid chart={sanitizedContent} />
                                            </div>
                                        );
                                    } else if (block.type === "document") {
                                        return (
                                            <div
                                                onClick={() =>
                                                    handleBlockSidebar(block.content, block.type, block.name)
                                                }
                                                key={`doc-${blockIdx}`}
                                                className={`border-2 border-slate-800 bg-slate-900 flex justify-between items-center gap-2 relative rounded-lg p-1 ${block.isComplete
                                                    ? "cursor-pointer hover:bg-slate-800 text-white flex"
                                                    : ""
                                                    }`}
                                            >
                                                <div
                                                    className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col"
                                                    style={{ maxWidth: "80%" }}
                                                >
                                                    {block.name || "Document"}
                                                    <p className="text-slate-600 text-sm">Document (Click)</p>
                                                </div>
                                                <div className="flex-shrink-0 px-3 py-2">
                                                    <img src="/docx.svg" className="opacity-70 w-h-14 h-14 -rotate-6" />
                                                </div>
                                            </div>
                                        );
                                    } else if (block.type === "visual") {
                                        const sanitizedMermaid = block.isComplete
                                            ? renderMermaidChart(block.content)
                                            : "";
                                        return (
                                            <div
                                                onClick={() =>
                                                    handleBlockSidebar(sanitizedMermaid, block.type, block.name)
                                                }
                                                key={`doc-${blockIdx}`}
                                                className={`border-2 border-slate-800 bg-slate-900 flex justify-between items-center gap-2 relative rounded-lg p-1 ${block.isComplete
                                                    ? "cursor-pointer hover:bg-slate-800 text-white flex"
                                                    : ""
                                                    }`}
                                            >
                                                <div
                                                    className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col"
                                                    style={{ maxWidth: "80%" }}
                                                >
                                                    {block.name || "Document"}
                                                    <p className="text-slate-600 text-sm">Visualization (Click)</p>
                                                </div>
                                                <div className="flex-shrink-0 px-3 py-2">
                                                    <img src="/h.svg" className="opacity-70 w-h-14 h-14 -rotate-6" />
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                        </div>
                    );
                } else {
                    // For other AI responses
                    return (
                        <div
                            key={`ai-${index}`}
                            className="text-slate-300 rounded shadow space-y-4"
                            ref={index === conversation.length - 1 ? chatContainerRef : null}
                        >
                            {item.workflow && item.workflow.length > 0 && (
                                <PollStatus
                                    workflow={item.workflow}
                                    updated={item.updated || []}
                                    isActive={isChanged}
                                    isOpen={true}
                                    sessionId={id}
                                    isCompleted={item?.message}
                                />
                            )}
                            {Array.isArray(item.message) &&
                                item.message.map((block, blockIdx) => {
                                    if (block.type === "text") {
                                        return (
                                            <div key={`text-${blockIdx}`}>
                                                <ReactMarkdown
                                                    className="module"
                                                    children={block.content.replace('undefined', '')}
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                    components={{
                                                        table: ({ children }) => (
                                                            <table
                                                                style={{
                                                                    borderCollapse: "collapse",
                                                                    width: "100%",
                                                                    borderRadius: "8px",
                                                                    overflow: "hidden",
                                                                    color: "#e0e0e0",
                                                                    margin: "1rem 0"
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
                                                                    backgroundColor: "transparent",
                                                                    textAlign: "left"
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
                                                                    color: "#e0e0e0"
                                                                }}
                                                            >
                                                                {children}
                                                            </td>
                                                        )
                                                    }}
                                                />
                                            </div>
                                        );
                                    } else if (block.type === "mermaid") {
                                        const sanitizedContent = renderMermaidChart(block.content);
                                        return (
                                            <div key={`mermaid-${blockIdx}`} className="overflow-auto flex items-center justify-center">
                                                <Mermaid chart={sanitizedContent} />
                                            </div>
                                        );
                                    } else if (block.type === "simulation") {
                                        return (
                                            <ChatSimulation
                                                key={`simulation-${blockIdx}`}
                                                personas={block.items}
                                                isLoading={conversation.length === index + 1 && isNextChatLoading}
                                            />
                                        );
                                    } else if (block.type === "document") {
                                        return (
                                            <div
                                                onClick={() =>
                                                    handleBlockSidebar(block.content, block.type, block.name)
                                                }
                                                key={`doc-${blockIdx}`}
                                                className={`border-2 border-slate-800 bg-slate-900 flex justify-between items-center gap-2 relative rounded-lg p-1 ${block.isComplete
                                                    ? "cursor-pointer hover:bg-slate-800 text-white flex"
                                                    : ""
                                                    }`}
                                            >
                                                <div
                                                    className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col"
                                                    style={{ maxWidth: "80%" }}
                                                >
                                                    {block.name || "Document"}
                                                    <p className="text-slate-600 text-sm">Document (Click)</p>
                                                </div>
                                                <div className="flex-shrink-0 px-3 py-2">
                                                    <img src="/docx.svg" className="opacity-70 w-h-14 h-14 -rotate-6" />
                                                </div>
                                            </div>
                                        );
                                    } else if (block.type === "visual") {
                                        const sanitizedMermaid = block.isComplete
                                            ? renderMermaidChart(block.content)
                                            : "";
                                        return (
                                            <div
                                                onClick={() =>
                                                    handleBlockSidebar(sanitizedMermaid, block.type, block.name)
                                                }
                                                key={`doc-${blockIdx}`}
                                                className={`border-2 border-slate-800 bg-slate-900 flex justify-between items-center gap-2 relative rounded-lg p-1 ${block.isComplete
                                                    ? "cursor-pointer hover:bg-slate-800 text-white flex"
                                                    : ""
                                                    }`}
                                            >
                                                <div
                                                    className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col"
                                                    style={{ maxWidth: "80%" }}
                                                >
                                                    {block.name || "Document"}
                                                    <p className="text-slate-600 text-sm">Visualization (Click)</p>
                                                </div>
                                                <div className="flex-shrink-0 px-3 py-2">
                                                    <img src="/h.svg" className="opacity-70 w-h-14 h-14 -rotate-6" />
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                        </div>
                    );
                }
            })}
            {isNextChatLoading && (
                <div className="flex mb-[60%] items-center space-x-2 text-blue-400">
                    <LoadingAnimation currentQuote={currentLoadingMessage} />
                </div>
            )}

            <div ref={scrollTimeoutRef} className="h-1 w-full" />
            <div ref={bottomRef} className="h-1 w-full" />
        </div>
    );
}

export default memo(Conversation);
