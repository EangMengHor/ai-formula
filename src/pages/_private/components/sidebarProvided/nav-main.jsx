"use client"

import { Delete, Loader, MoreHorizontal, Trash } from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { _useSidebar } from "../../../../context/SidebarContext"
import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"

export function NavMain({
    items,
}) {
    const { id } = useParams()
    const { isMobile } = useSidebar()
    const navigate = useNavigate()
    const { chatHistory, isSidebarChatHistoryLoading, currentActiveChat, setCurrentActiveChat } = _useSidebar()
    useEffect(() => {
        console.log(chatHistory);
    }, [chatHistory])
    return (
        <SidebarGroup>
            <SidebarMenu>
                {
                    isSidebarChatHistoryLoading && (
                        <div className="flex justify-center items-center h-full w-full  hover::bg-gray-700 rounded-md cursor-pointer px-2 ">
                            <Loader className="animate-spin" />
                        </div>
                    )
                }
                {!isSidebarChatHistoryLoading && Object.keys(chatHistory).map((label) => (
                    <div key={label}>
                        <div className="font-semibold capitalize text-lg px-2 py-1 w-full rounded-md bg-slate-700 my-2 ">{label}</div>
                        {chatHistory[label].map((item) => (
                            <div
                                onClick={() => {
                                    setCurrentActiveChat(item.chatname)
                                    navigate(`/chat/${item.sessionid}`)
                                }}
                                key={item.id} className={`${String(id) == item.sessionid ? 'bg-slate-700' : ""} data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex justify-between hover:bg-gray-700 rounded-md cursor-pointer px-2 items-center`}>
                                <p className="truncate max-w-xs">
                                    {item.chatname}
                                </p>
                                <DropdownMenu>
                                    <SidebarMenuItem>
                                        <DropdownMenuTrigger asChild>
                                            <SidebarMenuButton >
                                                <MoreHorizontal className="ml-auto" />
                                            </SidebarMenuButton>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            side={isMobile ? "bottom" : "right"}
                                            align={isMobile ? "end" : "start"}
                                            className="min-w-56 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2 hover:bg-gray-300 rounded-md px-2 py-1">
                                                <Trash width={20} height={20} />
                                                <p>Delete</p>
                                            </div>
                                        </DropdownMenuContent>
                                    </SidebarMenuItem>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
