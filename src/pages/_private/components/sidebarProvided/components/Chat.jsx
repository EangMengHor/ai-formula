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
import { parseContent, sanitizeFileName } from "../../../../../lib/utils";
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
import { refreshApi } from "@/services/n8n-apis/_auth/refresh.api";
import { set } from "lodash";
import { useCollection } from "../../../../../context/CollectionContext";
import { useScrollToBottom } from "@/hooks/scrollToBottom";

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
    isMemorizationLoading,
    setIsMemorizationLoading,
    fileName,
    setFileName,
    files,
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
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState("");
  const [dialogType, setDialogType] = useState("visual");
  const [dialogTitle, setDialogTitle] = useState("");
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
            {/* onClick={() => downloadDocument({
                                                content: block,
                                                type: "pdf",
                                                fileName: header ? header : "ARX Blocks"
                                            })} */}
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
                        console.log("PDF content:", block);

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
    console.log(fallBackPrompt);
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
        console.log(res, "conversation history");
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
                };
              }
              return {
                role: "ai",
                message: parsedResponse,
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
    console.log(chatIdentifer, conversation, "conversation ksdkfl2389040");
  }, [conversation, chatIdentifer]);

  useEffect(() => {
    if (isShowAgenticBlock && isSuperiorPersonaAttached) {
      console.log("interaction polling started lsdfs9820923");
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
        console.log("Stream completed due to inactivity");
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
      console.log(event, "loadingStatus");
      setCurrLoadingStatus(event.status || "Thinking . . .");
      return;
    }
    /* ─────────────────────────────────────────────────────── */
    /* 1. "swarmId" → update or create the simulation message  */
    /* ─────────────────────────────────────────────────────── */
    if (event.type === "swarmId") {
      const { output } = await getPersonaById(event.swarmId);
      const simItems = parseContent(output).flatMap((d) => d.items);
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
      console.log(event, "Exploitation Flag");
      if (event.userBan) {
        setIsUserBanned(true);
      } else if (event.sessionBan) {
        setIsSessionExploited(true);
      }
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
        case "searchUrls":
          console.log(event, "searchUrls");
          break;
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
        default:
          if (event.content && steps.length) {
            const s = steps[steps.length - 1];
            if (s) s.text = (s.text || "") + event.content;
          }
      }
      return conv;
    });
  };

  const processStreamingContent = (content, forceComplete = false) => {
    if (!content) return [];

    console.log("Processing content:", content.substring(0, 100) + "...");

    try {
      // First try the standard parser from utils for complete blocks
      if (forceComplete) {
        try {
          const parsedContent = parseContent(content);
          console.log("Standard parser result:", parsedContent);
          if (Array.isArray(parsedContent) && parsedContent.length > 0) {
            return parsedContent.map((block) => ({
              ...block,
              isComplete: true,
            }));
          }
        } catch (e) {
          console.warn("Standard parser failed:", e);
          // Continue with custom parsing
        }
      }

      // Custom block extraction with more robust patterns
      const result = [];

      // IMPROVED APPROACH: First extract document blocks completely with nested content
      // Use a more careful approach to extract document blocks with balanced tag parsing
      const extractDocumentBlocks = (content) => {
        const documentBlocks = [];
        const regex = /<document>/g;
        let match;
        let searchFrom = 0;

        while ((match = regex.exec(content)) !== null) {
          const startIndex = match.index;
          // Find the matching closing tag, considering nesting
          let tagDepth = 1;
          let closeIndex = startIndex + 10; // Length of "<document>"

          while (tagDepth > 0 && closeIndex < content.length) {
            const nextOpenTag = content.indexOf("<document>", closeIndex);
            const nextCloseTag = content.indexOf("</document>", closeIndex);

            // If we find a close tag and it's before any next open tag (or there is no next open tag)
            if (
              nextCloseTag !== -1 &&
              (nextOpenTag === -1 || nextCloseTag < nextOpenTag)
            ) {
              tagDepth--;
              closeIndex = nextCloseTag + 11; // Length of "</document>"
            }
            // If we find another open tag before a close tag
            else if (nextOpenTag !== -1) {
              tagDepth++;
              closeIndex = nextOpenTag + 10;
            }
            // If we can't find any more tags, break out
            else {
              break;
            }
          }

          // If we found a balanced document tag
          if (tagDepth === 0) {
            const fullDocContent = content.substring(startIndex, closeIndex);
            const innerContent = content.substring(
              startIndex + 10,
              closeIndex - 11,
            );

            // Extract the name if present
            const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(innerContent);
            let name = nameMatch ? nameMatch[1].trim() : "Document";
            let cleanContent = innerContent;

            if (nameMatch) {
              cleanContent = innerContent.replace(nameMatch[0], "").trim();
            }

            documentBlocks.push({
              type: "document",
              name,
              content: cleanContent,
              isComplete: forceComplete || cleanContent.length > 0,
              start: startIndex,
              end: closeIndex,
            });

            // Update search position to avoid re-finding the same tag
            regex.lastIndex = closeIndex;
          }
        }

        return documentBlocks;
      };

      // Extract all document blocks first
      const documentBlocks = extractDocumentBlocks(content);

      // Create a masked content where document blocks are replaced with placeholders
      let maskedContent = content;
      documentBlocks.forEach((block) => {
        // Replace the document block in the masked content with spaces
        maskedContent =
          maskedContent.substring(0, block.start) +
          " ".repeat(block.end - block.start) +
          maskedContent.substring(block.end);
      });

      // Now extract other blocks from the masked content (where document blocks are removed)
      const visualPattern = /<visual>([\s\S]*?)<\/visual>/g;
      const mermaidPattern = /```mermaid([\s\S]*?)```/g;

      const otherBlocks = [];

      // Find visual blocks in masked content
      let match;
      while ((match = visualPattern.exec(maskedContent)) !== null) {
        // Only process if not inside a document (check if the match position has content in maskedContent)
        if (
          maskedContent.substring(match.index, match.index + 8) === "<visual>"
        ) {
          const fullBlock = match[0];
          const blockContent = match[1];
          const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(blockContent);

          let name = nameMatch ? nameMatch[1].trim() : "Visualization";
          let cleanContent = blockContent;

          if (nameMatch) {
            cleanContent = blockContent.replace(nameMatch[0], "").trim();
          }

          otherBlocks.push({
            type: "visual",
            name,
            content: cleanContent,
            isComplete: forceComplete || cleanContent.length > 0,
            start: match.index,
            end: match.index + fullBlock.length,
          });
        }
      }

      // Find mermaid blocks in masked content
      while ((match = mermaidPattern.exec(maskedContent)) !== null) {
        // Only process if not inside a document
        if (
          maskedContent
            .substring(match.index, match.index + 10)
            .includes("mermaid")
        ) {
          otherBlocks.push({
            type: "mermaid",
            content: match[1].trim(),
            isComplete: true,
            start: match.index,
            end: match.index + match[0].length,
          });
        }
      }

      const automationPattern = /<automationCard>([\s\S]*?)<\/automationCard>/g;
      while ((match = automationPattern.exec(maskedContent)) !== null) {
        const inner = match[1];
        const name =
          (/<name>([\s\S]*?)<\/name>/i.exec(inner) || [])[1]?.trim() || "";
        const task =
          (/<task>([\s\S]*?)<\/task>/i.exec(inner) || [])[1]?.trim() || "";
        const time =
          (/<time>([\s\S]*?)<\/time>/i.exec(inner) || [])[1]?.trim() || "";
        const outputFormat =
          (/<outputFormat>([\s\S]*?)<\/outputFormat>/i.exec(inner) ||
            [])[1]?.trim() || "";
        otherBlocks.push({
          type: "automationDaily",
          name,
          task,
          time,
          outputFormat,
          isComplete: true,
          start: match.index,
          end: match.index + match[0].length,
        });
      }

      // Combine all blocks and sort by position
      const allBlocks = [...documentBlocks, ...otherBlocks].sort(
        (a, b) => a.start - b.start,
      );

      // Extract text between blocks
      let lastIndex = 0;

      for (const block of allBlocks) {
        // Add text before the current block
        if (block.start > lastIndex) {
          const textContent = content.substring(lastIndex, block.start).trim();
          if (textContent) {
            result.push({
              type: "text",
              content: textContent,
              isComplete: true,
            });
          }
        }

        // Add the block itself (without position info)
        const { start, end, ...cleanBlock } = block;
        result.push(cleanBlock);

        lastIndex = block.end;
      }

      // Add any remaining text after the last block
      if (lastIndex < content.length) {
        const remainingContent = content.substring(lastIndex).trim();
        if (remainingContent) {
          result.push({
            type: "text",
            content: remainingContent,
            isComplete: true,
          });
        }
      }

      // If nothing was found, return the full content as text
      if (result.length === 0 && content.trim()) {
        result.push({
          type: "text",
          content: content.trim(),
          isComplete: true,
        });
      }

      console.log("Final parsed blocks:", result);
      return result;
    } catch (error) {
      console.error("Error in processStreamingContent:", error);
      // Ultimate fallback - just return as plain text
      return [
        {
          type: "text",
          content: content || "",
          isComplete: true,
        },
      ];
    }
  };

  // Function to ensure history content is properly parsed and all blocks are marked complete
  const parseHistoryAIContent = (content) => {
    if (!content) return [];

    console.log("Parsing history content");

    try {
      // First try to parse with standard parser
      try {
        const parsedResult = parseContent(content);
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
      let response = await fetch(
        `${import.meta.env.VITE_SOCKET_URL}/api/core/chating`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      console.log("SSEChatCall response:", response);

      // If unauthorized or forbidden, try refreshing token and retrying once
      if (response.status === 401 || response.status === 403) {
        console.warn("❗ Unauthorized or forbidden, refreshing token");
        await refreshAccessToken();
        await new Promise((r) => setTimeout(r, 500)); // 100ms delay

        // Retry the request once after token refresh
        response = await fetch(
          `${import.meta.env.VITE_SOCKET_URL}/api/core/chating`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          },
        );
      }

      if (!response.ok || response.status >= 400) {
        const errorText = await response.json();
        console.log("SSEChatCall error:", errorText.errors);
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

  const onRetry = useCallback(() => {
    const lastHumanMessage = conversation
      .filter((item) => item.role === "human")
      .slice(-1)[0];
    if (lastHumanMessage) {
      console.log(lastHumanMessage, "last human message");
      lastContent.current = lastHumanMessage.message;
      // remove only last element of human message
      setConversation((prev) => {
        const lastIndex = prev.lastIndexOf(lastHumanMessage);
        return prev.filter((_, index) => index !== lastIndex);
      });
      isRetryTrigger.current = true;
    }
    console.log(lastHumanMessage, "last human message");
  }, [conversation]);

  useEffect(() => {
    if (isError && isRetryTrigger.current) {
      isRetryTrigger.current = false;

      const lastHumanMessageContent = lastContent.current;
      console.log(lastHumanMessageContent, "last human message content");
      // setPrompt(lastHumanMessageContent);
      handleSubmit(lastHumanMessageContent, true);
      setIsNextChatLoading(true);
      setIsError(false);
      setErrorMessage("");
    }
  }, [conversation]);

  async function _pollChatOutput(id) {
    return await pollChatOutput(id);
  }

  const startPollingChatOutput = (chatId) => {
    if (
      pollChatOutputRef.current &&
      pollChatOutputRef.current.hasOwnProperty("stopPolling")
    )
      return;
    startPollingStatus();

    pollChatOutputRef.current = polling(
      async () => {
        const pollResult = await _pollChatOutput(chatId);
        if (
          pollResult &&
          pollResult.success &&
          pollResult.data.length > 0 &&
          !dataFetchedRef.current
        ) {
          const parsedResponse = parseContent(pollResult.data);
          setConversation((prev) => [
            ...prev,
            {
              message: parsedResponse,
              role: "ai",
              workflow: compileWorkflow(
                isDocumentOn,
                isSearchOn,
                isVectorBaseOn,
              ),
              updated: latestUpdatedStatus.current,
            },
          ]);
          dataFetchedRef.current = true;
          setIsNextChatLoading(false);
          clearPolling();
        }
      },
      10000,
      2,
    )();
  };

  const startPollingStatus = () => {
    if (
      pollChatStatusRef.current &&
      pollChatStatusRef.current.hasOwnProperty("stopPolling")
    )
      return;

    pollChatStatusRef.current = polling(
      async () => {
        const data = await pollStatus(id);
        if (latestUpdatedStatus.current.length < data.data.length) {
          latestUpdatedStatus.current = data.data;
        }
        setIsChanged((prev) => !prev);
      },
      2000,
      2,
    )();
  };

  const startPollingInteractionLogs = () => {
    if (
      pollInteractionLogsRef.current &&
      pollInteractionLogsRef.current.hasOwnProperty("stopPolling")
    )
      return;
    if (!chatIdentifer) return;

    pollInteractionLogsRef.current = polling(
      async () => {
        const data = await pollInteractionLogs(chatIdentifer);
        if (data.data.length > 0) {
          const processedData = data.data.map((item) =>
            parseContent(item.output),
          );
          const setterData = processedData.map(
            (data) => data?.[0]?.items[0] || {},
          );
          if (interactionLogs.length !== setterData.length)
            setInteractionLogs(setterData);
        }
      },
      8000,
      2,
    )();
  };

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

  const openDialog = (type, content, title) => {
    setDialogType(type);
    setDialogContent(content);
    setDialogTitle(title);
    setDialogOpen(true);
  };

  const conversationRef = useRef(conversation);
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

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
        currentLoadingMessage={currentLoadingMessage}
        interactionLogs={interactionLogs}
        isChanged={isChanged}
        loadingMessage={currLoadingStatus}
        chatContainerRef={chatContainerRef}
        endRef={endRef}
      />

      
      <div className="w-full p-2 sticky bottom-0  mb-2 flex items-center justify-center">
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
