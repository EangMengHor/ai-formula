import React, { useState } from "react";
import {
  Anvil,
  Bolt,
  ChevronDown,
  FireExtinguisherIcon,
  Mails,
  Orbit,
  Podcast,
  SearchXIcon,
  SunMoon,
  Workflow,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const tools = [
  {
    id: "prompt-anvil",
    title: "Prompt Anvil",
    description: "Create and manage custom prompts",
    icon: Anvil,
    path: "/prompt-builder",
  },
  {
    id: "internal-knowledge",
    title: "Internal Knowledge",
    description: "Manage your internal knowledge base",
    icon: Orbit,
    path: "/addToPersonalKnowledgeBase",
  },
  {
    id: "trigger",
    title: "Trigger",
    description: "Set up automation triggers",
    icon: SunMoon,
    path: "/trigger",
  },
  {
    id: "email-outreach",
    title: "Email Outreach",
    description: "Manage email campaigns and outreach",
    icon: Mails,
    path: "/email-outreach",
  },
  {
    id: "OSINT",
    title: "OSINT Tools",
    description: "Access Open-Source Intelligence tools",
    icon: SearchXIcon,
    path: "/osint-tools",
  },
  {
    id: "podcast-search",
    title: "Podcast Search",
    description: "Search and discover podcasts with contact info",
    icon: Podcast,
    path: "/search-podcast-history",
  },
];

export function ToolsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isMobile } = useSidebar();

  const handleToolClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const MenuContent = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.path)}
              className={cn(
                "w-full p-4 rounded-lg border border-slate-700",
                "bg-slate-800 hover:bg-slate-700 active:bg-slate-600",
                "text-left transition-all duration-200 group",
                "hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50",
              )}
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-700 group-hover:bg-slate-600 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Icon className="w-6 h-6 text-slate-100 group-hover:text-slate-50" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-100 text-sm leading-tight mb-1">
                    {tool.title}
                  </h4>
                  <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const TriggerButton = () => (
    <button onClick={() => setIsOpen(true)} className="w-full">
      <div className="cursor-pointer px-2  hover:bg-slate-800  mt-2 mx-2 rounded-md">
        <div className="flex gap-2 items-center">
          <div className=" flex gap-1 items-center p-1">
            <Bolt className="w-4 rounded-md" />
          </div>
          <p className="font-bold">Tools</p>
        </div>
      </div>
    </button>
  );

  if (isMobile) {
    return (
      <>
        <TriggerButton />
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="bg-slate-900 border-slate-700">
            <DrawerHeader className="pb-4">
              <DrawerTitle className="text-slate-100 text-lg">
                Tools & Features
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 max-h-[70vh] overflow-y-auto">
              <MenuContent />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <TriggerButton />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-slate-100 text-lg">
              Tools & Features
            </DialogTitle>
          </DialogHeader>
          <div className="pr-4">
            <MenuContent />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
