import { useEffect, useRef, useState } from "react";
import { Brain, SendToBack, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // assuming shadcn is installed

export default function ChatModes({ modes } = { modes: [] }) {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const isInitialRendered = useRef(null);
  useEffect(() => {
    if (!isInitialRendered.current) {
      isInitialRendered.current = true;
      modes?.onClick && modes.onClick?.();
    }
  });
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center gap-1 mr-2 bg-slate-800 p-1 rounded-2xl shadow-md w-fit transition-all">
        {modes.map((mode, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild className="p-0">
              <button
                onClick={() => {
                  setSelectedIndex(index);
                  console.log(
                    "Selected mode: isSwarmMode in ChatInput 1",
                    mode.name,
                  );
                  mode.onClick && mode.onClick();
                }}
                className={`flex items-center justify-center  p-2 rounded-xl transition-all duration-200
  ${
    selectedIndex === index
      ? " border drop-shadow-[0_0_4px_rgba(255,255,255,0.8)] border-slate-200  shadow-slate-500/30 shadow"
      : " border border-transparent text-gray-400"
  }`}
              >
                {mode.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={10}
              className="bg-[#0e1525] border border-white text-white text-xs rounded-lg p-3 w-56 shadow-lg animate-slide-in"
            >
              <div className="font-semibold text-white mb-1">{mode.name}</div>
              <div className="text-gray-300 text-sm leading-tight">
                {mode.description}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
