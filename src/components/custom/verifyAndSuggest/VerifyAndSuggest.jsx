import { Button } from "@/components/ui/button";
import { useStackSidebar } from "@/context/StackSidebarContext";
import { BadgeCheck, Globe, SquareTerminal } from "lucide-react";
import StandardWorkflow from "../Workflow/StandardWorkflow";
import { useEffect, useState } from "react";
import { verifyAndSuggestion } from "@/services/verifyAndSuggest";
import { useParams } from "react-router-dom";
import SourcesIndicator from "../CitationSources";

function SearchStarted({ citations = [], isLoading = false }) {
  return (
    <div className="p-3 rounded-xl bg-g1/60 backdrop-blur-md shadow-sm w-fit transition-all duration-300">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-white/80 my-1" />
        <div className="flex flex-col gap-0.5 space-y-2">
          <span
            className={`${isLoading ? "animate-pulse" : "fade-in"} text-sm text-white/90 font-medium`}
          >
            {isLoading
              ? "Searching Internet For Cross Verification Sources . . ."
              : "Cross Verification Sources Found"}
          </span>
        </div>
      </div>
      {citations.length > 0 && (
        <SourcesIndicator
          citations={citations.map((url) => ({ url }))}
          maxIcons={5}
          className="bg-transparent px-0 py-0"
        />
      )}
    </div>
  );
}

function PromptCorrections({ correctionPrompt = "", handleSubmit = () => { } }) {
  return (
    <div className="bg-g1/60 p-3  space-y-2 rounded-lg">
      <div className="flex items-center gap-2   text-sm font-semibold rounded-xl">
        <SquareTerminal className="w-5 h-5 text-white/80 my-1" />
        Prompt Corrections
      </div>
      <div className="bg-slate-800 rounded-md p-2 text-wrap">
        {correctionPrompt}
      </div>
      <button
        onClick={(e) => {
          handleSubmit(correctionPrompt);
          e.target.style.display = "none";
        }}
        className="px-3 py-2 bg-white rounded-md font-semibold text-black hover:bg-slate-300 transition-all"
      >
        Apply Prompt
      </button>
    </div>
  );
}

export default function VerifyAndSuggest({
  content = "",
  isRealtime = false,
  handleSubmit = () => { },
}) {
  const { setSidebarStack } = useStackSidebar();
  const { id } = useParams();

  function WorkflowSidebar() {
    const [workflow, setWorkflow] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
      async function startVerificationAndSuggestions() {
        function handleSSEvents({ type, data }) {
          try {
            switch (type.trim()) {
              case "verify-starterEvent":
                if (data?.event?.message) {
                  setWorkflow((prev) => [
                    ...prev,
                    {
                      title: data.event.message,
                      description: "",
                      id: data.event.id || null,
                      isCompleted: false,
                      isLoading: true,
                    },
                  ]);
                }
                break;
              case "verify-completeEventId":

                if (data?.id) {
                  setWorkflow((prev) => {
                    const updatedWorkflow = prev.map((item) =>
                      item.id === data.id
                        ? {
                          ...item,
                          isCompleted: true,
                          isLoading: false,
                          description: "Completed",
                        }
                        : item,
                    );
                    return updatedWorkflow;
                  });
                }
                break;
              case "verify-plain":
                if (Array.isArray(data.text)) {
                  setWorkflow((prev) => [
                    ...prev,
                    ...data.text.map((item) => ({
                      title: item.task || "Task",
                      description: null,
                      isCompleted: false,
                      id: item.idx,
                    })),
                  ]);
                }
                break;
              case "verify-startingIndex":
                setWorkflow((prev) => {
                  const updatedWorkflow = prev.map((task) =>
                    task.id === data.index
                      ? {
                        ...task,
                        description: "Working ...",
                        isLoading: true,
                        isCompleted: false,
                      }
                      : task,
                  );
                  return updatedWorkflow;
                });
                break;
              case "verify-startingSearch":
                setWorkflow((prev) => {
                  const updatedWorkflow = prev.map((task) =>
                    task.id === data.id
                      ? {
                        ...task,
                        description: "Searching Sources and content ...",
                        children: <SearchStarted isLoading={true} />,
                        isLoading: true,
                        isCompleted: false,
                      }
                      : task,
                  );
                  return updatedWorkflow;
                });
                break;
              case "verify-completeText":
                setWorkflow((prev) => {
                  const updatedWorkflow = prev.map((task) =>
                    task.id === data.id
                      ? {
                        ...task,
                        description: data.text || "No text provided",
                        isLoading: false,
                        isCompleted: true,
                      }
                      : task,
                  );
                  return updatedWorkflow;
                });
                break;
              case "verify-searchFinish":
                if (Array.isArray(data.urls)) {
                  setWorkflow((prev) => {
                    const updatedWorkflow = prev.map((task) =>
                      task.id === data.id
                        ? {
                          ...task,
                          children: <SearchStarted citations={data.urls} />,
                          isLoading: false,
                          isCompleted: true,
                        }
                        : task,
                    );
                    return updatedWorkflow;
                  });
                }
                break;
              case "verify-isCorrectionNeeded":
                if (data.isNeeded) {
                  setWorkflow((prev) => [
                    ...prev,
                    {
                      title: "Corrections Needed",
                      description: "",
                      isCompleted: true,
                      isLoading: false,
                      children: (
                        <PromptCorrections
                          correctionPrompt={data.correctionPrompt}
                          handleSubmit={handleSubmit}
                        />
                      ),
                    },
                  ]);
                } else {
                  setWorkflow((prev) => [
                    ...prev,
                    {
                      title: "No Corrections Needed",
                      description:
                        "The content is accurate and does not require changes.",
                      isCompleted: true,
                    },
                  ]);
                }
                break;
              default:
                break;
            }
          } catch (error) {
            setError("An error occurred while processing the SSE event.");
          }
        }

        try {
          const response = await verifyAndSuggestion(content, id, isRealtime);
          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let buffer = "";

          const processStream = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const parts = buffer.split("\n\n");
              buffer = parts.pop();

              for (const part of parts) {
                if (!part.trim()) continue;
                const lines = part.split("\n");
                let eventType = "message";
                let dataStr = "";
                for (const line of lines) {
                  if (line.startsWith("event:"))
                    eventType = line.replace("event:", "").trim();
                  else if (line.startsWith("data:"))
                    dataStr += line.replace("data:", "").trim();
                }
                let data = {};
                try {
                  data = JSON.parse(dataStr);
                } catch {
                  data = { content: dataStr };
                }

                handleSSEvents({ type: eventType, data });
              }
            }
          };

          await processStream();
        } catch (error) {
          setError(
            "Failed to start verification and suggestions. Please try again later.",
          );
          setWorkflow((prev) => [
            ...prev,
            {
              title: "Error",
              description: error.message || "An unexpected error occurred.",
              isCompleted: false,
            },
          ]);
        }
      }
      startVerificationAndSuggestions();
    }, [content, id, isRealtime]);

    useEffect(() => {
      console.log("WorkflowSidebar mounted with content:", workflow);
    }, [workflow]);

    return (
      <div className="p-4 transition-opacity duration-300">
        <StandardWorkflow data={workflow} />
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    );
  }

  return (
    <div>
      <Button
        onClick={() => {
          setSidebarStack([
            {
              header: "Verify & Suggest",
              component: <WorkflowSidebar />,
            },
          ]);
        }}
        className="px-3 bg-transparent bg-slate-900 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-transform duration-300 "
      >
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-6 w-6" />
          <p>Verify & Suggest</p>
        </div>
      </Button>
    </div>
  );
}
