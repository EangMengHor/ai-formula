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
import { Atom, LoaderCircle } from "lucide-react";
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
import { pollChatOutput } from "../../../../../services/n8n-apis/_core/pollChatOutput.api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function Chat() {
    // current sessionId
    const { id } = useParams();
    const mermaidRef = useRef(null);
    const bottomRef = useRef(null); // Reference for the bottom of the chat container
    const chatContainerRef = useRef(null); // Reference to chat container
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
    const { isDocumentOn, setIsDocumentOn, isSearchOn, setIsSearchOn, isVectorBaseOn, setIsVectorBaseOn, isSuperiorPersonaAttached, setIsSuperiorPersonaAttached, selectedSuperiorPersona, setSelectedSuperiorPersona, currActiveIntraction, setCurrActiveIntraction } = useUser();
    console.log(id, 'idx')
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
    const [showScrollButton, setShowScrollButton] = useState(false); // State to control button visibility
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

    async function _pollChatOutput(id) {
        return await pollChatOutput(id)
    }
    let intervalId;
    const dataFetchedRef = useRef(false);

    useEffect(() => {
        console.log(conversation, "kjsoidf")
        return () => clearInterval(intervalId);
    }, [isNextChatLoading, conversation]);
    const handleSubmit = useCallback(async (prompt) => {
        dataFetchedRef.current = false;
        if (prompt.length == 0) {
            return;
        }
        setIsNextChatLoading(true);
        const prevPrompt = prompt;
        try {
            setPrompt("");
            setConversation((prev) => {
                return [...prev, { message: prompt, role: "human" }];
            });
            console.log(prompt, id, "is here and going to ai");
            const res = await chat(prompt, id, [], isSearchOn, isDocumentOn, isVectorBaseOn, "question", isSuperiorPersonaAttached, currActiveIntraction == "unstructured" ? "unstructured" : "sequential", selectedSuperiorPersona ? selectedSuperiorPersona.id : -1);
            if (res.success) {
                let requestCount = 0;
                const maxRequests = 2; // Maximum number of pending requests
                intervalId = setInterval(async () => {
                    if (requestCount < maxRequests) {
                        requestCount++;
                        try {
                            const pollResult = await _pollChatOutput(res.data);
                            console.log(pollResult && pollResult.success && pollResult.data.length > 0, pollResult, "koij");
                            if (pollResult && pollResult.success && pollResult.data.length > 0 && !dataFetchedRef.current) {
                                clearInterval(intervalId);
                                dataFetchedRef.current = true;
                                const parsedResponse = parseContent(pollResult.data);
                                console.log(parsedResponse, 'parsedResponse');
                                console.log(latestUpdatedStatus, 'latestUpdatedStatus');
                                setConversation((prev) => {
                                    return [...prev, { message: parsedResponse, role: "ai", workflow: compileWorkflow(isDocumentOn, isSearchOn, isVectorBaseOn), updated: latestUpdatedStatus.current }];
                                });
                                setIsNextChatLoading(false);
                            }
                        } finally {
                            requestCount--; // Decrement after the request is complete
                        }
                    } else {
                        console.log("Maximum number of pending requests reached.");
                    }
                }, 15000);
                // Clear the interval when the component unmounts

            } else {
                // Handle the case where the initial chat request fails
                toast({
                    title: 'Error',
                    description: res.error || 'Failed to initiate chat.',
                    variant: "destructive"
                });
                setPrompt(prevPrompt);
                setIsNextChatLoading(false); // Also set to false if initial request fails
            }

        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: "destructive"
            });
            setPrompt(prevPrompt);
            setIsNextChatLoading(false); // Set to false if an error occurs

        }

    }, [id, isSearchOn, isDocumentOn, isVectorBaseOn, toast, isSuperiorPersonaAttached, currActiveIntraction, selectedSuperiorPersona]);

    useEffect(() => {
        console.log(conversation, latestUpdatedStatus, 'conversation');
    }, [conversation])
    // get the conversation history
    useEffect(() => {
        async function fetchConversations() {
            try {

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
            let requestCount = 0;
            const maxRequests = 2; // Maximum number of pending requests

            interval = setInterval(async () => {
                if (requestCount < maxRequests) {
                    requestCount++;
                    try {
                        const data = await pollStatus(id);
                        latestUpdatedStatus.current = data.data;
                        setIsChanged(prev => !prev);
                        console.log(data, '453data');
                    } catch (error) {
                        console.error("Error during polling:", error);
                        // Optionally retry the request after a delay
                        setTimeout(() => {
                            requestCount--; // Decrement to allow a retry
                        }, 5000); // Retry after 5 seconds
                    } finally {
                        requestCount--; // Decrement after the request is complete
                    }
                } else {
                    console.log("Maximum number of pending requests reached.");
                }
            }, 15000);
        }
        return () => clearInterval(interval);
    }, [isNextChatLoading, id]);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

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
            <div
                className="flex-1 overflow-y-auto p-4 space-y-4 w-full max-w-4xl mx-auto"
            >
                {conversation.map((item, index) => {
                    if (item.role === "human") {
                        return (
                            <div ref={index == conversation.length - 1 ? chatContainerRef : null} key={index} className="bg-gray-600 p-2 rounded shadow">
                                {item.message ? item.message.replaceAll('Provided Document : No document provided', '') : "{Message Not found}"}
                            </div>
                        );
                    } else {
                        return (
                            <div ref={index == conversation.length ? chatContainerRef : null} key={index} className="text-slate-300 rounded shadow">
                                {
                                    item.workflow && item.workflow.length > 0 ? (
                                        <PollStatus workflow={compileWorkflow(isDocumentOn, isSearchOn, isVectorBaseOn, isSuperiorPersonaAttached)} updated={latestUpdatedStatus.current} isActive={isChanged} isOpen={true} sessionId={id} />
                                    ) : null
                                }
                                {item.message && item.message?.map((itm, idx) => {
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
                                    else if (itm.type == "persona") {
                                        return (
                                            <div className=" my-2 py-4 bg-slate-800 hover:bg-slate-700 rounded-md flex items-center justify-start p-2 ">
                                                <Dialog>
                                                    <DialogTrigger className="flex gap-2 w-full">
                                                        <div className="p-2 rounded-full w-fit  bg-blue-200  flex items-center justify-center h-fit">
                                                            <Atom className="text-blue-700" />

                                                        </div>
                                                        <div className="flex gap-2 flex-col items-start">
                                                            <div className="font-semibold text-xl">Experts Details</div>
                                                            <p>Click To Open</p>
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="w-[80%] h-[80%] overflow-scroll bg-slate-800 text-white">
                                                        <DialogHeader>
                                                            <DialogDescription>
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkMath, remarkGfm]} // Added remarkGfm for table support
                                                                    rehypePlugins={[rehypeKatex]}
                                                                    className="module flex flex-col gap-2 text-slate-400"
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
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        )
                                    }
                                })}
                            </div>
                        );
                    }
                })}
                {console.log(latestUpdatedStatus.current, " yourw")}
                {isNextChatLoading && (
                    <PollStatus workflow={compileWorkflow(isDocumentOn, isSearchOn, isVectorBaseOn, isSuperiorPersonaAttached)} updated={latestUpdatedStatus.current} isActive={isChanged} isOpen={true} sessionId={id} />
                )}
                {/* <PollStatus workflow={[
                    "interaction",
                    "generate"
                ]} updated={[{
                    "label": "interaction",
                    "data": "none",
                    "other": {
                        output: [
                            [
                                {
                                    "goal": "Conduct a detailed review of existing tax compliance frameworks to identify strengths and weaknesses; ensure adherence to both local and international tax regulations while preparing a comprehensive compliance overview report.",
                                    "name": "The Compliance Officer",
                                    "input": [],
                                    "execution": 1,
                                    "personaId": "1185"
                                },
                                {
                                    "goal": "Analyze the latest tax rules, ensuring that the compliance strategy effectively aligns with current legislation; provide insights on potential vulnerabilities in audit scenarios.",
                                    "name": "The Tax Strategist",
                                    "input": [],
                                    "execution": 1,
                                    "personaId": "1186"
                                }
                            ],
                            [
                                {
                                    "goal": "Leverage data analysis to examine historical compliance performance, identifying trends and potential areas for improved compliance; visually represent findings to enhance decision-making.",
                                    "name": "The Audit Specialist",
                                    "input": [
                                        "1185",
                                        "1186"
                                    ],
                                    "execution": 2,
                                    "personaId": "1187"
                                },
                                {
                                    "goal": "Develop a forward-looking tax liability forecast based on the compliance findings; collaborate with the compliance officer and audit specialist to align on key assumptions with an emphasis on risk management.",
                                    "name": "The Technology Integrator",
                                    "input": [
                                        "1187"
                                    ],
                                    "execution": 2,
                                    "personaId": "1190"
                                }
                            ],
                            [
                                {
                                    "goal": "Create a comprehensive overview of intercompany pricing methodologies applicable to various jurisdictions, ensuring compliance with transfer pricing regulations; collaborate with the technology integrator for system alignment.",
                                    "name": "The Data Analyst",
                                    "input": [
                                        "1190"
                                    ],
                                    "execution": 3,
                                    "personaId": "1188"
                                },
                                {
                                    "goal": "Evaluate the impact of pending legislation on corporate tax strategies; draft policy positions with recommendations to align tax strategies with potentially advantageous legislative developments.",
                                    "name": "The Financial Planner",
                                    "input": [
                                        "1185"
                                    ],
                                    "execution": 3,
                                    "personaId": "1191"
                                }
                            ],
                            [
                                {
                                    "goal": "Design and recommend optimal corporate structures that enhance compliance while minimizing tax liabilities, leveraging the insights from the compliance officer, tax strategist, and audit specialist.",
                                    "name": "The Corporate Structuring Officer",
                                    "input": [
                                        "1191",
                                        "1190"
                                    ],
                                    "execution": 4,
                                    "personaId": "1193"
                                },
                                {
                                    "goal": "Analyze intricate multi-jurisdictional tax landscapes; provide strategic insights that enhance both compliance and financial outcomes for the organization, focusing on potential international commitments.",
                                    "name": "The Policy Advocate",
                                    "input": [
                                        "1188",
                                        "1191"
                                    ],
                                    "execution": 4,
                                    "personaId": "1192"
                                }
                            ],
                            [
                                {
                                    "goal": "Assess and quantify risks associated with tax compliance strategies, advising on mitigation measures; connect with the audit specialist to ensure thorough understanding of upcoming audit risks.",
                                    "name": "The Risk Assessor",
                                    "input": [
                                        "1192",
                                        "1193"
                                    ],
                                    "execution": 5,
                                    "personaId": "1194"
                                }
                            ],
                            [
                                {
                                    "goal": "Create a comprehensive training program designed to educate employees on tax compliance responsibilities, fostering a culture of proactive awareness respecting tax obligations and financial integrity.",
                                    "name": "The Tax Trainer",
                                    "input": [
                                        "1190",
                                        "1194"
                                    ],
                                    "execution": 6,
                                    "personaId": "1195"
                                }
                            ]
                        ]
                    }
                }]} isActive={isChanged} isOpen={true} sessionId={id} /> */}
            </div>
            <div ref={bottomRef} />
            {/* Scroll to Bottom Button */}


            {/* Chat input */}
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
        workflow.push("interaction")
    }
    workflow.push("generate")
    return workflow;
}