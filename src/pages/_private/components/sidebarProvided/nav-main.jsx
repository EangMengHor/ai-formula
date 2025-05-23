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
import { useWorkflow } from "../../../../context/WorkflowContext";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function NavMain({ items, isClickedWorkflows }) {
  const { id } = useParams();
  const { isMobile } = useSidebar();
  const { workflowList, selectWorkflow, selectedWorkflowId } = useWorkflow();
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
        {isClickedWorkflows && (
          <div className="grid grid-cols-1 gap-3 p-2">
            {workflowList.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => selectWorkflow(workflow.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedWorkflowId === workflow.id
                    ? "bg-[#283044] border-blue-500 shadow-md shadow-blue-500/20"
                    : "border-slate-700 hover:bg-[#232a3a] hover:border-slate-600"
                }`}
              >
                <div className="font-medium text-lg truncate">
                  {workflow.name}
                </div>
                <div className="flex items-center mt-2">
                  <div className="flex -space-x-2">
                    {/* Persona avatars - showing up to 3 */}
                    {[...Array(Math.min(3, workflow.personaList.length))].map(
                      (_, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs border-2 border-[#283044]"
                        >
                          {i < 2 ? "P" : "+"}
                        </div>
                      ),
                    )}
                  </div>
                  <div className="text-sm text-slate-400 ml-3">
                    {workflow.personaList.length}{" "}
                    {workflow.personaList.length > 1 ? "personas" : "persona"}
                  </div>
                </div>
              </div>
            ))}

            {workflowList.length === 0 && (
              <div className="col-span-full p-4 border border-dashed border-slate-700 rounded-lg text-center text-slate-400">
                No saved workflows found
              </div>
            )}
          </div>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
