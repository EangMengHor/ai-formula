import { useToast } from "@/hooks/use-toast";
import { getUserAutomation } from "@/services/automations/getUserAutomation.api";
import { CalendarSync, Loader2, Play, Snowflake } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getUserAutomationJobs } from "@/services/automations/getUserAutomationJobs.api";
import SourcesIndicator from "@/components/custom/CitationSources";
import { useNavigate } from "react-router-dom";
export default function AutomationPage() {
  const [isAutomationLoading, setIsAutomationLoading] = useState(false);
  const [isAutomationJobsLoading, setIsAutomationJobsLoading] = useState(false);
  const [automationJobsData, setAutomationJobsData] = useState(null);
  const [automationData, setAutomationData] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [activeHoverId, setActiveHoverId] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on mount

    async function getAutomationOfUser() {
      setIsAutomationLoading(true);
      try {
        const data = await getUserAutomation();
        if (data) {
          setAutomationData(data.data);
        } else {
          console.error("Failed to fetch automation data");
        }
      } catch (error) {
        console.error("Error fetching automation data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch automation data",
          variant: "destructive",
        });
      } finally {
        setIsAutomationLoading(false);
      }
    }

    async function loadUserJobs() {
      setIsAutomationJobsLoading(true);
      try {
        const data = await getUserAutomationJobs();
        console.log(data, "User Automation Jobs Data");
        if (data) {
          setAutomationJobsData(data.data);
        } else {
          console.error("Failed to fetch automation jobs");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch automation jobs",
          variant: "destructive",
        });
      } finally {
        setIsAutomationJobsLoading(false);
      }
    }

    async function fetchData() {
      await Promise.all([getAutomationOfUser(), loadUserJobs()]);
    }
    fetchData();
  }, []);

  return (
    <div className="flex text-white flex-col p-4 h-screen  px-10  my-10 w-full items-center overflow-scroll ">
      <div className="max-w-7xl">
        <div className="flex flex-col  items-center w-full  h-fit max-w-7xl">
          {isAutomationLoading ? (
            <div className="flex items-center p-2 justify-center gap-2 w-full rounded-md  h-fit  bg-slate-800">
              <Loader2 className="animate-spin h-5 w-5 text-white" />
              <p className="text-white">Loading automations...</p>
            </div>
          ) : (
            <div>
              <p className="font-semibold mb-2 text-lg">Your Automations</p>
              {automationData && automationData.length !== 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {(showAll
                      ? automationData
                      : automationData.slice(0, 4)
                    ).map((automation) => (
                      <div
                        key={automation.id}
                        onMouseEnter={() => setActiveHoverId(automation.id)}
                        onMouseLeave={() => setActiveHoverId(null)}
                        className="p-4 bg-slate-800 hover:bg-slate-800/80 cursor-pointer flex flex-col justify-between h-52 rounded-md shadow-md"
                      >
                        <div className="space-y-2">
                          <CalendarSync />
                          <h3 className="text-lg ">{automation.name}</h3>
                        </div>
                        <div>
                          {activeHoverId === automation.id && (
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger>
                                  <div>
                                    <div className="p-1 bg-slate-700 hover:bg-slate-700/60 rounded-md w-fit h-fit">
                                      <Snowflake />
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Freeze Automation</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div>
                                    <div className="p-1 bg-slate-700 hover:bg-slate-700/60 rounded-md w-fit h-fit">
                                      <Play />
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Run Right Now</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {!showAll && automationData.length > 4 && (
                    <div className="flex  mt-2">
                      <button
                        onClick={() => setShowAll(true)}
                        className=" rounded  transition underline"
                      >
                        Show More
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-400">
                  No automations found.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center h-fit w-full max-w-7xl mt-4">
          <div className="flex items-start w-full justify-start">
            <p className="font-semibold text-left mb-2 text-lg">
              Your Automation History
            </p>
          </div>
          {console.log(automationJobsData, "Automation Jobs Data")}
          <div className="w-full h-fit rounded-md">
            {isAutomationJobsLoading ? (
              <div className="flex items-center p-2 justify-center gap-2 w-full rounded-md  h-fit  bg-slate-800">
                <Loader2 className="animate-spin h-5 w-5 text-white" />
                <p className="text-white">Loading automation jobs...</p>
              </div>
            ) : (
              <div className="gap-4 w-full">
                {automationJobsData && automationJobsData.length > 0 ? (
                  automationJobsData.map((job) => (
                    <div className="mb-4 cursor-pointer">
                      <div className="min-w-full flex gap-2 items-center ">
                        <p className="w-fit font-semibold text-lg">
                          {job.createdAt}
                        </p>
                        <hr className="border border-slate-300 w-[calc(100%-10rem)]" />
                      </div>
                      <div className="flex flex-col gap-4 py-2 w-full h-full  rounded-md mt-2">
                        {job.data.map((item) => (
                          <div
                            onClick={() => {
                              console.log(item, "Automation Job Item Clicked");
                              navigate(`/automationJobs/${item.id}`);
                            }}
                          >
                            <div className="flex gap-2 border-b-2 border-slate-500 py-3 mb-2">
                              {console.log(item, "Automation Job Item")}
                              <div>
                                {item.images ? (
                                  <img
                                    src={item.images[0].image_url}
                                    alt={item.title}
                                    className="h-64 w-96 object-cover rounded-md"
                                  />
                                ) : (
                                  <div className="h-64 w-96 border border-slate-500 bg-slate-400 flex items-center justify-center">
                                    Generating . . .
                                  </div>
                                )}
                              </div>
                              <div className="w-[60%] flex justify-between flex-col p-2">
                                <p className="font-bold text-2xl text-wrap">
                                  {item.title || "Generating . . . "}
                                </p>
                                <div>
                                  {item.citations &&
                                    item.citations.length > 0 && (
                                      <SourcesIndicator
                                        citations={item.citations}
                                      />
                                    )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400">
                    No automation jobs found.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
