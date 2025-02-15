import { Link, useNavigate } from "react-router-dom";
import ChatInput from "../../../../../components/custom/ChatInput";
import { useToast } from "../../../../../hooks/use-toast";
import { _useSidebar } from "../../../../../context/SidebarContext";
import { getNewSession } from "../../../../../services/n8n-apis/_core/getNewSession.api";
import { useEffect, useState } from "react";
import { useUser } from "../../../../../context/UserContext";
import { ArrowRight, School } from "lucide-react";

export default function Dashboard() {
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

    return (
        <div className="flex w-full h-full items-center justify-center">
            <div className=" w-full max-w-[900px] md:w-[54%]">
                <p className="text-center font-semibold capitalize text-4xl font-mono mb-2">
                    Let's create & Analyze some <span className="">amazing formulas</span> together.
                </p>

                <ChatInput
                    input={value}
                    setInput={setValue}
                    handleSubmit={handleSubmit}
                    isLoading={isChatLoading}
                    setLoading={setIsChatLoading}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <Link
                        to={'/knowledge'}
                        className="bg-slate-700 hover:bg-slate-600 cursor-pointer rounded-lg shadow-md p-4 flex flex-col  items-start gap-4 justify-start">
                        <div className="flex text-left rounded-full bg-blue text-slate-400 mx-auto">

                            <School />
                        </div>
                        <h3 className="text-lg font-semibold  mt-2">Knowledge Base & Persona</h3>
                        <p className="text-gray-300  mt-1">Create superior personas and knowledge base with chating functioanlity</p>
                        <p className="flex gap-2 items-end text-right w-full">Click To Visit <ArrowRight width={20} height={20} /></p>
                    </Link>

                </div>
            </div>
        </div>
    )
}