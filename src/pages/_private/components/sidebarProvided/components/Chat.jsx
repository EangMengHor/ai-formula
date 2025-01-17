import { useEffect, useState, useRef } from "react";
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
export default function Chat() {
    // current sessionId
    const { id } = useParams();
    const mermaidRef = useRef(null);

    // this states activates when user want to fetch the chat history
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [conversation, setConversation] = useState([]);
    // when user enter chat and ai is loading response
    const [isNextChatLoading, setIsNextChatLoading] = useState(false);
    // current prompt of the user 
    const [prompt, setPrompt] = useState('');

    // this prompt is from dashboard that will execute here
    const [fallBackPrompt, setFallBackPrompt] = useState("")
    const { toast } = useToast();

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

    async function handleSubmit(prompt) {
        setIsNextChatLoading(true);
        try {
            setConversation((prev) => {
                return [...prev, { message: prompt, role: "human" }]
            })
            console.log(prompt, id, "is here and going to ai");
            const res = await chat(prompt, id);
            if (res.success || res.data || res.data.length > 0) {
                const parsedResponse = parseContent(res.data);
                console.log(parsedResponse, 'parsedResponse');
                setConversation((prev) => {
                    return [...prev, { message: parsedResponse, role: "ai" }]
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
    }


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
            } catch (error) {
                toast({
                    title: 'Error',
                    description: error.message,
                    variant: "destructive"
                })
            } finally {
                setIsChatLoading(false);
            }
        }

        // trigger
        if (isChatLoading) {
            fetchConversations();
        }
    }, [isChatLoading, id]);


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
                            <div key={index} className="text-slate-300 p-2 rounded shadow">
                                {item.message.map((itm, idx) => {

                                    if (itm.type === "text") {
                                        return (
                                            <div key={idx}>
                                                <Markdown remarkPlugins={[remarkGfm]} className={`text-white text-left ${styles.module}`} >
                                                    {itm.content}
                                                </Markdown>
                                            </div>
                                        );
                                    } else if (itm.type === "latex") {
                                        
                                        return (
                                            <div key={idx}>
                                                <LatexParser content={itm.content} />
                                            </div>
                                        );
                                    } else if (itm.type === "mermaid") {
                                        return (
                                            <div key={idx} className="overflow-scroll  flex items-center justify-center">
                                                <Mermaid chart={itm.content} />
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
                        <div className="flex gap-2 p-2 bg-slate-800 w-fit rounded-md justify-start items-start">
                            <LoaderCircle className="animate-spin" />
                            <p>Agent Is Loading Your Response</p>
                        </div>
                    )
                }
            </div>

            {/* Chat input */}
            <div className="w-full  p-4 sticky bottom-0 bg-slate-950 mb-2 flex items-center justify-center">
                <div className="max-w-4xl w-full mx-auto">

                    <ChatInput
                        input={prompt}
                        setInput={setPrompt}
                        handleSubmit={() => handleSubmit(prompt)}
                        isLoading={isNextChatLoading}
                        setLoading={setIsNextChatLoading}
                    />
                </div>
            </div>
        </div>

    )
}

