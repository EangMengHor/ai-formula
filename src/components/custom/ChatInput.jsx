import { ArrowUp, ArrowUpRight, LoaderCircle, Paperclip } from "lucide-react";
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react";
import { _useSidebar } from "../../context/SidebarContext";

export default function ChatInput({
    input,
    setInput,
    handleSubmit,
    isLoading,
    setLoading
}) {
    const [rows, setRows] = useState(1);
    const maxRows = 30;
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

        setInput(event.target.value);
        setRows(currentRows < maxRows ? currentRows : maxRows);
    };


    return (
        <div className="flex w-full flex-col hide-scrollbar">
            {/* <p className="text-center font-bold text-4xl font-mono mb-5">Let's Start The Todays Science!</p> */}
            <div className="border border-gray-800 bg-slate-800 hide-scrollbar rounded-lg p-2">
                <Textarea
                    value={input}
                    onChange={handleChange}
                    rows={rows}
                    maxRows={maxRows}
                    className={`ring-0-0 resize-none border-0 focus:ring-0 focus-visible:ring-0 `}
                    type="text"
                    placeholder="Type a message"
                />
                <div className="flex justify-between">
                    <div className="flex items-center px-1 py-1 rounded-md border border-gray-600 hover:bg-slate-600 ">
                        <Paperclip className="w-6 h-6 p-1 m-1  rounded-md" />
                    </div>
                    <button
                        disabled={input.length == 0}
                        onClick={() => {
                            isLoading ? null : handleSubmit()
                        }}
                        className={` ${input.length == 0 ? "bg-gray-600 border-slate-600 hover:bg-gray-600" : ""} bg-white rounded-md hover:bg-slate-300`}>
                        {
                            isLoading ? (
                                <LoaderCircle className="animate-spin  w-5 h-5 m-2 text-black mx-3" />
                            ) : (
                                <ArrowUp className="text-black font-thin w-5 h-5 m-2" />
                            )
                        }

                    </button>
                </div>
            </div>
        </div>
    );
}