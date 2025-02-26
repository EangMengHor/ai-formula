import { ArrowUp, ArrowUpRight, BookHeart, ChevronDown, ChevronUp, CircleCheck, CircleUserRound, DatabaseZap, File, Files, FileText, Globe, LoaderCircle, Paperclip, SquarePlus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useRef, useState } from "react";
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
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import getUserSuperiorPersona from "../../services/n8n-knowledge-apis/getUserSuperiorPersona";
import { formatDistanceToNow, set } from "date-fns";
import { CommandLoading } from "cmdk";
import { aiIntractions } from "../../lib/config";
const maxRows = 30;




export default function ChatInput({
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
        SupPerItems,
        setSupPerItems,
        currActiveIntraction,
        setCurrActiveIntraction
    } = useUser();
    // component states
    const [rows, setRows] = useState(1);
    const [isToolBoxOpen, setIsToolBoxOpen] = useState(false)
    const [isTransribed, setIsTransribed] = useState(false);

    const [isSupPerItemLoading, setSupPerItemLoading] = useState(false)
    const [isSupDialogOpen, setIsSupDialogOpen] = useState(false)
    const { user } = useUser()

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


    // get superior persona
    async function getSuperiorPersona() {
        if (SupPerItems.length > 0) return;
        setSupPerItemLoading(true);
        try {
            const response = await getUserSuperiorPersona(user.id);
            if (response.success && response.data.length > 0) {
                setSupPerItems(response.data.map(item => ({
                    id: item.id,
                    date: item.created_at,
                    title: item.sup_per_name,
                })))
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong",
                variant: "destructive"
            })

        } finally {
            setSupPerItemLoading(false)
        }
    }


    return (
        <div className="flex w-full flex-col animate-fade-in">
            {/* {
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
            } */}




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


                            {
                                Object.keys(selectedSuperiorPersona).length > 0 && (
                                    <div className="p-2 bg-slate-600 rounded-md relative flex gap-2 mr-2 ">
                                        <div className="absolute -top-3 -right-3 cursor-pointer" onClick={() => {
                                            setIsSuperiorPersonaAttached(false)
                                            setSelectedSuperiorPersona({})
                                        }}>
                                            <X className="w-5 h-5 rounded-md bg-slate-700 hover:bg-slate-400" />
                                        </div>
                                        <CircleUserRound />
                                        <div className="flex gap-3 items-center ">
                                            <p>{selectedSuperiorPersona.title.length > 15 ? selectedSuperiorPersona.title.slice(0, 15) + '...' : selectedSuperiorPersona.title}</p>
                                            •
                                            <p className="text-xs capitalize">{currActiveIntraction}</p>
                                        </div>

                                    </div>
                                )
                            }

                        </div>
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger>
                                    <button
                                        onClick={() => {
                                            window.open(import.meta.env.VITE_GEMINI_REALTIME_URL, "_blank")
                                        }}
                                        className="flex items-center px-1 py-1 rounded-md bg-red-400 border border-gray-600 hover:bg-slate-600 "
                                    >
                                        <img src="/small-log.png" alt="Gemini Stream Realtime API" className="w-6 h-6 m-1 rounded-md" />
                                    </button>
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
                                    Search Is {isSearchOn ? "On" : "Off"}
                                </p>
                            </div>

                            <div
                                onClick={() => setIsVectorBaseOn(!isVectorBaseOn)}
                                className={`px-4 py-2 flex gap-2 items-center ${isVectorBaseOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-fit cursor-pointer`}
                            >
                                <DatabaseZap className={`${isVectorBaseOn ? "text-white" : "text-slate-500"}`} />
                                <p className={`font-semibold ${isVectorBaseOn ? "text-white" : "text-slate-500"}`}>
                                    Knowledge Is {isVectorBaseOn ? "On" : "Off"}
                                </p>
                            </div>

                            {files.length > 0 && (
                                <div
                                    onClick={() => setIsDocumentOn(!isDocumentOn)}
                                    className={`px-4 py-2 flex gap-2 items-center ${isDocumentOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-fit cursor-pointer`}
                                >
                                    <File className={`${isDocumentOn ? "text-white" : "text-slate-500"}`} />
                                    <p className={`font-semibold ${isDocumentOn ? "text-white" : "text-slate-500"}`}>
                                        File Data Is {isDocumentOn ? "On" : "Off"}
                                    </p>
                                </div>
                            )}

                            <Dialog open={Object.keys(selectedSuperiorPersona).length == 0 && isSupDialogOpen} onOpenChange={setIsSupDialogOpen}>
                                <DialogTrigger>
                                    <div
                                        onClick={() => {
                                            if (Object.keys(selectedSuperiorPersona).length > 0) {
                                                setIsSuperiorPersonaAttached(!isSuperiorPersonaAttached)
                                                setSelectedSuperiorPersona({})

                                            }
                                            else {
                                                getSuperiorPersona()
                                            }
                                        }}
                                        className={`px-4 py-2 flex gap-2 items-center ${isSuperiorPersonaAttached && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-fit cursor-pointer`}
                                    >
                                        <BookHeart className={`${isSuperiorPersonaAttached ? "text-white" : "text-slate-500"}`} />
                                        <p className={`font-semibold ${isSuperiorPersonaAttached ? "text-white" : "text-slate-500"}`}>
                                            {isSuperiorPersonaAttached ? "Detach Superior Persona" : "Attach Superior Persona"}
                                        </p>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl bg-slate-700 p-0 border-2 border-slate-500">
                                    <Command
                                        onOpenChange={() => setIsSupDialogOpen(true)}
                                        open={false}
                                        className="bg-slate-900 text-white"
                                    >
                                        <CommandInput placeholder="Type Title Or Date (Ex. '3 days Ago' or Title) " />
                                        <CommandList className="p-4 m-4">
                                            <div className="text-slate-400">
                                                Use ▲▽ Keys Or Click To Select
                                            </div>
                                            <hr className="border-slate-300 border-2" />

                                            <div>
                                                Select Intractions
                                            </div>
                                            <div className="grid grid-rows-1 grid-cols-2 gap-2 my-2">
                                                {
                                                    aiIntractions.map((item, index) => {
                                                        const isActive = currActiveIntraction === item.value;
                                                        return (
                                                            <Card
                                                                className={`relative ${isActive ? "border-2 border-white bg-slate-700 " : "border-2 border-slate-500"} rounded-md cursor-pointer p-0 flex items-start flex-col`}
                                                                onClick={() => setCurrActiveIntraction(item.value)}>
                                                                {
                                                                    isActive && <div className="absolute top-5 right-5">
                                                                        <CircleCheck className="text-slate-300" />
                                                                    </div>
                                                                }
                                                                <img src={item.icon} alt={item.label} className="w-full h-24" />
                                                                <CardHeader className="p-2">
                                                                    <CardTitle className="font-semibold text-xl text-white">{item.label}</CardTitle>
                                                                    <p className=" text-slate-300">{item.description}</p>
                                                                </CardHeader>
                                                            </Card>

                                                        )
                                                    })
                                                }
                                            </div>



                                            <hr className="border-slate-300 border-2" />
                                            {
                                                isSupPerItemLoading && <div className="flex gap-2 w-full items-center">
                                                    <LoaderCircle className="animate-spin" />
                                                    <p>Loading Your Superior Persona</p>
                                                </div>
                                            }
                                            {
                                                !isSupPerItemLoading && <CommandEmpty> You Don't Have Any Superior Persona</CommandEmpty>
                                            }
                                            {
                                                SupPerItems && SupPerItems.length > 0 && [...SupPerItems].reverse().map((item, index) => (
                                                    <CommandItem
                                                        onSelect={(value) => {
                                                            setIsSuperiorPersonaAttached(true)
                                                            setIsSupDialogOpen(false)
                                                            setSelectedSuperiorPersona(item)
                                                        }}
                                                        key={index}
                                                        className="flex gap-2 items-start bg-slate-700  my-2">
                                                        <CircleUserRound />
                                                        <div>
                                                            <p>{item.title}</p>
                                                            <p className="text-slate-500">Created {formatDistanceToNow(item.date)} Ago</p>

                                                        </div>
                                                    </CommandItem>
                                                ))
                                            }
                                        </CommandList>
                                    </Command>

                                </DialogContent>
                            </Dialog>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}