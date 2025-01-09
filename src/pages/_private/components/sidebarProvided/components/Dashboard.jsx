import { useNavigate } from "react-router-dom";
import ChatInput from "../../../../../components/custom/ChatInput";
import { useToast } from "../../../../../hooks/use-toast";
import { _useSidebar } from "../../../../../context/SidebarContext";
import { getNewSession } from "../../../../../services/n8n-apis/_core/getNewSession.api";
import { useEffect, useState } from "react";
import { useUser } from "../../../../../context/UserContext";

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
            <div className=" w-full md:w-[54%]">
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
            </div>
        </div>
    )
}