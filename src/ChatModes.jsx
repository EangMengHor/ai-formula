import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useUser } from "./context/UserContext";
import { useIsMobile } from "./hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatModes({ modes } = { modes: [] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isInitialRendered = useRef(false);
  const { getMode } = useUser();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isInitialRendered.current) {
      const mode = getMode();
      if (mode === "swarm") {
        setSelectedIndex(4);
      } else if (mode === "deep") {
        setSelectedIndex(3);
      } else if (mode === "helios") {
        setSelectedIndex(0);
      } else if (mode === "ablite8") {
        setSelectedIndex(1);
      } else {
        setSelectedIndex(2);
      }
      console.log("Selected mode: isSwarmMode in ChatInput 2", mode);
      isInitialRendered.current = true;
    }
  }, [getMode]);

  const handleModeSelect = (index, mode) => {
    setSelectedIndex(index);
    mode.onClick && mode.onClick();
    setIsDrawerOpen(false);
  };

  const selectedMode = modes[selectedIndex] || {};

  // Mobile Drawer View
  if (isMobile) {
    return (
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <button className="flex items-center gap-2 mr-2 bg-slate-800 px-4 py-3 rounded-xl shadow-md transition-all">
            <div className="hover:rotate-45 transition-all">
              {selectedMode.icon}
            </div>
            <span className="text-white text-sm font-medium">
              {selectedMode.name}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="bg-slate-900 border-slate-700">
          <DrawerHeader>
            <DrawerTitle className="text-white">Select Chat Mode</DrawerTitle>
            <DrawerDescription className="text-gray-400">
              Choose the mode that best fits your needs
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {modes.map((mode, index) => (
              <button
                key={index}
                onClick={() => handleModeSelect(index, mode)}
                className={`w-full flex items-start gap-3 text-gray-400 p-4 rounded-xl transition-all duration-200 ${
                  selectedIndex === index
                    ? "border drop-shadow-[0_0_4px_rgba(255,255,255,0.8)] border-slate-200 bg-slate-800 shadow-slate-500/30 shadow"
                    : "border border-transparent bg-slate-800/50  hover:bg-slate-800/70"
                }`}
              >
                <div className="mt-1 hover:rotate-45 transition-all">
                  {mode.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white mb-1">
                    {mode.name}
                  </div>
                  <div className="text-gray-300 text-sm leading-tight">
                    {mode.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop Dropdown View with shadcn
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 mr-2 bg-slate-800 px-4 py-3 rounded-xl shadow-md transition-all border outline-none">
          <div className="hover:rotate-45 transition-all">
            {selectedMode.icon}
          </div>
          <span className="text-white text-sm font-medium">
            {selectedMode.name}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="bg-[#0e1525] border border-slate-700 rounded-lg shadow-xl min-w-[240px] max-h-[380px] overflow-y-auto p-0"
      >
        {modes.map((mode, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => handleModeSelect(index, mode)}
            className={`flex items-center gap-2.5 px-3 py-3 transition-all duration-200 cursor-pointer focus:bg-transparent first:rounded-t-lg last:rounded-b-lg ${
              selectedIndex === index
                ? "bg-slate-800 border-l-2 border-slate-200 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]"
                : "text-gray-400 hover:bg-slate-800/50 focus:text-gray-400 border-l-2 border-transparent"
            }`}
          >
            <div className="hover:rotate-45 transition-all flex-shrink-0">
              {mode.icon}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium text-white text-sm">{mode.name}</div>
              <div className="text-gray-400 text-xs leading-snug line-clamp-2 mt-0.5">
                {mode.description}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
