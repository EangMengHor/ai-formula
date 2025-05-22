"use client";

import { Delete, Loader, MoreHorizontal, Trash } from "lucide-react";

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
import { _useSidebar } from "../../../../context/SidebarContext";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function NavMain({ items }) {
  const { id } = useParams();
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const {
    chatHistory,
    isSidebarChatHistoryLoading,
    currentActiveChat,
    setCurrentActiveChat,
  } = _useSidebar();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {isSidebarChatHistoryLoading && (
          <div className="flex justify-center items-center h-full w-full  hover::bg-gray-700 rounded-md cursor-pointer px-2 ">
            <Loader className="animate-spin" />
          </div>
        )}
        {!isSidebarChatHistoryLoading &&
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
      </SidebarMenu>
    </SidebarGroup>
  );
}
