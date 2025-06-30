import {
  ArrowDownToDot,
  ArrowLeftRight,
  ArrowUp,
  AudioLines,
  AudioWaveform,
  Brain,
  Camera,
  CircleFadingPlus,
  CirclePause,
  FileText,
  Grid2x2,
  Loader2,
  LoaderCircle,
  MonitorUp,
  Paperclip,
  SendToBack,
  Sparkles,
  SquareDashed,
  X,
  Zap,
  Settings2,
  Database,
  Component,
  Boxes,
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../ui/button";
import { useDomain } from "@/context/WhichDomainContext";
import { getPromptEnhancerApi } from "@/services/n8n-apis/_core/getPromptEnhancer.api";
import { useWorkflow } from "../../context/WorkflowContext";
import createUserSavedWorflow from "@/services/user-saved-workflow-apis/createUserSavedWorflow";
import { debounce, set } from "lodash";
import InternalKnowledgeDialog from "./InternalKnowledgeDialog";
import { useCollection } from "../../context/CollectionContext";
import Test from "@/Test";
import ModelSelectionDialog, { models } from "./ModelSelectionDialog";
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
    selectedModel,
    setSelectedModel,
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
  const [isKnowledgeBlockSelectorOpen, setIsKnowledgeBlockSelectorOpen] =
    useState(false);
  const [isIntentSelectionOpen, setIsIntentSelectionOpen] = useState(false);
  // Get only the necessary workflow states from context
  const {
    selectedWorkflowId,
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
  useEffect(() => {
    console.log(isSwarmMode, " isSwarmMode in ChatInput");
  }, [isSwarmMode]);
  // Optimize SwarmMode toggle with useCallback
  const modes = [
    {
      name: "Quick Response",
      icon: <Zap size={20} />,
      description: "Get instant replies for fast decisions.",
      onClick: () => {
        setIsSwarmMode(false); // Set context state
        setIsDeepThinkMode(false); // Set context state
      },
    },
    {
      name: "ARX Deep Thinking",
      icon: <Brain size={20} />,
      description: "Trigger deeper analysis and thoughtful exploration.",
      onClick: () => {
        setIsSwarmMode(false); // Set context state
        setIsDeepThinkMode(true); // Set context state
      },
    },
    {
      name: "Agentic ARX",
      icon: <SendToBack size={20} />,
      description: "Use multi-agent logic for advanced automation.",
      onClick: () => {
        console.log(" isSwarmMode in ChatInput 1", isSwarmMode);
        setIsSwarmMode(!isSwarmMode); // Toggle context state
      },
    },
  ];

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

  useEffect(() => {
    console.log(isIntentSelectionOpen, "isIntentSelectionOpen in ChatInput");
  }, [isIntentSelectionOpen]);

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
        <div
          className={`rounded-3xl p-2 hide-scrollbar bg-gray-900  border-2 
  ${isSwarmMode ? " border-blue-500 glow-outline-soft" : "border-transparent"}
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
            <div className="flex gap-2 ml-2 items-center overflow-x-auto scroll-smooth hide-scrollbar flex-nowrap">
              {selectedModel.length > 0 &&
                selectedModel.map((model, index) => {
                  const dataObj = models.find((m) => m.value == model);
                  if (!dataObj) return <></>;
                  return (
                    <AttachmentCard
                      key={index}
                      title={dataObj.name}
                      type="Intent Model"
                      showIsRemove={true}
                      onRemove={() => {
                        setSelectedModel((prev) =>
                          prev.filter((m) => m !== model),
                        );
                      }}
                      icon={<Boxes className="w-5 h-5" />}
                    />
                  );
                })}

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
            className={`ring-0 resize-none border-0 focus:ring-0 focus-visible:ring-0 `}
            type="text"
            placeholder="Type a message"
            id="aiInputTextArea"
          />

          <div className="flex justify-between items-center">
            <div className="flex gap-2 -mb-4">
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
                        <div className="flex items-center rounded-xl p-2 ">
                          <Paperclip className="w-5 h-5  drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
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

              {/* chat mode */}

              <div
                className={`${isPublicDomain && "hidden"}  rounded-xl hover:bg-gray-800 cursor-pointer `}
              >
                {isPromptEnchanced ? (
                  <div
                    onClick={onUndoPromptEnhance}
                    className="flex gap-2 items-center"
                  >
                    <ArrowLeftRight className="w-5 h-5 p-2 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] z-10" />
                    <p className="text-sm font-semibold text-white">Undo</p>
                  </div>
                ) : isPromptEnhancerLoading ? (
                  <LoaderCircle className="animate-spin w-5 h-5 text-white" />
                ) : (
                  <div onClick={enchancePrompt}>
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger>
                          <div className="cursor-pointer flex p-2 items-center rounded-xl hover:bg-gray-800">
                            <Sparkles className="w-5 h-5 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
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
              {/* voice */}
              <Dialog>
                <DialogTrigger className="p-0 m-0">
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger
                        className={`${isPublicDomain ? "hidden" : "flex"}`}
                      >
                        <div className="cursor-pointer gap-2 mb-0 items-center p-2 rounded-xl hover:bg-gray-800 ">
                          <AudioLines className="w-5 h-5 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
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
                      <div>
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
                      className={`flex justify-between bg-slate-600 hover:bg-slate-800  rounded-md transition-all items-center w-full ${domainState ? "flex" : "hidden"}`}
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
                      <div className="">
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

            <div className="flex gap-1 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="p-3 bg-slate-800 hover:bg-slate-600 mr-1 rounded-xl flex items-center justify-center gap-2 ">
                    <Settings2 className="w-5 h-5 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-none">
                  <DropdownMenuItem
                    onClick={() => {
                      setIsIntentSelectionOpen(true);
                    }}
                    className="hover:bg-slate-700 flex gap-2 items-start p-2"
                  >
                    <Boxes className="w-4 h-4 mt-1" />
                    <div>
                      <p className="text-md">Select Intent</p>
                      <p className="max-w-[200px] text-xs text-slate-400">
                        Select Diverse Model For Your Intent
                      </p>
                    </div>
                  </DropdownMenuItem>
                  {pathname !== "/dashboard" && (
                    <DropdownMenuItem
                      onClick={() => {
                        console.log("asdasdasdasdasdasd1212");
                        setWorkflowModalOpen(true);
                      }}
                      className="hover:bg-slate-700 flex gap-2 items-start p-2"
                    >
                      <CircleFadingPlus className="w-4 h-4 mt-1" />
                      <div>
                        <p className="text-md">Chat To Workflow</p>
                        <p className="max-w-[200px] text-xs text-slate-400">
                          Transform Current Chat Into Reusable Workflow
                        </p>
                      </div>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      setIsKnowledgeBlockSelectorOpen((prev) => !prev);
                    }}
                    className="hover:bg-slate-700 flex gap-2 items-start p-2"
                  >
                    <Database className="w-4 h-4 mt-1" />
                    <div>
                      <p className="text-md">Attach Knowledge Block</p>
                      <p className="max-w-[200px] text-xs text-slate-400">
                        Attach Your Global Knowledge As Knowledge Block For ARX
                      </p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* ghost component */}
              <InternalKnowledgeDialog
                isDialogOpen={isKnowledgeBlockSelectorOpen}
                setIsDialogOpen={setIsKnowledgeBlockSelectorOpen}
              />

              <ModelSelectionDialog
                open={isIntentSelectionOpen}
                onClose={setIsIntentSelectionOpen}
              />

              <Test modes={modes} />

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

        {/* create workflow */}
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
