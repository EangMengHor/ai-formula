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
import styles from '@/chat.module.css';
import mermaid from 'mermaid';
import { Mermaid } from "../../../../../components/custom/Mermaid";
import Latex from "react-latex-next";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import './Chat.css';
import { getUploadedDocumentHistory } from "../../../../../services/n8n-apis/_core/getUploadedDocumentHis.api";
import { useFilesUploadMetadata } from "../../../../../context/FilesUploadMetadata";
import PollStatus from "../../../../../components/custom/PolledStatus";
import { poll } from "poll";
import { pollStatus } from "../../../../../services/n8n-apis/_core/pollStatus.api";
import { UserContext, useUser } from "../../../../../context/UserContext";
export default function Chat() {
    // current sessionId
    const { id } = useParams();
    const mermaidRef = useRef(null);
    // context
    const {
        fileCount,
        setFileCount,
        memorizedFiles,
        setMemorizedFiles,
        isMemorizationLoading,
        setIsMemorizationLoading,
        fileName,
        setFileName,
        files,
        setFiles,
        resetAllStates
    } = useFilesUploadMetadata()
    const { isDocumentOn, setIsDocumentOn, isSearchOn, setIsSearchOn, isVectorBaseOn, setIsVectorBaseOn } = useUser();

    // this states activates when user want to fetch the chat history
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [conversation, setConversation] = useState([]);
    // when user enter chat and ai is loading response
    const [isNextChatLoading, setIsNextChatLoading] = useState(false);
    // current prompt of the user 
    const [prompt, setPrompt] = useState('');

    const latestUpdatedStatus = useRef([]);
    const [isChanged, setIsChanged] = useState(false);
    // this prompt is from dashboard that will execute here
    const [fallBackPrompt, setFallBackPrompt] = useState("")
    const { toast } = useToast();
    const [hasInitialChatLoaded, setHasInitialChatLoaded] = useState(false);


    // check if local storage has prompt if so then execture it or load the chat
    useEffect(() => {
        async function getPurpose() {
            const localItem = localStorage.getItem('prompt');
            if (localItem) {
                setFallBackPrompt(localItem);
                setIsNextChatLoading(true);
            }
            else {
                setIsChatLoading(true);
            }
        }

        getPurpose();
    }, [id])

    useEffect(() => {
        if (localStorage.getItem('prompt')) {
            localStorage.removeItem('prompt');
        }
        else {
            setIsChatLoading(true);
        }
    }, [id])
    useEffect(() => {
        if (fallBackPrompt.length > 0) {
            handleSubmit(fallBackPrompt);
        }
    }, [fallBackPrompt])

    const handleSubmit = useCallback(async (prompt) => {
        setIsNextChatLoading(true);
        try {
            setConversation((prev) => {
                return [...prev, { message: prompt, role: "human" }]
            })
            console.log(prompt, id, "is here and going to ai");
            const res = await chat(prompt, id, [], isSearchOn, isDocumentOn, isVectorBaseOn);
            if (res.success || res.data || res.data.length > 0) {
                const parsedResponse = parseContent(res.data);
                console.log(parsedResponse, 'parsedResponse');
                console.log(latestUpdatedStatus, 'latestUpdatedStatus');
                setConversation((prev) => {
                    return [...prev, { message: parsedResponse, role: "ai", workflow: compileWorkflow(isDocumentOn, isSearchOn, isVectorBaseOn), updated: latestUpdatedStatus.current }]
                })
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: "destructive"
            })

        } finally {
            setIsNextChatLoading(false);
            localStorage.setItem('isFallbackedUser', 'false');
        }
    }, [id, isSearchOn, isDocumentOn, isVectorBaseOn, toast]);


    useEffect(() => {
        console.log(conversation, latestUpdatedStatus, 'conversation');
    }, [conversation])
    // get the conversation history
    useEffect(() => {
        async function fetchConversations() {
            try {
                const isFallback = localStorage.getItem('isFallbackedUser');
                console.log(isFallback, 'isFallback');
                if (isFallback == "true") {
                    return
                }
                const res = await getConversationHistory(id);
                if (res.success) {
                    console.log(res.data, 'chat history');
                    const processedData = res.data.map((item) => {
                        if (item.role == "human") {
                            return item
                        }
                        else {
                            const parsedResponse = parseContent(item.message);
                            return {
                                role: "ai",
                                message: parsedResponse
                            }
                        }
                    })
                    console.log(processedData, 'processedData');
                    setConversation(processedData);
                }

                return res;
            } catch (error) {
                toast({
                    title: 'Error',
                    description: error.message,
                    variant: "destructive"
                })
            } finally {
                setIsChatLoading(false);
                setHasInitialChatLoaded(true); // Set to true after initial chat load
            }
        }


        // get uploaded Document
        async function getUploadedDocumentHis() {

            try {
                // api call
                const res = await getUploadedDocumentHistory(id);
                console.log(res, res.data[0], "dataTransfer")
                if (!res.isEmpty && Array.isArray(res.data)) {
                    const fileNames = [...new Set(res.data[0].fileName || [])]; // Remove duplicate names
                    // setMemorizedFiles(fileName); // Remove this line
                    setFileCount(fileNames.length);
                    setFileName(fileNames);
                    setFiles(fileNames.map(item => {
                        const splited = item.split('.') || [];
                        return {
                            name: item,
                            type: item.split('.')[splited.length - 1]
                        }
                    }) || []);

                    // Update memorizedFiles with the fileNames from history
                    setMemorizedFiles(fileNames);
                }

                return res;
            } catch (error) {

                console.error(error);
            }
        }

        // main
        async function getData() {
            resetAllStates();
            console.log("loading1234")
            const [a, b] = await Promise.all([
                getUploadedDocumentHis(),
                fetchConversations()
            ])
        }


        // trigger
        if (isChatLoading) {
            getData();
        }
    }, [isChatLoading, id]);


    // polling for status
    useEffect(() => {
        let interval;
        if (isNextChatLoading) {
            interval = setInterval(async () => {
                try {
                    const data = await pollStatus(id);
                    latestUpdatedStatus.current = data.data;
                    setIsChanged(prev => !prev);
                    console.log(data, 'data');
                } catch (error) {
                    console.error("Error during polling:", error);
                    clearInterval(interval);  // Stop polling on error
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isNextChatLoading, id]);




    if (isChatLoading) {
        return (
            <div className="w-full h-full flex  items-center justify-center gap-2">
                <LoaderCircle className="animate-spin" />
                <p>Loading Chats</p>
            </div>
        )
    }
    return (
        <div className="flex flex-col h-full w-full">
            {/* Chat messages container */}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full max-w-4xl mx-auto">

                {conversation.map((item, index) => {
                    if (item.role === "human") {
                        return (
                            <div key={index} className="bg-gray-600 p-2 rounded shadow">
                                {item.message.replaceAll('Provided Document : No document provided', '')}
                            </div>
                        );
                    } else {
                        return (
                            <div key={index} className="text-slate-300 rounded shadow">
                                {
                                    item.workflow && item.workflow.length > 0 ? (
                                        <PollStatus workflow={item.workflow} updated={item.updated} added={item.message[0].content.slice(0, 30)} isCompleted={true} isOpen={true} />
                                    ) : null
                                }
                                {item.message?.map((itm, idx) => {

                                    if (itm.type === "text") {
                                        return (
                                            <div key={idx}>

                                                <ReactMarkdown
                                                    remarkPlugins={[remarkMath, remarkGfm]} // Added remarkGfm for table support
                                                    rehypePlugins={[rehypeKatex]}
                                                    className="module"
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
                                    }

                                })}
                                {console.log(item.message, 'item.message')}
                            </div>
                        );
                    }
                })}
                {
                    isNextChatLoading && (
                        <PollStatus workflow={compileWorkflow(isDocumentOn, isSearchOn, isVectorBaseOn)} updated={latestUpdatedStatus.current} isActive={isChanged} isOpen={true} />
                    )
                }
            </div>

            {/* Chat input */}
            <div className="w-full  p-4 sticky bottom-0 bg-gray-950 mb-2 flex items-center justify-center">
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
                    />
                </div>
            </div>
        </div>

    )
}


function compileWorkflow(isDocumentOn, isSearchOn, isVectorBaseOn) {
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
    workflow.push("generate")
    return workflow;
}