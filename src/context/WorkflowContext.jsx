import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WorkflowContext = createContext();

export const WorkflowProvider = ({ children }) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [workflowList, setWorkflowList] = useState([
    {
      id: 1,
      userId: "34b6e6a2-6c31-45d1-95b3-9c64a16d58aa",
      personaList: [
        {
          id: 3,
          name: "AI Workflow Designer",
          description:
            "Builds and refines personalized AI-driven workflow agents.",
        },
      ],
      name: "tax workflow 2",
    },
    {
      id: 2,
      userId: "34b6e6a2-6c31-45d1-95b3-9c64a16d58aa",
      personaList: [
        {
          id: 3,
          name: "AI Workflow Designer",
          description:
            "Builds and refines personalized AI-driven workflow agents.",
        },
      ],
      name: "tax workflow 1",
    },
  ]);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedWorkflowId = localStorage.getItem("selectedWorkflowId");
    if (savedWorkflowId) {
      setSelectedWorkflowId(parseInt(savedWorkflowId));
    }
  }, []);

  useEffect(() => {
    if (selectedWorkflowId === null) {
      localStorage.removeItem("selectedWorkflowId");
    } else {
      localStorage.setItem("selectedWorkflowId", selectedWorkflowId.toString());
    }
  }, [selectedWorkflowId]);

  const selectWorkflow = (workflowId) => {
    setSelectedWorkflowId(workflowId);
    setWorkflowModalOpen(false);

    if (workflowId === null) {
      toast({
        title: "Workflow removed",
        description: "No workflow selected for this conversation",
      });
    } else {
      const workflow = workflowList.find((w) => w.id === workflowId);
      if (workflow) {
        toast({
          title: "Workflow selected",
          description: `${workflow.name} with ${workflow.personaList.length} ${
            workflow.personaList.length > 1 ? "personas" : "persona"
          } has been selected for this conversation`,
        });
      }
    }
  };

  const loadWorkflows = async () => {
    try {
      // TODO: Load workflows from API
    } catch (error) {
      console.error("Failed to load workflows:", error);
    }
  };

  const getSelectedWorkflow = () =>
    workflowList.find((w) => w.id === selectedWorkflowId);

  const WorkflowDialog = () => (
    <Dialog open={workflowModalOpen} onOpenChange={setWorkflowModalOpen}>
      <DialogContent className="bg-slate-800 text-white border border-slate-600 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Select Workflow
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Choose a workflow for this conversation
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto">
          <div
            onClick={() => selectWorkflow(null)}
            className={`p-4 border rounded-md cursor-pointer transition-colors ${
              selectedWorkflowId === null
                ? "bg-slate-700 border-blue-500"
                : "border-slate-600 hover:bg-slate-700"
            }`}
          >
            <div className="font-medium">No workflow</div>
            <div className="text-sm text-slate-400">
              Use default conversation without a specific workflow
            </div>
          </div>

          {workflowList.map((workflow) => (
            <div
              key={workflow.id}
              onClick={() => selectWorkflow(workflow.id)}
              className={`p-4 border rounded-md cursor-pointer transition-colors ${
                selectedWorkflowId === workflow.id
                  ? "bg-slate-700 border-blue-500"
                  : "border-slate-600 hover:bg-slate-700"
              }`}
            >
              <div className="font-medium">{workflow.name}</div>
              <div className="text-sm text-slate-400">
                {workflow.personaList.length}{" "}
                {workflow.personaList.length > 1 ? "personas" : "persona"}
                included
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setWorkflowModalOpen(false)}
            className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <WorkflowContext.Provider
      value={{
        workflowList,
        setWorkflowList,
        selectedWorkflowId,
        setSelectedWorkflowId,
        workflowModalOpen,
        setWorkflowModalOpen,
        selectWorkflow,
        loadWorkflows,
        getSelectedWorkflow,
        WorkflowDialog,
      }}
    >
      {children}
      <WorkflowDialog />
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
