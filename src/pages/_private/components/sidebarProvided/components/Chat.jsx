import { useEffect, useState, useRef, useCallback } from "react";
import { useToast } from "../../../../../hooks/use-toast";
import { chat } from "../../../../../services/n8n-apis/_core/chat.api";
import { useParams } from "react-router-dom";
import { parseContent } from "../../../../../lib/utils";
import ChatInput from "../../../../../components/custom/ChatInput";
import 'katex/dist/katex.min.css';
import LatexParser from "@/components/custom/LatexParser";
import { getConversationHistory } from "@/services/n8n-apis/_core/getConversationHistory.api";
import { LoaderCircle } from "lucide-react";
import '../../../../_private/components/sidebarProvided/components/Chat.css';
import { getUploadedDocumentHistory } from "../../../../../services/n8n-apis/_core/getUploadedDocumentHis.api";
import { useFilesUploadMetadata } from "../../../../../context/FilesUploadMetadata";
import PollStatus from "../../../../../components/custom/PolledStatus";
import { pollStatus } from "../../../../../services/n8n-apis/_core/pollStatus.api";
import { useUser } from "../../../../../context/UserContext";
import { pollChatOutput } from "../../../../../services/n8n-apis/_core/pollChatOutput.api";
import PersonaOp from "../../../../../components/custom/AiInteraction/PersonaOp";
import ChatSimulation from "../../../../../components/custom/AiInteraction/ChatSimulation";
import polling from "../../../../../lib/polling";
import { pollInteractionLogs } from "../../../../../services/n8n-apis/_core/pollInteractionLogs.api";
import { useStackSidebar } from "../../../../../context/StackSidebarContext";
import { io } from "socket.io-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Mermaid } from "../../../../../components/custom/Mermaid";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import LoadingAnimation from "@/components/custom/Loading";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { downloadDocument } from "@/lib/downloadModule";

// Import the components needed for deep thinking mode
import ExecutionTimeline from "./ExecutionTimeline";
import { StreamingResponse } from "./StreamingRendered";

const fileType = [
    'pdf', 'docx', 'csv'
]

export default function Chat() {
    const socket = useRef(null); // Use useRef for socket
    console.log(socket, 'socket')

    // Context
    const { id } = useParams();
    const { toast } = useToast();
    const { setFileCount, setMemorizedFiles, isMemorizationLoading, setIsMemorizationLoading, fileName, setFileName, files, setFiles, resetAllStates } = useFilesUploadMetadata();
    const { isDocumentOn, setIsDocumentOn, isSearchOn, setIsSearchOn, isVectorBaseOn, setIsVectorBaseOn, isSuperiorPersonaAttached, setIsSuperiorPersonaAttached, selectedSuperiorPersona, setSelectedSuperiorPersona, currActiveIntraction, setCurrActiveIntraction, isDeepThinkMode } = useUser();
    const { sidebarStack, setSidebarStack } = useStackSidebar();

    // Local state
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [fallBackPrompt, setFallBackPrompt] = useState("");
    const [conversation, setConversation] = useState([]);
    const [isNextChatLoading, setIsNextChatLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [isChanged, setIsChanged] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [chatIdentifer, setChatIdentifer] = useState(null);
    const [interactionLogs, setInteractionLogs] = useState([]);
    const [isShowInteractionLogs, setIsShowInteractionLogs] = useState(false);
    const [streamingResponse, setStreamingResponse] = useState("");
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState("");
    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState("");
    const [dialogType, setDialogType] = useState("visual");
    const [dialogTitle, setDialogTitle] = useState("");

    // Refs
    const bottomRef = useRef(null);
    const chatContainerRef = useRef(null);
    const latestUpdatedStatus = useRef([]);
    const dataFetchedRef = useRef(false);
    const pollChatOutputRef = useRef(null);
    const pollChatStatusRef = useRef(null);
    const pollInteractionLogsRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const streamTimeoutRef = useRef(null); // For deep thinking streaming timeout
    const currentStepRef = useRef(null); // For tracking current step in deep thinking

    // Effect: Load fallback prompt from localStorage
    useEffect(() => {
        async function getPurpose() {
            const localItem = localStorage.getItem('prompt');
            if (localItem) {
                setFallBackPrompt(localItem);
                setIsNextChatLoading(true);
            } else {
                setIsChatLoading(true);
            }
        }
        getPurpose();
    }, [id]);

    // Effect: Remove fallback prompt from localStorage
    useEffect(() => {
        if (localStorage.getItem('prompt')) {
            localStorage.removeItem('prompt');
        } else {
            setIsChatLoading(true);
        }
    }, [id]);

    // Effect: Handle fallback prompt submission
    useEffect(() => {
        if (fallBackPrompt.length > 0) {
            handleSubmit(fallBackPrompt);
        }
    }, [fallBackPrompt]);

    // fn : this function takes the document content and add that into the stack sidebar
    function handleBlockSidebar(block, type, header = "") {
        setSidebarStack(() => {
            return [

                {
                    header: header,
                    component: (
                        <div className="">
                            <div className="flex items-center justify-between p-4 gap-2 border-b-2 border-slate-600 sticky top-0 bg-slate-800 z-40">
                                <p
                                    className="text-slate-200 font-bold text-lg truncate overflow-hidden whitespace-nowrap"
                                    style={{ maxWidth: '80%' }}
                                    title={header ? header : "ARX Blocks"}
                                >
                                    {header ? (header.length > 55 ? header.slice(0, 55) + '...' : header) : " ARX Blocks"}
                                </p>
                                {/* download */}
                                {
                                    type == "document" &&

                                    <DropdownMenu>
                                        <DropdownMenuTrigger>

                                            <Button className="md:mr-16">
                                                Download
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            className="bg-slate-700 text-white"

                                        >
                                            {
                                                fileType.map(item => {
                                                    return <div
                                                        onClick={() => downloadDocument({
                                                            content: block,
                                                            type: item,
                                                            elementId: type === 'pdf' ? 'markdown-preview' : null
                                                        })}
                                                        className="hover:bg-slate-800 p-1 rounded-md cursor-pointer focus:outline-none"
                                                        type={item} >
                                                        {item.toUpperCase()}
                                                    </div>
                                                })
                                            }

                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                }
                            </div>
                            <div className="p-4">
                                {
                                    type == "document" && <ReactMarkdown
                                        remarkPlugins={[remarkMath, remarkGfm]}
                                        rehypePlugins={[rehypeKatex]}
                                        className="module overflow-scroll"
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
                                        {block}
                                    </ReactMarkdown>
                                }

                                {
                                    type == "visual" &&
                                    <Mermaid
                                        className="module overflow-scroll"
                                        chart={renderMermaidChart(block)}
                                        theme="dark"
                                        style={{ width: "100%", height: "100%" }}
                                    />

                                }

                            </div>
                        </div>
                    ),
                },
            ];
        })


    }


    // Effect: Fetch conversation and document history
    useEffect(() => {
        async function fetchConversations() {
            try {
                const res = await getConversationHistory(id);
                if (res.success) {
                    const processedData = res.data.map((item) => {
                        if (item.role === "human") {
                            return item;
                        } else {
                            const parsedResponse = parseHistoryAIContent(item.message);
                            return {
                                role: "ai",
                                message: parsedResponse
                            };
                        }
                    });
                    setConversation(processedData);
                    setIsNextChatLoading(false);

                }
            } catch (error) {
                toast({
                    title: 'Error',
                    description: error.message,
                    variant: "destructive"
                });
            } finally {
                // Make sure loading is turned off regardless of outcome
                setIsChatLoading(false);
                setIsNextChatLoading(false);
            }
        }

        async function getUploadedDocumentHis() {
            try {
                const res = await getUploadedDocumentHistory(id);
                if (!res.isEmpty && Array.isArray(res.data)) {
                    const fileNames = [...new Set(res.data[0].fileName || [])];
                    setFileCount(fileNames.length);
                    setFileName(fileNames);
                    setFiles(fileNames.map(item => {
                        const splited = item.split('.') || [];
                        return {
                            name: item,
                            type: item.split('.')[splited.length - 1]
                        };
                    }) || []);
                    setMemorizedFiles(fileNames);
                }
            } catch (error) {
                console.error(error);
            }
        }

        async function getData() {
            resetAllStates();
            await Promise.all([
                getUploadedDocumentHis(),
                fetchConversations()
            ]);
            setIsNextChatLoading(false);

        }

        if (isChatLoading) {
            getData();
        }
    }, [isChatLoading, id, toast]);

    // Effect: Log conversation and chat identifier
    useEffect(() => {
        console.log(chatIdentifer, conversation, 'conversation ksdkfl2389040');
    }, [conversation, chatIdentifer]);

    // Effect: Start polling interaction logs
    useEffect(() => {
        if (chatIdentifer && isSuperiorPersonaAttached) {
            console.log("interaction polling started lsdfs9820923");
            setIsShowInteractionLogs(true);
            startPollingInteractionLogs();
        }
    }, [chatIdentifer, isSuperiorPersonaAttached]);

    // Effect: Clear polling on component unmount
    useEffect(() => {
        return () => {
            clearPolling();
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
            }
        }
    }, []);

    // Monitor streaming status for deep thinking and finalize after inactivity
    useEffect(() => {
        // Find the latest deep thinking conversation item that is streaming
        const deepThinkingItem = conversation.find(item =>
            item.role === "ai" &&
            item.type === "deepThink" &&
            item.isStreaming
        );

        if (deepThinkingItem) {
            // Reset any existing timeout
            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
            }

            // Set new timeout to detect end of streaming
            streamTimeoutRef.current = setTimeout(() => {
                setConversation(prevConversation => {
                    return prevConversation.map(item => {
                        if (item.role === "ai" && item.type === "deepThink" && item.isStreaming) {
                            return { ...item, isStreaming: false };
                        }
                        return item;
                    });
                });
                console.log("Stream completed due to inactivity");
            }, 60000); // 60 seconds of inactivity means streaming is done
        }

        return () => {
            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
            }
        }
    }, [conversation]);

    // Socket Connection and Event Handling
    useEffect(() => {
        socket.current = io(import.meta.env.VITE_SOCKET_URL);

        socket.current.on("connect", () => {
            console.log("Connected to socket server:", socket.current.id);
        });

        socket.current.on("disconnect", () => {
            console.log("Disconnected from socket server");
        });

        socket.current.on("event", (event) => {
            handleSocketEvent(event);
        });

        socket.current.on("error", (error) => {
            console.error("Socket error:", error);
        });

        return () => {
            socket.current?.disconnect();
        };
    }, []);

    // Updated smoothScrollToBottom
    const smoothScrollToBottom = useCallback(() => {
        // Get the scrollable container (parent of bottomRef)
        const container = bottomRef.current?.parentElement;
        if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            // Only auto scroll if the user is within 100px of the bottom
            if (scrollHeight - scrollTop - clientHeight < 100) {
                bottomRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            }
        } else {
            bottomRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            });
        }
    }, []);
    // Handle socket events (streaming messages) - improved with consistent finalResponse handling
    // Handle socket events (streaming messages) - unified parsing approach
    const handleSocketEvent = (event) => {
        console.log("Received event:", event);

        // Find the last message in the conversation to update it
        setConversation(prevConversation => {
            // Clone the conversation array
            const newConversation = [...prevConversation];

            // Get the index of the last AI message in the conversation
            const lastAIMessageIndex = newConversation.length - 1;

            // If no AI message found, return unchanged conversation
            if (lastAIMessageIndex === -1) {
                console.log(prevConversation, "47824923849823749")
                return prevConversation;
            }

            const aiMessage = newConversation[lastAIMessageIndex];

            // Handle finalResponse event consistently for all message types
            if (event.type === "finalResponse" && event.content) {
                // Common processing for both quick and deepThink modes
                const contentToAdd = event.content || "";

                // Track raw accumulated content in a temporary buffer
                const accumulatedContent = (aiMessage.tempContent || "") + contentToAdd;
                aiMessage.tempContent = accumulatedContent;

                // Update the streaming status
                aiMessage.isStreaming = true;

                // Parse content using the same parser
                const parsedContent = processStreamingContent(accumulatedContent);

                // For quick responses: update message directly
                if (aiMessage.type === "quick") {
                    aiMessage.message = parsedContent;
                }

                // For deepThink: parse for markdown display
                else if (aiMessage.type === "deepThink") {
                    aiMessage.message = parseHistoryAIContent(accumulatedContent);
                }

                // Make sure loading state is active
                setIsNextChatLoading(true);
            }
            // Handle finish event consistently
            else if (event.type === "finish") {
                console.log("Received finish event - completing response");

                // Final parsing of content
                const finalContent = aiMessage.tempContent || "";
                const parsedFinalContent = processStreamingContent(finalContent, true);

                // Update both quick and deepThink messages with common approach
                if (aiMessage.type === "quick") {
                    aiMessage.message = parsedFinalContent;
                } else if (aiMessage.type === "deepThink") {
                    // Add a finish step if needed
                    if (aiMessage.steps) {
                        const finishStep = { type: "finish" };
                        aiMessage.steps = [...aiMessage.steps, finishStep];
                    }

                    // Use the same parsing approach for the final markdown
                    aiMessage.message = parseHistoryAIContent(finalContent);
                }

                // Mark as complete for all message types
                aiMessage.isComplete = true;
                aiMessage.isStreaming = false;

                // Turn off loading state
                setIsNextChatLoading(false);

                // Remove temporary content buffer
                delete aiMessage.tempContent;
            }
            // Type-specific event handlers for deepThink mode
            else if (aiMessage.type === "deepThink") {
                // Handle different deep think event types
                if (event.type === "defineGoal") {
                    // Create a new goal step
                    const newStep = { type: "defineGoal", text: "" };
                    aiMessage.steps = [...(aiMessage.steps || []), newStep];
                    currentStepRef.current = newStep;
                }
                else if (event.type === "thinking") {
                    // Create a new thinking step
                    const newStep = { type: "thinking", text: "" };
                    aiMessage.steps = [...(aiMessage.steps || []), newStep];
                    currentStepRef.current = newStep;
                }
                else if (event.type === "stepAgent") {
                    // Create a new step agent execution step
                    const newStep = {
                        type: "stepAgent",
                        goal: "",
                        isLoadingKnowledge: false,
                        isLoadingSearch: false
                    };
                    aiMessage.steps = [...(aiMessage.steps || []), newStep];
                    currentStepRef.current = newStep;
                }
                else if (event.type === "stepAgentGoal") {
                    // Update the current stepAgent's goal
                    if (aiMessage.steps && aiMessage.steps.length > 0) {
                        const lastStep = aiMessage.steps[aiMessage.steps.length - 1];
                        if (lastStep.type === "stepAgent") {
                            lastStep.goal = (lastStep.goal && lastStep.goal !== undefined)
                                ? (lastStep.goal + event.content || "")
                                : (event.content || "");
                            currentStepRef.current = lastStep;
                        }
                    }
                }
                else if (event.type === "knowledge") {
                    // This is a sub-event of stepAgent, mark it as loading knowledge
                    if (aiMessage.steps && aiMessage.steps.length > 0) {
                        const lastStep = aiMessage.steps[aiMessage.steps.length - 1];
                        if (lastStep && lastStep.type === "stepAgent") {
                            lastStep.isLoadingKnowledge = true;
                            currentStepRef.current = lastStep;
                        }
                    }
                }
                else if (event.type === "search") {
                    // This is a sub-event of stepAgent, mark it as loading search results
                    if (aiMessage.steps && aiMessage.steps.length > 0) {
                        const lastStep = aiMessage.steps[aiMessage.steps.length - 1];
                        if (lastStep && lastStep.type === "stepAgent") {
                            lastStep.isLoadingSearch = true;
                            currentStepRef.current = lastStep;
                        }
                    }
                }
                else if (event.type === "reEvaluating") {
                    // Create a new re-evaluating step
                    const newStep = { type: "reEvaluating", text: "" };
                    aiMessage.steps = [...(aiMessage.steps || []), newStep];
                    currentStepRef.current = newStep;
                }
                else if (event.content && aiMessage.steps && aiMessage.steps.length > 0) {
                    // Add content to the appropriate step
                    const lastStep = aiMessage.steps[aiMessage.steps.length - 1];

                    if (lastStep) {
                        if (event.type === "stepAgentGoal" && lastStep.type === "stepAgent") {
                            // Append to the goal if it's a stepAgentGoal event
                            lastStep.goal = (lastStep.goal || "") + event.content;
                        } else {
                            // Otherwise append to text as before
                            lastStep.text = (lastStep.text || "") + event.content;
                        }
                    }
                }
                else if (event.estimatedSteps && event.estimatedTime && aiMessage.steps && aiMessage.steps.length > 0) {
                    // Add estimated steps and time to the goal step
                    const lastStep = aiMessage.steps[aiMessage.steps.length - 1];
                    if (lastStep && lastStep.type === "defineGoal") {
                        lastStep.estimatedSteps = event.estimatedSteps;
                        lastStep.estimatedTime = event.estimatedTime;
                    }
                }
                else if (event.items && aiMessage.steps && aiMessage.steps.length > 0) {
                    // Handle knowledge base items
                    const lastStep = aiMessage.steps[aiMessage.steps.length - 1];
                    if (lastStep && lastStep.type === "stepAgent") {
                        lastStep.knowledgeBase = lastStep.knowledgeBase
                            ? [...lastStep.knowledgeBase, ...event.items]
                            : event.items;
                        lastStep.isLoadingKnowledge = false;
                    }
                }
                else if (event.urls && aiMessage.steps && aiMessage.steps.length > 0) {
                    // Handle search URLs
                    const lastStep = aiMessage.steps[aiMessage.steps.length - 1];
                    if (lastStep && lastStep.type === "stepAgent") {
                        lastStep.search = event.urls;
                        lastStep.isLoadingSearch = false;
                    }
                }
            }

            // Return the updated conversation
            return newConversation;
        });

        // Scroll to see new content
        smoothScrollToBottom();
    };
    // Process streaming content into blocks - completely rewritten for robustness
    const processStreamingContent = (content, forceComplete = false) => {
        if (!content) return [];

        console.log("Processing content:", content.substring(0, 100) + "...");

        try {
            // First try the standard parser from utils for complete blocks
            if (forceComplete) {
                try {
                    const parsedContent = parseContent(content);
                    console.log("Standard parser result:", parsedContent);
                    if (Array.isArray(parsedContent) && parsedContent.length > 0) {
                        return parsedContent.map(block => ({
                            ...block,
                            isComplete: true
                        }));
                    }
                } catch (e) {
                    console.warn("Standard parser failed:", e);
                    // Continue with custom parsing
                }
            }

            // Custom block extraction with more robust patterns
            const result = [];
            let remainingText = content;

            // Match patterns for document and visual blocks with more flexible whitespace handling
            const documentPattern = /<document>([\s\S]*?)<\/document>/g;
            const visualPattern = /<visual>([\s\S]*?)<\/visual>/g;
            const mermaidPattern = /```mermaid([\s\S]*?)```/g;

            // Step 1: Extract all special blocks with their positions
            const blocks = [];

            // Find document blocks
            let match;
            while ((match = documentPattern.exec(content)) !== null) {
                const fullBlock = match[0];
                const blockContent = match[1];
                const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(blockContent);

                let name = nameMatch ? nameMatch[1].trim() : "Document";
                let cleanContent = blockContent;

                if (nameMatch) {
                    cleanContent = blockContent.replace(nameMatch[0], '').trim();
                }

                blocks.push({
                    type: 'document',
                    name,
                    content: cleanContent,
                    isComplete: forceComplete || (cleanContent.length > 0),
                    start: match.index,
                    end: match.index + fullBlock.length
                });
            }

            // Find visual blocks
            while ((match = visualPattern.exec(content)) !== null) {
                const fullBlock = match[0];
                const blockContent = match[1];
                const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(blockContent);

                let name = nameMatch ? nameMatch[1].trim() : "Visualization";
                let cleanContent = blockContent;

                if (nameMatch) {
                    cleanContent = blockContent.replace(nameMatch[0], '').trim();
                }

                blocks.push({
                    type: 'visual',
                    name,
                    content: cleanContent,
                    isComplete: forceComplete || (cleanContent.length > 0),
                    start: match.index,
                    end: match.index + fullBlock.length
                });
            }

            // Find mermaid blocks
            while ((match = mermaidPattern.exec(content)) !== null) {
                blocks.push({
                    type: 'mermaid',
                    content: match[1].trim(),
                    isComplete: true,
                    start: match.index,
                    end: match.index + match[0].length
                });
            }

            // Sort blocks by their position
            blocks.sort((a, b) => a.start - b.start);

            // Step 2: Extract text between blocks
            let lastIndex = 0;

            for (const block of blocks) {
                // Add text before the current block
                if (block.start > lastIndex) {
                    const textContent = content.substring(lastIndex, block.start).trim();
                    if (textContent) {
                        result.push({
                            type: 'text',
                            content: textContent,
                            isComplete: true
                        });
                    }
                }

                // Add the block itself (without position info)
                const { start, end, ...cleanBlock } = block;
                result.push(cleanBlock);

                lastIndex = block.end;
            }

            // Add any remaining text after the last block
            if (lastIndex < content.length) {
                const remainingContent = content.substring(lastIndex).trim();
                if (remainingContent) {
                    result.push({
                        type: 'text',
                        content: remainingContent,
                        isComplete: true
                    });
                }
            }

            // If nothing was found, return the full content as text
            if (result.length === 0 && content.trim()) {
                result.push({
                    type: 'text',
                    content: content.trim(),
                    isComplete: true
                });
            }

            console.log("Final parsed blocks:", result);
            return result;
        } catch (error) {
            console.error("Error in processStreamingContent:", error);
            // Ultimate fallback - just return as plain text
            return [{
                type: 'text',
                content: content || "",
                isComplete: true
            }];
        }
    };

    // Function to ensure history content is properly parsed and all blocks are marked complete
    const parseHistoryAIContent = (content) => {
        if (!content) return [];

        console.log("Parsing history content");

        try {
            // First try to parse with standard parser
            try {
                const parsedResult = parseContent(content);
                if (Array.isArray(parsedResult) && parsedResult.length > 0) {
                    // Force all blocks to be marked as complete
                    return parsedResult.map(block => ({
                        ...block,
                        isComplete: true
                    }));
                }
            } catch (e) {
                console.warn("Standard parsing failed for history:", e);
            }

            // Fallback to our custom parser with forceComplete=true
            return processStreamingContent(content, true);
        } catch (error) {
            console.error("All parsing methods failed for history:", error);
            return [{
                type: 'text',
                content: content || "",
                isComplete: true
            }];
        }
    };

    // Improved Mermaid chart renderer with proper error handling and sanitization
    const renderMermaidChart = (content) => {
        if (!content || typeof content !== 'string') {
            console.error("Invalid mermaid content:", content);
            return "graph TD\nA[Error] --> B[Invalid diagram content]";
        }

        try {
            // Basic sanitization for common issues
            let sanitizedContent = content.trim();

            // Make sure content doesn't have HTML tags that might interfere
            sanitizedContent = sanitizedContent.replace(/<\/?[^>]+(>|$)/g, "");

            // Check if content starts with a valid diagram type
            const validTypes = [
                'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
                'stateDiagram', 'erDiagram', 'gantt', 'pie'
            ];

            const hasValidStart = validTypes.some(type =>
                sanitizedContent.startsWith(type)
            );

            if (!hasValidStart) {
                console.log("Adding graph TD prefix to mermaid content");
                sanitizedContent = `graph TD\n${sanitizedContent}`;
            }

            // Fix brackets issue - replace special characters in labels
            sanitizedContent = sanitizedContent.replace(/\[([^\]]+)\]/g, (match, p1) => {
                return `[${p1.replace(/[^a-zA-Z0-9 _-]/g, ' ')}]`;
            });

            return sanitizedContent;
        } catch (error) {
            console.error("Error sanitizing Mermaid content:", error);
            return "graph TD\nA[Error] --> B[Diagram processing failed]";
        }
    };

    // Function: Handle prompt submission
    const handleSubmit = useCallback(async (prompt) => {
        if (prompt.length === 0) {
            return;
        }

        // Set loading state
        setIsNextChatLoading(true);
        const prevPrompt = prompt;

        try {
            setPrompt("");

            // Add human message to conversation
            setConversation(prev => [...prev, {
                message: prompt,
                role: "human"
            }]);

            // Reset streaming response
            setStreamingResponse("");

            // Add AI message placeholder based on mode
            if (isDeepThinkMode) {
                // Add a placeholder for deep thinking response
                setConversation(prev => [...prev, {
                    role: "ai",
                    type: "deepThink",
                    steps: [], // Will hold the execution steps
                    markdownBuffer: "", // Will hold the final markdown response
                    isComplete: false,
                    isStreaming: false,
                    isLoading: true
                }]);
            } else {
                // Add a placeholder for quick response
                setConversation(prev => [...prev, {
                    role: "ai",
                    type: "quick",
                    message: [],
                    streamingContent: "",
                    isComplete: false,
                    isLoading: true
                }]);
            }

            // Send message to the server with appropriate mode
            socket.current.emit("chat", {
                prompt,
                sessionId: id,
                mode: isDeepThinkMode ? "deep" : "quick",
                isSwarm: false,
                swarmIds: [],
                isAutoSwarm: false,
            });

            // Scroll to bottom
            setTimeout(() => {
                smoothScrollToBottom();
            }, 100);

        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: "destructive"
            });
            setPrompt(prevPrompt);
            setIsNextChatLoading(false);
        }
    }, [id, toast, isDeepThinkMode]);

    // Function: Poll chat output (keeping for compatibility)
    async function _pollChatOutput(id) {
        return await pollChatOutput(id);
    }

    // Function: Start polling chat output
    const startPollingChatOutput = (chatId) => {
        if (pollChatOutputRef.current && pollChatOutputRef.current.hasOwnProperty("stopPolling")) return;
        startPollingStatus();

        pollChatOutputRef.current = polling(async () => {
            const pollResult = await _pollChatOutput(chatId);
            if (pollResult && pollResult.success && pollResult.data.length > 0 && !dataFetchedRef.current) {
                const parsedResponse = parseContent(pollResult.data);
                setConversation((prev) => [...prev, { message: parsedResponse, role: "ai", workflow: compileWorkflow(isDocumentOn, isSearchOn, isVectorBaseOn), updated: latestUpdatedStatus.current }]);
                dataFetchedRef.current = true;
                setIsNextChatLoading(false);
                clearPolling();
            }
        }, 10000, 2)();
    };

    // Function: Start polling chat status
    const startPollingStatus = () => {
        if (pollChatStatusRef.current && pollChatStatusRef.current.hasOwnProperty("stopPolling")) return;

        pollChatStatusRef.current = polling(async () => {
            const data = await pollStatus(id);
            if (latestUpdatedStatus.current.length < data.data.length) {
                latestUpdatedStatus.current = data.data;
            };
            setIsChanged(prev => !prev);
        }, 2000, 2)();
    };

    // Function: Start polling interaction logs
    const startPollingInteractionLogs = () => {
        if (pollInteractionLogsRef.current && pollInteractionLogsRef.current.hasOwnProperty("stopPolling")) return;
        if (!chatIdentifer) return;

        pollInteractionLogsRef.current = polling(async () => {
            const data = await pollInteractionLogs(chatIdentifer);
            if (data.data.length > 0) {
                const processedData = data.data.map(item => parseContent(item.output));
                const setterData = processedData.map(data => data?.[0]?.items[0] || {});
                if (interactionLogs.length !== setterData.length) setInteractionLogs(setterData);
            }
        }, 8000, 2)();
    };

    // Function: Clear polling
    function clearPolling() {
        pollChatOutputRef.current?.stopPolling();
        pollInteractionLogsRef.current?.stopPolling();
        pollChatStatusRef.current?.stopPolling();
        pollChatOutputRef.current = null;
        pollInteractionLogsRef.current = null;
        pollChatStatusRef.current = null;
        latestUpdatedStatus.current = [];
        setIsShowInteractionLogs(false);
        setChatIdentifer(null);
        setInteractionLogs([]);
    }

    // Function: Open dialog for document/visual content
    const openDialog = (type, content, title) => {
        setDialogType(type);
        setDialogContent(content);
        setDialogTitle(title);
        setDialogOpen(true);
    };

    if (isChatLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center gap-2">
                <LoaderCircle className="animate-spin" />
                <p>Loading Chats</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            <div className={`flex-1 overflow-y-auto p-4 space-y-2 w-full ${sidebarStack.length > 0 ? "max-w-2xl" : "max-w-4xl"} mx-auto`}>
                {conversation.map((item, index) => {
                    if (item.role === "human") {
                        return (
                            <div className="w-full flex justify-end">
                                <div
                                    ref={index === conversation.length - 1 ? chatContainerRef : null}
                                    key={`human-${index}`}
                                    className="bg-gradient-to-r from-slate-700 to-slate-800 max-w-[80%] border-2 border-slate-800 px-3 py-4 rounded-lg shadow"
                                >
                                    {item.message ? item.message.replaceAll('Provided Document : No document provided', '') : "{Message Not found}"}
                                </div>
                            </div>
                        );
                    } else if (item.type === "deepThink") {
                        // Render deep thinking response with ExecutionTimeline
                        return (
                            <div
                                ref={index === conversation.length - 1 ? chatContainerRef : null}
                                key={`ai-deep-${index}`}
                                className="text-slate-300 rounded shadow space-y-4"
                            >
                                {/* Render the execution timeline */}
                                <ExecutionTimeline
                                    steps={item.steps || []}
                                    isComplete={item.isComplete}
                                    isLoading={item.isLoading}
                                    newStepIndex={(item.steps?.length || 0) > 0 ? item.steps.length - 1 : null}
                                />

                                {/* Render the final response area if there's content */}
                                {item.markdownBuffer && (
                                    <div className="final-response p-4 border border-gray-800 rounded-lg bg-gray-900 shadow-lg w-full items-center">
                                        <h2 className="text-xl font-bold mb-4 flex items-center">
                                            Final Response
                                            {item.isStreaming && (
                                                <span className="ml-2 inline-flex">
                                                    <span className="h-2 w-2 bg-purple-600 rounded-full animate-pulse mx-0.5"></span>
                                                    <span className="h-2 w-2 bg-purple-600 rounded-full animate-pulse mx-0.5" style={{ animationDelay: '0.2s' }}></span>
                                                    <span className="h-2 w-2 bg-purple-600 rounded-full animate-pulse mx-0.5" style={{ animationDelay: '0.4s' }}></span>
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

                                {Array.isArray(item.message) ? item.message.map((block, blockIdx) => {
                                    if (block.type === "text") {
                                        return (
                                            <div key={`text-${blockIdx}`} >

                                                <ReactMarkdown
                                                    className="module"
                                                    // Provide the markdown content
                                                    children={block.content}

                                                    // Enable GitHub-flavored markdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}

                                                    // Enable KaTeX for math expressions
                                                    rehypePlugins={[rehypeKatex]}

                                                    components={{
                                                        // Customized paragraph styling for improved 
                                                        // Table with a dark slate background, rounded corners, and professional borders
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
                                                        // Table header cells with a slightly darker color for distinction
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
                                                        // Table data cells matching the dark theme while providing clear borders
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
                                                        ),

                                                    }}
                                                />
                                            </div>
                                        );
                                    } else if (block.type === "mermaid") {
                                        const sanitizedContent = renderMermaidChart(block.content);
                                        console.log("Rendering mermaid:", sanitizedContent.substring(0, 50) + "...");

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
                                                isLoading={conversation.length === (index + 1) && isNextChatLoading}
                                            />
                                        );
                                    } else if (block.type === "document") {
                                        console.log("Rendering document block:", block.name, block.isComplete);

                                        return (
                                            <div
                                                onClick={() => {
                                                    handleBlockSidebar(block.content, block.type, block.name)
                                                }}
                                                key={`doc-${blockIdx}`}
                                                className={`border-2 border-slate-800 bg-slate-900 flex justify-between items-center gap-2 relative rounded-lg p-1 ${block.isComplete ? "cursor-pointer hover:bg-slate-800 text-white flex " : ""}`}
                                            >
                                                <div
                                                    className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col "
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
                                        console.log("Rendering visual block:", block.name, block.isComplete);
                                        const sanitizedMermaid = block.isComplete ? renderMermaidChart(block.content) : '';

                                        return (
                                            <div
                                                onClick={() => {
                                                    handleBlockSidebar(sanitizedMermaid, block.type, block.name)
                                                }}
                                                key={`doc-${blockIdx}`}
                                                className={`border-2 border-slate-800 bg-slate-900 flex justify-between items-center gap-2 relative rounded-lg p-1 ${block.isComplete ? "cursor-pointer hover:bg-slate-800 text-white flex " : ""}`}
                                            >
                                                <div
                                                    className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col "
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
                                }) : (
                                    <div className="text-gray-400 italic">No content available</div>
                                )}
                            </div>
                        );
                    } else {
                        return (
                            <div
                                ref={index === conversation.length - 1 ? chatContainerRef : null}
                                key={`ai-${index}`}
                                className="text-slate-300 rounded shadow space-y-4"
                            >
                                {item.workflow && item.workflow.length > 0 ? (
                                    <PollStatus
                                        workflow={item.workflow}
                                        updated={item.updated || []}
                                        isActive={isChanged}
                                        isOpen={true}
                                        sessionId={id}
                                        isCompleted={item?.message}
                                    />
                                ) : null}

                                {Array.isArray(item.message) ? item.message.map((block, blockIdx) => {
                                    if (block.type === "text") {
                                        return (
                                            <div key={`text-${blockIdx}`} >

                                                <ReactMarkdown
                                                    className="module"
                                                    // Provide the markdown content
                                                    children={block.content}

                                                    // Enable GitHub-flavored markdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}

                                                    // Enable KaTeX for math expressions
                                                    rehypePlugins={[rehypeKatex]}

                                                    components={{
                                                        // Customized paragraph styling for improved 
                                                        // Table with a dark slate background, rounded corners, and professional borders
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
                                                        // Table header cells with a slightly darker color for distinction
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
                                                        // Table data cells matching the dark theme while providing clear borders
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
                                                        ),

                                                    }}
                                                />
                                            </div>
                                        );
                                    } else if (block.type === "mermaid") {
                                        const sanitizedContent = renderMermaidChart(block.content);
                                        console.log("Rendering mermaid:", sanitizedContent.substring(0, 50) + "...");

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
                                                isLoading={conversation.length === (index + 1) && isNextChatLoading}
                                            />
                                        );
                                    } else if (block.type === "document") {
                                        console.log("Rendering document block:", block.name, block.isComplete);

                                        return (
                                            <div
                                                onClick={() => {
                                                    handleBlockSidebar(block.content, block.type, block.name)
                                                }}
                                                key={`doc-${blockIdx}`}
                                                className={`border-2 border-slate-800 bg-slate-900 flex justify-between items-center gap-2 relative rounded-lg p-1 ${block.isComplete ? "cursor-pointer hover:bg-slate-800 text-white flex " : ""}`}
                                            >
                                                <div
                                                    className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col "
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
                                        console.log("Rendering visual block:", block.name, block.isComplete);
                                        const sanitizedMermaid = block.isComplete ? renderMermaidChart(block.content) : '';

                                        return (
                                            <div
                                                onClick={() => {
                                                    handleBlockSidebar(sanitizedMermaid, block.type, block.name)
                                                }}
                                                key={`doc-${blockIdx}`}
                                                className={`border-2 border-slate-800 bg-slate-900 flex justify-between items-center gap-2 relative rounded-lg p-1 ${block.isComplete ? "cursor-pointer hover:bg-slate-800 text-white flex " : ""}`}
                                            >
                                                <div
                                                    className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col "
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
                                }) : (
                                    <div className="text-gray-400 italic">No content available</div>
                                )}

                            </div>
                        );
                    }
                })}

                {(isNextChatLoading) && (
                    <div className="flex mb-[60%] items-center space-x-2 text-blue-400">
                        <LoadingAnimation currentQuote={currentLoadingMessage} />
                    </div>
                )}
                {isShowInteractionLogs && (
                    <ChatSimulation personas={interactionLogs} isLoading={isNextChatLoading} effect={true} />
                )}

                <div ref={scrollTimeoutRef} className="h-1 w-full" />
                <div ref={bottomRef} className="h-1 w-full" />
            </div>

            <div className="w-full p-2 sticky bottom-0 bg-black mb-2 flex items-center justify-center">
                <div className="max-w-4xl w-full mx-auto">
                    <ChatInput
                        input={prompt}
                        setInput={setPrompt}
                        handleSubmit={() => handleSubmit(prompt)}
                        isLoading={isNextChatLoading}
                        setLoading={setIsNextChatLoading}
                        isSearchOn={isSearchOn}
                        setIsSearchOn={setIsSearchOn}
                        isDocumentOn={isDocumentOn}
                        setIsDocumentOn={setIsDocumentOn}
                        isVectorBaseOn={isVectorBaseOn}
                        setIsVectorBaseOn={setIsVectorBaseOn}
                        handleScroll={smoothScrollToBottom}
                    />
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl w-full">
                    <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                    </DialogHeader>

                    {dialogType === "visual" ? (
                        <div className="p-4 overflow-auto max-h-[70vh]">
                            <Mermaid chart={dialogContent} />
                        </div>
                    ) : (
                        <div className="p-4 whitespace-pre-wrap overflow-auto max-h-[70vh]">
                            <ReactMarkdown
                                remarkPlugins={[remarkMath, remarkGfm]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {dialogContent}
                            </ReactMarkdown>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper function for workflow compilation
function compileWorkflow(isDocumentOn, isSearchOn, isVectorBaseOn, isInteraction) {
    const workflow = [];
    if (isDocumentOn) {
        workflow.push("document");
    }
    if (isSearchOn) {
        workflow.push("search");
    }
    if (isVectorBaseOn) {
        workflow.push("vector");
    }
    if (isInteraction) {
        workflow.push("interaction");
    }
    workflow.push("generate");
    return workflow;
}