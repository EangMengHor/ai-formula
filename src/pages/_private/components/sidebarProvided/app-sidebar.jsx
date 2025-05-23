import * as React from "react";
import {
  Compass,
  Ellipsis,
  GalleryVerticalEnd,
  Layers,
  Orbit,
  Plus,
  UserCircle2,
} from "lucide-react";

import { useWorkflow } from "../../../../context/WorkflowContext";

import { NavMain } from "@/pages/_private/components/sidebarProvided/nav-main";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { _useSidebar } from "../../../../context/SidebarContext";
import JamesLogo from "./components/JamesLogo";
import SettingsModal from "@/components/custom/SettingModal";
import { useState } from "react";
import { useDomain } from "../../../../context/WhichDomainContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const navigate = useNavigate();
  return (
    <Sidebar {...props} className="">
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
              className="cursor-pointer px-2 py-1 hover:bg-slate-700 bg-gray-800 mt-2 mx-2 rounded-md"
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
              hidden={isPublicDomain}
              onClick={() => {
                navigate("/workshop");
              }}
              className="cursor-pointer px-2 py-1 hover:bg-slate-800  mt-2 mx-2 rounded-md"
              size="lg"
              asChild
            >
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 flex gap-1 items-center p-1">
                  <Layers className="w-5 rounded-md  " />
                </div>
                <p className="font-bold">Workshop</p>
              </div>
            </div>
            <div
              onClick={() => {
                navigate("/addToPersonalKnowledgeBase");
              }}
              className="cursor-pointer px-2 py-1 hover:bg-slate-800  mt-2 mx-2 rounded-md"
              size="lg"
              asChild
            >
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 flex gap-1 items-center p-1">
                  <Orbit className="w-5 rounded-md  " />
                </div>
                <p className="font-bold">Internal Knowledge</p>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex gap-2 items-center">
          <Avatar>
            <AvatarImage src="#" />
            <AvatarFallback>
              {user.email.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="truncate">{user.email}</p>

          <div
            className="bg-gray-700 rounded-md mt-2 p-2 cursor-pointer hover:bg-slate-800"
            onClick={() => setOpenSettingsModal(true)}
          >
            <Ellipsis className="w-4 h-4 " />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
      <SettingsModal
        open={openSettingsModal}
        onClose={() => setOpenSettingsModal(false)}
      />
    </Sidebar>
  );
}
