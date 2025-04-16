import { ArrowRight, ArrowUp, ArrowUpRight, AudioLines, AudioWaveform, BookHeart, BrainCog, Camera, ChevronDown, ChevronUp, CircleCheck, CircleUserRound, DatabaseZap, DiamondPlus, File, Files, FileText, Flame, Globe, LoaderCircle, MonitorUp, Paperclip, SquarePlus, X } from "lucide-react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"

import { useToast } from "../../hooks/use-toast";
import { useStackSidebar } from "../../context/StackSidebarContext";
import GroupSuperiorPersonaSection from "./GroupSuperiorPersonaSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";
import { useDomain } from "@/context/WhichDomainContext";
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
    const { domainState } = useDomain();
    useEffect(() => {
        console.log(domainState, 'domainState')
    }, [domainState])
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
        isDeepThinkMode, // Use context state
        setIsDeepThinkMode, // Use context setter
    } = useUser();
    const { sidebarStack } = useStackSidebar();
    const isMobile = useIsMobile();

    // component states
    const [fetchSuperiorPersona, setFetchSuperiorPersona] = useState(null);
    const [rows, setRows] = useState(1);
    const [isToolBoxOpen, setIsToolBoxOpen] = useState(false)
    const [isTransribed, setIsTransribed] = useState(false);

    const [isSupDialogOpen, setIsSupDialogOpen] = useState(false)
    const { toast } = useToast();
    console.log(pathname.includes('dashboard'), "asdfsdf")
    const [open, setOpen] = useState(false)

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
        <div className="flex w-full flex-col animate-fade-in ">
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
            <div className=" bg-gray-900 hide-scrollbar rounded-2xl p-2 ">
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
                    <div className="flex gap-1 items-center justify-center  " >
                        <div className="flex gap-2 rounded-md">
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
                                                    className="flex items-center rounded-lg p-2 hover:bg-gray-800"
                                                >
                                                    <Paperclip className="w-5 h-5  " />
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
                        <div>
                            <DropdownMenu open={open} onOpenChange={(val) => { setOpen(val) }}>
                                <DropdownMenuTrigger className="p-2 text-slate-300 text-sm items-center border-0 ring-0 hover:bg-slate-800 rounded-md px-3 py-1 focus:ring-0 focus:ring-transparent focus:ring-offset-0 flex gap-2 ">
                                    {
                                        !isDeepThinkMode ? "Quick Response" : "Deep Thinking" // Use context state
                                    }
                                    {
                                        open ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />
                                    }
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-0">
                                    {/* Quick Response Option */}
                                    <div className="flex flex-col divide-y divide-[#2a3042]">
                                        <div
                                            className="flex items-start gap-3 py-3 px-4 cursor-pointer bg-slate-800 hover:bg-[#252b3b]"
                                            onClick={() => {
                                                setIsDeepThinkMode(false) // Set context state
                                                setOpen((prev) => !prev)
                                            }}
                                        >
                                            <div className="mt-1">
                                                <Flame className="text-white w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-[15px] text-[#e6e9f0]">Quick response</span>
                                                    <span className="text-xs text-[#8b93a7]">2-3 sec</span>
                                                </div>
                                                <span className="text-xs text-[#8b93a7] mt-0.5">Best for everyday conversation</span>
                                            </div>
                                            <div className="ml-auto mt-1">
                                                {!isDeepThinkMode ? ( // Check context state
                                                    <div className="h-4 w-4 rounded-full bg-purple-500 flex items-center justify-center"></div>
                                                ) : (
                                                    <div className="h-4 w-4 rounded-full border border-gray-600 flex items-center justify-center"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Deep Think Option */}
                                    <div className="flex flex-col divide-y divide-[#2a3042]">
                                        <div
                                            className="flex items-start gap-3 py-3 px-4 cursor-pointer bg-slate-800 hover:bg-[#252b3b]"
                                            onClick={() => {
                                                setIsDeepThinkMode(true) // Set context state
                                                setOpen((prev) => !prev)
                                            }}
                                        >
                                            <div className="mt-1">
                                                <BrainCog className="text-white w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-[15px] text-[#e6e9f0]">Deep Think & Executor</span>
                                                    <span className="text-xs text-[#8b93a7]">45s - 2m</span>
                                                </div>
                                                {/* TODO: Update description if needed */}
                                                <span className="text-xs text-[#8b93a7] mt-0.5">Best for complex tasks & analysis</span>
                                            </div>
                                            <div className="ml-auto mt-1">
                                                {isDeepThinkMode ? ( // Check context state
                                                    <div className="h-4 w-4 rounded-full bg-purple-500 flex items-center justify-center"></div>
                                                ) : (
                                                    <div className="h-4 w-4 rounded-full border border-gray-600 flex items-center justify-center"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>


                    <div className="flex gap-1 items-center">
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger>
                                    <div onClick={handleScroll} className={`${pathname.includes('dashboard') ? "hidden" : "md:flex"} cursor-pointer p-2 hover:bg-gray-800 hidden items-center  rounded-md`}>
                                        <ChevronDown className="w-5 h-5" />
                                    </div>

                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-600 p-2 rounded-md">
                                    <p>Scroll To Bottom</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <div className="flex gap-2 items-center">

                            <div className="flex gap-2 items-center">
                                <div
                                    onClick={() => {
                                        setIsToolBoxOpen(!isToolBoxOpen)
                                    }}
                                    className="px-2 py-2 rounded-md bg-slate-900 hover:bg-slate-800 cursor-pointer flex gap-2">
                                    {
                                        isSearchOn && <Globe className="w-4 h-4" />
                                    }
                                    {
                                        isDocumentOn && <File className="w-4 h-4" />
                                    }
                                    {
                                        isVectorBaseOn && <DatabaseZap className="w-4 h-4" />
                                    }
                                    {
                                        isSuperiorPersonaAttached && <CircleUserRound className="w-4 h-4" />
                                    }

                                    {/* default */}
                                    {
                                        !isSearchOn && !isDocumentOn && !isVectorBaseOn && !isSuperiorPersonaAttached && <div className="flex gap-2 font-semibold">
                                            <DiamondPlus className="w-5 h-5" />
                                        </div>
                                    }

                                </div>

                                {/* TODO: make the dialog where user can check the details for superior persona and selected Interection mode  */}

                                {

                                    selectedSuperiorPersona.length > 0 && !isMobile && (
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
                        </div>
                        {/* right side */}
                        {
                            isMobile && (
                                <div className="">
                                    <Drawer>
                                        <DrawerTrigger>
                                            <TooltipProvider>
                                                <Tooltip delayDuration={0}>
                                                    <TooltipTrigger >
                                                        <div className="cursor-pointer gap-2 items-center bg-slate-800 p-2 rounded-md">
                                                            <AudioLines className="w-5 h-5" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Use ARX Voice Technology</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </DrawerTrigger>
                                        <DrawerContent className="bg-slate-600 flex flex-col gap-2">
                                            <div
                                                onClick={() => {
                                                    let url = import.meta.env.VITE_OPENAI_REALTIME_URL;
                                                    url = files.length > 0
                                                        ? `${import.meta.env.VITE_OPENAI_REALTIME_URL}?documentCount=${fileCount}&memorizedCount=${memorizedFiles.length}&fileNames=${files.slice(0, 20).map(file => file.name).join('||||')}&namespace=${id || ''}`
                                                        : id && id != undefined ? `${import.meta.env.VITE_OPENAI_REALTIME_URL}?namespace=${id}` : import.meta.env.VITE_OPENAI_REALTIME_URL;

                                                    window.open(url, "_blank");
                                                }}
                                                className="flex flex-col justify-between bg-slate-600 hover:bg-slate-800 p-2 rounded-md transition-all items-start w-full mt-2">
                                                {/* left */}
                                                <div className="flex gap-2">
                                                    {/* image */}
                                                    <div className="flex items-center h-fit px-2 py-1 rounded-md bg-green-400 w-fit">
                                                        <img src="/small-log.png" alt="Stream Realtime API" className="w-6 h-6 m-1 rounded-md" />
                                                    </div>
                                                    {/* content */}
                                                    <div className="flex flex-col leading-5">
                                                        <p className="font-semibold text-white">ARX Next Voice Agent (Highly Recommended)</p>
                                                        <p className="text-slate-300">ARX Next Can Access Voice • Most Superior And Fast • Automation Features</p>
                                                        <div className="flex gap-1 mt-2">
                                                            <div className="bg-slate-800 rounded-md p-2">
                                                                <AudioWaveform className="text-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => {
                                                    window.open(import.meta.env.VITE_GEMINI_REALTIME_URL, "_blank")
                                                }}
                                                className="flex flex-col gap-2  justify-between bg-slate-600 hover:bg-slate-800 p-2 rounded-md transition-all items-start w-full">
                                                {/* left */}
                                                <div className="flex gap-2">
                                                    {/* image */}
                                                    <div className="flex items-center h-fit px-2 py-1 rounded-md bg-red-400">
                                                        <img src="/small-log.png" alt="Stream Realtime API" className="w-6 h-6 m-1 rounded-md" />
                                                    </div>
                                                    {/* content */}
                                                    <div className="flex flex-col leading-5">
                                                        <p className="font-semibold text-white">ARX Purle Voice Agent (Coming Soon)</p>
                                                        <p className="text-slate-300">ARX Pulse Can Access Voice ,Screen And Camara Sharing • Full Version Coming Soon</p>
                                                        {/* right */}
                                                        <div className="flex gap-1 mt-2">
                                                            <div className="bg-slate-800 rounded-md p-2">
                                                                <AudioWaveform className="text-white" />
                                                            </div>
                                                            <div className="bg-slate-800 rounded-md p-2">
                                                                <Camera className="text-white" />
                                                            </div>
                                                            <div className="bg-slate-800 rounded-md p-2">
                                                                <MonitorUp className="text-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>

                                        </DrawerContent>
                                    </Drawer>
                                </div>
                            )
                        }

                        <div className="md:flex hidden">
                            <Dialog>
                                <DialogTrigger>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger >
                                                <div className="cursor-pointer  md:flex hidden gap-2 items-center p-2 rounded-md hover:bg-gray-800  mr-2 ">
                                                    <AudioLines className="w-5 h-5 " />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Use ARX Voice Technology</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </DialogTrigger>
                                <DialogContent className="max-w-5xl bg-slate-700">
                                    <p className="font-semibold text-white text-2xl">Select Suitable Voice Agent</p>

                                    <div className="flex flex-col h-full gap-2 py-2 rounded-md cursor-pointer  transition-all ">
                                        <div
                                            onClick={() => {
                                                let url = domainState && domainState == 1 ? import.meta.env.VITE_OPENAI_REALTIME_URL : import.meta.env.VITE_OPENAI_REALTIME_URL2;
                                                console.log(url, 'url', import.meta.env.VITE_OPENAI_REALTIME_URL2)
                                                url = files.length > 0
                                                    ? `${url}?documentCount=${fileCount}&memorizedCount=${memorizedFiles.length}&fileNames=${files.slice(0, 20).map(file => file.name).join('||||')}&namespace=${id || ''}`
                                                    : id && id != undefined ? `${url}?namespace=${id}` : url;

                                                window.open(url, "_blank");
                                            }}
                                            className="flex justify-between bg-slate-600 hover:bg-slate-800 p-2 rounded-md transition-all items-center w-full mt-2">
                                            {/* left */}
                                            <div className="flex gap-2">
                                                {/* image */}
                                                <div className="flex items-center px-1 py-1 rounded-md bg-green-400 w-fit">
                                                    <img src="/small-log.png" alt="Stream Realtime API" className="w-6 h-6 m-1 rounded-md" />
                                                </div>
                                                {/* content */}
                                                <div className="flex flex-col leading-5">
                                                    <p className="font-semibold text-white">ARX Next Voice Agent (Highly Recommended)</p>
                                                    <p className="text-slate-300">ARX Next Can Access Voice • Most Superior And Fast • Automation Features</p>
                                                </div>
                                            </div>
                                            {/* right */}
                                            <div className="flex gap-1">
                                                <div className="bg-slate-800 rounded-md p-2">
                                                    <AudioWaveform className="text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => {
                                                const url = domainState && domainState == 1 ? import.meta.env.VITE_GEMINI_REALTIME_URL : import.meta.env.VITE_GEMINI_REALTIME_URL2;
                                                console.log(url, "kajlsdhfklasjd839472509382")
                                                window.open(url, "_blank")
                                            }}
                                            className="flex justify-between bg-slate-600 hover:bg-slate-800 p-2 rounded-md transition-all items-center w-full">
                                            {/* left */}
                                            <div className="flex gap-2">
                                                {/* image */}
                                                <div className="flex items-center px-1 py-1 rounded-md bg-red-400 w-fit">
                                                    <img src="/small-log.png" alt="Stream Realtime API" className="w-6 h-6 m-1 rounded-md" />
                                                </div>
                                                {/* content */}
                                                <div className="flex flex-col leading-5">
                                                    <p className="font-semibold text-white">ARX Purle Voice Agent (Coming Soon)</p>
                                                    <p className="text-slate-300">ARX Pulse Can Access Voice ,Screen And Camara Sharing • Full Version Coming Soon</p>
                                                </div>
                                            </div>
                                            {/* right */}
                                            <div className="flex gap-1">
                                                <div className="bg-slate-800 rounded-md p-2">
                                                    <AudioWaveform className="text-white" />
                                                </div>
                                                <div className="bg-slate-800 rounded-md p-2">
                                                    <Camera className="text-white" />
                                                </div>
                                                <div className="bg-slate-800 rounded-md p-2">
                                                    <MonitorUp className="text-white" />
                                                </div>
                                            </div>
                                        </div>




                                    </div>
                                    {/* <button
                                        onClick={() => {
                                            window.open(import.meta.env.VITE_GEMINI_REALTIME_URL, "_blank")
                                        }}
                                        className="flex items-center px-1 py-1 rounded-md bg-red-400 border border-gray-600 hover:bg-slate-600 w-fit"
                                    >
                                        <div className="flex w-fit">
                                            <img src="/small-log.png" alt="Stream Realtime API" className="w-6 h-6 m-1 rounded-md" />
                                        </div>
                                    </button> */}

                                </DialogContent>
                            </Dialog>

                        </div>
                        <button
                            disabled={input.length === 0 || isLoading} // Disable if loading
                            onClick={() => {
                                isLoading ? null : handleSubmit()
                            }}
                            className={` ${input.length === 0 || isLoading ? "bg-gray-600 border-slate-600 hover:bg-gray-600 cursor-not-allowed" : "bg-white hover:bg-slate-300"} rounded-md `}>
                            {
                                isLoading ? (
                                    <LoaderCircle className="animate-spin  w-5 h-5 m-2 text-black mx-3" />
                                ) : (
                                    <ArrowRight className="text-black font-thin w-5 h-5 m-2" />
                                )
                            }

                        </button>
                    </div>
                </div>
                <AnimatePresence>

                    <Drawer open={isMobile && isToolBoxOpen} onOpenChange={() => {
                        setIsToolBoxOpen(!isToolBoxOpen)
                    }}>
                        <DrawerContent className=" bg-slate-900 md:hidden px-3 py-2">
                            <AnimatePresence>
                                {selectedSuperiorPersona.length > 0 && (
                                    <motion.div
                                        className="my-4 flex flex-col gap-2"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <p className="font-semibold text-white">Superior Persona</p>
                                        <motion.div
                                            className="p-2 bg-slate-600 transition-all cursor-pointer rounded-md flex gap-2 flex-col mr-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="flex gap-2 text-white">
                                                <CircleUserRound className="text-white" />
                                                <p>
                                                    {sidebarStack.length > 0
                                                        ? `${selectedSuperiorPersona.length} Selected`
                                                        : `${selectedSuperiorPersona.length} Superior Persona Selected`}
                                                </p>
                                            </div>
                                            <div>
                                                <Button
                                                    onClick={() => {
                                                        setIsSuperiorPersonaAttached(false);
                                                        setSelectedSuperiorPersona([]);
                                                    }}
                                                    variant="outline"
                                                    className="bg-slate-800 border-none text-white hover:bg-slate-700 hover:text-white"
                                                >
                                                    Remove All Selected Superior Persona
                                                </Button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <p className="font-semibold text-white mb-2">Select Tools</p>
                            <div className="flex gap-2 flex-col">
                                <div
                                    onClick={() => setIsSearchOn(!isSearchOn)}
                                    className={`px-4 py-2 flex gap-2 items-center ${isSearchOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-full cursor-pointer`}
                                >
                                    <Globe className={`${isSearchOn ? "text-white" : "text-slate-500"}`} />
                                    <p className={`font-semibold ${isSearchOn ? "text-white" : "text-slate-500"}`}>
                                        {
                                            sidebarStack.length > 0 ? ("Search") : (`Search Is ${isSearchOn ? "On" : "Off"}`)
                                        }
                                    </p>
                                </div>
                                {/* knowledge base */}
                                <div
                                    onClick={() => setIsVectorBaseOn(!isVectorBaseOn)}
                                    className={`px-4 py-2 flex gap-2 items-center ${isVectorBaseOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-full cursor-pointer`}
                                >
                                    <DatabaseZap className={`${isVectorBaseOn ? "text-white" : "text-slate-500"}`} />
                                    <p className={`font-semibold ${isVectorBaseOn ? "text-white" : "text-slate-500"}`}>
                                        {
                                            sidebarStack.length > 0 ? ("Knowledge") : (`Knowledge Base Is ${isVectorBaseOn ? "On" : "Off"}`)
                                        }
                                    </p>
                                </div>
                                {/* file data */}
                                {files.length > 0 && (
                                    <div
                                        onClick={() => setIsDocumentOn(!isDocumentOn)}
                                        className={`px-4 py-2 flex gap-2 items-center ${isDocumentOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-full cursor-pointer`}
                                    >
                                        <File className={`${isDocumentOn ? "text-white" : "text-slate-500"}`} />
                                        <p className={`font-semibold ${isDocumentOn ? "text-white" : "text-slate-500"}`}>
                                            {
                                                sidebarStack.length > 0 ? ("Files Data") : (`File Data Is ${isDocumentOn ? "On" : "Off"}`)
                                            }
                                        </p>
                                    </div>
                                )}

                                <Drawer>
                                    <DrawerTrigger>
                                        <div
                                            onClick={() => {
                                                console.log(fetchSuperiorPersona, 'fetchSuperiorPersona')
                                                if (fetchSuperiorPersona) fetchSuperiorPersona()
                                            }}
                                            className={`px-4 py-2 flex gap-2 items-center ${selectedSuperiorPersona.length > 0 && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-full cursor-pointer`}
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
                                    </DrawerTrigger>
                                    <DrawerContent className="bg-slate-900 max-h-[75%]">
                                        <div className="overflow-scroll m-2">
                                            <GroupSuperiorPersonaSection onFetchSuperiorPersona={setFetchSuperiorPersona} />

                                        </div>

                                    </DrawerContent>
                                </Drawer>

                            </div>
                        </DrawerContent>
                    </Drawer>


                    {isToolBoxOpen && !isMobile && ( // Ensure it doesn't render on mobile
                        <motion.div
                            key="toolbox"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }} // Moves up when disappearing
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="md:flex hidden gap-2  mt-2 border-t border-slate-500  pt-2 w-full overflow-x-auto hide-scrollbar" // Added overflow-x-auto and hide-scrollbar
                        >
                            <div
                                onClick={() => setIsSearchOn(!isSearchOn)}
                                className={`px-4 py-2 flex gap-2 items-center ${isSearchOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-fit cursor-pointer flex-shrink-0`} // Added flex-shrink-0
                            >
                                <Globe className={`${isSearchOn ? "text-white" : "text-slate-500"}`} />
                                <p className={`font-semibold ${isSearchOn ? "text-white" : "text-slate-500"}`}>
                                    {sidebarStack.length > 0 ? ("Search") : (`Search Is ${isSearchOn ? "On" : "Off"}`)}
                                </p>
                            </div>

                            <div
                                onClick={() => setIsVectorBaseOn(!isVectorBaseOn)}
                                className={`px-4 py-2 flex gap-2 items-center ${isVectorBaseOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-fit cursor-pointer flex-shrink-0`} // Added flex-shrink-0
                            >
                                <DatabaseZap className={`${isVectorBaseOn ? "text-white" : "text-slate-500"}`} />
                                <p className={`font-semibold ${isVectorBaseOn ? "text-white" : "text-slate-500"}`}>
                                    {sidebarStack.length > 0 ? ("Knowledge") : (`Knowledge Base Is ${isVectorBaseOn ? "On" : "Off"}`)}
                                </p>
                            </div>

                            {files.length > 0 && (
                                <div
                                    onClick={() => setIsDocumentOn(!isDocumentOn)}
                                    className={`px-4 py-2 flex gap-2 items-center ${isDocumentOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-fit cursor-pointer flex-shrink-0`} // Added flex-shrink-0
                                >
                                    <File className={`${isDocumentOn ? "text-white" : "text-slate-500"}`} />
                                    <p className={`font-semibold ${isDocumentOn ? "text-white" : "text-slate-500"}`}>
                                        {sidebarStack.length > 0 ? ("Files Data") : (`File Data Is ${isDocumentOn ? "On" : "Off"}`)}
                                    </p>
                                </div>
                            )}
                            <Dialog open={isSupDialogOpen} onOpenChange={setIsSupDialogOpen}>
                                <DialogTrigger asChild> {/* Use asChild to avoid nested buttons */}
                                    <div
                                        onClick={() => {
                                            if (fetchSuperiorPersona) fetchSuperiorPersona()
                                        }}
                                        className={`px-4 py-2 flex gap-2 items-center ${selectedSuperiorPersona.length > 0 && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-fit cursor-pointer flex-shrink-0`} // Added flex-shrink-0
                                    >
                                        <BookHeart className={`${selectedSuperiorPersona.length > 0 ? "text-white" : "text-slate-500"}`} />
                                        <p className={`font-semibold ${selectedSuperiorPersona.length > 0 ? "text-white" : "text-slate-500"}`}>
                                            {sidebarStack.length > 0 ? (selectedSuperiorPersona.length > 0 ? "Manage" : "Attach") : (selectedSuperiorPersona.length > 0 ? "Manage Superior Personas" : "Attach Superior Persona")}
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


