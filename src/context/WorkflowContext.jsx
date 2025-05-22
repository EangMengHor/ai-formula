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
import { getUserSavedWorkflow } from "@/services/user-saved-workflow-apis/getUserSavedWorkflow";
import { useUser } from "./UserContext";
import { X } from "lucide-react";
import { set } from "date-fns";

const WorkflowContext = createContext();

export const WorkflowProvider = ({ children }) => {
    const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
    const [workflowList, setWorkflowList] = useState([]);
    const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();


    useEffect(() => {
        async function getUserWorkflow() {
            try {
                const data = await getUserSavedWorkflow(user.id)
                setWorkflowList(data.data);
            } catch (error) {
                console.error("Error fetching user workflows:", error);
                toast({
                    title: "Error",
                    description: "Failed to fetch user workflows",
                    variant: "destructive",
                });
            }

        }
        if (user && user.id) getUserWorkflow()
    }, [user])




    const selectWorkflow = (workflowId) => {
        setSelectedWorkflowId(workflowId);
        setWorkflowModalOpen(false);

        if (workflowId === null) {
            toast({
                title: "Workflow removed",
                description: "No workflow selected for this conversation",
            });
            setSelectedWorkflowId(null);
        } else {
            const workflow = workflowList.find((w) => w.id === workflowId);
            if (workflow) {
                toast({
                    title: "Workflow selected",
                    description: `${workflow.name} with ${workflow.personaList.length} ${workflow.personaList.length > 1 ? "personas" : "persona"
                        } has been selected for this conversation`,
                });
            }
            setSelectedWorkflowId(workflowId);
        }
    };
    useEffect(() => {
        console.log("Selected workflow ID changed:", selectedWorkflowId);
    }, [selectedWorkflowId])
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
            <DialogContent className="bg-[#1e2535] text-white border border-slate-700 w-[calc(100%-10rem)]">
                <div className="flex justify-between items-center">
                    <DialogTitle className="text-2xl font-bold text-white">
                        Select Workflow
                    </DialogTitle>

                </div>
                <DialogDescription className="text-slate-300 text-base">
                    Choose a workflow for this conversation
                </DialogDescription>

                <div className="my-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* No workflow option */}
                    <div className="mb-4">
                        <div
                            onClick={() => selectWorkflow(null)}
                            className={`p-5 border rounded-lg cursor-pointer transition-all ${selectedWorkflowId === null
                                ? "bg-[#283044] border-blue-500 shadow-md shadow-blue-500/20"
                                : "border-slate-700 hover:bg-[#232a3a] hover:border-slate-600"
                                }`}
                        >
                            <div className="font-medium text-lg">No workflow</div>
                            <div className="text-sm text-slate-400 mt-1">
                                Use default conversation without a specific workflow
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-medium text-slate-300 mb-3">
                        Your  saved workflows
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {workflowList.map((workflow) => (
                            <div
                                key={workflow.id}
                                onClick={() => selectWorkflow(workflow.id)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedWorkflowId === workflow.id
                                    ? "bg-[#283044] border-blue-500 shadow-md shadow-blue-500/20"
                                    : "border-slate-700 hover:bg-[#232a3a] hover:border-slate-600"
                                    }`}
                            >
                                <div className="font-medium text-lg truncate">
                                    {workflow.name}
                                </div>
                                <div className="flex items-center mt-2">
                                    <div className="flex -space-x-2">
                                        {/* Persona avatars - showing up to 3 */}
                                        {[...Array(Math.min(3, workflow.personaList.length))].map(
                                            (_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs border-2 border-[#283044]"
                                                >
                                                    {i < 2 ? "P" : "+"}
                                                </div>
                                            )
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-400 ml-3">
                                        {workflow.personaList.length}{" "}
                                        {workflow.personaList.length > 1
                                            ? "personas"
                                            : "persona"}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {workflowList.length === 0 && (
                            <div className="col-span-full p-4 border border-dashed border-slate-700 rounded-lg text-center text-slate-400">
                                No saved workflows found
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    <div className="text-sm text-slate-400">
                        {selectedWorkflowId === null
                            ? "Default conversation mode selected"
                            : `${workflowList.find((w) => w.id === selectedWorkflowId)?.name || ""
                            } selected`}
                    </div>
                    <Button
                        onClick={() => setWorkflowModalOpen(false)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Confirm
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
