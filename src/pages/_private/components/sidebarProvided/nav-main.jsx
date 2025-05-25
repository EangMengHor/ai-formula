"use client";

import { Codesandbox, Delete, Loader, MoreHorizontal, SquareDashed, Trash, X } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { _useSidebar } from "../../../../context/SidebarContext";
import { useWorkflow } from "../../../../context/WorkflowContext";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

export function NavMain({ items, isClickedWorkflows }) {
    const { id } = useParams();
    const { isMobile } = useSidebar();
    const { workflowList, selectWorkflow, selectedWorkflowId, getSelectedWorkflow } = useWorkflow();
    const navigate = useNavigate();
    const {
        chatHistory,
        isSidebarChatHistoryLoading,
        currentActiveChat,
        setCurrentActiveChat,
    } = _useSidebar();
    const [isHovered, setIsHovered] = useState(false);
    const [isWorkflowMoreInfoDialogOpen, setIsWorkflowMoreInfoDialogOpen] = useState()
    return (
        <SidebarGroup>
            <SidebarMenu>
                {isSidebarChatHistoryLoading && !isClickedWorkflows && (
                    <div className="flex justify-center items-center h-full w-full  hover::bg-gray-700 rounded-md cursor-pointer px-2 ">
                        <Loader className="animate-spin" />
                    </div>
                )}
                {!isSidebarChatHistoryLoading &&
                    !isClickedWorkflows &&
                    Object.keys(chatHistory).map((label) => {
                        const uniqueItems = chatHistory[label].reduce((acc, curr) => {
                            if (!acc.find((item) => item?.id == curr?.id)) {
                                acc.push(curr);
                            }
                            return acc;
                        }, []);

                        return (
                            <div key={label}>
                                <div className="font-semibold capitalize  px-2 py-1 w-full rounded-md text-sm mt-4 text-slate-400 my-2 ">
                                    {label}
                                </div>
                                {uniqueItems &&
                                    uniqueItems.map((item, index) => (
                                        <div
                                            onClick={() => {
                                                setCurrentActiveChat(item.chatname);
                                                navigate(`/chat/${item.sessionid}`);
                                            }}
                                            key={index}
                                            className={`${String(id) == item.sessionid ? "bg-slate-600" : ""} data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex justify-between hover:bg-gray-800 rounded-md cursor-pointer px-2 items-center`}
                                        >
                                            <p className="truncate max-w-xs py-1">{item.chatname}</p>
                                        </div>
                                    ))}
                            </div>
                        );
                    })}
                {
                    isClickedWorkflows && (selectedWorkflowId !== null || selectedWorkflowId > 0) && (
                        <div
                            onClick={() => selectWorkflow(null)}
                            className="flex items-center gap-2 p-2 mx-2 border-red-500 border text-sm text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors duration-200"
                        >
                            <X className="w-4 h-4" />
                            Remove Workflow
                        </div>
                    )
                }
                {isClickedWorkflows && (
                    <div className="grid grid-cols-1 gap-3 p-2">
                        {workflowList.map((workflow) => (

                            <motion.div
                                layout
                                key={workflow.id}
                                onClick={() => selectWorkflow(workflow.id)}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                initial={false}
                                animate={{ height: isHovered ? "auto" : "auto" }}
                                className={`p-2 overflow-hidden border rounded-lg cursor-pointer flex flex-col gap-2 transition-all duration-300 ${selectedWorkflowId === workflow.id
                                    ? "bg-[#283044] border-blue-500 shadow-md shadow-blue-500/20"
                                    : "border-slate-700 hover:bg-[#232a3a] hover:border-slate-600"
                                    }`}
                            >
                                <div className="flex gap-2">
                                    <SquareDashed />
                                    <div>
                                        <div className="font-medium text-sm truncate text-wrap">
                                            {workflow.name}
                                        </div>
                                        <div className="flex items-center">
                                            <div className="text-xs text-slate-400 ">
                                                {workflow.personaList.length}{" "}
                                                {workflow.personaList.length > 1 ? "personas" : "persona"} | {workflow.workflow.length}{" "} Workflow Steps
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => {
                                                setIsWorkflowMoreInfoDialogOpen(true);
                                            }
                                            }
                                            className="border-l text-sm hover:underline mt-3">
                                            show Details
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                        ))}

                        {workflowList.length === 0 && (
                            <div className="col-span-full p-4 border border-dashed border-slate-700 rounded-lg text-center text-slate-400">
                                No saved workflows found
                            </div>
                        )}
                    </div>
                )}
                {
                    selectedWorkflowId !== null && selectedWorkflowId > 0 && (
                        <Dialog open={isWorkflowMoreInfoDialogOpen} onOpenChange={setIsWorkflowMoreInfoDialogOpen}>
                            <DialogContent className="bg-[#1e2535] text-white border border-slate-700  w-[40%] h-fit max-h-[60%] overflow-y-scroll">
                                <DialogHeader>
                                    <DialogTitle>Workflow Details</DialogTitle>
                                    <div>
                                        <div className="bg-slate-800 text-white p-6 max-w-3xl mx-auto rounded">
                                            <h2 className="text-xl font-medium mb-1">{getSelectedWorkflow().name}</h2>
                                            <p className="text-slate-300 text-sm mb-4">{getSelectedWorkflow().description}</p>

                                            <p className="py-2 font-semibold">Workflow</p>
                                            <div className="relative">
                                                {/* Vertical connecting line */}
                                                <div className="absolute left-1 top-3 bottom-0 w-px bg-slate-600 opacity-50"></div>
                                                <div className="space-y-6">
                                                    {getSelectedWorkflow().workflow.map((step, index) => (
                                                        <div
                                                            key={index}
                                                            className={`relative transition-all duration-500 ease-out h-fit`}
                                                            style={{ transitionDelay: `${index * 200}ms` }}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <span className="text-slate-300 mt-0.5 z-10 bg-slate-800 rounded-full">•</span>
                                                                <p className="text-slate-100">{step}</p>
                                                            </div>

                                                            {/* Simple connector */}
                                                            {index < getSelectedWorkflow().workflow.length - 1 && (
                                                                <div className="absolute left-1 top-5 h-6">
                                                                    <div className="w-px h-full bg-slate-600 opacity-50"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-6 space-y-4">
                                                {
                                                    getSelectedWorkflow() &&
                                                        Object.keys(getSelectedWorkflow()).includes("personaList") &&
                                                        getSelectedWorkflow().personaList.length > 0 ? (
                                                        <div>
                                                            <p className="py-2 font-semibold mb-2">Agents</p>
                                                            <ul className="space-y-2">
                                                                {getSelectedWorkflow().personaList.map((agent, index) => (
                                                                    <li key={agent.id} className="border border-slate-500 p-4 flex gap-2 rounded-md">
                                                                        {/* index */}
                                                                        <p className="">{index}</p>
                                                                        <div className="border-l-2 border-slate-500 pl-2">
                                                                            <h4 className="font-semibold text-slate-100">{agent.name}</h4>
                                                                            <p className="text-slate-300">{agent.description}</p>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <p className="text-slate-300 mt-4">No agents available for this workflow.</p>
                                                    )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>

                    )
                }

            </SidebarMenu>
        </SidebarGroup>
    );
}
