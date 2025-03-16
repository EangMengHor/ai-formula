import { ArrowUp, ArrowUpRight, BookHeart, ChevronDown, ChevronUp, CircleCheck, CircleUserRound, DatabaseZap, File, Files, FileText, Globe, LoaderCircle, Paperclip, SquarePlus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea"
import { memo, useEffect, useRef, useState } from "react";
import { _useSidebar } from "../../context/SidebarContext";
import FileUploadDialog from "./file-upload-dialog/file-upload-dialog";
import { useFilesUploadMetadata } from "../../context/FilesUploadMetadata";
import AudioRecorder from "./audio-input/AudioRecorder";
import Player from "./audio-input/Player";
import { useLocation, useParams } from "react-router-dom";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUser } from "../../context/UserContext";
import { AnimatePresence, motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"

import { useToast } from "../../hooks/use-toast";
import { useStackSidebar } from "../../context/StackSidebarContext";
import GroupSuperiorPersonaSection from "./GroupSuperiorPersonaSection";
const maxRows = 30;



function ChatInput({
    input,
    setInput,
    handleSubmit,
    isLoading,
    setLoading,
    handleScroll
}) {
    // global states
    const { id } = useParams();
    const { pathname } = useLocation();
    const {
        fileCount,
        memorizedFiles,
        isMemorizationLoading,
        resetAllStates,
        files
    } = useFilesUploadMetadata();
    const {
        isDocumentOn,
        setIsDocumentOn,
        isSearchOn,
        setIsSearchOn,
        isVectorBaseOn,
        setIsVectorBaseOn,
        isSuperiorPersonaAttached,
        setIsSuperiorPersonaAttached,
        selectedSuperiorPersona,
        setSelectedSuperiorPersona,

    } = useUser();
    const { sidebarStack } = useStackSidebar();
    // component states
    const [fetchSuperiorPersona, setFetchSuperiorPersona] = useState(null);

    const [rows, setRows] = useState(1);
    const [isToolBoxOpen, setIsToolBoxOpen] = useState(false)
    const [isTransribed, setIsTransribed] = useState(false);

    const [isSupDialogOpen, setIsSupDialogOpen] = useState(false)
    const { toast } = useToast();
    // superiro persona

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

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (input.length > 0 && !isLoading) {
                handleSubmit();
            }
        } else if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault();
            const cursorPosition = event.target.selectionStart;
            const textBeforeCursor = input.substring(0, cursorPosition);
            const textAfterCursor = input.substring(cursorPosition);
            setInput(textBeforeCursor + "\n" + textAfterCursor);
            setRows(rows + 1);
        }
    };

    // trigger from voice command

    useEffect(() => {
        if (input.length > 0) {
            handleSubmit();

        }
    }, [isTransribed])

    // file scroller
    const scrollContainerRef = useRef(null);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft -= 300; // Adjust scroll distance as needed
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft += 300; // Adjust scroll distance as needed
        }
    };


    // clean up on route change
    useEffect(() => {
        if (pathname.includes('/dashboard')) {
            resetAllStates();
        }
    }, [pathname])




    useEffect(() => {
        console.log(isSuperiorPersonaAttached, 'isSuperiorPersonaAttached')
    }, [isSuperiorPersonaAttached])
    return (
        <div className="flex w-full flex-col animate-fade-in">


            <motion.div
                className={`relative flex items-center ${files.length > 0 ? "" : "hidden"}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: files.length > 0 ? 1 : 0, y: files.length > 0 ? 0 : -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
            >
                {
                    files.length > 3 &&
                    <button
                        onClick={scrollLeft}
                        className="absolute left-0 z-10 px-2 py-1 ml-2 border-2 border-gray-700 bg-gray-700/50 text-white rounded-md hover:bg-gray-600"
                    >
                        <ChevronLeft />
                    </button>
                }
                <div
                    ref={scrollContainerRef}
                    className="flex gap-2 items-center overflow-x-scroll scroll-smooth hide-scrollbar"
                >
                    {
                        files.filter(file => memorizedFiles.includes(file.name)).length > 0 && (
                            files.filter(file => memorizedFiles.includes(file.name)).map((file, index) => (
                                <div
                                    key={index}
                                    className="bg-[#2a3444]/80 backdrop-blur-sm rounded-lg px-2 py-2 my-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-gray-200 p-3 rounded-lg">
                                                <FileText className="w-5 h-5 text-gray-700" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h3 className="text-white font-medium truncate  w-full">{file.name.length > 25 ? file.name.slice(0, 25) + '...' : file.name}
                                                </h3>
                                                <p className="text-sm text-gray-400 truncate">
                                                    <span className="uppercase">{file.type.replaceAll('application/', '')}</span> File
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))
                        )
                    }
                </div>


                {
                    files.length > 3 &&
                    <button
                        onClick={scrollRight}
                        className="absolute right-0 z-10 px-2 py-1 bg-gray-700/50 text-white rounded-md hover:bg-gray-600"
                    >
                        <ChevronRight />
                    </button>
                }
            </motion.div>

            {/* <p className="text-center font-bold text-4xl font-mono mb-5">Let's Start The Todays Science!</p> */}
            <div className="border border-gray-800 bg-slate-800 hide-scrollbar rounded-lg p-2">


                <Textarea
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
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
                                                    className="flex items-center px-1 py-1 rounded-md border border-gray-600 "
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
                        <div className="flex gap-2 items-center">
                            <div
                                onClick={() => {
                                    setIsToolBoxOpen(!isToolBoxOpen)
                                }}
                                className="px-4 py-2 rounded-md bg-slate-600 cursor-pointer flex gap-2">
                                {
                                    isSearchOn && <Globe />
                                }
                                {
                                    isDocumentOn && <File />
                                }
                                {
                                    isVectorBaseOn && <DatabaseZap />
                                }
                                {
                                    isSuperiorPersonaAttached && <CircleUserRound />
                                }

                                {/* default */}
                                {
                                    !isSearchOn && !isDocumentOn && !isVectorBaseOn && !isSuperiorPersonaAttached && <div className="flex gap-2 font-semibold">
                                        <SquarePlus />
                                        Tool Box
                                    </div>
                                }
                                {
                                    !isToolBoxOpen ? <ChevronDown /> : <ChevronUp />
                                }
                            </div>

                            {/* TODO: make the dialog where user can check the details for superior persona and selected Interection mode  */}

                            {

                                selectedSuperiorPersona.length > 0 && (
                                    <div className="p-2 bg-slate-600 hover:bg-slate-500 transition-all cursor-pointer rounded-md relative flex gap-2 mr-2 ">
                                        <div className="absolute -top-3 -right-3 cursor-pointer" onClick={() => {
                                            setIsSuperiorPersonaAttached(false)
                                            setSelectedSuperiorPersona([])
                                        }}>
                                            <X className="w-5 h-5 rounded-md bg-slate-700 hover:bg-slate-400" />
                                        </div>
                                        <CircleUserRound />
                                        <div className="flex gap-3 items-center  ">
                                            <p>{sidebarStack.length > 0 ? `${selectedSuperiorPersona.length} Selected` : `${selectedSuperiorPersona.length} Superior Persona Selected`}</p>
                                            {/* <p className="text-slate-400">Click</p> */}
                                        </div>
                                    </div>
                                )
                            }


                        </div>
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger>
                                    {
                                        sidebarStack.length == 0 && (
                                            <button
                                                onClick={() => {
                                                    window.open(import.meta.env.VITE_GEMINI_REALTIME_URL, "_blank")
                                                }}
                                                className="flex items-center px-1 py-1 rounded-md bg-red-400 border border-gray-600 hover:bg-slate-600 "
                                            >
                                                <img src="/small-log.png" alt="Gemini Stream Realtime API" className="w-6 h-6 m-1 rounded-md" />
                                            </button>
                                        )
                                    }
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-600 p-2 rounded-md">
                                    <p>Up coming realtime</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>


                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger>
                                    <button
                                        onClick={() => {
                                            let url = import.meta.env.VITE_OPENAI_REALTIME_URL;
                                            url = files.length > 0
                                                ? `${import.meta.env.VITE_OPENAI_REALTIME_URL}?documentCount=${fileCount}&memorizedCount=${memorizedFiles.length}&fileNames=${files.slice(0, 20).map(file => file.name).join('||||')}&namespace=${id || ''}`
                                                : id && id != undefined ? `${import.meta.env.VITE_OPENAI_REALTIME_URL}?namespace=${id}` : import.meta.env.VITE_OPENAI_REALTIME_URL;

                                            window.open(url, "_blank");
                                        }}
                                        className="flex items-center px-1 py-1 rounded-md border bg-green-300 hover:bg-slate-400  "
                                    >
                                        <img src="/small-log.png" alt="Gemini Stream Realtime API" className="w-6 h-6 m-1 rounded-md  " />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-600 p-2 rounded-md">
                                    <p>New Realtime</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger>
                                    <div onClick={handleScroll} className="cursor-pointer flex gap-2 items-center bg-slate-700 px-2 py-2 rounded-md">
                                        <ChevronDown />
                                    </div>

                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-600 p-2 rounded-md">
                                    <p>Scroll To Bottom</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <button
                        disabled={input.length === 0}
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
                <AnimatePresence>
                    {isToolBoxOpen && (
                        <motion.div
                            key="toolbox"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }} // Moves up when disappearing
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="flex gap-2  mt-2 border-t border-slate-500  pt-2"
                        >
                            <div
                                onClick={() => setIsSearchOn(!isSearchOn)}
                                className={`px-4 py-2 flex gap-2 items-center ${isSearchOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-fit cursor-pointer`}
                            >
                                <Globe className={`${isSearchOn ? "text-white" : "text-slate-500"}`} />
                                <p className={`font-semibold ${isSearchOn ? "text-white" : "text-slate-500"}`}>
                                    {
                                        sidebarStack.length > 0 ? ("Search") : (`Search Is ${isSearchOn ? "On" : "Off"}`)
                                    }
                                </p>
                            </div>

                            <div
                                onClick={() => setIsVectorBaseOn(!isVectorBaseOn)}
                                className={`px-4 py-2 flex gap-2 items-center ${isVectorBaseOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-fit cursor-pointer`}
                            >
                                <DatabaseZap className={`${isVectorBaseOn ? "text-white" : "text-slate-500"}`} />
                                <p className={`font-semibold ${isVectorBaseOn ? "text-white" : "text-slate-500"}`}>
                                    {
                                        sidebarStack.length > 0 ? ("Knowledge") : (`Knowledge Base Is ${isVectorBaseOn ? "On" : "Off"}`)
                                    }
                                </p>
                            </div>

                            {files.length > 0 && (
                                <div
                                    onClick={() => setIsDocumentOn(!isDocumentOn)}
                                    className={`px-4 py-2 flex gap-2 items-center ${isDocumentOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-fit cursor-pointer`}
                                >
                                    <File className={`${isDocumentOn ? "text-white" : "text-slate-500"}`} />
                                    <p className={`font-semibold ${isDocumentOn ? "text-white" : "text-slate-500"}`}>
                                        {
                                            sidebarStack.length > 0 ? ("Files Data") : (`File Data Is ${isDocumentOn ? "On" : "Off"}`)
                                        }
                                    </p>
                                </div>
                            )}
                            <Dialog open={isSupDialogOpen} onOpenChange={setIsSupDialogOpen}>
                                <DialogTrigger>
                                    <div
                                        onClick={() => {
                                            console.log(fetchSuperiorPersona, 'fetchSuperiorPersona')
                                            if (fetchSuperiorPersona) fetchSuperiorPersona()
                                        }}
                                        className={`px-4 py-2 flex gap-2 items-center ${selectedSuperiorPersona.length > 0 && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-fit cursor-pointer`}
                                    >
                                        <BookHeart className={`${selectedSuperiorPersona.length > 0 ? "text-white" : "text-slate-500"}`} />
                                        <p className={`font-semibold ${selectedSuperiorPersona.length > 0 ? "text-white" : "text-slate-500"}`}>
                                            {
                                                sidebarStack.length > 0 ? (
                                                    selectedSuperiorPersona.length > 0 ? "Manage" : "Attach"
                                                ) : (
                                                    selectedSuperiorPersona.length > 0 ? "Manage Superior Personas" : "Attach Superior Persona"
                                                )
                                            }
                                        </p>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-5xl h-[80%] bg-slate-700 p-0 border-2 border-slate-500 overflow-y-scroll">

                                    <GroupSuperiorPersonaSection onFetchSuperiorPersona={setFetchSuperiorPersona} />


                                </DialogContent>
                            </Dialog>

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default memo(ChatInput);


function SelectedPersonaDetails({
    selectedSuperiorPersona
}) {

    return (
        <div>

        </div>
    )
}