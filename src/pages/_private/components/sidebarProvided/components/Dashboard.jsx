import { Link, useNavigate } from "react-router-dom";
import ChatInput from "../../../../../components/custom/ChatInput";
import { useToast } from "../../../../../hooks/use-toast";
import { _useSidebar } from "../../../../../context/SidebarContext";
import { getNewSession } from "../../../../../services/n8n-apis/_core/getNewSession.api";
import { memo, useEffect, useState } from "react";
import { useUser } from "../../../../../context/UserContext";
import { ArrowRight, Brain, CalendarSync, FileInput, School } from "lucide-react";
import { Badge } from "@/components/ui/badge"
import AnimatedBadge from "../../../../../components/custom/AnimatedBadge";

function Dashboard() {
    const [value, setValue] = useState("");
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useUser();
    const [isChatLoading, setIsChatLoading] = useState(false);
    const { appendToChatHistory } = _useSidebar();
    async function handleSubmit() {
        setIsChatLoading(true);
        try {
            const res = await getNewSession(value, user.id)
            if (res.success) {
                console.log(res, 'res')
                appendToChatHistory(res.data)
                localStorage.setItem('prompt', value);
                localStorage.setItem('isFallbackedUser', 'true');
                navigate(`/chat/${res.data.sessionid}`)
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

    useEffect(() => {
        return () => {
            setIsChatLoading(false);
        }
    }, [])

    const navCards = [
        {
            id: 1,
            to: '/knowledge',
            icon: School,
            title: 'Knowledge Base & Persona',
            description: 'Create superior personas and knowledge base with chatting functionality'
        },
        {
            id: 2,
            to: '/agenticAutomation',
            icon: CalendarSync,
            title: "Superior persona Automation",
            description: "Create Automations for superior persona"
        },
        {
            id: 3,
            to: '/oasis',
            icon: Brain,
            title: "Oasis - Social Media Simulation",
            description: "Create and analyze social media posts and simulate the social media environment"
        },
        {
            id: 4,
            to: '/addToPermenentKnowledgeBase',
            icon: FileInput,
            title: "Add to Permenent Knowledge Base",
            description: "Add New Document to the permenent knowledge base"
        }
    ];

    return (
        <div className="flex w-full h-full items-center justify-center">
            <div className="w-full max-w-[900px] md:w-[54%] mt-[20%]">
                <div className="-mt-11 mb-8 w-full flex items-center justify-center">
                    <AnimatedBadge onClick={() => window.open('https://ai-formula-user-manual.notion.site/Chat-Interface-User-Manual-1b805ab349a7806a8263f5556c809970', '_blank')}>
                        Work Along With Interactive User Manual
                    </AnimatedBadge>

                </div>
                <p className="text-center font-semibold capitalize text-4xl font-mono mb-2">
                    Let's create & Analyze some <span>amazing formulas</span> together.
                </p>

                <ChatInput
                    input={value}
                    setInput={setValue}
                    handleSubmit={handleSubmit}
                    isLoading={isChatLoading}
                    setLoading={setIsChatLoading}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {navCards.map((card) => (
                        <Link
                            key={card.id}
                            to={card.to}
                            className="bg-slate-700 hover:bg-slate-600 cursor-pointer rounded-lg shadow-md p-4 flex flex-col items-start gap-4 justify-start"
                        >
                            <div className="flex text-left rounded-full bg-blue text-slate-400 ">
                                <card.icon />
                            </div>
                            <h3 className="text-lg font-semibold mt-2">{card.title}</h3>
                            <p className="text-gray-300 mt-1">{card.description}</p>
                            <p className="flex gap-2 items-end text-right w-full">
                                Click To Visit <ArrowRight width={20} height={20} />
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default memo(Dashboard);