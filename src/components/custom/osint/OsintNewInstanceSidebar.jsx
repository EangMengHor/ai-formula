import { useToast } from "@/hooks/use-toast";
import { pollNewOsintInstanceWorkflow } from "@/services/osint/pollNewOsintInstanceWorkflow";
import { useEffect, useState } from "react";

export default function OsintNewInstanceSidebar({ workflowId, name }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [workflowData, setWorkflowData] = useState(null);

  useEffect(() => {
    async function fetchNewOsintInstanceWorkflow() {
      try {
        setIsLoading(true);
        console.log(
          "[OsintNewInstanceSidebar] Fetching new OSINT instance workflow for ID:",
          workflowId,
        );
        const response = await pollNewOsintInstanceWorkflow(workflowId);
        console.log("[OsintNewInstanceSidebar] Response:", response);
      } catch (error) {
        console.error(
          "[OsintNewInstanceSidebar] Error fetching new OSINT instance workflow:",
          error,
        );
        toast({
          title: "Error",
          description: "Failed to fetch new OSINT instance workflow.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    console.log(
      "[OsintNewInstanceSidebar] Component mounted with workflowId:",
      workflowId,
    );
    if (workflowId) {
      fetchNewOsintInstanceWorkflow();
    }
  }, [workflowId]);

  return (
    <div className="p-3">
      <div>
        <p className="font-semibold text-lg">{name}</p>
      </div>
    </div>
  );
}
