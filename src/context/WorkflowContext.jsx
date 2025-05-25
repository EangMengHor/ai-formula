import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useToast } from "../hooks/use-toast";
import { getUserSavedWorkflow } from "@/services/user-saved-workflow-apis/getUserSavedWorkflow";
import { useUser } from "./UserContext";

const WorkflowContext = createContext();

export const WorkflowProvider = ({ children }) => {
  // State for all available workflows for user
  const [workflowList, setWorkflowList] = useState([]);
  // State for the selected workflow ID
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const { user } = useUser();
  const { toast } = useToast();

  // Fetch user workflows when user ID changes
  useEffect(() => {
    let isMounted = true;

    async function fetchUserWorkflows() {
      if (!user?.id) return;

      try {
        const data = await getUserSavedWorkflow(user.id);
        if (isMounted) {
          setWorkflowList(data.data);
        }
      } catch (error) {
        console.error("Error fetching user workflows:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to fetch user workflows",
            variant: "destructive",
          });
        }
      }
    }

    fetchUserWorkflows();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [user?.id, toast]);

  // Handler for selecting a workflow - memoize to prevent recreation on every render
  const selectWorkflow = useCallback(
    (workflowId) => {
      if (workflowId === null) {
        toast({
          title: "Workflow removed",
          description: "No workflow selected for this conversation",
        });
        setSelectedWorkflowId(null);
        return;
      }

      const workflow = workflowList.find((w) => w.id === workflowId);
      if (workflow) {
        toast({
          title: "Workflow selected",
          description: `${workflow.name} with ${workflow.personaList.length} ${
            workflow.personaList.length > 1 ? "personas" : "persona"
          } has been selected for this conversation`,
        });
      }

      setSelectedWorkflowId(workflowId);
    },
    [workflowList, toast],
  );

  // Memoized function to get the selected workflow
  const getSelectedWorkflow = useMemo(
    () => () => workflowList.find((w) => w.id === selectedWorkflowId) || {
        name:"No Workflow Selected",
        personaList: [],
        workflow
    },
    [workflowList, selectedWorkflowId],
  );

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({
      workflowList,
      setWorkflowList,
      selectedWorkflowId,
      setSelectedWorkflowId,
      selectWorkflow,
      getSelectedWorkflow,
    }),
    [workflowList, selectedWorkflowId, selectWorkflow, getSelectedWorkflow],
  );

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
};
