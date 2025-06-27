import {
  ArrowDownToDot,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  AudioLines,
  AudioWaveform,
  BrainCog,
  Camera,
  ChevronDown,
  ChevronUp,
  CircleFadingPlus,
  CirclePause,
  DiamondPlus,
  FileText,
  Flame,
  Grid2x2,
  Layers2,
  Loader2,
  LoaderCircle,
  MonitorUp,
  Paperclip,
  RotateCcw,
  Sparkles,
  SquareDashed,
  Target,
  TriangleAlert,
  Unplug,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { memo, useEffect, useRef, useState, useCallback } from "react";
import { _useSidebar } from "../../context/SidebarContext";
import FileUploadDialog from "./file-upload-dialog/file-upload-dialog";
import { useFilesUploadMetadata } from "../../context/FilesUploadMetadata";
import AudioRecorder from "./audio-input/AudioRecorder";
import { useLocation, useParams } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "../../context/UserContext";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../ui/button";
import { useDomain } from "@/context/WhichDomainContext";
import { getPromptEnhancerApi } from "@/services/n8n-apis/_core/getPromptEnhancer.api";
import { useWorkflow } from "../../context/WorkflowContext";
import createUserSavedWorflow from "@/services/user-saved-workflow-apis/createUserSavedWorflow";
import { debounce } from "lodash";
import SelectedCollectionsDisplay from "./SelectedCollectionsDisplay";
import InternalKnowledgeDialog from "./InternalKnowledgeDialog";
import { useCollection } from "../../context/CollectionContext";
const maxRows = 30;

function ChatInput({
  conversationProp = [],
  input,
  setInput,
  handleSubmit,
  isLoading,
  onScrollToBottom = () => {},
  onAbort,
  isAborting,
  currConversationId,
  processingFiles = new Set(),
  onVoiceModeToggle,
  isVoiceMode = false,
}) {
  const { isPublicDomain, domainState } = useDomain();
  const { id } = useParams();
  const { pathname } = useLocation();
  const { fileCount, memorizedFiles, resetAllStates, files } =
    useFilesUploadMetadata();
  const {
    isSwarmMode,
    setIsSwarmMode,
    isAutoSwarmContextState,
    setIsAutoSwarmContextState,
    isDeepThinkMode, // Use context state
    setIsDeepThinkMode, // Use context setter
  } = useUser();
  // component states
  const [rows, setRows] = useState(5);
  // TODO: use isToolBoxOpen and create option to select superior persona
  const [isToolBoxOpen, setIsToolBoxOpen] = useState(false);
  const [isTransribed, setIsTransribed] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPromptEnhancerLoading, setIsPromptEnhancerLoading] = useState(false);
  const [isPromptEnchanced, setIsPromptEnhanced] = useState(false);
  const [prevUnenchancedPrompt, setPrevUnenchancedPrompt] = useState("");
  // Add a ref to track if input is being set by enhancer API
  const isEnhancerApiUpdateRef = useRef(false);
  const { toggleCollectionSelection, getSelectedCollections } = useCollection();
  const selectedCollections = getSelectedCollections();

  // Get only the necessary workflow states from context
  const {
    selectedWorkflowId,
    workflowList,
    setWorkflowList,
    getSelectedWorkflow,
    setSelectedWorkflowId,
  } = useWorkflow();

  // Move remaining workflow states here to prevent unnecessary rerenders
  const [workflowPrompt, setWorkflowPrompt] = useState("");
  const [isWorkflowCreatorLoading, setIsWorkflowCreatorLoading] =
    useState(false);
  const [recentlyCreatedWorkflowResponse, setRecentlyCreatedWorkflowResponse] =
    useState({});
  const [hovered, setHovered] = useState(false);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (pathname.startsWith("/chat")) {
      setRows(2);
    }
  }, [pathname]);

  // Memoize the heavy function to prevent recreation on each render
  const handleCreateNewWorkflow = useCallback(async () => {
    // Debug: Log all relevant variables before try
    try {
      // Use default values if missing
      const conversation =
        conversationProp && Array.isArray(conversationProp.current)
          ? conversationProp.current
          : [];
      const safeUser = user || {};
      const safeUserId = safeUser.id || "unknown-user";
      const safeWorkflowPrompt =
        typeof workflowPrompt === "string" ? workflowPrompt : "";

      if (!safeUserId || conversation.length === 0) {
        toast({
          title: "Error",
          description:
            "Please ensure you have a conversation, and personas selected before creating a new workflow.",
          variant: "destructive",
        });
        return;
      }
      setIsWorkflowCreatorLoading(true);
      let nextId = 1;
      const agents = conversation
        .reduce((acc, msg) => {
          if (!msg || msg.role !== "ai" || !msg.message) return acc;
          const simulationBlocks = Array.isArray(msg.message)
            ? msg.message.filter((b) => b && b.type === "simulation")
            : [];
          simulationBlocks.forEach((block) => {
            if (block && Array.isArray(block.items)) {
              block.items.forEach((item) => {
                acc.push({
                  id: nextId++,
                  name: item?.title || "Untitled",
                  description: item?.goal ?? "",
                });
              });
            }
          });
          return acc;
        }, [])
        .slice(0, 80);
      const allUserPrompt = conversation.reduce((acc, curr) => {
        if (curr && curr.role === "human" && curr.message) {
          acc.push(curr.message);
          return acc;
        }
        return acc;
      }, []);
      // Debug: Log constructed workflow object
      const newWorkflow = {
        userInput: allUserPrompt,
        agents: agents,
        userPrompt: safeWorkflowPrompt,
        userId: safeUserId,
      };
      const resp = await createUserSavedWorflow(newWorkflow);
      setRecentlyCreatedWorkflowResponse(resp.data);
      setWorkflowList((prev) => [
        ...prev,
        {
          ...resp.data,
        },
      ]);
    } catch (error) {
      // Improved error logging
      console.error("Error creating new workflow:", error);
      toast({
        title: "Error",
        description: `Failed to create new workflow: ${error && error.stack ? error.stack : error}`,
        variant: "destructive",
      });
    } finally {
      setIsWorkflowCreatorLoading(false);
    }
  }, [conversationProp, user, workflowPrompt, toast]);

  // Memoize the prompt enhancer function
  const enchancePrompt = useCallback(async () => {
    try {
      setPrevUnenchancedPrompt(input);
      setIsPromptEnhancerLoading(true);

      if (!input || input.length < 5) {
        throw new Error("Please enter a valid prompt.");
      } else if (isPromptEnchanced) {
        toast({
          title: "Prompt Already Enhanced",
          description: `Please enter a new prompt to enhance`,
          variant: "destructive",
        });
        return;
      }

      const getPromptEnhanced = await getPromptEnhancerApi(input);
      isEnhancerApiUpdateRef.current = true;
      setInput(getPromptEnhanced);
      setIsPromptEnhanced(true);
      setRows(13);
    } catch (error) {
      toast({
        title: "Error",
        description: `Something went wrong while enhancing the prompt : ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsPromptEnhancerLoading(false);
    }
  }, [input, isPromptEnchanced, toast]);

  // Memoize the undo function
  const onUndoPromptEnhance = useCallback(() => {
    isEnhancerApiUpdateRef.current = true;
    setInput(prevUnenchancedPrompt);
    setIsPromptEnhanced(false);
    setPrevUnenchancedPrompt("");
    toast({
      title: "Prompt Enhancement Reverted",
      description: `The prompt has been reverted to its original state.`,
      variant: "default",
    });
  }, [prevUnenchancedPrompt, toast]);

  // Create a debounced version of handleChange
  const debouncedHandleChange = useCallback(
    debounce((value, rows) => {
      setInput(value);
      setRows(rows);
    }, 10), // Small delay to batch updates
    [],
  );

  const handleChange = useCallback(
    (event) => {
      const textareaLineHeight = 24;
      const previousRows = event.target.rows;
      event.target.rows = 1; // reset number of rows in textarea

      const currentRows = Math.floor(
        event.target.scrollHeight / textareaLineHeight,
      );

      const newRows = currentRows < maxRows ? currentRows : maxRows;

      // Set rows immediately for a responsive feel
      if (event.target.value.length < 5) {
        event.target.rows = 1;
      } else if (currentRows === previousRows) {
        event.target.rows = currentRows;
      } else if (currentRows >= maxRows) {
        event.target.rows = maxRows;
        event.target.scrollTop = event.target.scrollHeight;
      } else {
        event.target.rows = newRows;
      }

      // Debounce the state updates to avoid triggering re-renders too frequently
      debouncedHandleChange(event.target.value, newRows);
    },
    [debouncedHandleChange],
  );
  const getVoiceAgentUrl = useCallback(
    (baseUrl) => {
      if (!baseUrl) return "";

      if (files.length === 0) {
        return id && id !== undefined ? `${baseUrl}?namespace=${id}` : baseUrl;
      }

      return `${baseUrl}?documentCount=${fileCount}&memorizedCount=${memorizedFiles.length}&fileNames=${files
        .slice(0, 20)
        .map((file) => file.name)
        .join("||||")}&namespace=${id || ""}`;
    },
    [files, fileCount, memorizedFiles, id],
  );
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (input.length > 30000) {
          toast({
            title: "Please Make Your Input Prompt Shorter.",
            description: `Input length exceeded 30000 Character! Current length: ${input.length}`,
            variant: "destructive",
          });
          return;
        }
        if (input.length > 0 && !isLoading) {
          setRows(1); // Reset rows to 1 when submitting
          handleSubmit();
        }
      } else if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        const cursorPosition = event.target.selectionStart;
        const textBeforeCursor = input.substring(0, cursorPosition);
        const textAfterCursor = input.substring(cursorPosition);
        setInput(textBeforeCursor + "\n" + textAfterCursor);
        setRows(rows + 1);
      }
    },
    [input, isLoading, handleSubmit, rows, toast],
  );

  // clean up on route change
  useEffect(() => {
    if (pathname.includes("/dashboard")) {
      resetAllStates();
    }
  }, [pathname]);

  useEffect(() => {
    if (isPublicDomain) {
      setIsAutoSwarmContextState(true);
    }
  }, [isPublicDomain]);

  // Memoize modal controls
  const handleWorkflowModalChange = useCallback(
    (value) => {
      if (value == false && isWorkflowCreatorLoading == true) {
        toast({
          title: "Please Wait While ARX Create Workflow...",
          variant: "destructive",
        });
      } else {
        setWorkflowModalOpen(value);
      }
    },
    [isWorkflowCreatorLoading, toast],
  );

  // Optimize SwarmMode toggle with useCallback
  const toggleSwarmMode = useCallback(() => {
    setIsSwarmMode((prev) => {
      const newState = !prev;
      return newState;
    });
    setIsToolBoxOpen((prev) => !prev);
  }, []);

  const AttachmentCard = ({
    title = "",
    type = "",
    icon = () => {},
    showIsRemove = true,
    onRemove = () => {},
    isProcessing = false,
  }) => {
    return (
      <div className="flex mt-3 items-center rounded-2xl justify-between mb-2 w-fit bg-slate-800">
        <div className="p-2 pl-3">
          {isProcessing ? (
            <LoaderCircle className="w-5 h-5 text-blue-400 animate-spin" />
          ) : (
            icon
          )}
        </div>
        <div className="flex items-center gap-2 py-2 pr-4">
          <span className="text-white text-xs h-full min-w-max">
            {title}
            <p className={`text-slate-400 ${isProcessing ? "opacity-70" : ""}`}>
              {isProcessing ? "Processing..." : type}
            </p>
          </span>
        </div>
        {showIsRemove && !isProcessing && (
          <Button
            variant="outline"
            size="sm"
            className="bg-slate-800 rounded-xl p-2 m-2 hover:bg-slate-700 text-white"
            onClick={onRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  useEffect(() => {
    console.log(selectedCollections, "Selected Collections in ChatInput");
  }, []);
  const handleClick = useCallback(() => {
    console.log("Click:", { isLoading, currConversationId, isAborting });

    if (isLoading && currConversationId && !isAborting) {
      console.log("Calling onAbort");
      onAbort();
    } else {
      console.log("Calling handleSubmit");
      handleSubmit();
    }
  }, [isLoading, currConversationId, isAborting, onAbort, handleSubmit]);

  // More efficient method to prepare URL for voice agents - memoized to avoid recalculation
  return (
    <div className="relative ">
      {pathname !== "/dashboard" && (
        <div className="w-full absolute -top-14 flex justify-end items-center">
          <div
            onClick={onScrollToBottom}
            className="m-2 rounded-full border p-2 border-slate-600 cursor-pointer hover:bg-slate-700"
          >
            <ArrowDownToDot className="text-gray-500 w-5 h-5" />
          </div>
        </div>
      )}
      <div className="flex w-full flex-col animate-fade-in ">
        {/* {isReconnectionNeeded && (
          <div className="mb-2 font-semibold text-lg rounded-xl border-blue-900 border-2 bg-blue-300 flex items-center p-2 justify-between">
            <div className="flex gap-2 text-black max-w-lg">
              <Unplug />
              <div className="flex items-center justify-center flex-col text-[16px]">
                <p>Connection lost. Please reconnect.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setIsReconnectionNeeded(false);
                }}
                size="sm"
              >
                <div className="flex gap-2">
                  <X />
                  <p>Close</p>
                </div>
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="destructive"
                size="sm"
                className="bg-blue-900 hover:bg-blue-500"
              >
                <div className="flex gap-2">
                  <RotateCcw />
                  <p>Reconnect</p>
                </div>
              </Button>
            </div>
          </div>
        )} */}
        {/* {isError && (
          <div className="mb-2 font-semibold text-lg rounded-xl border-red-900 border-2 bg-red-300 flex items-center p-2 justify-between">
            <div className="flex gap-2 text-black max-w-lg">
              <TriangleAlert />
              <div className="flex items-center justify-center flex-col text-[16px]">
                <p>{errorMessage || "Something Went Wrong!!"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setIsError(false);
                }}
                size="sm"
              >
                <div className="flex gap-2">
                  <X />
                  <p>Close</p>
                </div>
              </Button>
              <Button onClick={onRetry} variant="destructive" size="sm">
                <div className="flex gap-2">
                  <RotateCcw />
                  <p>Retry</p>
                </div>
              </Button>
            </div>
          </div>
        )} */}

        <div
          className={`rounded-3xl p-2 hide-scrollbar bg-gray-900 
  ${isSwarmMode ? "border-2 border-blue-500 glow-outline-soft" : ""}
`}
        >
          <motion.div
            className={`relative flex items-center `}
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: 1,
              y: -10,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="flex gap-2 items-center overflow-x-auto scroll-smooth hide-scrollbar flex-nowrap">
              {files.length > 0 &&
                files.map((file, index) => {
                  const isVectorized = memorizedFiles.includes(file.name);

                  return (
                    <AttachmentCard
                      key={index}
                      title={file.name}
                      type={file.type.replaceAll("application/", "")}
                      icon={<FileText className="w-5 h-5" />}
                      showIsRemove={false}
                      isProcessing={!isVectorized}
                    />
                  );
                })}

              {selectedWorkflowId !== null && selectedWorkflowId > 0 && (
                <AttachmentCard
                  title={getSelectedWorkflow()?.name || "No Workflow Selected"}
                  type="Workflow"
                  icon={<SquareDashed className="w-5 h-5" />}
                  showIsRemove={true}
                  onRemove={() => setSelectedWorkflowId(null)}
                />
              )}

              {selectedCollections.map((collection) => (
                <AttachmentCard
                  key={collection.id}
                  title={collection.collectionName}
                  type="Knowledge Block"
                  icon={<Grid2x2 className="w-5 h-5" />}
                  showIsRemove={true}
                  onRemove={() => toggleCollectionSelection(collection.id)}
                />
              ))}
            </div>
          </motion.div>

          {/* <SelectedCollectionsDisplay /> */}

          <Textarea
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={rows}
            maxRows={maxRows}
            className={`ring-0-0 resize-none border-0 focus:ring-0 focus-visible:ring-0 `}
            type="text"
            placeholder="Type a message"
            id="aiInputTextArea"
          />

          <div className="flex justify-between">
            <div className="flex gap-1 items-center justify-center  ">
              <div className="flex gap-2 rounded-md">
                <AudioRecorder
                  value={input}
                  setValue={setInput}
                  trigger={isTransribed}
                  setTrigger={setIsTransribed}
                />
              </div>
              {pathname !== "/dashboard" ? (
                <FileUploadDialog />
              ) : (
                <div>
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger>
                        <div className="flex items-center rounded-lg p-2 hover:bg-gray-800">
                          <Paperclip className="w-5 h-5  " />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-600 p-2 rounded-md">
                        <p className="capitalize">
                          Please First Start The Conversation to get the
                          Document Upload Section (Start By Saying Hello Or Hi!)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {/* Favorite - Now represents workflow */}
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger
                    asChild
                    className={`${pathname == "/dashboard" && "hidden"}`}
                  >
                    <div
                      onMouseEnter={() => setHovered(true)}
                      onMouseLeave={() => setHovered(false)}
                      onClick={() => setWorkflowModalOpen(true)}
                      className={`relative flex items-center justify-end cursor-pointer px-2 py-1 rounded-md hover:bg-gray-800 `}
                    >
                      {/* Star (z-10 above text, on right) */}
                      <div className="z-10">
                        <CircleFadingPlus
                          className={`w-5 h-5 ${
                            selectedWorkflowId ? "text-white " : "text-white"
                          } drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]`}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm text-center ">
                    <p>Transform This Conversationg Into Workflow</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* chat mode */}
              <InternalKnowledgeDialog />

              <div
                className={`${isSwarmMode ? "hidden" : "flex"} gap-2 rounded-md`}
              >
                <DropdownMenu
                  open={open}
                  onOpenChange={(val) => {
                    setOpen(val);
                  }}
                >
                  <DropdownMenuTrigger className="p-2 text-slate-300 text-sm items-center border-0 ring-0 hover:bg-slate-800 rounded-md px-3 py-1 focus:ring-0 focus:ring-transparent focus:ring-offset-0 flex gap-2 ">
                    {
                      !isDeepThinkMode ? "Quick Response" : "Deep Thinking" // Use context state
                    }
                    {open ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronUp className="w-5 h-5" />
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="p-0">
                    {/* Quick Response Option */}
                    <div className="flex flex-col divide-y divide-[#2a3042]">
                      <div
                        className="flex items-start gap-3 py-3 px-4 cursor-pointer bg-slate-800 hover:bg-[#252b3b]"
                        onClick={() => {
                          setIsDeepThinkMode(false); // Set context state
                          setOpen((prev) => !prev);
                        }}
                      >
                        <div className="mt-1">
                          <Flame className="text-white w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[15px] text-[#e6e9f0]">
                              Quick response
                            </span>
                            <span className="text-xs text-[#8b93a7]">
                              2-3 sec
                            </span>
                          </div>
                          <span className="text-xs text-[#8b93a7] mt-0.5">
                            Best for everyday conversation
                          </span>
                        </div>
                        <div className="ml-auto mt-1">
                          {!isDeepThinkMode ? ( // Check context state
                            <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center"></div>
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-gray-600 flex items-center justify-center"></div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Deep Think Option */}
                    <div className="flex flex-col divide-y divide-[#2a3042]">
                      <div
                        className="flex items-start gap-3 py-3 px-4 cursor-pointer bg-slate-800 hover:bg-[#252b3b]"
                        onClick={() => {
                          setIsDeepThinkMode(true); // Set context state
                          setOpen((prev) => !prev);
                        }}
                      >
                        <div className="mt-1">
                          <BrainCog className="text-white w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[15px] text-[#e6e9f0]">
                              Deep Think & Executor
                            </span>
                            <span className="text-xs text-[#8b93a7]">
                              45s - 2m
                            </span>
                          </div>
                          {/* TODO: Update description if needed */}
                          <span className="text-xs text-[#8b93a7] mt-0.5">
                            Best for complex tasks & analysis
                          </span>
                        </div>
                        <div className="ml-auto mt-1">
                          {isDeepThinkMode ? ( // Check context state
                            <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center"></div>
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-gray-600 flex items-center justify-center"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div
                className={` ${isSwarmMode && !isPublicDomain ? "flex" : "hidden"} gap-2 rounded-md`}
              >
                <div className="relative flex items-center gap-2 ml-2">
                  {/* Auto Button */}
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger>
                        <button
                          onClick={() => setIsAutoSwarmContextState(true)}
                          className="flex   items-center gap-1 px-1 py-1 text-white"
                        >
                          <Target className="w-4 h-4" />
                          <span className="text-sm font-medium">Auto</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="border border-slate-400 max-w-sm text-center">
                        <p>
                          In Auto mode you don't have to manually select the
                          superior persona for agentic simulation. ARXS will
                          create the agents based on your query
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Manual Button */}
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger>
                        <button
                          onClick={() => setIsAutoSwarmContextState(false)}
                          className="flex items-center gap-1 px-1 py-1 text-white"
                        >
                          <Layers2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Manual</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="border border-slate-400 max-w-sm text-center">
                        <p>
                          In manual mode you have to manually select the
                          superior persona for agentic simulation
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Animated Glowing Dash */}
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute bottom-0 h-[3px] w-[60px] rounded-full 
                                        bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 
                                        shadow-[0_0_8px_#c084fc] mt-2"
                    style={{
                      left: isAutoSwarmContextState ? "0px" : "75px", // Adjust based on button width + spacing
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-1 items-center">
              <div
                className={`${isPublicDomain && "hidden"} p-2 rounded-md hover:bg-gray-800 cursor-pointer `}
              >
                {isPromptEnchanced ? (
                  <div
                    onClick={onUndoPromptEnhance}
                    className="flex gap-2 items-center"
                  >
                    <ArrowLeftRight className="w-5 h-5 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] z-10" />
                    <p className="text-sm font-semibold text-white">Undo</p>
                  </div>
                ) : isPromptEnhancerLoading ? (
                  <LoaderCircle className="animate-spin w-5 h-5 text-white" />
                ) : (
                  <div onClick={enchancePrompt}>
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger>
                          <div className="cursor-pointer flex gap-2 items-center rounded-md hover:bg-gray-800">
                            <Sparkles className="w-5 h-5 mt-1 text-white" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm text-center">
                          <p>Enhance your Prompt</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
              {
                <div className="flex gap-2 items-center">
                  <div
                    onClick={toggleSwarmMode}
                    className=" rounded-md px-2 cursor-pointer flex gap-2"
                  >
                    {
                      <div className="flex gap-2 font-semibold">
                        <TooltipProvider>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger>
                              <div
                                className={
                                  isSwarmMode
                                    ? "relative w-9 h-9 glow-button backdrop-blur-md border border-blue-400/30 flex items-center justify-center focus:outline-none"
                                    : " w-9 h-9 flex items-center justify-center"
                                }
                              >
                                <DiamondPlus className="w-5 h-5 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)] z-10" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isSwarmMode
                                ? "Go Back To Chat"
                                : "Go To Agentic ARX"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    }
                  </div>

                  {/* TODO: make the dialog where user can check the details for superior persona and selected Interection mode  */}
                </div>
              }
              {/* right side */}

              <div>
                <Dialog>
                  <DialogTrigger>
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger
                          className={`${isPublicDomain ? "hidden" : "flex"}`}
                        >
                          <div className="cursor-pointer gap-2 items-center p-2 rounded-md hover:bg-gray-800 mr-2">
                            <AudioLines className="w-5 h-5" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Use ARX Voice Technology</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl bg-slate-700">
                    <DialogHeader>
                      <DialogTitle className="font-semibold text-white text-2xl">
                        Select Suitable Voice Agent
                      </DialogTitle>
                      <DialogDescription>
                        Choose a voice agent to enhance your conversation
                        experience
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col h-full gap-2 py-2 rounded-md cursor-pointer transition-all">
                      <div
                        onClick={() => {
                          let url = domainState
                            ? import.meta.env.VITE_OPENAI_REALTIME_URL
                            : import.meta.env.VITE_OPENAI_REALTIME_URL2;

                          url =
                            files.length > 0
                              ? `${url}?documentCount=${fileCount}&memorizedCount=${memorizedFiles.length}&fileNames=${files
                                  .slice(0, 20)
                                  .map((file) => file.name)
                                  .join("||||")}&namespace=${id || ""}`
                              : id && id != undefined
                                ? `${url}?namespace=${id}`
                                : url;

                          window.open(url, "_blank");
                        }}
                        className="flex justify-between bg-slate-600 hover:bg-slate-800 p-2 rounded-md transition-all items-center w-full mt-2"
                      >
                        {/* left */}
                        <div className="flex gap-2">
                          {/* image */}
                          <div className="flex items-center px-1 py-1 rounded-md bg-green-400 w-fit">
                            <img
                              src="/small-log.png"
                              alt="Stream Realtime API"
                              className="w-6 h-6 m-1 rounded-md"
                            />
                          </div>
                          {/* content */}
                          <div className="flex flex-col leading-5">
                            <p className="font-semibold text-white">
                              {isPublicDomain
                                ? "Beta Voice Agent"
                                : "ARX Next Voice Agent (Highly Recommended)"}
                            </p>
                            <p className="text-slate-300">
                              {isPublicDomain
                                ? "Beta Can Access Voice • Most Superior And Fast • Automation Features"
                                : "ARX Next Can Access Voice • Most Superior And Fast • Automation Features"}
                            </p>
                          </div>
                        </div>
                        {/* right */}
                        <div className="flex gap-1">
                          <div className="bg-slate-800 rounded-md p-2">
                            <AudioWaveform className="text-white" />
                          </div>
                        </div>
                      </div>
                      <div
                        onClick={() => {
                          const url = domainState
                            ? import.meta.env.VITE_GEMINI_REALTIME_URL
                            : import.meta.env.VITE_GEMINI_REALTIME_URL2;
                          window.open(url, "_blank");
                        }}
                        className={`flex justify-between bg-slate-600 hover:bg-slate-800 p-2 rounded-md transition-all items-center w-full ${domainState ? "flex" : "hidden"}`}
                      >
                        {/* left */}
                        <div className="flex gap-2">
                          {/* image */}
                          <div className="flex items-center px-1 py-1 rounded-md bg-red-400 w-fit">
                            <img
                              src="/small-log.png"
                              alt="Stream Realtime API"
                              className="w-6 h-6 m-1 rounded-md"
                            />
                          </div>
                          {/* content */}
                          <div className="flex flex-col leading-5">
                            <p className="font-semibold text-white">
                              ARX Purle Voice Agent (Coming Soon)
                            </p>
                            <p className="text-slate-300">
                              ARX Pulse Can Access Voice ,Screen And Camara
                              Sharing • Full Version Coming Soon
                            </p>
                          </div>
                        </div>
                        {/* right */}
                        <div className="flex gap-1">
                          <div className="bg-slate-800 rounded-md p-2">
                            <AudioWaveform className="text-white" />
                          </div>
                          <div className="bg-slate-800 rounded-md p-2">
                            <Camera className="text-white" />
                          </div>
                          <div className="bg-slate-800 rounded-md p-2">
                            <MonitorUp className="text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {console.log(
                isAborting,
                input.length === 0,
                isLoading,
                !currConversationId,
                "asdhlk120983",
              )}
              <button
                disabled={isAborting || (isLoading && !currConversationId)}
                onClick={handleClick}
                className={`${
                  isAborting ||
                  input.length === 0 ||
                  (isLoading && !currConversationId)
                    ? "bg-white border-slate-600 hover:bg-gray-300 cursor-not-allowed"
                    : "bg-white hover:bg-slate-300"
                } rounded-2xl p-1 cursor-pointer`}
              >
                {isLoading && (!currConversationId || isAborting) ? (
                  <LoaderCircle className="animate-spin w-5 h-5 m-2 text-black" />
                ) : isLoading && currConversationId && !isAborting ? (
                  <CirclePause className="w-5 h-5 text-black m-2" />
                ) : (
                  <ArrowUp className="text-black font-thin w-5 h-5 m-2" />
                )}
              </button>
            </div>
          </div>
        </div>
        <Dialog
          open={workflowModalOpen}
          onOpenChange={handleWorkflowModalChange}
        >
          <DialogContent className="bg-[#1e2535] text-white border border-slate-700  w-[40%] h-fit max-h-[60%] overflow-y-scroll">
            {/* header */}
            <div>
              <h1 className="font-semibold text-lg">Create Workflow</h1>
              <p className="font-thin text-slate-400">
                Turn this chat into a workflow. AI will review the messages and
                build a new one for you.
              </p>
            </div>
            <hr />
            <div className="font-thin text-slate-300">
              Enter Any Special Request <strong>(optional)</strong>
            </div>
            <Textarea
              className="w-full mb-4"
              placeholder="Enter workflow prompt here..."
              value={workflowPrompt}
              onChange={(e) => setWorkflowPrompt(e.target.value)}
            />
            <Button
              onClick={handleCreateNewWorkflow}
              className="w-full text-white"
            >
              {isWorkflowCreatorLoading ? (
                <div className="flex gap-2 items-center">
                  <Loader2 className="animate-spin w-5 h-5 mr-2 inline-block" />
                  <p>Creating Workflow . . .</p>
                </div>
              ) : (
                <div>Create Workflow</div>
              )}
            </Button>
            {recentlyCreatedWorkflowResponse &&
              Object.keys(recentlyCreatedWorkflowResponse).length > 0 && (
                <div>
                  <div className="bg-slate-800 text-white p-6 max-w-3xl mx-auto rounded">
                    <h2 className="text-xl font-medium mb-1">
                      {recentlyCreatedWorkflowResponse.name}
                    </h2>
                    <p className="text-slate-300 text-sm mb-4">
                      {recentlyCreatedWorkflowResponse.description}
                    </p>

                    <p className="py-2 font-semibold">Workflow</p>
                    <div className="relative">
                      {/* Vertical connecting line */}
                      <div className="absolute left-1 top-3 bottom-0 w-px bg-slate-600 opacity-50"></div>
                      <div className="space-y-6">
                        {recentlyCreatedWorkflowResponse.workflow.map(
                          (step, index) => (
                            <div
                              key={index}
                              className={`relative transition-all duration-500 ease-out h-fit`}
                              style={{ transitionDelay: `${index * 200}ms` }}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-slate-300 mt-0.5 z-10 bg-slate-800 rounded-full">
                                  •
                                </span>
                                <p className="text-slate-100">{step}</p>
                              </div>

                              {/* Simple connector */}
                              {index <
                                recentlyCreatedWorkflowResponse.workflow
                                  .length -
                                  1 && (
                                <div className="absolute left-1 top-5 h-6">
                                  <div className="w-px h-full bg-slate-600 opacity-50"></div>
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {recentlyCreatedWorkflowResponse &&
                      Object.keys(recentlyCreatedWorkflowResponse).includes(
                        "personaList",
                      ) &&
                      recentlyCreatedWorkflowResponse.personaList.length > 0 ? (
                        <div>
                          <p className="py-2 font-semibold mb-2">Agents</p>
                          <ul className="space-y-2">
                            {recentlyCreatedWorkflowResponse.personaList.map(
                              (agent, index) => (
                                <li
                                  key={agent.id}
                                  className="border border-slate-500 p-4 flex gap-2 rounded-md"
                                >
                                  {/* index */}
                                  <p className="">{index}</p>
                                  <div className="border-l-2 border-slate-500 pl-2">
                                    <h4 className="font-semibold text-slate-100">
                                      {agent.name}
                                    </h4>
                                    <p className="text-slate-300">
                                      {agent.description}
                                    </p>
                                  </div>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-slate-300 mt-4">
                          No agents available for this workflow.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </DialogContent>
        </Dialog>
      </div>
      <div className="p-2 bg-black -mt-2"></div>
    </div>
  );
}

export default memo(ChatInput);
