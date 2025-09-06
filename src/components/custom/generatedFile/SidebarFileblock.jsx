import { useEffect, useRef, useState } from "react";
import { pollGenDocStatus } from "../../../services/genDoc/pollGenDocStatus";
import { CircleDashed, File, Globe2, ListTodo, Loader2, ScrollText, Shapes } from "lucide-react";
import { Progress } from "../../ui/progress";
import StandardWorkflow from "../Workflow/StandardWorkflow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function extractSectionAndInstruction(blockText) {
  // Regex for section
  const sectionMatch = blockText.match(/^- section:\s*(.+)$/m);
  // Regex for instruction (multiline support until next hyphen label or end)
  const instructionMatch = blockText.match(/^- instruction:\s*([\s\S]*?)(?=\n- [a-z])/m);

  return {
    section: sectionMatch ? sectionMatch[1].trim() : "N/A",
    instruction: instructionMatch ? instructionMatch[1].trim() : "N/A"
  };
}


export default function SidebarFileBlock({ genId, name, pages }) {
  const [workflowData, setWorkflowData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRetryTrigger, setIsRetryTrigger] = useState(false);
  const [isInitLoading, setIsInitLoading] = useState(false);
  const [tabValue, setTabValue] = useState("task");
  const [isError, setIsError] = useState(false);
  const pollingInterval = useRef(null);

  // Switch to PDF tab when file is ready
  useEffect(() => {
    if (workflowData?.fileBucketPath) {
      setTabValue("pdf");
    }
  }, [workflowData?.fileBucketPath]);

  // Main polling logic
  useEffect(() => {
    const pollAndStore = async () => {
      if (!isInitLoading && workflowData == null) {
        setIsInitLoading(true);
      }

      // Stop polling if we already have the file
      if (workflowData?.fileBucketPath) {
        return;
      }

      try {
        if (!genId) {
          console.error("No genId provided for polling");
          return;
        }

        const res = await pollGenDocStatus(genId);
        
        if (res?.success) {
          setWorkflowData(res.data);
          
          if (res.data?.content && Array.isArray(res.data.content) && res.data.content.length > 0) {
            setIsCompleted(res.data.content[res.data.content.length - 1]?.isCompleted || false);
          }

          // Stop polling when file is ready
          if (res.data?.fileBucketPath && pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
            console.log("File ready, stopping polling");
            return;
          }
        } else {
          setIsRetryTrigger(prev => !prev);
        }

        if (isInitLoading) {
          setIsInitLoading(false);
        }
      } catch (error) {
        console.error("Error polling workflow data:", error);
        setIsError(true);
        if (isInitLoading) {
          setIsInitLoading(false);
        }
      }
    };

    if (genId) {
      // Initial call
      pollAndStore();
      
      // Set up polling interval
      if (!workflowData?.fileBucketPath) {
        pollingInterval.current = setInterval(pollAndStore, 5000);
      }

      // Cleanup
      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
      };
    } else {
      console.warn("genId is not available for polling");
    }
  }, [genId, isRetryTrigger]);

  // Clean up polling when file is ready
  useEffect(() => {
    if (workflowData?.fileBucketPath && pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, [workflowData?.fileBucketPath]);

  // Error state
  if ((workflowData?.isError) || isError) {
    return (
      <div className="p-3">
        <div className="p-3 bg-red-500/20 border border-red-500 text-red-200 rounded-2xl">
          <p className="font-medium">Error: Failed to fetch document generation status</p>
          <button
            onClick={() => {
              setIsError(false);
              setIsRetryTrigger(prev => !prev);
            }}
            className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isInitLoading && workflowData == null) {
    return (
      <div className="p-3 h-full w-full text-white rounded-2xl flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <p>Loading document details...</p>
      </div>
    );
  }
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 my-3 font-semibold text-lg">
        <ScrollText />
        <p>{name || "Document"}</p>
      </div>
      
      <Tabs 
        defaultValue="task" 
        value={tabValue} 
        onValueChange={(value) => {
          if (value === "pdf" && workflowData?.fileBucketPath) {
            setTabValue("pdf");
          } else {
            setTabValue("task");
          }
        }} 
        className="w-full"
      >
        <TabsList className="bg-slate-700 rounded-xl flex gap-2 w-fit sticky top-0 z-50">
          <TabsTrigger 
            value="pdf" 
            disabled={!workflowData?.fileBucketPath}
            className="data-[state=active]:bg-blue-600"
          >
            <div className="flex gap-2 items-center">
              <File className="w-5 h-5" />
              <p>PDF</p>
            </div>
          </TabsTrigger>
          <TabsTrigger value="task" className="data-[state=active]:bg-g1">
            <div className="flex gap-2 items-center">
              <ListTodo className="w-5 h-5" />
              <p>Tasks</p>
            </div>
          </TabsTrigger>
        </TabsList>
      <TabsContent value="pdf" className="overflow-hidden">
        <div className="flex flex-col w-full h-full">
          {workflowData?.fileBucketPath ? (
            <>
              <iframe
                src={`${workflowData.fileBucketPath}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                className="w-full h-[80vh] border border-gray-300 rounded-lg shadow-sm"
                title="PDF Document Viewer"
                allow="fullscreen"
                loading="lazy"
                onError={(e) => {
                  console.error('PDF iframe failed to load:', e);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden p-4 text-center text-gray-500 bg-gray-100 rounded-lg">
                <p>Unable to display PDF. Please try opening it in a new tab.</p>
                <a 
                  href={workflowData.fileBucketPath} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Open PDF in new tab
                </a>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[80vh] text-gray-500">
              <div className="text-center">
                <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>PDF not available</p>
              </div>
            </div>
          )}
        </div>
      </TabsContent>
        <TabsContent value="task">
          <div className="bg-g1/70 p-3 rounded-2xl flex-col flex justify-between gap-2 relative">
            <div className="flex gap-2 items-center justify-between">
              <div className="flex gap-2 items-center">
                <CircleDashed className={`${!isCompleted && "animate-spin"} w-5 h-5`} />
                <p>Summary</p>
              </div>
              {!isCompleted && (
                <div className="text-yellow-500 text-sm">
                  {workflowData?.progress?.estimatedRemainingTime || "0"} Remaining
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Progress 
                className="h-3" 
                value={typeof workflowData?.progress?.percentage === 'number' ? workflowData.progress.percentage : 0} 
              />

              <div className="flex justify-between items-center w-full">
                <p className="text-sm text-slate-400">
                  {typeof workflowData?.progress?.percentage === 'number' 
                    ? `${workflowData.progress.percentage}%` 
                    : "0%"}
                </p>

                <p className="text-sm text-slate-400">
                  {workflowData?.relativeTime && !isCompleted 
                    ? workflowData.relativeTime 
                    : (isCompleted ? "Completed" : "N/A")}
                </p>
              </div>
            </div>
          </div>

          {!isCompleted && (
            <div className="w-auto p-2 mx-4 py-3 rounded-b-xl bg-g2 -z-10 text-yellow-400 animate-pulse">
              {workflowData?.status}
            </div>
          )}

          <div className="mt-4">
            <StandardWorkflow
              data={
                workflowData?.content?.map((item) => ({
                  title: extractSectionAndInstruction(item.sectionInfo).section || "No Title",
                  description: extractSectionAndInstruction(item.sectionInfo).instruction || "No Instruction",
                  isCompleted: item.isCompleted,
                  isLoading: item.isLoading,
                  children: (
                    <div className="flex gap-2">
                      {item?.visualization?.numOfVisualization > 0 && (
                        <div className="flex items-center gap-2 bg-slate-900 rounded-xl p-2 w-fit">
                          <Shapes className="w-6 h-6" />
                          <p>{item.visualization.numOfVisualization} Visualizations</p>
                        </div>
                      )}

                      {item.internetSearch && item.internetSearch.length > 0 && (
                        <div className="flex items-center gap-2 bg-slate-900 rounded-xl p-2 w-fit">
                          <Globe2 className="w-6 h-6" />
                          <p>{item.internetSearch.length} Internet Searches</p>
                        </div>
                      )}
                    </div>
                  )
                })) || []
              }
            />
          </div>
        </TabsContent>
    </Tabs>
    </div>
  );
}
