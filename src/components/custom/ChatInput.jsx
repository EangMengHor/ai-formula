import { ArrowUp, ArrowUpRight, Files, LoaderCircle, Paperclip } from "lucide-react";
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react";
import { _useSidebar } from "../../context/SidebarContext";
import FileUploadDialog from "./file-upload-dialog/file-upload-dialog";
import { useFilesUploadMetadata } from "../../context/FilesUploadMetadata";
import AudioRecorder from "./audio-input/AudioRecorder";

export default function ChatInput({
    input,
    setInput,
    handleSubmit,
    isLoading,
    setLoading
}) {

    // global states
    const {
        fileCount,
        memorizedFiles,
        isMemorizationLoading,
    } = useFilesUploadMetadata();
    // component states
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
                        <AudioRecorder />

                        <FileUploadDialog />
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