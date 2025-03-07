import { useEffect, useState, useRef, useCallback } from "react";
import { useToast } from "../../../../../hooks/use-toast";
import { chat } from "../../../../../services/n8n-apis/_core/chat.api";
import { useParams } from "react-router-dom";
import { parseContent } from "../../../../../lib/utils";
import ChatInput from "../../../../../components/custom/ChatInput";
import Markdown from "react-markdown";
import 'katex/dist/katex.min.css';
import remarkGfm from "remark-gfm";
import LatexParser from "@/components/custom/LatexParser";
import { getConversationHistory } from "@/services/n8n-apis/_core/getConversationHistory.api";
import { LoaderCircle } from "lucide-react";
import { Mermaid } from "../../../../../components/custom/Mermaid";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import './Chat.css';
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

export default function Chat() {
    // Context
    const { id } = useParams();
    const { toast } = useToast();
    const { setFileCount, setMemorizedFiles, isMemorizationLoading, setIsMemorizationLoading, fileName, setFileName, files, setFiles, resetAllStates } = useFilesUploadMetadata();
    const { isDocumentOn, setIsDocumentOn, isSearchOn, setIsSearchOn, isVectorBaseOn, setIsVectorBaseOn, isSuperiorPersonaAttached, setIsSuperiorPersonaAttached, selectedSuperiorPersona, setSelectedSuperiorPersona, currActiveIntraction, setCurrActiveIntraction } = useUser();
    const { sidebarStack, setSidebarStack } = useStackSidebar();

    // Local state
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [fallBackPrompt, setFallBackPrompt] = useState("");
    const [conversation, setConversation] = useState([]);
    const [isNextChatLoading, setIsNextChatLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [isChanged, setIsChanged] = useState(false);
    const [hasInitialChatLoaded, setHasInitialChatLoaded] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [chatIdentifer, setChatIdentifer] = useState(null);
    const [interactionLogs, setInteractionLogs] = useState([]);
    const [isShowInteractionLogs, setIsShowInteractionLogs] = useState(false);

    // Refs
    const bottomRef = useRef(null);
    const chatContainerRef = useRef(null);
    const latestUpdatedStatus = useRef([]);
    const dataFetchedRef = useRef(false);
    const pollChatOutputRef = useRef(null);
    const pollChatStatusRef = useRef(null);
    const pollInteractionLogsRef = useRef(null);

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
                            const parsedResponse = parseContent(item.message);
                            return {
                                role: "ai",
                                message: parsedResponse
                            };
                        }
                    });
                    setConversation(processedData);
                }
            } catch (error) {
                toast({
                    title: 'Error',
                    description: error.message,
                    variant: "destructive"
                });
            } finally {
                setIsChatLoading(false);
                setHasInitialChatLoaded(true);
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
        }

        if (isChatLoading) {
            getData();
        }
    }, [isChatLoading, id]);

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
        }
    }, []);

    // Function: Handle prompt submission
    const handleSubmit = useCallback(async (prompt) => {
        dataFetchedRef.current = false;
        if (prompt.length === 0) {
            return;
        }
        setIsNextChatLoading(true);
        const prevPrompt = prompt;
        try {
            setPrompt("");
            setConversation((prev) => [...prev, { message: prompt, role: "human" }]);
            console.log("hellow", selectedSuperiorPersona.map(item => item.id))
            const res = await chat(
                prompt,
                id,
                [],
                isSearchOn,
                isDocumentOn,
                isVectorBaseOn,
                "question",
                isSuperiorPersonaAttached,
                currActiveIntraction === "unstructured" ? "unstructured" : "sequential",
                selectedSuperiorPersona ? selectedSuperiorPersona.map(item => item.id) : -1
            );

            setChatIdentifer(res.data.identity);
            if (res.success) {
                startPollingChatOutput(res.data.id);
            } else {
                toast({
                    title: 'Error',
                    description: res.error || 'Failed to initiate chat.',
                    variant: "destructive"
                });
                setPrompt(prevPrompt);
                setIsNextChatLoading(false);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: "destructive"
            });
            setPrompt(prevPrompt);
            setIsNextChatLoading(false);
        }
    }, [id, isSearchOn, isDocumentOn, isVectorBaseOn, toast, isSuperiorPersonaAttached, currActiveIntraction, selectedSuperiorPersona]);

    // Function: Poll chat output
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

    // Function: Scroll to bottom
    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            <div className={`flex-1  overflow-y-auto p-4 space-y-2 w-full ${sidebarStack.length > 0 ? "max-w-2xl" : "max-w-4xl"} mx-auto`}>
                {conversation.map((item, index) => {
                    if (item.role === "human") {
                        return (
                            <div ref={index === conversation.length - 1 ? chatContainerRef : null} key={index} className="bg-gray-600 p-2 rounded shadow">
                                {item.message ? item.message.replaceAll('Provided Document : No document provided', '') : "{Message Not found}"}
                            </div>
                        );
                    } else {
                        return (
                            <div ref={index === conversation.length ? chatContainerRef : null} key={index} className="text-slate-300 rounded shadow">
                                {item.workflow && item.workflow.length > 0 ? (
                                    <PollStatus workflow={item.workflow} updated={item.updated || []} isActive={isChanged} isOpen={true} sessionId={id} isCompleted={item?.message} />
                                ) : null}
                                {item.message && item.message.map((itm, idx) => {
                                    if (itm.type === "text") {
                                        return (
                                            <div key={idx}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkMath, remarkGfm]}
                                                    rehypePlugins={[rehypeKatex]}
                                                    className="module"
                                                    components={{
                                                        p: ({ children }) => <p>{children}</p>,
                                                        table: ({ children }) => (
                                                            <table style={{ borderCollapse: "collapse", width: "100%", color: "#e0e0e0" }}>
                                                                {children}
                                                            </table>
                                                        ),
                                                        th: ({ children }) => (
                                                            <th style={{ border: "1px solid #444", padding: "8px", backgroundColor: "#333", color: "#e0e0e0" }}>
                                                                {children}
                                                            </th>
                                                        ),
                                                        td: ({ children }) => (
                                                            <td style={{ border: "1px solid #444", padding: "8px", backgroundColor: "#222", color: "#e0e0e0" }}>
                                                                {children}
                                                            </td>
                                                        ),
                                                    }}
                                                >
                                                    {itm.content}
                                                </ReactMarkdown>
                                            </div>
                                        );
                                    } else if (itm.type === "mermaid") {
                                        const sanitizedContent = itm.content.replace(/\[([^\]]+)\]/g, (match, p1) => {
                                            return `[${p1.replace(/[^a-zA-Z0-9 ]/g, '')}]`;
                                        });
                                        return (
                                            <div key={idx} className="overflow-scroll flex items-center justify-center">
                                                <Mermaid chart={sanitizedContent} />
                                            </div>
                                        );
                                    } else if (itm.type === "simulation") {
                                        return (
                                            <ChatSimulation personas={itm.items} isLoading={conversation.length === (index + 1) && isNextChatLoading} />
                                        );
                                    }
                                })}
                            </div>
                        );
                    }
                })}

                {isNextChatLoading && (
                    <PollStatus workflow={compileWorkflow(isDocumentOn, isSearchOn, isVectorBaseOn, isSuperiorPersonaAttached)} updated={latestUpdatedStatus.current} isActive={isChanged} isOpen={true} sessionId={id} />
                )}

                {isShowInteractionLogs && (
                    <ChatSimulation personas={interactionLogs} isLoading={isNextChatLoading} effect={true} />
                )}
            </div>
            <div ref={bottomRef} />
            <div className="w-full p-4 sticky bottom-0 bg-gray-950 mb-2 flex items-center justify-center">
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
                        handleScroll={scrollToBottom}
                    />
                </div>
            </div>
        </div>
    );
}

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