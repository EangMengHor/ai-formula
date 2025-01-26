import { ArrowUp, ArrowUpRight, Files, LoaderCircle, Paperclip } from "lucide-react";
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react";
import { _useSidebar } from "../../context/SidebarContext";
import FileUploadDialog from "./file-upload-dialog/file-upload-dialog";
import { useFilesUploadMetadata } from "../../context/FilesUploadMetadata";
import AudioRecorder from "./audio-input/AudioRecorder";
import Player from "./audio-input/Player";
import { useLocation } from "react-router-dom";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export default function ChatInput({
    input,
    setInput,
    handleSubmit,
    isLoading,
    setLoading
}) {

    // global states
    const { pathname } = useLocation();
    const {
        fileCount,
        memorizedFiles,
        isMemorizationLoading,
    } = useFilesUploadMetadata();
    // component states
    const [rows, setRows] = useState(1);
    const [isTransribed, setIsTransribed] = useState(false);
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

    // trigger from voice command

    useEffect(() => {
        if (input.length > 0) {
            handleSubmit();
        }
    }, [isTransribed])


    return (
        <div className="flex w-full flex-col hide-scrollbar">
            {
                fileCount > 0 && (
                    <div className="bg-slate-600 rounded-md my-2 p-3 flex gap-2 w-fit">
                        <div>
                            <Files />
                        </div>
                        <div className="flex gap-2 flex-col">
                            <div className="flex gap-4 items-center ">
                                <p className="font-bold ">
                                    {fileCount} Files Selected
                                </p>
                                <div className="w-2 h-2 bg-white rounded-full "></div>
                                <p>
                                    {memorizedFiles.length} Files Memoried
                                </p>
                            </div>

                            {
                                isMemorizationLoading && (
                                    <div className="flex gap-2">
                                        <LoaderCircle className="animate-spin" />
                                        <p>Memorizing Files...</p>
                                    </div>
                                )
                            }

                        </div>
                    </div>
                )
            }


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
                    <div className="flex gap-2 items-center">
                        <div className="flex gap-2 rounded-md ">
                            <AudioRecorder value={input} setValue={setInput} trigger={isTransribed} setTrigger={setIsTransribed} />
                            <Player />
                        </div>
                        {
                            pathname !== '/dashboard' ? (
                                <FileUploadDialog />
                            ) : (
                                <div>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger>
                                                <div
                                                    className="flex items-center px-1 py-1 rounded-md border border-gray-600 hover:bg-slate-600 "
                                                >
                                                    <Paperclip className="w-6 h-6 p-1 m-1  rounded-md" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-600 p-2 rounded-md">
                                                <p className="capitalize">Please First Start The Conversation to get the Document Upload Section (Start By Saying Hello Or Hi! )</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>


                                </div>
                            )
                        }
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger>
                                    <button
                                        onClick={() => {
                                            window.open("https://gemini-live-five.vercel.app/", "_blank")
                                        }}
                                        className="flex items-center px-1 py-1 rounded-md border border-gray-600 hover:bg-slate-600 "
                                    >

                                        <img src="/google-gemini-icon.webp" alt="close" className="w-6 h-6 m-1  rounded-md" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-600 p-2 rounded-md">
                                    <p>Gemini Stream Realtime API</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                    </div>

                    <button
                        disabled={input.length == 0}
                        onClick={() => {
                            isLoading ? null : handleSubmit()
                        }}
                        className={` ${input.length == 0 ? "bg-gray-600 border-slate-600 hover:bg-gray-600" : ""} p-1 bg-white rounded-md hover:bg-slate-300`}>
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