"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  Calendar,
  Clock,
  ChevronDown,
  Activity,
  Maximize2,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

// Import the API function (adjust the path as needed)
import { useToast } from "../../../hooks/use-toast";
import { getJobDetails } from "../../../services/n8n-agentic-auto/getJobDetails.api";
import { useParams } from "react-router-dom";
import { WorkflowDiagram } from "../../../components/custom/AiInteraction/WorkflowDiagram";
import {
  formatDate,
  getStatusColor,
  groupWorkflowData,
} from "../../../lib/utils";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import "../../_private/components/sidebarProvided/components/Chat.css";
import { Workflow } from "../../../components/custom/agenticAutomation/workflow/workflow";
import { getJobEachAgentResponse } from "../../../services/n8n-agentic-auto/getJobEachAgentResponse.api";
import PersonaDetails from "../../../components/custom/AiInteraction/PersonaDetails";
import PersonaOp from "../../../components/custom/AiInteraction/PersonaOp";
export default function JobDetails() {
  const { jobId } = useParams();
  const [jobData, setJobData] = useState(null);
  const [isJobDataLoading, setIsJobDataLoading] = useState(true);
  const [showFullDiagram, setShowFullDiagram] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  // states for "show all agents workflow exection and interaction"
  const [eachAgentResponse, setEachAgentResponse] = useState([]);
  const [isShowAllAgentsLoading, setIsShowAllAgentsLoading] = useState(false);
  const { toast } = useToast();

  async function getJobIdData() {
    setIsJobDataLoading(true);
    try {
      const res = await getJobDetails(jobId);
      if (res.success && res.data) {
        setJobData(res.data);
        return;
      }
      toast({
        title: "Error Fetching Data",
        description: res.message,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error Fetching Data",
        description: "Error Occurred While Fetching Data About This Job!",
        variant: "destructive",
      });
    } finally {
      setIsJobDataLoading(false);
    }
  }

  // This effect will call API for data about current job id
  useEffect(() => {
    if (jobId) {
      getJobIdData();
    }
  }, [jobId]);

  // this function calls api to get all the data about all the agents
  async function getAllAgentsResponseAndCoT() {
    if (isShowAllAgentsLoading) return;
    try {
      setIsShowAllAgentsLoading(true);
      const res = await getJobEachAgentResponse(jobId);
      if (res.success) {
        setEachAgentResponse(res.data);
        return;
      }
      toast({
        title: "Error Fetching Data",
        description: res.message,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error Fetching Data",
        description: "Error Occurred While Fetching Data About This Job!",
        variant: "destructive",
      });
    }
  }

  if (isJobDataLoading || !jobData) {
    return <JobDetailsSkeleton />;
  }

  return (
    <div className="min-h-screen  text-slate-100 p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr,3fr] gap-6">
          {/* Left Column - Workflow Diagram */}
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-6 h-[400px]">
              <div className="text-slate-400 mb-4">
                <h3 className="font-semibold text-slate-300 text-xl">
                  Agent Interaction Behaviour
                </h3>
                {jobData.jobInteractionMap.length || 0} Interaction Taken Place
                In This Job. Check Goal Achieved By Each Agent By Zooming the
                Agents Below 👇
              </div>
              <div className="h-[calc(100%-30px)]">
                <WorkflowDiagram
                  isAgenticWorkflowExecuted={true}
                  data={groupWorkflowData(jobData.jobInteractionMap)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300"
              onClick={() => setShowFullDiagram(true)}
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              View Full Interaction Map Between Agents
            </Button>
          </div>

          {/* Right Column - Details */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6">
            {/* Header Section */}
            <div className="mb-6 bg-slate-800 p-4 rounded-md">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1
                  className="text-2xl font-semibold text-white truncate"
                  title={jobData.automationName}
                >
                  {jobData.automationName}
                </h1>
                <Badge
                  className={`px-3 py-1 border ${getStatusColor(jobData.jobStatus)}`}
                >
                  {jobData.jobStatus}
                </Badge>
              </div>
              <p
                className="text-slate-400 line-clamp-2"
                title={jobData.automationTask}
              >
                {jobData.automationTask}
              </p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Next Run</p>
                  <p className="text-white">{formatDate(jobData.nextRun)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Last Run</p>
                  <p className="text-white">{formatDate(jobData.lastRun)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Activity className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Job Created At</p>
                  <p className="text-white">
                    {formatDate(jobData.jobCreatingDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Superior Personas */}
            {jobData.automationSuperiorPersona?.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg text-white">Superior Personas</h3>
                  <Badge
                    variant="outline"
                    className="ml-1 bg-transparent text-slate-400 border-slate-700"
                  >
                    {jobData.automationSuperiorPersona.length}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-3">
                  {jobData.automationSuperiorPersona.map((persona, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-slate-900/80 rounded-lg px-4 py-2 border border-slate-600/50"
                    >
                      <Brain className="h-4 w-4 text-purple-400" />
                      <span className="text-slate-300 truncate max-w-[200px]">
                        {persona.name}
                      </span>
                      <Badge className="bg-slate-700 text-slate-300 border-none">
                        {persona.numberOfPersona}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full mt-6">
          {/* Final Report Section */}
          {jobData.jobFinalReport && jobData.jobFinalReport !== "''" && (
            <div className=" bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 w-[60%]">
              <h2 className="text-xl font-semibold text-white mb-4">
                Final Report
              </h2>
              <div className="relative">
                <div
                  className={`prose prose-invert max-w-none bg-slate-900/30 rounded-lg py-4 ${
                    !showFullReport ? "max-h-[180px] overflow-hidden" : ""
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    className="module"
                    components={{
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
                    }}
                  >
                    {jobData.jobFinalReport || ""}
                  </ReactMarkdown>
                </div>

                {!showFullReport && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-800 rounded-b-md to-transparent pointer-events-none" />
                )}

                <div className="mt-8 text-center">
                  <Button
                    variant="outline"
                    className="border-slate-600 bg-slate-900/50 hover:bg-slate-800 text-slate-300 z-10 relative"
                    onClick={() => setShowFullReport(!showFullReport)}
                  >
                    {showFullReport ? "Show Less" : "Show Complete Report"}
                    <ChevronDown
                      className={`ml-2 h-4 w-4 transition-transform ${showFullReport ? "rotate-180" : ""}`}
                    />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-6  w-[40%]">
            <div>
              <p className="font-semibold text-lg">Agentic Workflow</p>
              <p className="text-slate-400 capitalize">
                This is Workflow that Each Agent Have Used to reach to decisions
                , research and final response
              </p>
            </div>
            <div className="flex items-start justify-start">
              <Workflow data={jobData.automationEachAgentTask} />
            </div>
          </div>
        </div>
      </div>
      <div className="my-2">
        <div
          onClick={getAllAgentsResponseAndCoT}
          className={`flex justify-between cursor-pointer bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 font-semibold text-lg hover:bg-slate-700 ${eachAgentResponse.length > 0 && "hidden"}`}
        >
          {!isShowAllAgentsLoading ? (
            <div className="flex gap-2">
              Show All Agents Workflow Execution and Interaction
              <ChevronRight />
            </div>
          ) : (
            <div className="flex gap-2 animate-pulse items-center">
              <LoaderCircle className="animate-spin" />
              Loading Each Agent's Details...
            </div>
          )}
        </div>
        {eachAgentResponse.length > 0 && (
          <div>
            <div className="flex gap-2 text-white items-center">
              <p className="font-semibold text-lg">
                Personas Used In This Automation
              </p>
              <p className="text-slate-600">Click To View Chain Of Thoughts</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3  gap-4 mt-4 pb-80">
              {eachAgentResponse.length > 0 &&
                eachAgentResponse.map((agent, index) => (
                  <PersonaOp
                    key={index}
                    output={agent.output}
                    title={agent.name}
                    goal={agent.goal}
                    team={agent.team}
                    cot={agent.CoT}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Diagram Dialog */}
      <Dialog open={showFullDiagram} onOpenChange={setShowFullDiagram}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] bg-slate-900 p-6">
          <div className="w-full h-[calc(90vh-100px)]">
            <WorkflowDiagram
              isAgenticWorkflowExecuted={true}
              data={groupWorkflowData(jobData.jobInteractionMap)}
              isFullSize={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobDetailsSkeleton() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr,3fr] gap-6">
          <div className="space-y-4">
            <Skeleton className="w-full h-[400px]" />
            <Skeleton className="w-full h-10" />
          </div>
          <div>
            <Skeleton className="w-3/4 h-8 mb-3" />
            <Skeleton className="w-full h-20 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-24" />
              ))}
            </div>
            <Skeleton className="w-full h-48" />
          </div>
        </div>
        <Skeleton className="w-full h-48 mt-6" />
      </div>
    </div>
  );
}
