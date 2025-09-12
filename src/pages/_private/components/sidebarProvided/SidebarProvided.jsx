import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/pages/_private/components/sidebarProvided/app-sidebar.jsx";
import { useLocation } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Chat from "./chat/Chat";
import { _useSidebar } from "../../../../context/SidebarContext";
import StackSidebarProvider, {
  useStackSidebar,
} from "../../../../context/StackSidebarContext";
import StackSidebarContainer from "../../../../components/custom/StackableSidebar/StackSidebarContainer";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { variants } from "../../../../lib/config";
import Workshop from "./components/Workshop";
import AutomationPage from "@/pages/_automations/AutomationPage";
import AutomationJobDetails from "@/pages/_automations/AutomationJobsDetails";
import PromptTemplateLibrary from "./components/PromptTemplateLibrary";
import { useChatCtx } from "@/context/ChatContext";
import DownloadThreadWithUser from "@/components/custom/downloadThread/DownloadThreadWithUser";
import { Button } from "@/components/ui/button";
import { CircleArrowDown } from "lucide-react";
import TriggerHome from "@/pages/_trigger/components/TriggerHome";
import TriggersDetail from "@/pages/_trigger/components/TriggersDetail";
import PromptBuilder from "./components/PromptBuilder";
export default function Page() {
  const { pathname } = useLocation();
  console.log(pathname, "dfsd");
  const { currentActiveChat } = _useSidebar();
  const { sidebarStack, setSidebarStack } = useStackSidebar();
  const { conversation, setConversation } = useChatCtx();
  useEffect(() => {
    if (pathname) {
      setSidebarStack([]);
    }
  }, [pathname]);

  useEffect(() => {
    console.log(conversation, "conversation in sidebar");
  }, [conversation, setConversation]);

  return (
    <SidebarProvider>
      <div className="bg-g1">
        <AppSidebar />
      </div>
      <SidebarInset>
        <header className="flex fixed   bg-black w-full z-50 h-12 shrink-0 items-center border-b px-4">
          <div className="flex gap-2 items-center">
            <SidebarTrigger className="-ml-1 text-white" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          {pathname.startsWith("/chat") && (
            <DownloadThreadWithUser
              button={
                <button className="bg-transparent flex gap-2 items-center text-white  px-1 py-1 hover:bg-g2/60 rounded-md">
                  <CircleArrowDown className="w-4 h-4" />
                  Export Thread
                </button>
              }
              dialogHeader="Download Chat Thread"
            />
          )}
        </header>
        <div className="flex gap-2 flex-1 w-full ">
          <div className="flex text-white bg-black flex-1 mt-12 flex-col gap-2 p-2 pt-0">
            {pathname === "/dashboard" && <Dashboard />}
            {pathname.startsWith("/chat/") && <Chat />}
            {pathname.startsWith("/workshop") && <Workshop />}
            {pathname.startsWith("/your-automations") && <AutomationPage />}
            {pathname.startsWith("/triggersDetail") && <TriggersDetail />}
            {pathname.startsWith("/template-library") && (
              <PromptTemplateLibrary />
            )}
            {pathname === "/prompt-builder" && <PromptBuilder />}
            {pathname === "/trigger" && <TriggerHome />}
          </div>
          <motion.div
            className={`sticky top-0 h-[100vh] overflow-hidden z-50 ${sidebarStack.length > 0 && "w-[80%]"}`}
            variants={variants}
            animate={sidebarStack.length > 0 ? "open" : "closed"}
          >
            <div>
              <StackSidebarContainer />
            </div>
          </motion.div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
