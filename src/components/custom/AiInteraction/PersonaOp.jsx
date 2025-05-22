import {
  Brain,
  BriefcaseBusiness,
  Goal,
  Hand,
  HeartHandshake,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { motion } from "framer-motion";
import { useStackSidebar } from "../../../context/StackSidebarContext";
import { Button } from "../../ui/button";
import { Briefcase, Users, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import PersonaDetails from "./PersonaDetails";
import ChainOfThoughtVisualizer from "../agenticAutomation/ChainOfThoughtVisualizer";

export default function PersonaOp({ title, goal, team, output, cot = [] }) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  const { sidebarStack, setSidebarStack } = useStackSidebar();
  const shortGoal = goal.slice(0, 50);
  const longGoal = goal;
  function handleDetails() {
    setSidebarStack((prev) => [
      ...prev,
      {
        component: (
          <PersonaDetails
            output={output}
            title={title}
            goal={goal}
            team={team}
            cot={cot}
          />
        ),
      },
    ]);
  }

  return (
    <div className="bg-slate-800/40 rounded-lg shadow-lg border border-slate-700/50 overflow-hidden hover:shadow-xl transition-all duration-300 flex justify-between h-full flex-col">
      <div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-3 px-5 py-3 ">
            <BriefcaseBusiness
              className="text-slate-200"
              width={20}
              height={20}
            />
            <h3 className="font-semibold text-md capitalize text-white">
              {title}
            </h3>
          </div>
          {cot.length > 0 && (
            <div className="flex gap-2 bg-purple-700 px-3 py-1 rounded-md items-center">
              <Brain className="w-4 h-4" />
              Chain Of Thoughts
            </div>
          )}
        </div>
        <Separator className="border-slate-500/70" />

        <div className="flex gap-3 px-5 py-4">
          <Goal
            className="text-slate-400 shrink-0 mt-1"
            width={18}
            height={18}
          />
          <div>
            <p className="text-xs leading-5 text-slate-300">
              {expanded ? longGoal : shortGoal}
              {goal.length > 50 && (
                <button
                  onClick={toggleExpanded}
                  className="text-blue-400 hover:text-blue-300 font-medium ml-2 transition-colors"
                >
                  {expanded ? "Read Less" : "Read More"}
                </button>
              )}
            </p>
          </div>
        </div>
        {team && team.length > 0 && (
          <Separator className="border-slate-700/70" />
        )}

        <div className="px-5 py-4">
          {team && team.length > 0 && (
            <div className="flex items-center gap-2 mb-3 text-xs">
              <HeartHandshake
                className="text-slate-400 "
                width={20}
                height={20}
              />
              <p className="font-medium text-slate-200">
                Collaborated With Personas
              </p>
              <p className="text-slate-500">Hover for full name</p>
            </div>
          )}
          <div
            className={`grid ${team.length >= 2 ? "grid-cols-2" : "grid-cols-1"} gap-2`}
          >
            {team &&
              team.length > 0 &&
              team.map((item) => (
                <TooltipProvider key={item} delayDuration={10}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-slate-800 w-fit border border-slate-600/50 px-3 py-2 rounded-md flex gap-2 items-center text-white transition-colors cursor-pointer">
                        <Hand
                          className="text-slate-300 "
                          width={15}
                          height={15}
                        />
                        <div className="text-ellipsis overflow-hidden whitespace-nowrap text-sm">
                          {item.replace(/^"|"$/g, "")}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 text-white border-slate-600 border ">
                      {item.replace(/^"|"$/g, "")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
          </div>
        </div>
      </div>
      <div
        onClick={() => handleDetails()}
        className={`${team && team.length > 0 ? "border-t border-slate-900" : ""} px-5 py-2`}
      >
        <Button variant="default">Work Details</Button>
      </div>
    </div>
  );
}
