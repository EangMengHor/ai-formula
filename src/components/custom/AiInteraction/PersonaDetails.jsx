import {
  Briefcase,
  Users,
  FileText,
  Goal,
  HeartHandshake,
  Hand,
  Brain,
  Terminal,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "../../ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useStackSidebar } from "../../../context/StackSidebarContext";
import ChainOfThoughtVisualizer from "../agenticAutomation/ChainOfThoughtVisualizer";

export default function PersonaDetails({
  output,
  title,
  goal,
  team,
  cot = [],
}) {
  const { sidebarStack, setSidebarStack } = useStackSidebar();
  function handleCoT() {
    if (cot.length > 0) {
      setSidebarStack((prev) => [
        ...prev,
        {
          component: <ChainOfThoughtVisualizer data={cot} />,
        },
      ]);
    }
  }
  return (
    <div className="p-6 bg-slate-800 rounded-lg shadow-md">
      {cot.length > 0 && (
        <Alert variant="green" className="mb-4">
          <AlertTitle>Note !</AlertTitle>
          <AlertDescription className="capitalize">
            This Agent Have Used Custom Agentic Workflow To archive the goal
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-center gap-4 mb-5">
        <Briefcase className="text-slate-400 w-6 h-6" />
        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Goal className="text-slate-400 w-5 h-5" />
          <h3 className="text-lg font-semibold text-slate-200">Goal</h3>
        </div>
        <p className="text-slate-300 leading-relaxed">{goal}</p>
      </div>

      <div className="mb-6">
        {team && team.length > 0 && (
          <div className="flex items-center gap-3 mb-2">
            <HeartHandshake
              className="text-slate-400 "
              width={20}
              height={20}
            />
            <h3 className="text-lg font-semibold text-slate-200">
              Collaborated With Personas
            </h3>
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
                    <div className="bg-slate-700 border border-slate-600/50 px-3 py-2 rounded-md flex gap-2 items-center text-white  transition-colors cursor-pointer">
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

        {cot.length > 0 && (
          <div className="my-4 flex gap-2 flex-col">
            <div className="flex gap-2 items-center">
              <Brain className="w-5 h-5 text-slate-400" />
              <span className="text-slate-200 font-semibold text-lg">
                Open Chain Of Thoughts
              </span>
            </div>
            <div>
              <Button onClick={handleCoT}>Open Chain Of Thoughts</Button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <FileText className="text-slate-400 w-5 h-5" />
          <h3 className="text-lg font-semibold text-slate-200">Output</h3>
        </div>
        <p className="text-slate-300 leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]} // Added remarkGfm for table support
            rehypePlugins={[rehypeKatex]}
            className="module flex flex-col gap-2 text-slate-400 bg-slate-700 p-2 rounded-md "
            components={{
              // Handle potential rendering issues
              p: ({ children }) => <p>{children}</p>,
              table: ({ children }) => (
                <table
                  style={{
                    borderCollapse: "collapse",
                    width: "100%",
                    color: "#e0e0e0",
                  }}
                >
                  {children}
                </table>
              ),
              th: ({ children }) => (
                <th
                  style={{
                    border: "1px solid #444",
                    padding: "8px",
                    backgroundColor: "#333",
                    color: "#e0e0e0",
                  }}
                >
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td
                  style={{
                    border: "1px solid #444",
                    padding: "8px",
                    backgroundColor: "#222",
                    color: "#e0e0e0",
                  }}
                >
                  {children}
                </td>
              ),
              pre: ({ children }) => {
                return (
                  <pre className="bg-slate-800 p-2 rounded-md text-wrap">
                    {children}
                  </pre>
                );
              },
            }}
          >
            {output}
          </ReactMarkdown>
        </p>
      </div>
    </div>
  );
}
