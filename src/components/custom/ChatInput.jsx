import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  AudioWaveform,
  BookHeart,
  BrainCog,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleFadingPlus,
  CircleUserRound,
  DatabaseZap,
  DiamondPlus,
  File,
  Files,
  FileText,
  Flame,
  Globe,
  Layers2,
  Loader2,
  LoaderCircle,
  MonitorUp,
  Paperclip,
  RotateCcw,
  Sparkles,
  SquareDashed,
  SquarePlus,
  Star,
  Target,
  TriangleAlert,
  Unplug,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { _useSidebar } from "../../context/SidebarContext";
import FileUploadDialog from "./file-upload-dialog/file-upload-dialog";
import { useFilesUploadMetadata } from "../../context/FilesUploadMetadata";
import AudioRecorder from "./audio-input/AudioRecorder";
import Player from "./audio-input/Player";
import { useLocation, useParams } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Separator } from "@/components/ui/separator";

import { useToast } from "../../hooks/use-toast";
import { useStackSidebar } from "../../context/StackSidebarContext";
import GroupSuperiorPersonaSection from "./GroupSuperiorPersonaSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";
import { useDomain } from "@/context/WhichDomainContext";
import { getPromptEnhancerApi } from "@/services/n8n-apis/_core/getPromptEnhancer.api";
import { useWorkflow } from "../../context/WorkflowContext";
import createUserSavedWorflow from "@/services/user-saved-workflow-apis/createUserSavedWorflow";
// Add this import for debounce function
import { debounce } from "lodash";
const maxRows = 30;

function ChatInput({
  conversationProp = [],
  isReconnectionNeeded = false,
  setIsReconnectionNeeded = () => {},
  input,
  setInput,
  handleSubmit,
  isLoading,
  isError = false,
  setIsError,
  errorMessage = "Something Went Wrong!!",
  onRetry,
  isReconnecting = false,
  setIsReconnecting,
  isReconnected = false,
  setIsReconnected,
}) {
  const { isPublicDomain, domainState } = useDomain();
  const { id } = useParams();
  const { pathname } = useLocation();
  const {
    fileCount,
    memorizedFiles,
    isMemorizationLoading,
    resetAllStates,
    files,
  } = useFilesUploadMetadata();
  const {
    isDocumentOn,
    setIsDocumentOn,
    isSearchOn,
    setIsSearchOn,
    isVectorBaseOn,
    setIsVectorBaseOn,
    isSuperiorPersonaAttached,
    setIsSuperiorPersonaAttached,

    isSwarmMode,
    setIsSwarmMode,
    isAutoSwarmContextState,
    setIsAutoSwarmContextState,

    selectedSuperiorPersona,
    setSelectedSuperiorPersona,
    isDeepThinkMode, // Use context state
    setIsDeepThinkMode, // Use context setter
  } = useUser();
  const { sidebarStack } = useStackSidebar();
  const isMobile = useIsMobile();
  // component states
  const [fetchSuperiorPersona, setFetchSuperiorPersona] = useState(null);
  const [rows, setRows] = useState(1);
  const [isToolBoxOpen, setIsToolBoxOpen] = useState(false);
  const [isTransribed, setIsTransribed] = useState(false);
  const [isSupDialogOpen, setIsSupDialogOpen] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPromptEnhancerLoading, setIsPromptEnhancerLoading] = useState(false);
  const [isPromptEnchanced, setIsPromptEnhanced] = useState(false);
  const [prevUnenchancedPrompt, setPrevUnenchancedPrompt] = useState("");
  // Add a ref to track if input is being set by enhancer API
  const isEnhancerApiUpdateRef = useRef(false);
  // Add the missing scroll container ref
  const scrollContainerRef = useRef(null);

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

  // Memoize the heavy function to prevent recreation on each render
  const handleCreateNewWorkflow = useCallback(async () => {
    try {
      const conversation = conversationProp.current;
      if (
        !user ||
        !user.id ||
        !conversationProp.current ||
        conversationProp.current.length === 0
      ) {
        console.log(
          !user || !user.id || !conversation || conversation.length === 0,
          "User or conversation is not available",
        );
        toast({
          title: "Error",
          description:
            "Please ensure you have a conversation,  and personas selected before creating a new workflow.",
          variant: "destructive",
        });
        return;
      }
      console.log("Creating new workflow with conversation:", conversation);
      setIsWorkflowCreatorLoading(true);
      let nextId = 1;
      const agents = conversation
        .reduce((acc, msg) => {
          if (msg.role !== "ai") return acc;

          const simulationBlocks = msg.message.filter(
            (b) => b.type === "simulation",
          );
          simulationBlocks.forEach((block) => {
            block.items.forEach((item) => {
              acc.push({
                id: nextId++,
                name: item.title,
                description: item.goal ?? "",
              });
            });
          });
          return acc;
        }, [])
        .slice(0, 80);
      const allUserPrompt = conversation.reduce((acc, curr) => {
        if (curr.role === "human") {
          acc.push(curr.message);
          return acc;
        }
        return acc;
      }, []);
      console.log("Creating new workflow with conversation3:", conversation);

      const newWorkflow = {
        userInput: allUserPrompt,
        agents: agents,
        userPrompt: workflowPrompt,
        userId: user.id,
      };
      console.log(newWorkflow, "New Workflow Data");
      const resp = await createUserSavedWorflow(newWorkflow);
      setRecentlyCreatedWorkflowResponse(resp.data);
      setWorkflowList((prev) => [
        ...prev,
        {
          ...resp.data,
        },
      ]);
      console.log("Creating new workflow with data:", newWorkflow);
    } catch (error) {
      console.error("Error creating new workflow:", error);
      toast({
        title: "Error",
        description: "Failed to create new workflow",
        variant: "destructive",
      });
    } finally {
      setIsWorkflowCreatorLoading(false);
    }
  }, [conversationProp.current, user.id, workflowPrompt, toast]);

  useEffect(() => {
    console.log("Workflow List Updated:", workflowList);
  }, [workflowList]);

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
        if (input.length > 4999) {
          toast({
            title: "Please Make Your Input Prompt Shorter.",
            description: `Input length exceeded 5000 Character! Current length: ${input.length}`,
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

  // Optimize scroll handlers
  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft -= 300;
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += 300;
    }
  }, []);

  // clean up on route change
  useEffect(() => {
    if (pathname.includes("/dashboard")) {
      resetAllStates();
    }
  }, [pathname]);

  // toggler
  useEffect(() => {
    if (isReconnected) {
      setTimeout(() => {
        setIsReconnected(false);
      }, 1500);
    }

    if (isReconnecting) {
      setTimeout(() => {
        setIsReconnecting(false);
      }, 1500);
    }
  }, [isReconnected, isReconnecting]);

  // if public or domain state is false, then set isAutoSwarmContextState to false
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
      console.log("ChatInput - Toggling isSwarmMode to:", newState);
      return newState;
    });
    setIsToolBoxOpen((prev) => !prev);
  }, []);

  // More efficient method to prepare URL for voice agents - memoized to avoid recalculation

  return (
    <div className="flex w-full flex-col animate-fade-in ">
      {isReconnectionNeeded && (
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
      )}
      {isError && (
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
      )}

      <motion.div
        className={`relative flex items-center ${files.length > 0 ? "" : "hidden"}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{
          opacity: files.length > 0 ? 1 : 0,
          y: files.length > 0 ? 0 : -10,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {files.length > 3 && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 z-10 px-2 py-1 ml-2 border-2 border-gray-700 bg-gray-700/50 text-white rounded-md hover:bg-gray-600"
          >
            <ChevronLeft />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-2 items-center overflow-x-scroll scroll-smooth hide-scrollbar"
        >
          {files.filter((file) => memorizedFiles.includes(file.name)).length >
            0 &&
            files
              .filter((file) => memorizedFiles.includes(file.name))
              .map((file, index) => (
                <div
                  key={index}
                  className="bg-[#2a3444]/80 backdrop-blur-sm rounded-lg px-2 py-2 my-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 p-3 rounded-lg">
                        <FileText className="w-5 h-5 text-gray-700" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-white font-medium truncate  w-full">
                          {file.name.length > 25
                            ? file.name.slice(0, 25) + "..."
                            : file.name}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                          <span className="uppercase">
                            {file.type.replaceAll("application/", "")}
                          </span>{" "}
                          File
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {files.length > 3 && (
          <button
            onClick={scrollRight}
            className="absolute right-0 z-10 px-2 py-1 bg-gray-700/50 text-white rounded-md hover:bg-gray-600"
          >
            <ChevronRight />
          </button>
        )}
      </motion.div>

      <div
        className={`rounded-2xl p-2 hide-scrollbar bg-gray-900 trans
                         ${
                           isSwarmMode
                             ? "border-2  border-blue-500 glow-outline-soft"
                             : "border  border-gray-400"
                         }`}
      >
        {selectedWorkflowId !== null && selectedWorkflowId > 0 && (
          <div className="flex items-center gap-2  rounded-md justify-between mb-2 p-2 w-fit bg-slate-800">
            <SquareDashed className="w-5 h-5" />
            <div className="flex items-center gap-2">
              <span className=" text-white text-xs">
                {getSelectedWorkflow()?.name || "No Workflow Selected"}
                <p className="text-slate-400">Workflow</p>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-800 rounded-full hover:bg-slate-700 text-white"
              onClick={() => setSelectedWorkflowId(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
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
                        Please First Start The Conversation to get the Document
                        Upload Section (Start By Saying Hello Or Hi! )
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

                    {/* Mask container for text reveal on left of star
                                        <div
                                            className="relative overflow-hidden"
                                            style={{
                                                width: hovered && workflowName ? 100 : 0,
                                                height: 20,
                                            }}
                                        >
                                            <AnimatePresence>
                                                {hovered && selectedWorkflowId && workflowName && (
                                                    <motion.span
                                                        key="workflow-name"
                                                        initial={{ x: 60, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        exit={{ x: 60, opacity: 0 }}
                                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                                        className="absolute right-0 top-0 text-sm text-slate-300 whitespace-nowrap z-0 pr-2"
                                                    >
                                                        {workflowName.length > 13
                                                            ? workflowName.slice(0, 10) + "..."
                                                            : workflowName}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </div> */}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm text-center ">
                  <p>Transform This Conversationg Into Workflow</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* chat mode */}
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
                        In manual mode you have to manually select the superior
                        persona for agentic simulation
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
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger
                  asChild
                  className={`${pathname == "/dashboard" && "hidden"}`}
                >
                  <div className="p-2 mr-2 rounded-md hover:bg-gray-800 cursor-pointer">
                    <ChevronDown className="w-5 h-5 text-slate-500 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)] z-10" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm text-center">
                  <p>Scroll to Bottom</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className=" p-2 rounded-md hover:bg-gray-800 cursor-pointer ">
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
                  {/* default */}
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
            {isMobile && (
              <div className="">
                <Drawer>
                  <DrawerTrigger>
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger>
                          <div className="cursor-pointer gap-2 items-center bg-slate-800 p-2 rounded-md">
                            <AudioLines className="w-5 h-5" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Use ARX Voice Technology</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </DrawerTrigger>
                  <DrawerContent className="bg-slate-600 flex flex-col gap-2">
                    <DrawerHeader>
                      <DrawerTitle>Voice Technology Options</DrawerTitle>
                      <DrawerDescription>
                        Choose a voice agent for your conversation
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 flex flex-col gap-2">
                      <div
                        onClick={() => {
                          const url = getVoiceAgentUrl(
                            import.meta.env.VITE_OPENAI_REALTIME_URL,
                          );
                          window.open(url, "_blank");
                        }}
                        className="flex flex-col justify-between bg-slate-600 hover:bg-slate-800 p-2 rounded-md transition-all items-start w-full mt-2"
                      >
                        {/* left */}
                        <div className="flex gap-2">
                          {/* image */}
                          <div className="flex items-center h-fit px-2 py-1 rounded-md bg-green-400 w-fit">
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
                                ? "ARX Beta Voice Agent"
                                : "ARX Next Voice Agent (Highly Recommended)"}
                            </p>
                            <p className="text-slate-300">
                              ARX Next Can Access Voice • Most Superior And Fast
                              • Automation Features
                            </p>
                          </div>
                        </div>
                      </div>
                      <div
                        onClick={() => {
                          window.open(
                            import.meta.env.VITE_GEMINI_REALTIME_URL,
                            "_blank",
                          );
                        }}
                        className="flex flex-col gap-2  justify-between bg-slate-600 hover:bg-slate-800 p-2 rounded-md transition-all items-start w-full"
                      >
                        {/* left */}
                        <div className="flex gap-2">
                          {/* image */}
                          <div className="flex items-center h-fit px-2 py-1 rounded-md bg-red-400">
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
                            {/* right */}
                            <div className="flex gap-1 mt-2">
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
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            )}

            <div className="md:flex hidden">
              <Dialog>
                <DialogTrigger>
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger>
                        <div className="cursor-pointer md:flex hidden gap-2 items-center p-2 rounded-md hover:bg-gray-800 mr-2">
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
                        console.log(
                          url,
                          "url",
                          import.meta.env.VITE_OPENAI_REALTIME_URL2,
                        );
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
                        console.log(url, "kajlsdhfklasjd839472509382");
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
                  {/* <button
                                        onClick={() => {
                                            window.open(import.meta.env.VITE_GEMINI_REALTIME_URL, "_blank")
                                        }}
                                        className="flex items-center px-1 py-1 rounded-md bg-red-400 border border-gray-600 hover:bg-slate-600 w-fit"
                                    >
                                        <div className="flex w-fit">
                                            <img src="/small-log.png" alt="Stream Realtime API" className="w-6 h-6 m-1 rounded-md" />
                                        </div>
                                    </button> */}
                </DialogContent>
              </Dialog>
            </div>
            <button
              disabled={input.length === 0 || isLoading} // Disable if loading
              onClick={() => {
                isLoading ? null : handleSubmit();
              }}
              className={` ${input.length === 0 || isLoading ? "bg-gray-600 border-slate-600 hover:bg-gray-600 cursor-not-allowed" : "bg-white hover:bg-slate-300"} rounded-md `}
            >
              {isLoading ? (
                <LoaderCircle className="animate-spin  w-5 h-5 m-2 text-black mx-3" />
              ) : (
                <ArrowRight className="text-black font-thin w-5 h-5 m-2" />
              )}
            </button>
          </div>
        </div>
        <AnimatePresence>
          <Drawer
            open={isMobile && isToolBoxOpen}
            onOpenChange={() => {
              setIsToolBoxOpen(!isToolBoxOpen);
            }}
          >
            <DrawerContent className=" bg-slate-900 md:hidden px-3 py-2">
              <AnimatePresence>
                {selectedSuperiorPersona.length > 0 && (
                  <motion.div
                    className="my-4 flex flex-col gap-2"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="font-semibold text-white">Superior Persona</p>
                    <motion.div
                      className="p-2 bg-slate-600 transition-all cursor-pointer rounded-md flex gap-2 flex-col mr-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex gap-2 text-white">
                        <CircleUserRound className="text-white" />
                        <p>
                          {sidebarStack.length > 0
                            ? `${selectedSuperiorPersona.length} Selected`
                            : `${selectedSuperiorPersona.length} Superior Persona Selected`}
                        </p>
                      </div>
                      <div>
                        <Button
                          onClick={() => {
                            setIsSuperiorPersonaAttached(false);
                            setSelectedSuperiorPersona([]);
                          }}
                          variant="outline"
                          className="bg-slate-800 border-none text-white hover:bg-slate-700 hover:text-white"
                        >
                          Remove All Selected Superior Persona
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="font-semibold text-white mb-2">Select Tools</p>
              <div className="flex gap-2 flex-col">
                <div
                  onClick={() => setIsSearchOn(!isSearchOn)}
                  className={`px-4 py-2 flex gap-2 items-center ${isSearchOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-full cursor-pointer`}
                >
                  <Globe
                    className={`${isSearchOn ? "text-white" : "text-slate-500"}`}
                  />
                  <p
                    className={`font-semibold ${isSearchOn ? "text-white" : "text-slate-500"}`}
                  >
                    {sidebarStack.length > 0
                      ? "Search"
                      : `Search Is ${isSearchOn ? "On" : "Off"}`}
                  </p>
                </div>
                {/* knowledge base */}
                <div
                  onClick={() => setIsVectorBaseOn(!isVectorBaseOn)}
                  className={`px-4 py-2 flex gap-2 items-center ${isVectorBaseOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-full cursor-pointer`}
                >
                  <DatabaseZap
                    className={`${isVectorBaseOn ? "text-white" : "text-slate-500"}`}
                  />
                  <p
                    className={`font-semibold ${isVectorBaseOn ? "text-white" : "text-slate-500"}`}
                  >
                    {sidebarStack.length > 0
                      ? "Knowledge"
                      : `Knowledge Base Is ${isVectorBaseOn ? "On" : "Off"}`}
                  </p>
                </div>
                {/* file data */}
                {files.length > 0 && (
                  <div
                    onClick={() => setIsDocumentOn(!isDocumentOn)}
                    className={`px-4 py-2 flex gap-2 items-center ${isDocumentOn && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-full cursor-pointer`}
                  >
                    <File
                      className={`${isDocumentOn ? "text-white" : "text-slate-500"}`}
                    />
                    <p
                      className={`font-semibold ${isDocumentOn ? "text-white" : "text-slate-500"}`}
                    >
                      {sidebarStack.length > 0
                        ? "Files Data"
                        : `File Data Is ${isDocumentOn ? "On" : "Off"}`}
                    </p>
                  </div>
                )}

                <Drawer>
                  <DrawerTrigger>
                    <div
                      onClick={() => {
                        console.log(
                          fetchSuperiorPersona,
                          "fetchSuperiorPersona",
                        );
                        if (fetchSuperiorPersona) fetchSuperiorPersona();
                      }}
                      className={`px-4 py-2 flex gap-2 items-center ${selectedSuperiorPersona.length > 0 && "bg-gray-600 border-white border-2"} border-slate-600 border rounded-md w-full cursor-pointer`}
                    >
                      <BookHeart
                        className={`${selectedSuperiorPersona.length > 0 ? "text-white" : "text-slate-500"}`}
                      />
                      <p
                        className={`font-semibold ${selectedSuperiorPersona.length > 0 ? "text-white" : "text-slate-500"}`}
                      >
                        {sidebarStack.length > 0
                          ? selectedSuperiorPersona.length > 0
                            ? "Manage"
                            : "Attach"
                          : selectedSuperiorPersona.length > 0
                            ? "Manage Superior Personas"
                            : "Attach Superior Persona"}
                      </p>
                    </div>
                  </DrawerTrigger>
                  <DrawerContent className="bg-slate-900 max-h-[75%]">
                    <div className="overflow-scroll m-2">
                      <GroupSuperiorPersonaSection
                        onFetchSuperiorPersona={setFetchSuperiorPersona}
                      />
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </DrawerContent>
          </Drawer>

          {!isAutoSwarmContextState && isSwarmMode && (
            <motion.div
              key="toolbox"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} // Moves up when disappearing
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:flex  gap-2  mt-2 border-t-2 border-blue-900 pt-2 w-full overflow-scroll"
            >
              <Dialog open={isSupDialogOpen} onOpenChange={setIsSupDialogOpen}>
                <DialogTrigger>
                  <div
                    onClick={() => {
                      if (fetchSuperiorPersona) fetchSuperiorPersona();
                    }}
                  >
                    <div className="text-sm w-full flex items-center font-semibold bg-slate-800  hover:bg-slate-700 px-3 py-1 rounded-md cursor-pointer">
                      Manage Superior Persona
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-5xl h-[80%] bg-slate-700 p-0 border-2 border-slate-500 overflow-y-scroll">
                  <DialogHeader>
                    <DialogTitle>Superior Persona Management</DialogTitle>
                    <DialogDescription>
                      Select and manage superior personas for your conversation
                    </DialogDescription>
                  </DialogHeader>
                  <GroupSuperiorPersonaSection
                    onFetchSuperiorPersona={setFetchSuperiorPersona}
                  />
                </DialogContent>
              </Dialog>

              {/* count */}
              {selectedSuperiorPersona.length > 0 && !isMobile && (
                <div className="bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer rounded-md relative flex items-center px-3  gap-2 mr-2 ">
                  <div
                    className="absolute -top-3 -right-3 cursor-pointer"
                    onClick={() => {
                      setIsSuperiorPersonaAttached(false);
                      setSelectedSuperiorPersona([]);
                    }}
                  >
                    <X className="w-4 h-4 z-50 rounded-md bg-slate-700 hover:bg-slate-400" />
                  </div>
                  <CircleUserRound className="w-4 h-4" />
                  <div className="flex gap-3 items-center  ">
                    <p>
                      {sidebarStack.length > 0
                        ? `${selectedSuperiorPersona.length} Selected`
                        : `${selectedSuperiorPersona.length} Superior Persona Selected`}
                    </p>
                    {/* <p className="text-slate-400">Click</p> */}
                  </div>
                </div>
              )}

              {/* bound */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Dialog open={workflowModalOpen} onOpenChange={handleWorkflowModalChange}>
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
                              recentlyCreatedWorkflowResponse.workflow.length -
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
  );
}

export default memo(ChatInput);
