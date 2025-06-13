import { BadgePlus, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import { useToast } from "../../../hooks/use-toast";
import { getUserAgenticAutomation } from "../../../services/n8n-agentic-auto/getUserAgenticAutomation.api";
import UserAgenticAutoCard from "../../../components/custom/agenticAutomation/UserAgenticAutoCard";

export default function AgenticAutomation() {
  //hooks
  const { toast } = useToast();

  // local states
  const [isUserAgenticAutomationLoading, setIsUserAgenticAutomationLoading] =
    useState(false);
  const [userAgenticAutomationProject, setUserAgenticAutomationProject] =
    useState([]);
  const { user } = useUser();

  // when page load get all the automations of the use
  useEffect(() => {
    async function fetchUserAgenticAutomation() {
      setIsUserAgenticAutomationLoading(true);
      try {
        const resp = await getUserAgenticAutomation(user.id);

        if (resp.success && resp.data.lenght <= 0) {
          toast({
            title: "No Agentic Automation Found",
            description: "You have not created any agentic automation yet",
            varient: "default",
          });
        }
        if (resp.success && resp.data.length > 0) {
          setUserAgenticAutomationProject(resp.data);
          return;
        }

        if (!resp.success) {
          toast({
            title: "Error Loading Your Agentic Automation",
            description: resp.message,
            varient: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error Loading Your Agentic Automation",
          description: error.message,
          varient: "destructive",
        });
      } finally {
        setIsUserAgenticAutomationLoading(false);
      }
    }
    if (user.id) {
      fetchUserAgenticAutomation();
    }
  }, []);

  return (
    <div>
      <Link
        to="/agenticAutomation/createNewAgenticAutomation"
        className="w-full sm:w-[30%] h-32 bg-slate-800 hover:bg-slate-700 cursor-pointer rounded-md my-4 flex flex-col items-center justify-center"
      >
        <BadgePlus className="text-white" />
        <p className="font-semibold text-xl mt-3 text-white text-center">
          Create New Agentic Automation
        </p>
      </Link>

      <hr className="border border-slate-600" />
      {isUserAgenticAutomationLoading ? (
        <div className="w-full h-96 gap-2 flex items-center justify-center">
          <LoaderCircle className="text-white animate-spin" />
          <p className="font-semibold text-white ">
            Loading Your Agentic Automation Project
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
          {userAgenticAutomationProject &&
            userAgenticAutomationProject.length > 0 &&
            userAgenticAutomationProject.map((project, index) => {
              return (
                <UserAgenticAutoCard
                  key={index}
                  name={project.name}
                  interval={project.interval}
                  task={project.task}
                  nextRun={project.next_run_date}
                  lastRun={project.last_run_date}
                  superiorPersonas={project.superiorPersonas}
                  taskAgents={project.taskAgents}
                  id={project.id}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}
