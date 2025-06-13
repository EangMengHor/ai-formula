import { Button } from "./ui/button";
import { WorkflowDiagram } from "./custom/AiInteraction/WorkflowDiagram";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PollInteraction({
  interactionData = [],
  sessionId = "",
}) {
  return (
    <div>
      <Dialog>
        <DialogTrigger>
          {Object.keys(interactionData).length > 0 && (
            <div>
              <p className="text-left my-2">
                {interactionData &&
                  interactionData.hasOwnProperty("other") &&
                  interactionData.other.length}{" "}
                Step Interaction
              </p>
              <Button className="bg-slate-700 text-white">
                View Interaction Logs
              </Button>
            </div>
          )}
        </DialogTrigger>
        <DialogContent className="w-[calc(100%-5rem)] h-[calc(100%-5rem)] bg-slate-700">
          <div className="w-full h-full ">
            <p className="font-semibold text-2xl text-white mb-3">
              Interaction Workflow
            </p>
            <WorkflowDiagram data={interactionData} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
