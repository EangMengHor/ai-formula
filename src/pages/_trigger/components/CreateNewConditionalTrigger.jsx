import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createNewWorkflow } from "@/services/trigger/createNewWorkflow";
import { createNewConditionalTrigger } from "@/services/trigger/createNewConditionalTrigger";
import StandardWorkflow from "@/components/custom/Workflow/StandardWorkflow";
import {
  Search,
  Database,
  GitBranch,
  Clock,
  Mail,
  CheckCircle,
  Calendar,
  User,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
// Child components for different workflow step types with clean, modern design
function SearchStepComponent() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
      <Search className="w-3.5 h-3.5 text-blue-400" />
      <span className="text-blue-300 text-xs font-medium">Search</span>
    </div>
  );
}

function KnowledgeStepComponent() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-md">
      <Database className="w-3.5 h-3.5 text-purple-400" />
      <span className="text-purple-300 text-xs font-medium">ARX Knowledge</span>
    </div>
  );
}

function BooleanDecisionComponent({ terminateIfTrue, terminateIfFalse }) {
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
        <GitBranch className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-amber-300 text-xs font-medium">
          Decision Step
        </span>
      </div>
      {(terminateIfTrue || terminateIfFalse) && (
        <div className="flex flex-wrap gap-1.5">
          {terminateIfTrue && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-xs">
              <span className="w-1 h-1 bg-green-400 rounded-full"></span>
              Terminate if TRUE
            </div>
          )}
          {terminateIfFalse && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
              <span className="w-1 h-1 bg-red-400 rounded-full"></span>
              Terminate if FALSE
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RegularStepComponent() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-500/10 border border-slate-500/20 rounded-md">
      <Clock className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-slate-300 text-xs font-medium">Process</span>
    </div>
  );
}

export default function CreateNewConditionalTrigger() {
  const [currentTab, setCurrentTab] = useState("workflow"); // outputFormat,email,save

  const { user } = useUser();
  const [conditionTriggerLoading, setConditionTriggerLoading] = useState({
    workflowLoading: false,
    newConditionalWorkflowLoading: false,
  });
  const [createdTrigger, setCreatedTrigger] = useState(null);


  const [newConditionalTriggerData, setNewConditionalTriggerData] = useState({
    prompt: "Notify Me When",
    outputFormat: "Complete Report of the prompt",
    workflow: [], // Start with empty array
    type: "conditional",
    email: "",
  });

  // Helper function to render appropriate child component based on step properties
  const renderStepComponent = (step) => {
    if (step.isSearch) {
      return <SearchStepComponent />;
    } else if (step.isKnowledge) {
      return <KnowledgeStepComponent />;
    } else if (step.isBooleanOutput) {
      return (
        <BooleanDecisionComponent
          terminateIfTrue={step.terminateWorkflowIfTrue}
          terminateIfFalse={step.terminateWorkflowIfFalse}
        />
      );
    } else {
      return <RegularStepComponent />;
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 justify-start items-center">
      <div className="flex flex-col gap-2 max-w-4xl w-full h-full items-start justify-center">
        <div className="flex flex-col my-4 ">
          <h2 className="text-2xl font-medium text-white">New Conditional Trigger</h2>
          <p className="text-lg text-gray-500 font-semibold">
            Create a new conditional trigger with specific conditions and actions.
          </p>
        </div>
        {/* workflow */}
        <div
          className={`${currentTab === "workflow" ? "block" : "hidden"} w-full flex flex-col gap-4`}
        >
          <div>
            <Label htmlFor="email" className="text-base  text-white/70">
              Prompt
            </Label>
            <Textarea
              value={newConditionalTriggerData.prompt}
              onChange={(e) =>
                setNewConditionalTriggerData({
                  ...newConditionalTriggerData,
                  prompt: e.target.value,
                })
              }
              row={10}
              id="prompt"
              className="w-full bg-g1/40 text-white min-h-[120px] border-none bg-blue-950 rounded-2xl"
              placeholder="Enter Your Prompt..."
            />
          </div>

          <div>
            <Label htmlFor="outputFormat" className="text-base  text-white/70">
              Output Format Of The Trigger
            </Label>
            <Textarea
              value={newConditionalTriggerData.outputFormat}
              onChange={(e) =>
                setNewConditionalTriggerData({
                  ...newConditionalTriggerData,
                  outputFormat: e.target.value,
                })
              }
              id="outputFormat"
              className="w-full bg-g1/40 text-white min-h-[120px] border-none bg-blue-950 rounded-2xl"
              placeholder="Enter Your Prompt..."
            />
          </div>

          <Button
            onClick={async () => {
              try {
                setConditionTriggerLoading((prev) => ({
                  ...prev,
                  workflowLoading: true,
                }));

                const workflow = await createNewWorkflow({
                  prompt: newConditionalTriggerData.prompt,
                  outputFormat: newConditionalTriggerData.outputFormat,
                  existingWorkflow: newConditionalTriggerData.workflow,
                });

                // Update the workflow state with API response
                if (workflow) {
                  setNewConditionalTriggerData((prev) => ({
                    ...prev,
                    workflow: workflow,
                  }));
                }
              } catch (error) {
                console.error("Error creating workflow:", error);
              } finally {
                setConditionTriggerLoading((prev) => ({
                  ...prev,
                  workflowLoading: false,
                }));
              }
            }}
            disabled={
              conditionTriggerLoading?.workflowLoading ||
              !newConditionalTriggerData.prompt.trim()
            }
            className="rounded-xl bg-white text-black py-4 hover:bg-white/50"
          >
            {conditionTriggerLoading?.workflowLoading ? (
              <p>Creating Workflow...</p>
            ) : (
              <p>Create Workflow</p>
            )}
          </Button>

          {/* workflow */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Generated Workflow
            </h3>
            <div className="bg-slate-800/50 text-white rounded-xl p-4 max-h-96 overflow-y-auto">
              {newConditionalTriggerData.workflow &&
              newConditionalTriggerData.workflow?.length > 0 ? (
                <StandardWorkflow
                  data={newConditionalTriggerData.workflow.map(
                    (step, index) => ({
                      title: step?.stepGoal || `Step ${index + 1}`,
                      description: `Step ${step?.stepId || index + 1}`,
                      isCompleted: false,
                      isLoading: false,
                      children: renderStepComponent(step),
                    }),
                  )}
                />
              ) : (
                <div className="text-center text-slate-400 py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                    <GitBranch className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-sm">No workflow created yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click "Create Workflow" to generate steps
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* email */}

          {newConditionalTriggerData?.workflow &&
            newConditionalTriggerData?.workflow?.length > 0 && (
              <div>
                <Button
                  onClick={() => {
                    setCurrentTab("email");
                  }}
                  className="rounded-xl bg-white text-black py-4 hover:bg-white/50"
                >
                  Save And Continue
                </Button>
              </div>
            )}
        </div>

        {/* email */}
        <div
          className={`${currentTab == "email" ? "block" : "hidden"} w-full flex flex-col gap-4`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Email Settings</h3>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 space-y-4">
            <div>
              <Label
                htmlFor="email"
                className="text-base text-white/70 mb-2 block"
              >
                Email Addresses
              </Label>
              <p className="text-sm text-slate-400 mb-3">
                Enter email addresses separated by commas. You'll receive
                notifications when the trigger conditions are met.
              </p>
              <Input
                value={newConditionalTriggerData.email}
                onChange={(e) =>
                  setNewConditionalTriggerData({
                    ...newConditionalTriggerData,
                    email: e.target.value,
                  })
                }
                id="email"
                type="email"
                className="w-full bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500"
                placeholder="example@domain.com, another@domain.com"
              />
              {newConditionalTriggerData.email && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-1">
                    Email addresses to notify:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {newConditionalTriggerData.email
                      .split(",")
                      .map((email, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300 text-xs"
                        >
                          <Mail className="w-3 h-3" />
                          {email.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setCurrentTab("workflow")}
                variant="outline"
                className="bg-white border-slate-300 text-black hover:bg-gray-100"
              >
                Back to Workflow
              </Button>
              <Button
                onClick={async () => {
                  try {
                    setConditionTriggerLoading((prev) => ({
                      ...prev,
                      newConditionalWorkflowLoading: true,
                    }));

                    const result = await createNewConditionalTrigger({
                      workflow: newConditionalTriggerData.workflow,
                      prompt: newConditionalTriggerData.prompt,
                      outputFormat: newConditionalTriggerData.outputFormat,
                      userId: user?.id,
                      email: newConditionalTriggerData.email,
                    });

                    if (result) {
                      setCreatedTrigger(result);
                      setCurrentTab("final");
                    }
                  } catch (error) {
                    console.error("Error creating conditional trigger:", error);
                  } finally {
                    setConditionTriggerLoading((prev) => ({
                      ...prev,
                      newConditionalWorkflowLoading: false,
                    }));
                  }
                }}
                disabled={
                  conditionTriggerLoading?.newConditionalWorkflowLoading ||
                  !newConditionalTriggerData.email.trim()
                }
                className="bg-white text-black hover:bg-gray-100 disabled:bg-gray-300 disabled:text-gray-500 font-medium"
              >
                {conditionTriggerLoading?.newConditionalWorkflowLoading
                  ? "Creating Trigger..."
                  : "Create Conditional Workflow"}
              </Button>
            </div>
          </div>
        </div>

        {/* final card */}
        <div
          className={`${currentTab == "final" ? "block" : "hidden"} w-full flex flex-col gap-4`}
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">
              Conditional Workflow Created Successfully
            </h3>
          </div>

          {createdTrigger && (
            <div className="bg-slate-800/50 text-white rounded-xl p-6 space-y-6">
              {/* Header Info */}
              <div className="border-b border-slate-700 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-1">
                      {createdTrigger.name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-slate-400"></div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium">
                    Active
                  </span>
                </div>
              </div>

              {/* Prompt Section */}
              <div>
                <h5 className="text-sm font-medium text-slate-300 mb-2">
                  Prompt
                </h5>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-white text-sm">{createdTrigger.prompt}</p>
                </div>
              </div>

              {/* Output Format Section */}
              <div>
                <h5 className="text-sm font-medium text-slate-300 mb-2">
                  Output Format
                </h5>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-white text-sm">
                    {createdTrigger.outputformat}
                  </p>
                </div>
              </div>

              {/* Email Notifications */}
              <div>
                <h5 className="text-sm font-medium text-slate-300 mb-2">
                  Email Notifications
                </h5>
                <div className="flex flex-wrap gap-2">
                  {createdTrigger.email.split(",").map((email, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-xs"
                    >
                      <Mail className="w-3 h-3" />
                      {email.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Workflow Steps */}
              <div>
                <h5 className="text-sm font-medium text-slate-300 mb-3">
                  Workflow Steps
                </h5>
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <StandardWorkflow
                    data={createdTrigger.workflow.map((step, index) => ({
                      title: step?.stepGoal || `Step ${index + 1}`,
                      description: `Step ${step?.stepId || index + 1}`,
                      isCompleted: true,
                      isLoading: false,
                      children: renderStepComponent(step),
                    }))}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <Button
                  onClick={() => {
                    setCurrentTab("workflow");
                    setCreatedTrigger(null);
                    setNewConditionalTriggerData({
                      prompt: "",
                      outputFormat: "Complete Report of the prompt",
                      workflow: [],
                      type: "conditional",
                      email: "",
                    });
                  }}
                  className="bg-white text-black hover:bg-gray-100 font-medium"
                >
                  Create Another Workflow
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="bg-white border-slate-300 text-black hover:bg-gray-100"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
