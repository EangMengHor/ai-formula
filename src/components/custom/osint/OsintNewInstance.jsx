import { pollNewOsintInstanceWorkflow } from "@/services/osint/pollNewOsintInstanceWorkflow";
import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
export default function OsintNewInstance({ workflowId, name }) {
  const [status, setStatus] = useState("pending");
  const [workflowMessages, setWorkflowMessages] = useState([]);

  // polling
  useEffect(() => {
    async function fetch() {
      try {
        const response = await pollNewOsintInstanceWorkflow(workflowId);
        console.log("OSINT instance workflow response:", response);
        if (response) {
          console.log("OSINT instance workflow status:", response);
          setStatus(response.data);

          // Store the workflow messages if they exist
          if (response.message && Array.isArray(response.message)) {
            setWorkflowMessages(response.message);
          }
        } else {
          setStatus("error");
        }
        return response.data;
      } catch (error) {
        console.error("Error fetching OSINT instance workflow:", error);
        setStatus("error");
      }
    }
    const interval = setInterval(async () => {
      const status = await fetch();

      if (status === "success" || status === "completed") {
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, [workflowId]);
  return (
    <div>
      <div
        className={` bg-g1 cursor-pointer flex justify-between items-center gap-2 relative rounded-2xl p-1 `}
      >
        <div
          className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col"
          style={{ maxWidth: "80%" }}
        >
          {name.replaceAll("_", " ") || "Document"}
          <p className="text-slate-600 text-sm">OSINT Search Job (Click)</p>
        </div>
        <div className="flex-shrink-0 px-3 py-2">
          <img
            src="/people (1).png"
            className="opacity-70 w-16 h-1w-16 -rotate-6"
          />
        </div>
      </div>
      <div className="w-full bg-g2 p-4 -mt-5 pt- rounded-b-2xl flex flex-col space-y-4">
        {/* Workflow messages display - moved to the top */}
        <div className="text-sm   rounded-lg mt-4 bg-g ">
          {workflowMessages && workflowMessages.length > 0 ? (
            <div className="space-y-2">
              {workflowMessages.map((msg, index) => (
                <div key={index} className="text-gray-200 flex items-start">
                  <span>{index + 1 + ". "}</span>
                  <span>{msg || "Loading Workflow Step..."}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-300">
              <Loader2 className="animate-spin" size={14} />
              <span>Loading Workflow Step...</span>
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center space-x-2 text-sm font-medium">
          <div className="flex items-center gap-2">
            {status === "running" && (
              <>
                <Loader2 className="animate-spin text-yellow-500" size={18} />
                <span className="text-yellow-500">
                  Creating OSINT instance...
                </span>
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle className="text-green-500" size={18} />
                <span className="text-green-500">
                  OSINT instance created successfully!
                </span>
              </>
            )}
            {status === "completed" && (
              <>
                <CheckCircle className="text-green-500" size={18} />
                <span className="text-green-500">Completed !</span>
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="text-red-500" size={18} />
                <span className="text-red-500">
                  Error creating OSINT instance.
                </span>
              </>
            )}
            {!["running", "success", "completed", "error"].includes(status) && (
              <>
                <Clock className="text-gray-400" size={18} />
                <span className="text-gray-400">Pending...</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
