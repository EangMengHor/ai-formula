import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileDown, LoaderCircle, Loader2, Upload, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useToast } from "../../../../../hooks/use-toast";
import ChatInput from "../../../../../components/custom/ChatInput";
import { getConversationHistory } from "@/services/n8n-apis/_core/getConversationHistory.api";
import "../../../../_private/components/sidebarProvided/components/Chat.css";
import { getUploadedDocumentHistory } from "../../../../../services/n8n-apis/_core/getUploadedDocumentHis.api";
import { useFilesUploadMetadata } from "../../../../../context/FilesUploadMetadata";
import { useUser } from "../../../../../context/UserContext";
import { useStackSidebar } from "../../../../../context/StackSidebarContext";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Mermaid } from "../../../../../components/custom/Mermaid";
import { Button } from "@/components/ui/button";
import Conversation from "./Conversation";
import { getPersonaById } from "@/services/n8n-knowledge-apis/getPersonaById";
import { Textarea } from "@/components/ui/textarea";
import { downloadPdf } from "@/services/n8n-apis/_core/downloadPdf.api";
import { useWorkflow } from "@/context/WorkflowContext";
import { useCollection } from "../../../../../context/CollectionContext";
import { useScrollToBottom } from "@/hooks/scrollToBottom";
import RenderMaterialUniProb from "../components/RenderMaterialUniProb";
import { SSEChatCall } from "../../../../../services/SSEChat";
import { abortSSEChat } from "@/services/abortSSEChat";
import { isReplay } from "@/services/isReplay";
import { replayStream } from "@/services/replayStream";
import SidebarVectorStoreScrapper from "@/components/custom/webVectorStoreScrapper/SidebarVectorStoreScrapper";
import { sanitizeFileName } from "@/lib/utils";
import { useFileUpload } from "@/hooks/use-file-upload";
import SidebarUrlShower from "@/components/custom/urlScraperSidebar/SidebarUrlShower";
import OsintNewInstanceSidebar from "@/components/custom/osint/OsintNewInstanceSidebar";
import SidebarFileBlock from "@/components/custom/generatedFile/SidebarFileblock";
// import VoiceInterface from "@/components/custom/VoiceInterface";

function Chat() {
  // exploitation
  const [isSessionExploited, setIsSessionExploited] = useState(false);

  const isRetryTrigger = useRef(false);

  // --- Context ---
  const { id } = useParams();

  // Add debugging for production
  useEffect(() => {
    console.log("Chat component mounted with ID:", id);
    console.log(
      "localStorage prompt at mount:",
      localStorage.getItem("prompt"),
    );
    console.log("Environment:", process.env.NODE_ENV);
  }, []);

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
    isSwarmMode,
    isAutoSwarmContextState,
    selectedSuperiorPersona,
    isDeepThinkMode,
    setIsUserBanned,
    refreshAccessToken,
    selectedModel,
    setSelectedModel,
  } = useUser();
  const { setSidebarStack } = useStackSidebar();
  const navigate = useNavigate();
  const { selectedCollectionIds } = useCollection();

  // --- State ---
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [fallBackPrompt, setFallBackPrompt] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isNextChatLoading, setIsNextChatLoading] = useState(false);
  const [prompt, setPrompt] = useState("");

  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pdfFileName, setpPdfFileName] = useState("");
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [currLoadingStatus, setCurrLoadingStatus] = useState("Thinking");
  const chatContainerRef = useRef(null);
  const agentCitationsRef = useRef([]);
  const searchCitationsRef = useRef([]);
  //   aboard controller logic
  const [currConversationId, setCurrConversationId] = useState("");
  const [isAborting, setIsAborting] = useState(false);
  const isAboartController = useRef(null);
  //   voice to voice
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  // --- File Upload Hook ---
  const { isDragActive, processingFiles } = useFileUpload({
    enabled: !isChatLoading && !isSessionExploited && id, // Only enable when chat is loaded and session is valid
    maxFiles: 200,
    onFilesAdded: (files) => {
      console.log("Files added via drag and drop:", files);
      // Files are automatically added to context by the hook
    },
    excludeSelector: "[data-sidebar], .sidebar",
  });
  // Use the hook properly
  const { showScrollButton, scrollToBottom, endRef } =
    useScrollToBottom(chatContainerRef);
  //   replay message
  const messageReplayRef = useRef(null);
  const lastReadedRelayIndex = useRef(null);
  const handleSubmitRef = useRef(null);

  // Force submit function for immediate submission

  // Helper function to extract text in exact order from message blocks
  const extractTextInOrder = useCallback((messageBlocks) => {
    if (!Array.isArray(messageBlocks)) return "";

    let extractedText = "";

    // Process blocks in their exact array order
    for (let i = 0; i < messageBlocks.length; i++) {
      const block = messageBlocks[i];

      if (block.type === "text" && block.content) {
        // Add the text content exactly as it appears
        extractedText += block.content;

        // Add proper spacing between text blocks
        if (i < messageBlocks.length - 1) {
          // Check if the content already ends with proper punctuation/spacing
          const trimmedContent = block.content.trim();
          if (!trimmedContent.match(/[.!?]\s*$/)) {
            extractedText += " ";
          } else {
            extractedText += " ";
          }
        }
      }
      // For non-text blocks, add brief descriptions
      else if (block.type === "document" && block.name) {
        extractedText += `Document ${block.name} presented. `;
      } else if (block.type === "visual" && block.name) {
        extractedText += `Visualization ${block.name} shown. `;
      } else if (block.type === "chart" && block.dataName) {
        extractedText += `Chart ${block.dataName} displayed. `;
      } else if (block.type === "mermaid") {
        extractedText += "Diagram presented. ";
      } else if (block.type === "simulation") {
        extractedText += "Agent simulation results shown. ";
      }
    }

    return extractedText.trim();
  }, []);

  // when sessionId changes then reset the state
  useEffect(() => {
    console.log("Session ID changed:", id);
    setIsNextChatLoading(false);
    isSessionExploited && setIsSessionExploited(false);

    // Also reset fallback prompt when session changes
    setFallBackPrompt("");
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

  const memoizedHandleVectorStoreScrapperSidebar = useCallback((dbId, name) => {
    setSidebarStack(() => {
      return [
        {
          header: name, // or replace with appropriate value or variable
          component: <SidebarVectorStoreScrapper dbId={dbId} name={name} />,
        },
      ];
    });
  }, []);

  const memorizedNewOsintInstance = useCallback((workflowId, name) => {
    console.log("New OSINT Instance:", workflowId, name);
    setSidebarStack(() => {
      return [
        {
          header: name,
          component: (
            <OsintNewInstanceSidebar name={name} workflowId={workflowId} />
          ),
        },
      ];
    });
  }, []);

  const memorizedHandleUrlScraperSidebar = useCallback(
    (jobId, name, numOfUrls) => {
      setSidebarStack(() => {
        return [
          {
            header: name, // or replace with appropriate value or variable
            component: (
              <SidebarUrlShower
                jobId={jobId}
                name={name}
                numOfUrls={numOfUrls}
              />
            ),
          },
        ];
      });
    },
    [],
  );

  const memorizedGeneratedDocumentBlockSidebar = useCallback(
    (genId, name = "File", pages = "-") => {
      setSidebarStack(() => {
        return [
          {
            header: name,
            component: (
              <SidebarFileBlock
                genId={genId}
                name={name}
                pages={pages}
                key={`sidebar-file-block-${genId}`}
              />
            ),
          },
        ];
      });
    },
    [],
  );

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

  // document block with download pdf
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

  // check if user is coming from dashboard to here.
  useEffect(() => {
    async function getPurpose() {
      const localItem = localStorage.getItem("prompt");
      console.log("getPurpose called, localItem:", localItem); // <-- added for testing

      if (localItem) {
        try {
          setFallBackPrompt(localItem);
          localStorage.removeItem("prompt");
        } catch (error) {
          console.error("Error parsing localStorage prompt:", error);
          // If parsing fails, use the raw string
          setFallBackPrompt(localItem);
          setIsNextChatLoading(true);
          localStorage.removeItem("prompt");
        }
      } else {
        setIsChatLoading(true);
      }
    }
    getPurpose();
  }, [id]);

  // check the prompt coming from dashboard
  useEffect(() => {
    if (
      fallBackPrompt &&
      fallBackPrompt.trim().length > 0 &&
      handleSubmitRef.current
    ) {
      if (fallBackPrompt.length > 30000) {
        toast({
          title: "Error",
          description: "Prompt length exceeds 30000 characters.",
          variant: "destructive",
        });
        setFallBackPrompt(""); // Clear the fallback to prevent infinite retries
        return;
      }

      console.log("Processing fallBackPrompt:", fallBackPrompt);

      // Use a more reliable approach to ensure handleSubmit is called
      const attemptSubmit = () => {
        if (typeof handleSubmitRef.current === "function") {
          console.log("Submitting fallBackPrompt:", fallBackPrompt);
          handleSubmitRef.current(fallBackPrompt);
          setFallBackPrompt(""); // Clear after successful submission
        } else {
          // If handleSubmitRef is not ready, try again in a short while
          console.log("handleSubmitRef not ready, retrying...");
          setTimeout(attemptSubmit, 100);
        }
      };

      // Small delay to ensure everything is initialized
      setTimeout(attemptSubmit, 50);
    }
  }, [fallBackPrompt, toast, handleSubmitRef.current]);

  // get conversation history and uploaded documents for chat thread
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
              return {
                role: "ai",
                type: "quick",
                isLoading: false,
                isComplete: true,
                message: parsedResponse,
                citations: item?.citations || [],
                cot: item.cot,
                agenticCitations: item.agenticCitations || [],
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

    async function isReplayMessages() {
      messageReplayRef.current = null;
      lastReadedRelayIndex.current = null;
      const res = await isReplay(id);
      const data = res.data;

      if (data && data?.message && data.message?.data.length > 0) {
        console.log(data, "is replay data 1");

        messageReplayRef.current = data.message.data || null;
        lastReadedRelayIndex.current = data.message.lastReadedIndex || 0;
        console.log(messageReplayRef.current, "message replay ref");
        if (
          messageReplayRef.current &&
          Array.isArray(messageReplayRef.current) &&
          messageReplayRef.current.length > 0 &&
          messageReplayRef.current.reduce((acc, curr) => {
            console.log(curr, "curr message replay");
            if (curr && curr.event == "finish") acc = true;
            return acc;
          }, false)
        ) {
          console.log("no replay to do");
        } else {
          loadReplayMessages();
        }
      }
      console.log(
        data,
        "is replay data",
        messageReplayRef,
        lastReadedRelayIndex,
      );
    }

    async function getData() {
      resetAllStates();
      await Promise.all([getUploadedDocumentHis(), fetchConversations()]);

      isReplayMessages();
    }

    if (isChatLoading) {
      getData();
    }
  }, [isChatLoading, id, toast]);

  // load replay messages if available
  async function loadReplayMessages() {
    // setIsNextChatLoading(true);

    console.log("Loading replay messages", messageReplayRef.current);
    console.log("Last read index:", lastReadedRelayIndex.current);
    if (
      messageReplayRef.current &&
      Array.isArray(messageReplayRef.current) &&
      messageReplayRef.current.length > 0
    ) {
      const messages = messageReplayRef.current;
      messages.forEach(async (msg, index) => {
        console.log("messageasdasdad", {
          type: msg.event,
          ...msg.object,
        });

        await handleSocketEvent({
          type: msg.event,
          ...msg.object,
        });
      });
    }

    // replay

    try {
      const replayStreamRes = await replayStream(
        id,
        parseInt(lastReadedRelayIndex.current) || 0,
      );
      console.log("Replay stream response 2:", replayStreamRes);

      const reader = replayStreamRes.body.getReader();
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
              else if (line.startsWith("id:"))
                continue; // Ignore id lines
              else if (line.startsWith("data:"))
                dataStr += line.replace("data:", "").trim();
            }
            let data = {};
            try {
              data = JSON.parse(dataStr);
              console.warn(data, " parsed data");
            } catch {
              data = { content: dataStr };
            }
            handleSocketEvent({ type: eventType, ...data });
          }
        }
      };

      await processStream();
    } catch (error) {
      console.error("Error loading replay messages:", error);
      setIsError(true);
      setErrorMessage(
        "An error occurred while loading replay messages. Please try again.",
      );
    }
  }

  // catch the error and set the error in conversation
  useEffect(() => {
    if (isError) {
      setToLastAiMessage({
        isError: true,
        errorMessage: errorMessage || "An error occurred during the chat.",
      });
      console.warn("Error in chat:", errorMessage);
    }
  }, [isError, errorMessage]);

  // --- Helper Functions ---
  const newAiMessage = (kind = "quick") => ({
    role: "ai",
    type: kind, // "simulation" | "quick"
    isStreaming: kind !== "simulation",
    isComplete: kind === "simulation",
    message: kind === "simulation" ? [{ type: "simulation", items: [] }] : [],
    tempContent: "", // streaming buffer
    cot: "",
    isOpen: false,
  });

  const newHumanMessage = ({ prompt, isRetry = false }) => ({
    role: "human",
    message: prompt,
    isRetry: isRetry,
  });

  // function that set the response when streaming the latest response
  const appendChunk = (msg, chunk) => {
    console.log(msg, chunk, "asdlhjaskdlh09123");
    msg.tempContent += chunk;
    msg.isStreaming = true;
    msg.message = processStreamingContent(msg.tempContent);
  };

  const completeStreaming = (msg) => {
    msg.isStreaming = false;
    msg.isComplete = true;
    delete msg.tempContent;
  };

  const setToLastAiMessage = (item) => {
    setConversation((prev) => {
      const conv = [...prev];
      let last = conv[conv.length - 1];
      if (last && last.role === "ai" && typeof item == "object") {
        Object.keys(item).forEach((key) => {
          if (item[key] !== undefined) {
            last[key] = item[key];
          }
        });
      }
      return conv;
    });
  };

  const convesationCleanup = () => {
    setIsChatLoading(false);
    setIsNextChatLoading(false);
    setCurrConversationId(null);
    setIsAborting(false);
    setCurrLoadingStatus("");
    isAboartController.current = null;
    agentCitationsRef.current = [];
    searchCitationsRef.current = [];
  };

  const handleSocketEvent = async (event) => {
    console.log(event, "socket event received");

    if (event.type === "loadingStatus") {
      setCurrLoadingStatus(event.status || "Thinking . . .");
      return;
    }

    setConversation((prev) => {
      const conv = [...prev];
      let last = conv[conv.length - 1];

      /* 1. swarmId → create simulation block */
      if (event.type === "swarmId") {
        getPersonaById(event.swarmId).then(({ output }) => {
          const simItems = processStreamingContent(output).flatMap(
            (d) => d.items,
          );

          setConversation((prevConv) => {
            console.log("🔄 Updating conversation...");
            const convCopy = [...prevConv];
            let lastSim = convCopy[convCopy.length - 1];

            console.log("📌 Last message before update:", lastSim);

            const isLastMessageSimulation =
              lastSim &&
              lastSim.type === "simulation" &&
              Array.isArray(lastSim.message) &&
              lastSim.message.length > 0 &&
              lastSim.message[0]?.type === "simulation";

            console.log(
              "✅ Is last message a simulation?",
              isLastMessageSimulation,
            );

            if (!isLastMessageSimulation) {
              console.log("➕ Creating new simulation message");
              lastSim = newAiMessage("simulation");
              convCopy.push(lastSim);
            }

            if (!lastSim.message || lastSim.message.length === 0) {
              console.log("🆕 Initializing message array");
              lastSim.message = [{ type: "simulation", items: [] }];
            }

            // ✅ Ensure simItems is an array
            const simArray = Array.isArray(simItems) ? simItems : [simItems];

            // 🚨 Track incoming items
            console.log("📥 Incoming simItems:", simArray);

            // ✅ Filter invalid entries
            const validItems = simArray.filter((item, index) => {
              const isValid = item !== undefined && item !== null;
              if (!isValid) {
                console.warn(
                  `⚠️ Item at index ${index} is invalid (filtered out):`,
                  item,
                );
              }
              return isValid;
            });

            console.log("✅ Valid items after filtering:", validItems);

            lastSim.message[0].items.push(...validItems);

            console.log("📤 Updated conversation message:", lastSim.message);

            return convCopy;
          });
        });
        return prev;
      }

      /* 2. finalResponse → streaming message */
      if (event.type === "finalResponse" && event.content) {
        if (isAboartController.current) return;
        if (!last || last.type !== "quick") {
          last = newAiMessage("quick");
          conv.push(last);
        }
        last.agenticCitations = agentCitationsRef.current || [];
        if (searchCitationsRef.current !== last?.citations || []) {
          last.citations = searchCitationsRef.current || [];
        }
        if (
          last?.agentCitations &&
          agentCitationsRef.current !== last?.agentCitations
        ) {
          last.agenticCitations = agentCitationsRef.current || [];
        }
        if (last.isOpen) last.isOpen = false;
        appendChunk(last, event.content);
        setIsNextChatLoading(true);

        // TTS will be handled by useEffect when message is completed

        return conv;
      }

      /* 3. finish → mark last complete */
      if (event.type === "finish") {
        console.log(last.citations, "last citations");
        if (last) {
          completeStreaming(last);

          // TTS will be handled by useEffect when message is completed
        }
        convesationCleanup();
        return conv;
      }

      /* 4. searchUrls → attach citations to last */
      if (event.type === "searchUrls") {
        searchCitationsRef.current = [
          ...(searchCitationsRef.current || []),
          ...(event.urls || []),
        ];

        console.log("got search urls", searchCitationsRef.current);
        return conv;
      }

      /* 5. nextThought → add thought to last if open */
      if (event.type === "nextThought") {
        if (!last || last.type !== "quick") {
          last = newAiMessage("quick");
          conv.push(last);
        }
        if (last) {
          console.log("last thought", last, event);
          if (!last.isOpen) last.isOpen = true;
          last.cot = (last.cot || "") + (event.nextThought || "");
        }
        return conv;
      }

      if (event.type == "conversationId") {
        if (!isNextChatLoading) {
          setIsNextChatLoading(true);
        }
        setCurrConversationId(event.conversationId);
      }

      if (event.type == "successAbort") {
        if (last) completeStreaming(last);
        setIsNextChatLoading(false);
        setIsChatLoading(false);
        setIsAborting(false);
        last.isAbortManually = true;
      }
      // agentic citation
      if (event.type == "agenticCitation") {
        agentCitationsRef.current = event.agentCitations;
        console.log(event.agentCitations, "agentic citations");
      }
      return conv; // default return if no match
    });

    /* 6. Error & flag handlers */
    if (event.type == "error") {
      console.error("Error event received:", event);
      setIsError(true);
      convesationCleanup();
      return;
    }

    if (event.type === "exploitationFlag") {
      if (event.userBan) setIsUserBanned(true);
      else if (event.sessionBan) setIsSessionExploited(true);
    }
  };

  // persers.
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
        regex: /<dataChart>([\s\S]*?)<\/dataChart>/gi,
        handler: (m, start, end) => {
          let inner = m[1].trim();

          const extractTag = (tag, source) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
            const match = regex.exec(source);
            return match ? match[1].trim() : null;
          };

          const chartType = extractTag("chartType", inner);
          const dataId = extractTag("dataId", inner);
          const dataName = extractTag("dataName", inner);
          const dataLabel = extractTag("dataLabel", inner);

          return {
            type: "chart",
            chartType,
            dataId,
            dataName,
            dataLabel,
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
          const rawContent = m[1].trim();

          // Important: Don't use m[1] directly for parsing — use rawContent + manually remove tail
          const parsed = parseAgentBlock(
            rawContent.replaceAll("<visual>", "").replaceAll("</visual>", ""),
          );
          return {
            type: "persona",
            ...parsed,
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "realtime",
        regex: /<realtime>([\s\S]*?)<\/realtime>/gi,
        handler: (m, start, end) => {
          const inner = m[1].trim();

          const extractTag = (tag, source) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
            const match = regex.exec(source);
            return match ? match[1].trim() : null;
          };

          return {
            type: "realtime",
            ticker: extractTag("ticker", inner),
            assetType: extractTag("type", inner),
            generalName: extractTag("generalName", inner),
            isComplete: true,
            start,
            end,
          };
        },
      },

      {
        type: "vectorStoreJob",
        regex: /<newVectorStoreJob>([\s\S]*?)<\/newVectorStoreJob>/gi,
        handler: (m, start, end) => {
          const rawContent = m[1].trim();

          // Extract values from XML-style tags manually
          const vsIdMatch = rawContent.match(/<vsId>([\s\S]*?)<\/vsId>/i);
          const taskMatch = rawContent.match(/<task>([\s\S]*?)<\/task>/i);
          const nameMatch = rawContent.match(/<name>([\s\S]*?)<\/name>/i);

          return {
            type: "vectorStoreJob",
            vsId: vsIdMatch?.[1]?.trim() || null,
            task: taskMatch?.[1]?.trim() || null,
            name: nameMatch?.[1]?.trim() || "Vector Store Scrapper",
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "urlScraper",
        regex: /<urlScraper>([\s\S]*?)<\/urlScraper>/gi,
        handler: (m, start, end) => {
          const inner = m[1].trim();

          const extractTag = (tag, source) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
            const match = regex.exec(source);
            return match ? match[1].trim() : null;
          };

          return {
            type: "urlScraper",
            jobId: extractTag("jobid", inner),
            name: extractTag("name", inner),
            numOfUrls: extractTag("numOfUrls", inner),
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "osintInstance",
        regex: /<newOsintInstance>([\s\S]*?)<\/newOsintInstance>/gi,
        handler: (m, start, end) => {
          const inner = m[1].trim();

          const extractTag = (tag, source) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
            const match = regex.exec(source);
            return match ? match[1].trim() : null;
          };

          return {
            type: "osintInstance",
            name: extractTag("name", inner) || "OSINT Instance",
            osintWorkflowId: extractTag("osintWorkflowId", inner),
            isComplete: true,
            start,
            end,
          };
        },
      },
      // ── Omni-Resilience block ──────────────────────────────────────────────────────
      {
        type: "omni",
        regex: /<Omni>([\s\S]*?)<\/Omni>/gi,
        handler: (m, start, end) => {
          const inner = m[1].trim();

          // Helper to extract any tag
          const extractTag = (tag, source = inner) => {
            const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
            const match = re.exec(source);
            return match ? match[1].trim() : null;
          };

          // Parse <shortTerm> or <longTerm> sections
          const parseHorizon = (horizonTag) => {
            const section = extractTag(horizonTag);
            if (!section) return null;

            const metrics = {};
            const tagRe = /<(\w+)>([\s\S]*?)<\/\1>/g;
            let match;
            while ((match = tagRe.exec(section))) {
              metrics[match[1]] = match[2].trim();
            }
            return metrics;
          };

          return {
            type: "omni",
            ticker: extractTag("ticker"),
            assetType: extractTag("type"),
            shortTerm: parseHorizon("shortTerm"),
            longTerm: parseHorizon("longTerm"),
            summary: extractTag("summary"),
            isComplete: true,
            start,
            end,
          };
        },
      },
      {
        type: "genDoc",
        regex: /<genDoc>([\s\S]*?)<\/genDoc>/gi,
        handler: (m, start, end) => {
          const inner = m[1].trim();

          const extractTag = (tag, source) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
            const match = regex.exec(source);
            return match ? match[1].trim() : null;
          };

          return {
            type: "genDoc",
            name: extractTag("name", inner) || "Generated Document",
            genId: extractTag("genId", inner),
            pages: parseInt(extractTag("pages", inner), 10) || 1,
            isComplete: true,
            start,
            end,
          };
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
      return processStreamingContent(content, true);
    } catch (error) {
      console.error("All parsing methods failed for history:", error);
      return [
        {
          type: "text",
          content: "error occured while loading your history" || "",
          isComplete: true,
        },
      ];
    }
  };

  const handleSubmit = useCallback(
    async (prompt, isRetry = false) => {
      console.log("handleSubmit called with prompt:", prompt);
      if (!prompt.trim() || prompt.length == 0 || isNextChatLoading) return;
      scrollToBottom();
      // Remove onScrollDown() call - the hook will handle auto-scrolling

      if (prompt.length > 30000) {
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

      // clear the input box and store the previous prompt seperatly
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
        intentModel: selectedModel,
      };

      // Reset state
      setConversation((prev) => [
        ...prev,
        newHumanMessage({
          prompt: prompt,
          isRetry,
        }),
        newAiMessage("quick"),
      ]);

      try {
        let response = await SSEChatCall(payload, refreshAccessToken);
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        // Start inactivity check
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

              handleSocketEvent({ type: eventType, ...data });
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
      selectedModel,
    ],
  );

  // Update the ref whenever handleSubmit changes
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
    console.log(
      "handleSubmitRef updated, function available:",
      typeof handleSubmit === "function",
    );
  }, [handleSubmit]);

  const lastContent = useRef("");

  const onRetry = useCallback(() => {
    const lastHumanMessage = [...conversation]
      .reverse()
      .find((item) => item.role === "human");

    if (!lastHumanMessage) return;

    lastContent.current = lastHumanMessage.message;

    setConversation((prev) => {
      const lastIndex = prev.lastIndexOf(lastHumanMessage);
      if (lastIndex === -1) return prev;

      const updated = [...prev];
      updated.splice(lastIndex, 1); // remove last human message

      // If the next message (same index due to splice) is from AI, remove it too
      if (updated[lastIndex]?.role === "ai") {
        updated.splice(lastIndex, 1);
      }

      return updated;
    });

    isRetryTrigger.current = true;
  }, [conversation]);

  const onAbort = useCallback(async () => {
    setIsAborting(true);

    try {
      const conversationId = currConversationId;

      if (!conversationId) {
        toast({
          title: "Error Stopping Response",
          description: "No Current Conversation Loading",
          variant: "destructive",
        });
      }

      const abort = await abortSSEChat(conversationId);

      if (abort.success) {
        convesationCleanup();
      } else {
        setIsError(true);
        setErrorMessage(
          abort.message || "An error occurred while stopping the response.",
        );
      }
    } catch (error) {
      console.error("Error during abort:", error);
      toast({
        title: "Abort Error",
        description: error.message,
        variant: "destructive",
      });

      setIsError(true);
      setErrorMessage("Can't Stop Response" + error.message);
    }
  }, [currConversationId]);

  useEffect(() => {
    if (isError && isRetryTrigger.current) {
      isRetryTrigger.current = false;
      const lastHumanMessageContent = lastContent.current;
      // setPrompt(lastHumanMessageContent);
      setTimeout(() => {
        if (typeof handleSubmitRef.current === "function") {
          handleSubmitRef.current(lastHumanMessageContent, true);
        }
      }, 0);
      setIsNextChatLoading(true);
      setIsError(false);
      setErrorMessage("");
    }
  }, [conversation]);

  const conversationRef = useRef(conversation);
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    if (isChatLoading == false) {
      scrollToBottom();
    }
  }, [isChatLoading]);

  useEffect(() => {
    // Get the last AI message that was just completed
    const lastMessage = conversation[conversation.length - 1];

    if (
      lastMessage &&
      lastMessage.role === "ai" &&
      lastMessage.isComplete &&
      !lastMessage.isStreaming &&
      !lastMessage._ttsProcessed
    ) {
      // Prevent duplicate processing

      console.log("🗣️ Detected completed AI message, triggering TTS");

      // Mark as processed to prevent duplicate TTS
      lastMessage._ttsProcessed = true;

      // Trigger TTS for the completed message
    }
  }, [conversation]);

  // --- UI Render hook boundary ---
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
      {/* Drag and Drop Overlay */}
      {isDragActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white/10 backdrop-blur-md border-2 border-dashed border-blue-300 rounded-xl p-8 max-w-md mx-4 text-center">
            <Upload className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Drop files to upload
            </h3>
            <p className="text-blue-200 text-sm">
              Drop your files anywhere to add them to this conversation
            </p>
            <div className="mt-4 text-xs text-blue-300">
              Supported: PDF, TXT, DOCX, XLSX, PPTX, MD, CSV
            </div>
          </div>
        </div>
      )}

      <Conversation
        conversation={conversation}
        isNextChatLoading={isNextChatLoading}
        id={id}
        handleBlockSidebar={memoizedHandleBlockSidebar}
        renderMermaidChart={memoizedRenderMermaidChart}
        handleMaterialSidebar={memoizedHandleMaterialSidebar}
        handleVectorStoreSidebar={memoizedHandleVectorStoreScrapperSidebar}
        handleUrlScraperSidebar={memorizedHandleUrlScraperSidebar}
        handleGeneratedDocSidebar={memorizedGeneratedDocumentBlockSidebar}
        loadingMessage={currLoadingStatus}
        chatContainerRef={chatContainerRef}
        endRef={endRef}
        isError={isError}
        setIsError={setIsError}
        errorMessage={errorMessage}
        onRetry={onRetry}
        handleSubmit={handleSubmit}
      />

      <div className="w-full sticky bottom-0  mb-2 flex items-center justify-center">
        <div className="max-w-4xl  w-full mx-auto">
          <ChatInput
            conversationProp={conversationRef}
            setConversation={setConversation}
            input={prompt}
            setInput={setPrompt}
            handleSubmit={() => handleSubmit(prompt)}
            isLoading={isNextChatLoading}
            onScrollToBottom={scrollToBottom}
            onAbort={onAbort}
            isAborting={isAborting}
            currConversationId={currConversationId}
            processingFiles={processingFiles}
            isVoiceMode={isVoiceMode}
            setIsVoiceMode={setIsVoiceMode}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(Chat);
