import { useEffect, useRef, useState } from "react";
import { pollGenDocStatus } from "../../../services/genDoc/pollGenDocStatus";
import { CircleDashed, File, Globe, Globe2, ListTodo, Loader2, ScrollText, Shapes } from "lucide-react";
import { Progress } from "../../ui/progress";
import StandardWorkflow from "../Workflow/StandardWorkflow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PDFViewer from "../FileReader";
// {
//     "id": 88,
//     "created_at": "2025-07-22T18:39:05.432084+00:00",
//     "isError": false,
//     "content": [
//         {
//             "isLoading": false,
//             "isCompleted": true,
//             "sectionInfo": "- section: Cover Page and Filing Summary\n- instruction: Create the cover page and filing summary for the SEC 10-K document, adhering to the standard format required by the SEC. Include the company name (use a placeholder like 'XYZ Corporation'), fiscal year end date (assume December 31, 2024), filing date (use current date: July 22, 2025), CIK number (placeholder), and other required identifiers. Specify that this is an annual report pursuant to Section 13 or 15(d) of the Securities Exchange Act of 1934. Include a summary of the filing contents as per SEC guidelines, ensuring compliance with formatting rules such as font size and layout.\n- is continuation: false\n- previous summary: N/A\n- next agent note: Do NOT summarize or conclude—leave open for the next agent to continue seamlessly.",
//             "visualization": {
//                 "description": "not",
//                 "numOfVisualization": 0
//             },
//             "internetSearch": []
//         }
//     ],
//     "status": "Section Updated",
//     "fileBucketPath": null,
//     "relativeTime": "Generating for 26 minutes",
//     "progress": {
//         "percentage": 63,
//         "estimatedRemainingTime": "14 minutes 5 seconds",
//         "totalEstimatedTime": "39 minutes 20 seconds"
//     }
// }
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
  const pollingInterval = useRef(null)
  useEffect(() => {
    if (workflowData && workflowData?.fileBucketPath && workflowData?.fileBucketPath !== "") {
      setTabValue("pdf");
    }
  }, [workflowData])

  useEffect(() => {
    const pollAndStore = async () => {
      if (!isInitLoading && workflowData == null) {
        setIsInitLoading(true)
      }
      console.log("---:", workflowData);
      if (workflowData?.fileBucketPath) {
        return;
      }
      try {
        if (!genId) {
          console.error("No genId provided for polling");
          return;
        }
        const res = await pollGenDocStatus(genId);
        console.log("Polling result:", res);
        if (res && res?.success) {
          setWorkflowData(res.data)
          if (res?.data?.content && Array.isArray(res.data.content) && res.data.content.length > 0) {
            setIsCompleted(res.data.content[res.data.content.length - 1]?.isCompleted || false);
          }
          console.log("File bucket path:", res.fileBucketPath, res);

          // Check if we have fileBucketPath and stop polling immediately
          if (res.data?.fileBucketPath) {
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current);
              pollingInterval.current = null;
              console.log("File bucket path found, stopping polling.");
            }
            return;
          }
        }
        else {
          setIsRetryTrigger(true);
        }
        if (isInitLoading) {
          setIsInitLoading(false);
        }
      } catch (error) {
        console.error("Error polling workflow data:", error);
        setIsError(true);
      }
    }

    if (genId) {
      // Call immediately for initial loading
      pollAndStore();
      // Then set up interval for subsequent polls
      pollingInterval.current = setInterval(pollAndStore, 5000);
      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
      };
    } else {
      console.warn("genId is not available for polling");
    }
  }, [isRetryTrigger])

  useEffect(() => {
    if (workflowData?.fileBucketPath && pollingInterval.current) {
      pollingInterval.current && clearInterval(pollingInterval.current);
      pollingInterval.current = null;
      console.log("stopping polling as file bucket path is available");

    }
  }, [workflowData])

  if ((workflowData && workflowData?.isError) || isError) {
    return (
      <div>
        <div className="p-3 bg-red-500 text-white rounded-2xl">
          <p>Error: Failed to fetch document generation status</p>
          <button
            onClick={() => setIsRetryTrigger(!isRetryTrigger)}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
          >
            Recheck Status
          </button>
        </div>
      </div>
    )
  }
  if (isInitLoading && workflowData == null) {
    return (
      <div className="p-3 h-full w-full text-white rounded-2xl flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin 0" />
        <p className="ml-2 ">Loading Details...</p>
      </div>
    )
  }
  return <div className="p-3 ">
    <div className="flex items-center gap-2 my-3 font-semibold text-lg ">
      <ScrollText />
      <p>{name || "-"}</p>
    </div>
    <Tabs defaultValue="task" value={tabValue} onValueChange={(value) => {
      if (value == "pdf" && workflowData?.fileBucketPath) {
        setTabValue("pdf");
        return;
      }
      setTabValue("task");
    }} className="w-full">
      <TabsList className="bg-slate-700 rounded-xl flex gap-2 w-fit sticky top-0 z-50">
        <TabsTrigger value="pdf">
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
        <PDFViewer url={workflowData?.fileBucketPath} />"
      </TabsContent>
      <TabsContent value="task" className>
        <div className="bg-g1/70 p-3 rounded-2xl flex-col flex justify-between gap-2 relative">
          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-2 items-center">
              <CircleDashed className={`${!isCompleted && "animate-spin "} w-5 h-5`} />
              <p>Summary</p>
            </div>
            <div className={`${isCompleted ? "hidden " : "text-yellow-500"} text-sm `}>
              {`${workflowData?.progress?.estimatedRemainingTime || 0} Remaining`}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">

            <div>
              <Progress className={`h-3 `} value={typeof workflowData?.progress?.percentage == 'number' ? workflowData?.progress?.percentage : 0} />
            </div>

            <div className="flex justify-between items-center w-full">

              {/* percentage */}
              {
                typeof workflowData?.progress?.percentage === 'number' ? (
                  <p className="text-sm text-slate-400">{workflowData?.progress?.percentage}%</p>
                ) : (
                  <p className="text-sm text-slate-400">0%</p>
                )
              }

              {/* estimated time */}
              {
                workflowData?.relativeTime && !isCompleted ? (
                  <p className="text-sm text-slate-400">
                    {workflowData?.relativeTime}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">{isCompleted ? "Completed" : "N/A"}</p>
                )
              }

            </div>
          </div>
        </div>
        <div className={`w-auto p-2 mx-4 py-3 rounded-b-xl bg-g2 -z-10 ${!isCompleted ? 'text-yellow-400 animate-pulse' : "hidden"}`}>
          {workflowData?.status}
        </div>
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
                    {item?.visualization?.numOfVisualization ? (
                      <div className={` flex items-center gap-2 bg-slate-900 rounded-xl p-2 w-fit`}>
                        <Shapes className="w-6 h-6" />
                        <p>{item?.visualization?.numOfVisualization} Visualizations</p>
                      </div>
                    ) : <></>}

                    {
                      item.internetSearch && item.internetSearch.length > 0 ? (
                        <div className={` flex items-center gap-2 bg-slate-900 rounded-xl p-2 w-fit`}>
                          <Globe2 className="w-6 h-6" />
                          <p>{item.internetSearch.length} Internet Searches</p>
                        </div>
                      ) : <></>
                    }
                  </div>
                )
              }))
            }
          />

        </div>
      </TabsContent>
    </Tabs>

  </div >
}
