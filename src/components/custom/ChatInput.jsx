import { ArrowUp, ArrowUpRight, Paperclip } from "lucide-react";
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react";
import { getNewSession } from "../../services/n8n-apis/_core/getNewSession.api";
import { useUser } from "../../context/UserContext";
import { _useSidebar } from "../../context/SidebarContext";
import { useToast } from "../../hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function ChatInput() {
    const [value, setValue] = useState("");
    const [rows, setRows] = useState(1);
    const { user } = useUser();
    const { appendToChatHistory } = _useSidebar();
    const maxRows = 30;
    const navigate = useNavigate()
    const { toast } = useToast()
    const handleChange = (event) => {
        const textareaLineHeight = 24;
        const previousRows = event.target.rows;
        event.target.rows = 1; // reset number of rows in textarea 

        const currentRows = Math.floor(event.target.scrollHeight / textareaLineHeight);

        if (currentRows === previousRows) {
            event.target.rows = currentRows;
        }

        if (currentRows >= maxRows) {
            event.target.rows = maxRows;
            event.target.scrollTop = event.target.scrollHeight;
        }

        setValue(event.target.value);
        setRows(currentRows < maxRows ? currentRows : maxRows);
    };

    async function handleSubmit() {
        try {
            const res = await getNewSession(value, user.id)
            if (res.success) {
                console.log(res, 'res')
                appendToChatHistory(res.data)
                navigate(`/chat/${res.data.sessionid}`)
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: "destructive"
            })

        }
    }


    return (
        <div className="flex w-[53%] flex-col hide-scrollbar">
            <p className="text-center font-bold text-4xl font-mono mb-5">Let's Start The Todays Science!</p>
            <div className="border border-gray-800 bg-slate-800 hide-scrollbar rounded-lg p-2">
                <Textarea
                    value={value}
                    onChange={handleChange}
                    rows={rows}
                    maxRows={maxRows}
                    className={`ring-0-0 resize-none pb-10 border-0 focus:ring-0 focus-visible:ring-0 `}
                    type="text"
                    placeholder="Type a message"
                />
                <div className="flex justify-between">
                    <div className="flex items-center px-1 py-1 rounded-md border border-gray-600 hover:bg-slate-600 ">
                        <Paperclip className="w-6 h-6 p-1 m-1  rounded-md" />
                    </div>
                    <button
                        disabled={value.length == 0}
                        onClick={handleSubmit}
                        className={` ${value.length == 0 ? "bg-gray-600 border-slate-600 hover:bg-gray-600" : ""} bg-white rounded-md hover:bg-slate-300`}>
                        <ArrowUp className="text-black font-thin w-5 h-5 m-2" />
                    </button>
                </div>
            </div>
        </div>
    );
}