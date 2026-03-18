import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { streamDecisionAgent } from "@/services/mppt/mppt.api";
import {
    Send,
    LoaderCircle,
    Brain,
    AlertCircle,
    ArrowLeft,
    Copy,
    Check,
} from "lucide-react";
import MarkdownRenderer from "../_private/components/sidebarProvided/components/AnimatedMarkdown";

const getUserId = () => localStorage.getItem("id");

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };
    return (
        <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Copy"
        >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
        </button>
    );
}

function MessageBubble({ message }) {
    if (message.role === "user") {
        return (
            <div className="flex justify-end">
                <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 p-3 max-w-[80%] rounded-2xl">
                    <p className="text-white whitespace-pre-wrap">{message.content}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-start">
            <div className="w-full group">
                {message.isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <LoaderCircle className="w-4 h-4 animate-spin text-blue-400" />
                        <span className="animate-pulse">{message.loadingMessage || "Initializing decision agent..."}</span>
                    </div>
                ) : message.isError ? (
                    <div className="flex items-center gap-2 text-sm text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>{message.content}</span>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="text-gray-200">
                            <MarkdownRenderer content={message.content || ""} />
                        </div>
                        {message.content && (
                            <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={message.content} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DecisionAgent() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [messages, setMessages] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const minH = 56;
        const maxH = 140;
        el.style.height = `${Math.max(minH, Math.min(el.scrollHeight, maxH))}px`;
        el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
    }, [prompt]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = async () => {
        const trimmed = prompt.trim();
        if (!trimmed || isStreaming) return;

        const userId = getUserId();
        if (!userId) {
            toast({ title: "Not authenticated", description: "User ID not found", variant: "destructive" });
            return;
        }

        // Build chatMemory from previous messages
        const chatMemory = messages
            .filter((m) => !m.isLoading && !m.isError)
            .map((m) => ({ role: m.role, content: m.content }));

        // Add user message and placeholder assistant message
        setMessages((prev) => [
            ...prev,
            { role: "user", content: trimmed },
            { role: "assistant", content: "", isLoading: true, loadingMessage: "Initializing decision agent..." },
        ]);
        setPrompt("");
        setIsStreaming(true);

        let buffer = "";
        const decoder = new TextDecoder();

        try {
            const response = await streamDecisionAgent({ prompt: trimmed, chatMemory, userId });

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const reader = response.body.getReader();

            const handleEvents = ({ type, ...data }) => {
                if (type === "loading") {
                    setMessages((prev) => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last.role === "assistant") {
                            updated[updated.length - 1] = {
                                ...last,
                                isLoading: true,
                                loadingMessage: data.message || "Processing...",
                            };
                        }
                        return updated;
                    });
                } else if (type === "chunk") {
                    const token = data.token || "";
                    setMessages((prev) => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last.role === "assistant") {
                            updated[updated.length - 1] = {
                                ...last,
                                content: (last.content || "") + token,
                                isLoading: false,
                            };
                        }
                        return updated;
                    });
                } else if (type === "done") {
                    setMessages((prev) => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last.role === "assistant") {
                            updated[updated.length - 1] = {
                                ...last,
                                isLoading: false,
                            };
                        }
                        return updated;
                    });
                    setIsStreaming(false);
                }
            };

            const processStream = async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split("\n\n");
                    buffer = parts.pop();

                    for (const part of parts) {
                        if (!part.trim()) continue;

                        const lines = part.split("\n");
                        let eventType = "message";
                        let dataStr = "";

                        for (const line of lines) {
                            if (line.startsWith("event:")) {
                                eventType = line.replace("event:", "").trim();
                            } else if (line.startsWith("data:")) {
                                dataStr += line.replace("data:", "").trim();
                            }
                        }

                        let parsedData = {};
                        try {
                            parsedData = JSON.parse(dataStr);
                        } catch {
                            parsedData = { content: dataStr };
                        }

                        handleEvents({ type: eventType, ...parsedData });
                    }
                }
                // Stream ended — make sure loading is cleared
                setIsStreaming(false);
                setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last.role === "assistant" && last.isLoading) {
                        updated[updated.length - 1] = { ...last, isLoading: false };
                    }
                    return updated;
                });
            };

            await processStream();
        } catch (error) {
            console.error("Decision agent error:", error);
            setIsStreaming(false);
            setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                    updated[updated.length - 1] = {
                        role: "assistant",
                        content: "An error occurred. Please try again.",
                        isError: true,
                    };
                }
                return updated;
            });
            toast({ title: "Error", description: error.message || "Failed to connect to decision agent", variant: "destructive" });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey && !isStreaming) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/mppt/dashboard")}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <Brain className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">Decision Agent</p>
                        <p className="text-xs text-gray-400">Ask questions about your MPPT decisions</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                            <Brain className="w-7 h-7 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium mb-1">Decision Agent</p>
                            <p className="text-gray-400 text-sm max-w-sm">
                                Ask me about your past MPPT decisions, investment insights, or strategy questions.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                            {[
                                "What decisions were made about Tesla stock?",
                                "Summarize my investment decisions from this week",
                                "What are the key risk factors from my recent analyses?",
                                "Which decisions had high confidence ratings?",
                            ].map((example, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setPrompt(example)}
                                    className="bg-g1 hover:bg-g2 text-gray-300 text-xs px-3 py-2 rounded-xl text-left transition-all"
                                >
                                    {example}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((message, idx) => (
                    <MessageBubble key={idx} message={message} />
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 pt-2">
                <div className={`bg-gradient-to-t from-g1 to-g2 rounded-3xl transition-all ${isStreaming ? "opacity-70" : ""}`}>
                    <div className="px-4 pt-3 pb-2">
                        <textarea
                            ref={textareaRef}
                            className="bg-transparent outline-none border-none w-full text-white resize-none leading-relaxed placeholder:text-gray-400"
                            placeholder={isStreaming ? "Responding..." : "Ask about your decisions..."}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isStreaming}
                            rows={2}
                        />
                        <div className="flex items-center justify-end mt-2 pt-1 border-t border-white/10">
                            <button
                                className={`p-2 rounded-lg transition-all ${
                                    prompt.trim() && !isStreaming
                                        ? "bg-white hover:bg-gray-100 text-black"
                                        : "bg-white/20 text-gray-500 cursor-not-allowed"
                                }`}
                                disabled={!prompt.trim() || isStreaming}
                                onClick={handleSubmit}
                            >
                                {isStreaming ? (
                                    <LoaderCircle className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
