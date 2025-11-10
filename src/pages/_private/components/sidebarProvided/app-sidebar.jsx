import * as React from "react";
import { Ellipsis, Plus, Workflow } from "lucide-react";

import { NavMain } from "@/pages/_private/components/sidebarProvided/nav-main";
import { ToolsMenu } from "@/pages/_private/components/sidebarProvided/ToolsMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useUser } from "../../../../context/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { _useSidebar } from "../../../../context/SidebarContext";
import JamesLogo from "./components/JamesLogo";
import SettingsModal from "@/components/custom/SettingModal";
import { useState } from "react";
import { useDomain } from "../../../../context/WhichDomainContext";
import SearchChats from "@/components/custom/SearchChats";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Getting Started",
      url: "#",
      items: [
        {
          title: "Installation",
          url: "#",
        },
        {
          title: "Project Structure",
          url: "#",
        },
      ],
    },
    {
      title: "Building Your Application",
      url: "#",
      items: [
        {
          title: "Routing",
          url: "#",
        },
        {
          title: "Data Fetching",
          url: "#",
          isActive: true,
        },
        {
          title: "Rendering",
          url: "#",
        },
        {
          title: "Caching",
          url: "#",
        },
        {
          title: "Styling",
          url: "#",
        },
        {
          title: "Optimizing",
          url: "#",
        },
        {
          title: "Configuring",
          url: "#",
        },
        {
          title: "Testing",
          url: "#",
        },
        {
          title: "Authentication",
          url: "#",
        },
        {
          title: "Deploying",
          url: "#",
        },
        {
          title: "Upgrading",
          url: "#",
        },
        {
          title: "Examples",
          url: "#",
        },
      ],
    },
    {
      title: "API Reference",
      url: "#",
      items: [
        {
          title: "Components",
          url: "#",
        },
        {
          title: "File Conventions",
          url: "#",
        },
        {
          title: "Functions",
          url: "#",
        },
        {
          title: "next.config.js Options",
          url: "#",
        },
        {
          title: "CLI",
          url: "#",
        },
        {
          title: "Edge Runtime",
          url: "#",
        },
      ],
    },
    {
      title: "Architecture",
      url: "#",
      items: [
        {
          title: "Accessibility",
          url: "#",
        },
        {
          title: "Fast Refresh",
          url: "#",
        },
        {
          title: "Next.js Compiler",
          url: "#",
        },
        {
          title: "Supported Browsers",
          url: "#",
        },
        {
          title: "Turbopack",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }) {
  const { user, logout } = useUser();
  const { isPublicDomain } = useDomain();
  const { clearAllStates } = _useSidebar();
  const [openSettingsModal, setOpenSettingsModal] = useState(false);
  const [isClickedWorkflows, setIsClickedWorkflows] = useState(false);
  const navigate = useNavigate();

  const handleWorkflowsClick = async () => {
    try {
      setIsClickedWorkflows((prev) => !prev);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };

  return (
    <Sidebar {...props} data-sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="mx-3 items-center justify-center ">
            <JamesLogo />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div
              onClick={() => {
                navigate("/dashboard");
              }}
              className="cursor-pointer px-2 py-1 hover:bg-g2/60 bg-g2 mt-2 mx-2 rounded-md"
              size="lg"
              asChild
            >
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 flex gap-1 items-center p-1">
                  <Plus className=" rounded-md  " />
                </div>
                <p className="font-bold">New Chat</p>
              </div>
            </div>

            <div
              onClick={handleWorkflowsClick}
              className={`cursor-pointer px-2 py-1 hover:bg-slate-800  mt-2 mx-2 rounded-md flex items-center justify-between ${
                isClickedWorkflows ? "bg-slate-800" : ""
              }`}
              size="lg"
              asChild
            >
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 flex gap-1 items-center p-1">
                  <Workflow className="w-5 rounded-md  " />
                </div>
                <p className="font-bold">
                  {isClickedWorkflows ? "Your Conversations" : "Your Workflows"}
                </p>
              </div>
            </div>
  

            {/* Search - Secondary Option */}
            <SearchChats />

            {/* Tools Menu - Collapsible Section */}
            <ToolsMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} isClickedWorkflows={isClickedWorkflows}/>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex gap-2 items-center px-2 py-2 rounded-md hover:bg-slate-800 transition-colors">
          <Avatar className="w-8 h-8">
            <AvatarImage src="#" />
            <AvatarFallback className="bg-slate-700 text-slate-100 text-xs font-semibold">
              {user.email.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="truncate text-sm text-slate-200 flex-1">{user.email}</p>

          <button
            className="rounded-md p-1.5 cursor-pointer hover:bg-slate-700 transition-colors flex-shrink-0"
            onClick={() => setOpenSettingsModal(true)}
            title="Settings"
          >
            <Ellipsis className="w-4 h-4 text-slate-400 hover:text-slate-200" />
          </button>
        </div>
      </SidebarFooter>
      <SettingsModal
        open={openSettingsModal}
        onClose={() => setOpenSettingsModal(false)}
      />
    </Sidebar>
  );
}
