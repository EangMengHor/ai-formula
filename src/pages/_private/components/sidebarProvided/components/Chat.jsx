import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileDown, LoaderCircle, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useToast } from "../../../../../hooks/use-toast";
import { chat } from "../../../../../services/n8n-apis/_core/chat.api";
import { sanitizeFileName } from "../../../../../lib/utils";
import ChatInput from "../../../../../components/custom/ChatInput";
import LatexParser from "@/components/custom/LatexParser";
import { getConversationHistory } from "@/services/n8n-apis/_core/getConversationHistory.api";
import "../../../../_private/components/sidebarProvided/components/Chat.css";
import { getUploadedDocumentHistory } from "../../../../../services/n8n-apis/_core/getUploadedDocumentHis.api";
import { useFilesUploadMetadata } from "../../../../../context/FilesUploadMetadata";
import PollStatus from "../../../../../components/custom/PolledStatus";
import { pollStatus } from "../../../../../services/n8n-apis/_core/pollStatus.api";
import { useUser } from "../../../../../context/UserContext";
import { pollChatOutput } from "../../../../../services/n8n-apis/_core/pollChatOutput.api";
import PersonaOp from "../../../../../components/custom/AiInteraction/PersonaOp";
import ChatSimulation from "../../../../../components/custom/AiInteraction/ChatSimulation";
import polling from "../../../../../lib/polling";
import { pollInteractionLogs } from "../../../../../services/n8n-apis/_core/pollInteractionLogs.api";
import { useStackSidebar } from "../../../../../context/StackSidebarContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mermaid } from "../../../../../components/custom/Mermaid";
import LoadingAnimation from "@/components/custom/Loading";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadDocument } from "@/lib/downloadModule";
import ExecutionTimeline from "./ExecutionTimeline";
import { StreamingResponse } from "./StreamingRendered";
import Conversation from "./Conversation";
import { getPersonaById } from "@/services/n8n-knowledge-apis/getPersonaById";
import { Textarea } from "@/components/ui/textarea";
import { downloadPdf } from "@/services/n8n-apis/_core/downloadPdf.api";
import { useWorkflow } from "@/context/WorkflowContext";
import { useCollection } from "../../../../../context/CollectionContext";
import { useScrollToBottom } from "@/hooks/scrollToBottom";
import RenderMaterialUniProb from "./RenderMaterialUniProb";

const fileType = ["pdf"];

function Chat() {
  // exploitation
  const [isSessionExploited, setIsSessionExploited] = useState(false);

  // --- Refs ---
  const conversationCompRef = useRef(null);
  const latestUpdatedStatus = useRef([]);
  const dataFetchedRef = useRef(false);
  const pollChatOutputRef = useRef(null);
  const pollChatStatusRef = useRef(null);
  const pollInteractionLogsRef = useRef(null);
  const streamTimeoutRef = useRef(null);
  const isRetryTrigger = useRef(false);

  // --- Context ---
  const { id } = useParams();
  const { toast } = useToast();
  const {
    setFileCount,
    setMemorizedFiles,
    setFileName,
    setFiles,
    resetAllStates,
  } = useFilesUploadMetadata();
  const { selectedWorkflowId } = useWorkflow();
  const {
    isVectorBaseOn,
    setIsVectorBaseOn,
    isSuperiorPersonaAttached,
    isSwarmMode,
    setIsSwarmMode,
    isAutoSwarmContextState,
    setIsAutoSwarmContextState,
    setIsSuperiorPersonaAttached,
    selectedSuperiorPersona,
    setSelectedSuperiorPersona,
    currActiveIntraction,
    setCurrActiveIntraction,
    isDeepThinkMode,
    isUserBanned,
    setIsUserBanned,
    refreshAccessToken,
    authToken,
  } = useUser();
  const { sidebarStack, setSidebarStack } = useStackSidebar();
  const navigate = useNavigate();
  const { selectedCollectionIds } = useCollection();
  // --- State ---
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [fallBackPrompt, setFallBackPrompt] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isNextChatLoading, setIsNextChatLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isChanged, setIsChanged] = useState(false);
  const [chatIdentifer, setChatIdentifer] = useState(null);
  const [interactionLogs, setInteractionLogs] = useState([]);
  const [isShowInteractionLogs, setIsShowInteractionLogs] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [isShowAgenticBlock, setIsShowAgenticBlock] = useState(false);

  const [isReconnectionNeeded, setIsReconnectionNeeded] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isReconnected, setIsReconnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pdfFileName, setpPdfFileName] = useState("");
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [currLoadingStatus, setCurrLoadingStatus] = useState("Thinking");
  const chatContainerRef = useRef(null);

  // Use the hook properly
  const { showScrollButton, scrollToBottom, endRef } =
    useScrollToBottom(chatContainerRef);

  useEffect(() => {
    setIsNextChatLoading(false);
    isSessionExploited && setIsSessionExploited(false);
  }, [id]);

  // --- Memoized/Callback Functions ---
  const memoizedRenderMermaidChart = useCallback((content) => {
    if (!content || typeof content !== "string") {
      console.error("Invalid mermaid content:", content);
      return "graph TD\nA[Error] --> B[Invalid diagram content]";
    }
    try {
      let sanitizedContent = content.trim();
      sanitizedContent = sanitizedContent.replace(/<\/?[^>]+(>|$)/g, "");
      const validTypes = [
        "graph",
        "flowchart",
        "sequenceDiagram",
        "classDiagram",
        "stateDiagram",
        "erDiagram",
        "gantt",
        "pie",
      ];
      const hasValidStart = validTypes.some((type) =>
        sanitizedContent.startsWith(type),
      );
      if (!hasValidStart) {
        sanitizedContent = `graph TD\n${sanitizedContent}`;
      }
      sanitizedContent = sanitizedContent.replace(
        /\[([^\]]+)\]/g,
        (match, p1) => {
          return `[${p1.replace(/[^a-zA-Z0-9 _-]/g, " ")}]`;
        },
      );
      return sanitizedContent;
    } catch (error) {
      console.error("Error sanitizing Mermaid content:", error);
      return "graph TD\nA[Error] --> B[Diagram processing failed]";
    }
  }, []);

  const memoizedHandleMaterialSidebar = useCallback((uniProb, title) => {
    setSidebarStack(() => {
      return [
        {
          header: title,
          component: (
            <RenderMaterialUniProb uniProbId={uniProb} title={title} />
          ),
        },
      ];
    });
  }, []);

  const memoizedHandleBlockSidebar = useCallback(
    (block, type, header = "") => {
      setSidebarStack(() => [
        {
          header,
          component: (
            <Sb
              header={header}
              block={block}
              type={type}
              pdfFileName={pdfFileName}
              setpPdfFileName={setpPdfFileName}
            />
          ),
        },
      ]);
    },
    [setSidebarStack],
  );

  const Sb = useCallback(
    ({ header, block, type }) => {
      const [isPdfDownloadLoading, setIsPdfDownloadLoading] = useState(false);
      const [pdfFileName, setpPdfFileName] = useState("");
      return (
        <div>
          <div className="flex items-center justify-between p-4 gap-2 border-b-2 border-slate-600 sticky top-0 bg-slate-800 z-40">
            {/* download */}
            <div className="sticky right-0 top-0 z-50">
              <Dialog>
                <DialogTrigger>
                  <div className="hover:bg-slate-800 font-semibold p-1 rounded-md cursor-pointer focus:outline-none bg-slate-700">
                    Download As PDF
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-slate-800">
                  <h1 className="font-semibold text-lg  text-white mb-3">
                    Name And Download Your PDF
                  </h1>

                  <p className="text-white -mb-2">File Name</p>
                  <Textarea
                    className="w-full h-10 text-white"
                    placeholder="Document Name"
                    value={pdfFileName == "" ? header : pdfFileName}
                    onChange={(e) => setpPdfFileName(e.target.value)}
                  />

                  <Button
                    className="bg-slate-600 hover:bg-slate-500 text-white mt-4"
                    onClick={async () => {
                      if (isPdfDownloadLoading) {
                        toast({
                          title: "PDF Already In Processing...",
                          description: "Please Wait While It Completes!",
                          variants: "default",
                        });
                      }
                      const loadingToast = toast({
                        title: "Processing PDF...",
                        description: `The PDF is downloading and may take a few seconds. You will be notified once the download is complete. Feel free to continue working in the meantime.\n File Name : ${sanitizeFileName(pdfFileName || header)} `,
                        variant: "default",
                        duration: Infinity,
                      });

                      try {
                        setIsPdfDownloadLoading(true);

                        const down = await downloadPdf({
                          content: block,
                          fileName: sanitizeFileName(
                            pdfFileName && pdfFileName !== ""
                              ? pdfFileName
                              : header,
                          ),
                          type: "pdf",
                        });

                        // Remove loading toast
                        loadingToast.dismiss?.();

                        if (down.success) {
                          toast({
                            title: "Success",
                            description: "PDF downloaded successfully",
                            variant: "success",
                          });
                        } else {
                          toast({
                            title: "Error",
                            description: down.message,
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        loadingToast.dismiss?.();
                        console.error("Error downloading PDF:", error);
                        toast({
                          title: "Error",
                          description: error.message,
                          variant: "destructive",
                        });
                      } finally {
                        setPdfDialogOpen(false);
                        setIsPdfDownloadLoading(false);
                      }
                    }}
                  >
                    {isPdfDownloadLoading ? (
                      <div className="flex items-center gap-2 ">
                        <Loader2 className="animate-spin " />
                        Downloading...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FileDown /> Download
                      </div>
                    )}
                  </Button>
                </DialogContent>
              </Dialog>
            </div>

            <p
              className="text-slate-200 font-bold text-lg truncate overflow-hidden whitespace-nowrap"
              style={{ maxWidth: "80%" }}
              title={header ? header : "ARX Blocks"}
            >
              {header
                ? header.length > 65
                  ? header.slice(0, 65) + "..."
                  : header
                : " ARX Blocks"}
            </p>
          </div>
          <div className="p-4">
            {type == "document" && (
              <div className="overflow-scroll h-[calc(100vh-10rem)]">
                <p>
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    className="module text-wrap overflow-scroll"
                    components={{
                      p: ({ children }) => <p>{children}</p>,
                      table: ({ children }) => (
                        <table
                          style={{
                            borderCollapse: "collapse",
                            width: "100%",
                            color: "#e0e0e0",
                          }}
                        >
                          {children}
                        </table>
                      ),
                      th: ({ children }) => (
                        <th
                          style={{
                            border: "1px solid #444",
                            padding: "8px",
                            backgroundColor: "#333",
                            color: "#e0e0e0",
                          }}
                        >
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td
                          style={{
                            border: "1px solid #444",
                            padding: "8px",
                            backgroundColor: "#222",
                            color: "#e0e0e0",
                          }}
                        >
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {block}
                  </ReactMarkdown>
                </p>
              </div>
            )}

            {type == "visual" && (
              <Mermaid
                className="module overflow-scroll"
                chart={memoizedRenderMermaidChart(block)}
                theme="dark"
                style={{ width: "100%", height: "100%" }}
              />
            )}
          </div>
        </div>
      );
    },
    [memoizedRenderMermaidChart, pdfFileName, setpPdfFileName],
  );

  // --- Effects ---
  useEffect(() => {
    async function getPurpose() {
      const localItem = localStorage.getItem("prompt");
      if (localItem) {
        setFallBackPrompt(localItem);
        setIsNextChatLoading(true);
      } else {
        setIsChatLoading(true);
      }
    }
    getPurpose();
  }, [id]);

  useEffect(() => {
    if (localStorage.getItem("prompt")) {
      localStorage.removeItem("prompt");
    } else {
      setIsChatLoading(true);
    }
  }, [id]);

  useEffect(() => {
    if (fallBackPrompt.length > 4999) {
      toast({
        title: "Error",
        description: "Prompt length exceeds 5000 characters.",

        variant: "destructive",
      });
    }
    if (fallBackPrompt.length > 0) {
      handleSubmit(fallBackPrompt);
    }
  }, [fallBackPrompt]);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await getConversationHistory(id);
        if (res.success) {
          const processedData = res.data.map((item) => {
            if (item.role === "human") {
              return item;
            } else {
              const parsedResponse = parseHistoryAIContent(item.message);
              if (item?.steps) {
                return {
                  role: "ai",
                  type: "deepThink",
                  steps: item.steps,
                  isLoading: false,
                  isComplete: true,
                  message: parsedResponse,
                  citations: item?.citations || [],
                  cot: item.cot,
                };
              }
              return {
                role: "ai",
                message: parsedResponse,
                cot: item.cot || [],
              };
            }
          });
          setConversation(processedData);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        // Make sure loading is turned off regardless of outcome
        setIsChatLoading(false);
      }
    }

    async function getUploadedDocumentHis() {
      try {
        const res = await getUploadedDocumentHistory(id);
        if (!res.isEmpty && Array.isArray(res.data)) {
          const fileNames = [...new Set(res.data[0].fileName || [])];
          setFileCount(fileNames.length);
          setFileName(fileNames);
          setFiles(
            fileNames.map((item) => {
              const splited = item.split(".") || [];
              return {
                name: item,
                type: item.split(".")[splited.length - 1],
              };
            }) || [],
          );
          setMemorizedFiles(fileNames);
        }
      } catch (error) {
        console.error(error);
      }
    }

    async function getData() {
      resetAllStates();
      await Promise.all([getUploadedDocumentHis(), fetchConversations()]);
    }

    if (isChatLoading) {
      getData();
    }
  }, [isChatLoading, id, toast]);

  useEffect(() => {
    if (isShowAgenticBlock && isSuperiorPersonaAttached) {
      setIsShowInteractionLogs(true);
      // startPollingInteractionLogs();
    }
  }, [isShowAgenticBlock, isSuperiorPersonaAttached]);

  useEffect(() => {
    return () => {
      clearPolling();
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Find the latest deep thinking conversation item that is streaming
    const deepThinkingItem = conversation.find(
      (item) =>
        item.role === "ai" && item.type === "deepThink" && item.isStreaming,
    );

    if (deepThinkingItem) {
      // Reset any existing timeout
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }

      // Set new timeout to detect end of streaming
      streamTimeoutRef.current = setTimeout(() => {
        setConversation((prevConversation) => {
          return prevConversation.map((item) => {
            if (
              item.role === "ai" &&
              item.type === "deepThink" &&
              item.isStreaming
            ) {
              return { ...item, isStreaming: false };
            }
            return item;
          });
        });
      }, 60000); // 60 seconds of inactivity means streaming is done
    }

    return () => {
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
    };
  }, [conversation]);

  // --- Helper Functions ---
  const newAiMessage = (kind = "quick") => ({
    role: "ai",
    type: kind, // "simulation" | "quick" | "deepThink"
    isStreaming: kind !== "simulation",
    isComplete: kind === "simulation",
    message: kind === "simulation" ? [{ type: "simulation", items: [] }] : [],
    tempContent: "", // streaming buffer
    steps: [], // deep‑think only
    cot: "",
    isOpen: false,
  });

  const appendChunk = (msg, chunk) => {
    msg.tempContent += chunk;
    msg.isStreaming = true;

    msg.message =
      msg.type === "quick"
        ? processStreamingContent(msg.tempContent)
        : parseHistoryAIContent(msg.tempContent);
  };

  const completeStreaming = (msg) => {
    msg.isStreaming = false;
    msg.isComplete = true;
    delete msg.tempContent;
  };

  const handleSocketEvent = async (event) => {
    if (event.type === "loadingStatus") {
      setCurrLoadingStatus(event.status || "Thinking . . .");
      return;
    }
    /* ─────────────────────────────────────────────────────── */
    /* 1. "swarmId" → update or create the simulation message  */
    /* ─────────────────────────────────────────────────────── */
    if (event.type === "swarmId") {
      const { output } = await getPersonaById(event.swarmId);
      const simItems = processStreamingContent(output).flatMap((d) => d.items);
      setConversation((prev) => {
        const conv = [...prev];
        let last = conv[conv.length - 1];
        if (!last || last.type !== "simulation") {
          last = newAiMessage("simulation");
          conv.push(last);
        }
        last.message[0].items.push(...simItems);
        return conv;
      });
      return;
    }
    /* ─────────────────────────────────────────────────────── */
    /* 2. "finalResponse" chunks                               */
    /* ─────────────────────────────────────────────────────── */
    if (event.type === "finalResponse" && event.content) {
      setConversation((prev) => {
        const conv = [...prev];
        let last = conv[conv.length - 1];
        if (!last || (last.type !== "quick" && last.type !== "deepThink")) {
          last = newAiMessage("quick");
          conv.push(last);
        }
        if (last.isOpen) {
          last.isOpen = false; // Reset open state if it was open
        }
        appendChunk(last, event.content);
        return conv;
      });
      setIsNextChatLoading(true);
      return;
    }
    /* ─────────────────────────────────────────────────────── */
    /* 3. "finish" → close the streaming message               */
    /* ─────────────────────────────────────────────────────── */
    if (event.type === "finish") {
      setConversation((prev) => {
        const conv = [...prev];
        const last = conv[conv.length - 1];
        if (last && (last.type === "quick" || last.type === "deepThink")) {
          completeStreaming(last);
          if (last.type === "deepThink") {
            last.steps.push({ type: "finish" });
          }
        }
        return conv;
      });
      setIsNextChatLoading(false);
      setIsShowAgenticBlock(false);
      setCurrLoadingStatus("");
      return;
    }

    if (event.type === "error") {
      console.error("Error event received:", event);
      setIsError(true);
      setErrorMessage(event.message || "An error occurred during the chat.");
      setIsNextChatLoading(false);
      setIsChatLoading(false);
    }

    if (event.type == "exploitationFlag") {
      if (event.userBan) {
        setIsUserBanned(true);
      } else if (event.sessionBan) {
        setIsSessionExploited(true);
      }
    }

    if (event.type == "searchUrls") {
      setConversation((prev) => {
        const conv = [...prev];
        let last = conv[conv.length - 1];
        if (!last || (last.type !== "quick" && last.type !== "deepThink")) {
          last = newAiMessage("quick");
          conv.push({
            ...last,
            citations: event.urls,
          });
        } else {
          // If the last message is already a quick or deepThink, just update its citations
          last.citations = event.urls;
        }
        console.log("Search URLs updated:", event.urls, conv);
        return conv;
      });
    }
    /* ─────────────────────────────────────────────────────── */
    /* 4. Deep‑think sub‑events (only if last message is deep) */
    /* ─────────────────────────────────────────────────────── */
    setConversation((prev) => {
      const conv = [...prev];
      const last = conv[conv.length - 1];
      if (!last || last.type !== "deepThink") return prev;
      const steps = last.steps || (last.steps = []);

      switch (event.type) {
        case "defineGoal":
          steps.push({ type: "defineGoal", text: "" });
          break;
        case "thinking":
          steps.push({ type: "thinking", text: "" });
          break;
        case "stepAgent":
          steps.push({
            type: "stepAgent",
            goal: "",
            isLoadingKnowledge: false,
            isLoadingSearch: false,
          });
          break;
        case "stepAgentGoal":
          if (steps.length) {
            const s = steps[steps.length - 1];
            if (s.type === "stepAgent") s.goal += event.content || "";
          }
          break;
        case "knowledge":
          if (steps.length) {
            const s = steps[steps.length - 1];
            if (s.type === "stepAgent") s.isLoadingKnowledge = true;
          }
          break;
        case "search":
          if (steps.length) {
            const s = steps[steps.length - 1];
            if (s.type === "stepAgent") s.isLoadingSearch = true;
          }
          break;
        case "reEvaluating":
          steps.push({ type: "reEvaluating", text: "" });
          break;
        case "nextThought":
          if (!last.isOpen) {
            last.isOpen = true;
          }
          console.log("chain of thought", event);
          last.cot += event.nextThought;

        default:
          if (event.content && steps.length) {
            const s = steps[steps.length - 1];
            if (s) s.text = (s.text || "") + event.content;
          }
      }
      return conv;
    });
  };
  function parseAgentBlock(agentContent) {
    const result = {
      content: agentContent,
    };

    // Extract title
    const titleMatch = /<\|title\|([\s\S]*?)<\|title\|>/g.exec(agentContent);
    if (titleMatch) {
      let title = titleMatch[1].trim();
      if (title.startsWith(">")) {
        title = title.substring(1).trim();
      }
      result.title = title;
      result.content = result.content.replace(titleMatch[0], "");
    }

    // Extract goal
    const goalMatch = /<\|goal\|([\s\S]*?)<\|goal\|>/g.exec(agentContent);
    if (goalMatch) {
      let goal = goalMatch[1].trim();
      if (goal.startsWith(">")) {
        goal = goal.substring(1).trim();
      }
      result.goal = goal;
      result.content = result.content.replace(goalMatch[0], "");
    }

    // Extract all team entries
    result.team = [];
    const teamRegex = /<\|team\|([\s\S]*?)<\|team\|>/g;
    let teamMatch;

    while ((teamMatch = teamRegex.exec(agentContent)) !== null) {
      const teamContent = teamMatch[1].trim();

      if (teamContent.startsWith('"') && teamContent.endsWith('"')) {
        let member = teamContent.slice(1, -1).trim();
        if (member.startsWith(">")) {
          member = member.substring(1).trim();
        }
        result.team.push(member);
      } else {
        const members = teamContent.split(",").map((item) => {
          let trimmed = item.trim();
          if (trimmed.startsWith(">")) {
            trimmed = trimmed.substring(1).trim();
          }
          return trimmed.startsWith('"') && trimmed.endsWith('"')
            ? trimmed.slice(1, -1).trim()
            : trimmed;
        });
        result.team.push(...members);
      }

      result.content = result.content.replace(teamMatch[0], "");
    }

    result.content = result.content.trim();
    if (result.content.startsWith(">")) {
      result.content = result.content.substring(1).trim();
    }
    return result;
  }

  const processStreamingContent = (input, forceComplete = false) => {
    if (!input) return [];

    /** helper to push a text block if non-empty */
    const pushText = (arr, txt) => {
      const t = txt.trim();
      if (t) arr.push({ type: "text", content: t, isComplete: true });
    };

    // --- 1. Extract balanced <document> blocks ---
    const documentBlocks = [];
    const docRegex = /<document>/gi;
    let match;
    while ((match = docRegex.exec(input)) !== null) {
      const start = match.index;
      let depth = 1;
      let pos = start + match[0].length;
      while (depth > 0 && pos < input.length) {
        const nextOpen = input.indexOf("<document>", pos);
        const nextClose = input.indexOf("</document>", pos);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          pos = nextOpen + 10;
        } else {
          depth--;
          pos = nextClose + 11;
        }
      }
      if (depth === 0) {
        const end = pos;
        let inner = input.slice(start + 10, end - 11).trim();
        let name = "Document";
        const nm = /<name>([\s\S]*?)<\/name>/i.exec(inner);
        if (nm) {
          name = nm[1].trim();
          inner = inner.replace(nm[0], "").trim();
        }
        documentBlocks.push({
          type: "document",
          name,
          content: inner,
          isComplete: true,
          start,
          end,
        });
        docRegex.lastIndex = end;
      }
    }

    // --- 2. Mask document spans to avoid nested matches ---
    let masked = input;
    documentBlocks.forEach(({ start, end }) => {
      masked =
        masked.slice(0, start) + " ".repeat(end - start) + masked.slice(end);
    });

    // --- 3. Define other block patterns ---
    const blockDefs = [
      {
        type: "visual",
        regex: /<visual>([\s\S]*?)<\/visual>/gi,
        handler: (m, start, end) => {
          let inner = m[1].trim();
          let name = "Visualization";
          const nm = /<name>([\s\S]*?)<\/name>/i.exec(inner);
          if (nm) {
            name = nm[1].trim();
            inner = inner.replace(nm[0], "").trim();
          }
          return {
            type: "visual",
            name,
            content: inner,
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "mermaid",
        regex: /```mermaid([\s\S]*?)```/gi,
        handler: (m, start, end) => ({
          type: "mermaid",
          content: m[1].trim(),
          isComplete: true,
          start,
          end,
        }),
      },
      {
        type: "automationDaily",
        regex: /<automationCard>([\s\S]*?)<\/automationCard>/gi,
        handler: (m, start, end) => {
          const inner = m[1];
          console.log(inner, "aahsdkj387498");
          const tag = (t) =>
            new RegExp(`<${t}>([\\s\\S]*?)<\/${t}>`, "i")
              .exec(inner)?.[1]
              ?.trim() || "";
          return {
            type: "automationDaily",
            name: tag("name"),
            task: tag("task"),
            time: tag("time"),
            outputFormat: tag("outputFormat"),
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "showUniProt",
        regex: /<showUniProt>([\s\S]*?)<\/showUniProt>/gi,
        handler: (m, start, end) => {
          let inner = m[1].trim();
          let name = "";
          const nm = /<name>([\s\S]*?)<\/name>/i.exec(inner);
          if (nm) {
            name = nm[1].trim();
            inner = inner.replace(nm[0], "").trim();
          }
          return {
            type: "showUniProt",
            name,
            uniProt: inner,
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "chart",
        regex: /<chart>([\s\S]*?)<\/chart>/gi,
        handler: (m, start, end) => {
          let inner = m[1].trim();
          let chartType = "";
          const tp = /<type>([\s\S]*?)<\/type>/i.exec(inner);
          if (tp) {
            chartType = tp[1].trim();
            inner = inner.replace(tp[0], "").trim();
          }
          return {
            type: "chart",
            chartType,
            content: inner,
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "persona",
        regex: /<\|agent\|([\s\S]*?)<\|end\|>/gi,
        handler: (m, start, end) => {
          const parsed = parseAgentBlock(m[1]);
          return { type: "persona", ...parsed, isComplete: true, start, end };
        },
      },
    ];

    // --- 4. Find other blocks in masked content ---
    const found = [];
    blockDefs.forEach((def) => {
      let rx = def.regex;
      let m;
      while ((m = rx.exec(masked)) !== null) {
        found.push(def.handler(m, m.index, rx.lastIndex));
      }
    });

    // Combine and sort all blocks
    const allBlocks = [...documentBlocks, ...found].sort(
      (a, b) => a.start - b.start,
    );

    // --- 5. Walk through content and build result ---
    const result = [];
    let cursor = 0;

    allBlocks.forEach((block) => {
      if (block.start > cursor) {
        pushText(result, input.slice(cursor, block.start));
      }
      block.isComplete =
        forceComplete || Boolean(block.content && block.content.length > 0);
      result.push(block);
      cursor = block.end;
    });

    if (cursor < input.length) pushText(result, input.slice(cursor));

    if (result.length === 0) {
      result.push({ type: "text", content: input.trim(), isComplete: true });
    }

    // --- 6. Merge persona blocks into a simulation at original position ---
    const personas = result.filter((b) => b.type === "persona");
    if (personas.length) {
      const idx = result.findIndex((b) => b.type === "persona");
      const simulation = {
        type: "simulation",
        items: personas,
        isComplete: true,
      };
      const filtered = result.filter((b) => b.type !== "persona");
      filtered.splice(idx, 0, simulation);
      return filtered;
    }

    return result;
  };

  // Function to ensure history content is properly parsed and all blocks are marked complete
  const parseHistoryAIContent = (content) => {
    if (!content) return [];

    try {
      // First try to parse with standard parser
      try {
        const parsedResult = processStreamingContent(content);
        if (Array.isArray(parsedResult) && parsedResult.length > 0) {
          // Force all blocks to be marked as complete
          return parsedResult.map((block) => ({
            ...block,
            isComplete: true,
          }));
        }
      } catch (e) {
        console.warn("Standard parsing failed for history:", e);
      }

      // Fallback to our custom parser with forceComplete=true
      return processStreamingContent(content, true);
    } catch (error) {
      console.error("All parsing methods failed for history:", error);
      return [
        {
          type: "text",
          content: content || "",
          isComplete: true,
        },
      ];
    }
  };

  async function SSEChatCall(payload) {
    try {
      const accessToken = localStorage.getItem("accessToken");
      let response = await fetch(
        `${import.meta.env.VITE_SOCKET_URL}/api/core/chating`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      // If unauthorized or forbidden, try refreshing token and retrying once
      if (response.status === 401 || response.status === 403) {
        console.warn("❗ Unauthorized or forbidden, refreshing token");
        await refreshAccessToken();
        await new Promise((r) => setTimeout(r, 500)); // 100ms delay
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          toast({
            title: "Error",
            description: "No Access Token Found",
            variant: "destructive",
          });
          return;
        }
        // Retry the request once after token refresh
        response = await fetch(
          `${import.meta.env.VITE_SOCKET_URL}/api/core/chating`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            credentials: "include",
            body: JSON.stringify(payload),
          },
        );
      }

      if (!response.ok || response.status >= 400) {
        const errorText = await response.json();
        throw new Error(`${errorText.errors}`);
      }

      return response;
    } catch (error) {
      console.error("Error in SSEChatCall:", error);
      throw new Error(error.message || "Unknown SSEChatCall error");
    }
  }

  const handleSubmit = useCallback(
    async (prompt, isRetry = false) => {
      if (!prompt.trim()) return;
      scrollToBottom();
      // Remove onScrollDown() call - the hook will handle auto-scrolling

      if (prompt.length > 4999) {
        toast({
          title: "Error",
          description: "Prompt is too long. Please shorten it.",
          variant: "destructive",
        });
        return;
      }

      if (isError) {
        setIsError(false);
        setErrorMessage("");
      }

      setIsNextChatLoading(true);
      const prevPrompt = prompt;
      setPrompt("");

      const payload = {
        prompt,
        sessionId: id,
        mode: isDeepThinkMode ? "deep" : "quick",
        isSwarm: isSwarmMode,
        swarmIds: selectedSuperiorPersona?.map((p) => p.id) || [],
        isAutoSwarm: isAutoSwarmContextState,
        workflowId: selectedWorkflowId,
        collectionIds: selectedCollectionIds,
      };

      // Reset state
      setStreamingResponse("");
      setIsShowAgenticBlock(true);
      setConversation((prev) => [
        ...prev,
        { message: prompt, role: "human", isRetry },
        {
          role: "ai",
          type: isDeepThinkMode ? "deepThink" : "quick",
          ...(isDeepThinkMode
            ? {
                steps: [],
                markdownBuffer: "",
                isComplete: false,
                isStreaming: false,
                isLoading: true,
              }
            : {
                message: [],
                streamingContent: "",
                isComplete: false,
                isLoading: true,
              }),
        },
      ]);

      let activityTimeout = null;
      let lastMessageTime = Date.now();

      const checkInactivity = () => {
        if (Date.now() - lastMessageTime > 20000) {
          console.warn("⚠️ Stream inactive for 20s");
          setIsError(true);
          setErrorMessage("The connection is too slow or has stalled.");
        }
      };

      try {
        let response;
        response = await SSEChatCall(payload);

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        // Start inactivity check
        activityTimeout = setInterval(checkInactivity, 5000);

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

              lastMessageTime = Date.now();

              let data = {};
              try {
                data = JSON.parse(dataStr);
              } catch {
                data = { content: dataStr };
              }

              handleSocketEvent({ type: eventType, ...data });

              if (eventType === "end") {
                clearInterval(activityTimeout);
                return;
              }
            }
          }
        };

        await processStream();
      } catch (error) {
        if (String(error).includes("User is blocked")) {
          setIsUserBanned(true);
          toast({
            title: "User Blocked",
            description:
              "You have been blocked from using this feature or platform",
            variant: "destructive",
          });
          return;
        }

        console.error("❌ SSE error:", error);
        toast({
          title: "Streaming error",
          description: error.message,
          variant: "destructive",
        });
        setPrompt(prevPrompt);
        setIsError(true);
        setErrorMessage(error.message);
      } finally {
        clearInterval(activityTimeout);
        setIsNextChatLoading(false);
      }
    },
    [
      id,
      toast,
      isDeepThinkMode,
      isSwarmMode,
      selectedSuperiorPersona,
      isAutoSwarmContextState,
      selectedWorkflowId,
      isError,
      selectedCollectionIds,
    ],
  );

  const lastContent = useRef("");
  const onRetry = useCallback(() => {
    const lastHumanMessage = conversation
      .filter((item) => item.role === "human")
      .slice(-1)[0];
    if (lastHumanMessage) {
      lastContent.current = lastHumanMessage.message;
      // remove only last element of human message
      setConversation((prev) => {
        const lastIndex = prev.lastIndexOf(lastHumanMessage);
        return prev.filter((_, index) => index !== lastIndex);
      });
      isRetryTrigger.current = true;
    }
  }, [conversation]);

  useEffect(() => {
    if (isError && isRetryTrigger.current) {
      isRetryTrigger.current = false;

      const lastHumanMessageContent = lastContent.current;
      // setPrompt(lastHumanMessageContent);
      handleSubmit(lastHumanMessageContent, true);
      setIsNextChatLoading(true);
      setIsError(false);
      setErrorMessage("");
    }
  }, [conversation]);

  function clearPolling() {
    pollChatOutputRef.current?.stopPolling();
    pollInteractionLogsRef.current?.stopPolling();
    pollChatStatusRef.current?.stopPolling();
    pollChatOutputRef.current = null;
    pollInteractionLogsRef.current = null;
    pollChatStatusRef.current = null;
    latestUpdatedStatus.current = [];
    setIsShowInteractionLogs(false);
    setChatIdentifer(null);
    setInteractionLogs([]);
  }

  const conversationRef = useRef(conversation);
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    if (isChatLoading == false) {
      scrollToBottom();
    }
  }, [isChatLoading]);

  // --- UI Render ---
  if (isChatLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center gap-2">
        <LoaderCircle className="animate-spin" />
        <p>Loading Chats</p>
      </div>
    );
  }

  if (isSessionExploited) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        {/* card */}

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-blue-500">
            Chat Thread Exploited
          </h2>
          <p className="text-gray-300 mb-4">
            You have exhausted the Limit of Exploitation Of This Chat Thread.
            Please create a new session to continue your work.
          </p>
          <Button
            onClick={() => {
              navigate("/dashboard");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create New Chat
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full w-full relative">
      <Conversation
        conversation={conversation}
        isNextChatLoading={isNextChatLoading}
        isShowInteractionLogs={isShowInteractionLogs}
        sidebarStack={sidebarStack}
        id={id}
        handleBlockSidebar={memoizedHandleBlockSidebar}
        renderMermaidChart={memoizedRenderMermaidChart}
        handleMaterialSidebar={memoizedHandleMaterialSidebar}
        interactionLogs={interactionLogs}
        isChanged={isChanged}
        loadingMessage={currLoadingStatus}
        chatContainerRef={chatContainerRef}
        endRef={endRef}
      />

      <div className="w-full sticky bottom-0  mb-2 flex items-center justify-center">
        <div className="max-w-4xl bg-black w-full mx-auto">
          <ChatInput
            conversationProp={conversationRef}
            conversationCount={conversation.length}
            isReconnectionNeeded={isReconnectionNeeded}
            input={prompt}
            setInput={setPrompt}
            handleSubmit={() => handleSubmit(prompt)}
            isLoading={isNextChatLoading}
            setLoading={setIsNextChatLoading}
            isError={isError}
            errorMessage={errorMessage}
            onRetry={onRetry}
            setIsError={setIsError}
            setIsReconnectionNeeded={setIsReconnectionNeeded}
            isReconnecting={isReconnecting}
            setIsReconnecting={setIsReconnecting}
            setIsReconnected={setIsReconnected}
            isReconnected={isReconnected}
            onScrollToBottom={scrollToBottom}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(Chat);

// --- Helper: Workflow Compilation ---
function compileWorkflow(
  isDocumentOn,
  isSearchOn,
  isVectorBaseOn,
  isInteraction,
) {
  const workflow = [];
  if (isDocumentOn) {
    workflow.push("document");
  }
  if (isSearchOn) {
    workflow.push("search");
  }
  if (isVectorBaseOn) {
    workflow.push("vector");
  }
  if (isInteraction) {
    workflow.push("interaction");
  }
  workflow.push("generate");
  return workflow;
}
