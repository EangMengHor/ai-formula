"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Atom, Check, CircleArrowOutUpRight, LoaderCircle } from 'lucide-react'
import { motion } from "framer-motion"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "../../../../components/ui/separator"
import { useToast } from "../../../../hooks/use-toast"
import editGeneratedPersona from "../../../../services/n8n-knowledge-apis/editGeneratedPersona"
import { getFavicon } from "../../../../lib/utils"

const descriptionLength = 120
const editableField = [
    { label: 'Knowledge Base Search', value: 'knowledgeBaseSearch' },
    { label: 'Task', value: 'task' },
    { label: 'Output Format', value: 'outputFormat' },
    { label: 'Source Links', value: 'sourceLinks' },
    { label: 'External Access', value: 'isExternalAllowed' },
    { label: 'Name', value: 'name' },
    { label: 'Description', value: 'description' },
]
export default function PersonaCard({ isEditable, persona, setPersona, isKnowledgeCard = false, sources = [], KnowledgeLoading = false, isMemoried = false }) {
    const [expanded, setExpanded] = useState(false)
    const [open, setOpen] = useState(false)
    const [selectedEditableField, setSelectedEditableField] = useState([])
    const [isEditLoading, setIsEditLoading] = useState(false)
    const [prompt, setPrompt] = useState("")
    const inputRef = useRef(null);
    const [editedFields, setEditedFields] = useState([])
    const { toast } = useToast()

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);
    function a() {
        console.log("B")
    }
    const editField = useCallback(async () => {
        setOpen(false);
        if (prompt.length <= 0) {
            return;
        }
        setIsEditLoading(true);
        try {
            console.log("Selected Fields", selectedEditableField);
            const res = await editGeneratedPersona({
                persona,
                fieldToEdit: selectedEditableField.join(","),
                prompt
            });

            if (res.success) {
                setEditedFields(res.data.map((field) => field.field));
                toast({
                    title: "Success",
                    description: "Edited Successfully",
                    varient: "success"
                })
            }

            setPersona({
                ...persona,
                ...res.data.reduce((acc, field) => {
                    acc[field.field] = field.editedValue;
                    return acc;
                }, {})
            });
            console.log("Edited Field", {
                ...persona,
                ...res.data.reduce((acc, field) => {
                    acc[field.field] = field.editedValue;
                    return acc;
                }, {})
            });

        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                varient: "destructive"
            })

        } finally {
            setIsEditLoading(false);
            setSelectedEditableField([]);
            setPrompt("");
        }



    }
        , [selectedEditableField, persona, prompt, setPersona, toast])




    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut", marginTop: "0rem !important" }}
            className="w-full max-w-2xl h-full "
            style={{
                marginTop: "0rem !important",
            }}
        >
            <Card className="bg-slate-900 border-slate-600">
                <CardHeader className="">
                    <div className="flex justify-between gap-2 items-center">
                        <div className=" bg-blue-500/10 p-3 rounded-full text-left w-fit">
                            <Atom className="w-8 h-8 text-blue-500" />
                        </div>
                        <HoverCard open={open} setOpen={setOpen}  >
                            {
                                isMemoried && (
                                    <div className='bg-green-300 px-4 py-1 rounded-md flex gap-2 text-black font-semibold'>
                                        <Check />
                                        <p>Added Data To Knowledge</p>
                                    </div>
                                )
                            }
                            {
                                isEditLoading || KnowledgeLoading ? <div className="bg-slate-700 p-4 rounded-md flex gap-2 font-semibold">
                                    <LoaderCircle className="animate-spin" />
                                    {sources.length > 0 ? <p className="text-slate-400">Storing Knowledge</p> : <p className="text-slate-400">Loading Knowledge Sources</p>}
                                </div> :
                                    <HoverCardTrigger className={`${isEditable ? "block" : "hidden"}`}>
                                        <Button onClick={() => setOpen(!open)}>{open ? "Click To Close" : "Edit With AI"}</Button>
                                    </HoverCardTrigger>
                            }
                            <HoverCardContent className="w-96 h-fit bg-slate-800/20 backdrop-blur-lg border border-gray-700 p-4 rounded-lg shadow-lg justify-between">
                                <input
                                    ref={inputRef}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe the changes And Select Field"
                                    className="flex flex-col  mb-12 gap-3 bg-transparent border-none outline-none relative w-full h-fit text-wrap flex-wrap break-words" />
                                <Separator className="my-4 border border-white" />

                                <p className="mb-3 font-semibold">Select Fields To Change</p>
                                <div className="flex w-96 flex-wrap gap-2">
                                    {editableField.map((field, index) => (
                                        <div key={index} className={`${selectedEditableField.includes(field.value) ? "" : ""} flex gap-2 items-center font-medium cursor-pointer border border-slate-500 rounded-md`}>
                                            <Toggle
                                                checked={selectedEditableField.includes(field.value)}
                                                onPressedChange={() => {
                                                    if (selectedEditableField.includes(field.value)) {
                                                        setSelectedEditableField(selectedEditableField.filter((item) => item !== field.value))
                                                    } else {
                                                        setSelectedEditableField([...selectedEditableField, field.value])
                                                    }
                                                    console.log(selectedEditableField)
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <label className="font-light">{field.label}</label>
                                            </Toggle>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-4 border border-white" />
                                <Button
                                    onClick={editField}
                                    variant="default"
                                >Start Editing</Button>
                            </HoverCardContent>
                        </HoverCard>


                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl text-slate-50 text-left overflow-hidden text-ellipsis whitespace-nowrap">
                            {persona.name}
                            {
                                editedFields.includes("name") && <EditedIcon />
                            }
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-left">
                            {expanded
                                ? persona.description
                                : persona.description.substring(0, descriptionLength)}
                            {persona.description.length > descriptionLength && (
                                <Button
                                    variant="link"
                                    className="px-1.5 h-auto text-blue-400"
                                    onClick={() => setExpanded(!expanded)}
                                >
                                    {expanded ? "Read Less" : "Read More"}
                                </Button>
                            )}
                            {
                                editedFields.includes("description") && <EditedIcon />
                            }
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">


                    {/* partially hidden */}
                    <Accordion type="single" collapsible className={`w-full ${isKnowledgeCard ? "hidden" : ""}`}>
                        <AccordionItem value="task">
                            <AccordionTrigger className="text-slate-200 hover:text-slate-50">
                                <div className="flex gap-2 items-center">
                                    Task
                                    {
                                        editedFields.includes("task") && <EditedIcon />
                                    }
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="text-sm text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {persona.task ? persona.task : "No Task Provided"}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="knowledge">
                            <AccordionTrigger className="text-slate-200 hover:text-slate-50 flex w-full justify-between items-center">
                                <div className="flex gap-2 items-center">
                                    Knowledge Base Items
                                    {
                                        editedFields.includes("knowledgeBaseSearch") && <EditedIcon />
                                    }
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ScrollArea className="h-[300px] pr-4">
                                    {
                                        persona.knowledgeBaseSearch && Array.isArray(persona.knowledgeBaseSearch) && persona.knowledgeBaseSearch.length > 4 && <div className="text-sm text-slate-400 px-2 py-1 bg-slate-600 m-2 rounded-md">
                                            Scroll For More
                                        </div>
                                    }
                                    <ul className="space-y-2 text-sm text-slate-400">
                                        {persona.knowledgeBaseSearch && Array.isArray(persona.knowledgeBaseSearch) && persona.knowledgeBaseSearch.length > 4 ? persona.knowledgeBaseSearch.map((item, index) => (
                                            <li key={index} className="pl-4 border-l-2 border-slate-800">
                                                {item}
                                            </li>
                                        )) : <li className="pl-4 border-l-2 border-slate-800">
                                            {persona.knowledgeBaseSearch}
                                        </li>}
                                    </ul>
                                </ScrollArea>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="outputFormat">
                            <AccordionTrigger className="text-slate-200 hover:text-slate-50">
                                <div className="flex gap-2 items-center">
                                    Output Format
                                    {
                                        editedFields.includes("outputFormat") && <EditedIcon />
                                    }
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="text-sm text-slate-400">
                                    {persona.outputFormat && persona.outputFormat.trim() === "" ? "No Output Format Provided" : persona.outputFormat}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="sourceLinks">
                            <AccordionTrigger className="text-slate-200 hover:text-slate-50">
                                <div className="flex gap-2 items-center">
                                    Source Link
                                    {
                                        editedFields.includes("sourceLinks") && <EditedIcon />
                                    }
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="text-sm text-slate-400 break-words">
                                    {persona.sourceLinks && persona.sourceLinks.trim() === "" ? "No External Source Links Provided" : persona.sourceLinks}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="externalAccess">
                            <AccordionTrigger className="text-slate-200 hover:text-slate-50">
                                <div className="flex gap-2 items-center">
                                    External Url Access
                                    {
                                        editedFields.includes("isExternalAllowed") && <EditedIcon />
                                    }
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Badge variant={persona.isExternalAllowed ? "success" : "destructive"}>
                                    {persona.isExternalAllowed ? "Allowed" : "Not Allowed"}
                                </Badge>
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>



                    {/* partially hidden */}
                    <div>
                        <Dialog>
                            <DialogTrigger>
                                {
                                    sources.length > 0 && <Button>Show {sources.length} Sources</Button>
                                }
                            </DialogTrigger>
                            <DialogContent className="w-[90%] max-w-4xl bg-slate-800 h-[60%]">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl text-white">Creating Knowledge Base Using {sources.length} Sources</DialogTitle>
                                    <div className="flex gap-2 text-slate-200">
                                        <p>Scroll For More Links</p>
                                        •
                                        <p>Hover to check full link</p>
                                        •
                                        <p>Click To Visit</p>
                                    </div>
                                    <DialogDescription className="text-slate-400">
                                        These are the sources used to generate this persona.
                                    </DialogDescription>
                                </DialogHeader>
                                <motion.div
                                    className="flex flex-col w-full h-full overflow-scroll gap-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {getFavicon(sources).map((item, index) => (
                                        <motion.a
                                            key={index}
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex  items-center px-4 py-2 gap-4 border rounded-lg shadow-md bg-slate-900 border-slate-700 hover:bg-slate-700 transition-colors duration-200"
                                            style={{ height: '100%' }}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                        >
                                            <div className="flex items-center justify-between space-x-3 w-full">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-7 h-7 rounded-full overflow-hidden">
                                                        <img src={item.favImage} alt={`${item.root} ${index}`} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h3 className="text-lg font-semibold text-slate-50">{item.root}</h3>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>

                                                                    <p className="text-sm text-slate-400 break-words text-ellipsis line-clamp-1">
                                                                        {item.link}
                                                                    </p>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {item.link}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                    </div>
                                                </div>
                                                <div>
                                                    <CircleArrowOutUpRight className="text-white" />
                                                </div>
                                            </div>

                                        </motion.a>
                                    ))}
                                </motion.div>
                            </DialogContent>
                        </Dialog>

                    </div>

                </CardContent>
            </Card>
        </motion.div>
    )
}


function EditedIcon() {
    return (
        <div className="rounded-md p-1 bg-green-900  flex gap-2 items-center text-green-600 text-sm w-fit px-4">
            <Check className="text-green-600" />
            Edited Successfully
        </div>
    )
}