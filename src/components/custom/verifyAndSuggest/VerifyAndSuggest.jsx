import { Button } from "@/components/ui/button";
import { useStackSidebar } from "@/context/StackSidebarContext";
import { BadgeCheck, Globe } from "lucide-react";
import StandardWorkflow from "../Workflow/StandardWorkflow";
import { useEffect, useState } from "react";
import { verifyAndSuggestion } from "@/services/verifyAndSuggest";
import { useParams } from "react-router-dom";
import SourcesIndicator from "../CitationSources";
// event: verify-starterEvent
// data: {"event":{"id":"fd5ec9f2-ebe2-4137-9dff-cbdd28af2862-chat-memory","message":"Check Conversation Memory"}}

// event: verify-completeEventId
// data: {"id":"fd5ec9f2-ebe2-4137-9dff-cbdd28af2862-chat-memory"}

// event: verify-starterEvent
// data: {"event":{"id":"fd5ec9f2-ebe2-4137-9dff-cbdd28af2862-planning","message":"Plan Verification & Suggestion Task"}}

// event: verify-plain
// data: {"id":"fd5ec9f2-ebe2-4137-9dff-cbdd28af2862-planning","text":[{"idx":0,"task":"Verify the accuracy of the real-time performance data for Grok 4, OpenAI GPT-4, Anthropic Claude Opus 4, and Gemini 2.5 Pro as of July 2025 "},{"idx":1,"task":"Check the validity of the cited sources and links provided for the performance data of the LLMs "},{"idx":2,"task":"Validate the claimed capabilities of the ARX System against known benchmarks and frameworks"},{"idx":3,"task":"Assess the feasibility of ARX System's 'infinite scalability and adaptability' claims using the V Framework and OmniSynth descriptions"},{"idx":4,"task":"Evaluate the uniqueness of ARX System features (e.g., God Particle, recursive learning) compared to existing LLMs"},{"idx":5,"task":"Suggest improvements or potential risks in ARX System's integration of multiple frameworks like ARCS, ARCF, and Advanced Quantitative Analysis"}]}

// event: verify-completeEventId
// data: {"id":"fd5ec9f2-ebe2-4137-9dff-cbdd28af2862-planning"}

// event: verify-startingIndex
// data: {"index":0}

// event: verify-startingSearch
// data: {"id":0}

// event: verify-plain
// data: {"id":0,"text":"The accuracy of the real-time performance data for Grok 4, OpenAI GPT-4, Anthropic Claude Opus 4, and Gemini 2.5 Pro as of July 2025 is partially verified. Grok 4 excels in reasoning and real-time data integration, particularly with X/Twitter. OpenAI GPT-4 is strong in general-purpose tasks but lacks real-time data capabilities. Claude Opus 4 is noted for its safety focus and coding abilities. Gemini 2.5 Pro is recognized for its multimodal capabilities, especially with video and long-context processing. However, specific metrics like ARC-AGI-2 scores and SWE-Bench performance are not directly confirmed in the latest sources. The ARX System's claims of infinite scalability and adaptability are not supported by current LLM benchmarks."}

// event: verify-searchFinish
// data: {"id":0,"urls":["https://felloai.com/2025/07/we-tested-grok-4-claude-gemini-gpt-4o-which-ai-should-you-use-in-july-2025/","https://collabnix.com/comparing-top-ai-models-in-2025-claude-grok-gpt-llama-gemini-and-deepseek-the-ultimate-guide/","https://propelcode.ai/blog/ai-code-review-showdown-claude-vs-gpt4-vs-gemini-2025","https://www.datastudios.org/post/chatgpt-vs-gemini-vs-claude-all-current-models-full-comparison-and-next-developments-july-2025","https://creatoreconomy.so/p/chatgpt-vs-claude-vs-gemini-the-best-ai-model-for-each-use-case-2025"]}

// event: verify-startingIndex
// data: {"index":0}

// event: verify-startingSearch
// data: {"id":0}

// event: verify-plain
// data: {"id":0,"text":"The cited sources and links provided for the performance data of the LLMs appear to be partially inaccurate or unverifiable. For instance, the links [1] and [2] are related to Grok and other LLM comparisons but do not directly support the specific performance metrics mentioned. The links [3] and [4] discuss various LLMs but do not provide the exact data or benchmarks listed in the content piece. Additionally, some links are not accessible or do not exist as described, which raises concerns about their validity. Overall, the accuracy of the performance data and the links provided cannot be fully verified based on the available information."}

// event: verify-searchFinish
// data: {"id":0,"urls":["https://www.youtube.com/watch?v=HTk6VpBgSus","https://www.getpassionfruit.com/blog/claude-4-vs-chatgpt-o3-vs-grok-3-vs-gemini-2-5-pro-complete-2025-comparison-for-seo-traditional-benchmarks-research","https://www.kommunicate.io/blog/gpt4-vs-claude-3-vs-gemini/","https://www.nitromediagroup.com/grok-4-ai-model-2025/","https://felloai.com/2025/05/we-tested-claude-4-gpt-4-5-gemini-2-5-pro-grok-3-whats-the-best-ai-to-use-in-may-2025/"]}

// event: verify-startingIndex
// data: {"index":0}

// event: verify-startingIndex
// data: {"index":0}

// event: verify-startingIndex
// data: {"index":0}

// event: verify-startingIndex
// data: {"index":0}

function SearchStarted({
  citations = [
    "https://www.youtube.com/watch?v=HTk6VpBgSus",
    "https://www.getpassionfruit.com/blog/claude-4-vs-chatgpt-o3-vs-grok-3-vs-gemini-2-5-pro-complete-2025-comparison-for-seo-traditional-benchmarks-research",
    "https://www.kommunicate.io/blog/gpt4-vs-claude-3-vs-gemini/",
    "https://www.nitromediagroup.com/grok-4-ai-model-2025/",
    "https://felloai.com/2025/05/we-tested-claude-4-gpt-4-5-gemini-2-5-pro-grok-3-whats-the-best-ai-to-use-in-may-2025/",
  ],
}) {
  return (
    <div className="w-fit px-2 py-3 rounded-lg items-center bg-g1/50 flex gap-2">
      <Globe className="w-4 h-4" />
      <div>
        <p className="text-sm">Browsing Internet . . .</p>
        <SourcesIndicator
          citations={citations.map((item) => ({ url: item }))}
          maxIcons={5}
        />
      </div>
    </div>
  );
}

export default function VerifyAndSuggest({ content = "", isRealtime = false }) {
  const { setSidebarStack } = useStackSidebar();
  const { id } = useParams();

  // Sidebar workflow component that manages its own state and API call
  function WorkflowSidebar() {
    const [workflow, setWorkflow] = useState([]);
    const [error, setError] = useState(null);
    const [lockedTask, setLockedTask] = useState(false);

    useEffect(() => {
      async function startVerificationAndSuggestions() {
        function handleSSEvents({ type, data }) {
          console.log("Received SSE event:", type, data);
          try {
            switch (type.trim()) {
              case "verify-starterEvent":
                if (data && data?.event && data?.event?.message) {
                  console.log(data, "is chat memory");
                  setWorkflow((prev) => [
                    ...prev,
                    {
                      title: data?.event?.message,
                      description: "",
                      id: data?.event?.id || null,
                      isCompleted: false,
                      isLoading: true,
                    },
                  ]);
                }
                break;
              case "verify-completeEventId":
                if (data && data?.id && data?.id) {
                  setWorkflow((prev) => {
                    let foundElement = prev.find((item) => item.id === data.id);
                    if (foundElement) {
                      foundElement.isCompleted = true;
                      foundElement.isLoading = false;
                      foundElement.description = "Completed";
                    }
                    return [...prev];
                  });
                }

                break;
              case "verify-plain":
                if (data && Array.isArray(data.text)) {
                  console.log("Received plain text data:", data.text);
                  setWorkflow((prev) => [
                    ...prev,
                    ...data.text.map((item) => ({
                      title: item.task || "Task",
                      description: null,
                      isCompleted: false,
                      id: item?.idx,
                    })),
                  ]);
                }
                break;
              case "verify-startingIndex":
                setWorkflow((prev) => {
                  const foundElement = prev.find(
                    (task) => task.id === data.index,
                  );
                  if (foundElement) {
                    foundElement.description = "Working ...";
                    foundElement.isLoading = true;
                    foundElement.isCompleted = false;
                  }
                  return [...prev];
                });
                break;
              case "verify-startingSearch":
                setWorkflow((prev) => {
                  const foundElement = prev.find((task) => task.id === data.id);
                  if (foundElement) {
                    foundElement.description =
                      "Searching Sources and content ...";
                    foundElement.children = <SearchStarted />;
                    foundElement.isLoading = true;
                    foundElement.isCompleted = false;
                  }
                  return [...prev];
                });
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
      <div className="p-4">
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
        className={`px-3  bg-transparent bg-slate-900 hover:bg-slate-700 rounded-xl flex items-center justify-center`}
      >
        <div className="flex items-center gap-2">
          <BadgeCheck className={"h-6 w-6"} />
          <p>Verify & Suggest</p>
        </div>
      </Button>
    </div>
  );
}
