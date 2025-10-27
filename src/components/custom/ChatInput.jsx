import {
  ArrowDownToDot,
  ArrowUp,
  AudioLines,
  Brain,
  CircleFadingPlus,
  CirclePause,
  Grid2x2,
  Loader2,
  LoaderCircle,
  SendToBack,
  SquareDashed,
  X,
  Zap,
  Settings2,
  Database,
  Boxes,
  FileText,
  Aperture,
  Mic,
  Anvil,
  Skull,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { memo, useEffect, useRef, useState, useCallback } from "react";
import { _useSidebar } from "../../context/SidebarContext";
import FileUploadDialog from "./file-upload-dialog/file-upload-dialog";
import { useFilesUploadMetadata } from "../../context/FilesUploadMetadata";
import AudioRecorder from "./audio-input/AudioRecorder";
import { useLocation, useParams } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../ui/button";
import { useDomain } from "@/context/WhichDomainContext";
import { useWorkflow } from "../../context/WorkflowContext";
import createUserSavedWorflow from "@/services/user-saved-workflow-apis/createUserSavedWorflow";
import { debounce, set } from "lodash";
import InternalKnowledgeDialog from "./InternalKnowledgeDialog";
import { useCollection } from "../../context/CollectionContext";
import ModelSelectionDialog, { models } from "./ModelSelectionDialog";
import VoiceInputBlock from "./VoiceTVoice/VoiceInputBlock";
import ChatModes from "@/ChatModes";
import PromptLibrary from "./PromptLibrary";

const maxRows = 30;

const AttachmentCard = ({
  title = "",
  type = "",
  icon = () => {},
  showIsRemove = true,
  onRemove = () => {},
  isProcessing = false,
  isHeliosUnsupported = false,
}) => {
  return (
    <div
      className={`flex mt-3 items-center rounded-2xl justify-between mb-2 w-fit ${
        isHeliosUnsupported
          ? "bg-slate-800/50 border-2 border-dashed border-slate-600"
          : "bg-slate-800"
      }`}
    >
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
          <p
            className={`text-slate-400 ${isProcessing ? "opacity-70" : ""} ${isHeliosUnsupported ? "text-red-400" : ""}`}
          >
            {isProcessing
              ? "Processing..."
              : isHeliosUnsupported
                ? "Helios Unsupported"
                : type}
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

function ChatInput({
  conversationProp = [],
  input,
  setConversation = () => {},
  setInput,
  handleSubmit,
  isLoading,
  onScrollToBottom = () => {},
  onAbort,
  isAborting,
  currConversationId,
  processingFiles = new Set(),
  isVoiceMode = false,
  setIsVoiceMode = () => {},
}) {
  const { isPublicDomain } = useDomain();
  const { id } = useParams();
  const { pathname } = useLocation();
  const { memorizedFiles, resetAllStates, files, setFiles } =
    useFilesUploadMetadata();
  const {
    isSwarmMode,
    setIsSwarmMode,
    setIsAutoSwarmContextState,
    setIsDeepThinkMode, // Use context setter
    selectedModel,
    isHeliosAgentMode,
    setIsHeliosAgentMode,
    setSelectedModel,
    removeSelectedIntent,
    restoredSavedModel,
    setIsAbliteratedMode,
  } = useUser();
  // component states
  const [rows, setRows] = useState(5);
  // TODO: use isToolBoxOpen and create option to select superior persona
  const [isTransribed, setIsTransribed] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { toggleCollectionSelection, getSelectedCollections } = useCollection();
  const selectedCollections = getSelectedCollections();
  const [isKnowledgeBlockSelectorOpen, setIsKnowledgeBlockSelectorOpen] =
    useState(false);
  const [isIntentSelectionOpen, setIsIntentSelectionOpen] = useState(false);
  const {
    selectedWorkflowId,
    setWorkflowList,
    getSelectedWorkflow,
    setSelectedWorkflowId,
    selectWorkflow,
    restoreSavedWorkflow,
  } = useWorkflow();
  const [workflowPrompt, setWorkflowPrompt] = useState("");
  const [isWorkflowCreatorLoading, setIsWorkflowCreatorLoading] =
    useState(false);
  const [recentlyCreatedWorkflowResponse, setRecentlyCreatedWorkflowResponse] =
    useState({});
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [showHeliosTooltip, setShowHeliosTooltip] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const prevSelectedModelLength = useRef(selectedModel.length);

  const { user } = useUser();

  useEffect(() => {
    if (pathname.startsWith("/chat")) {
      setRows(2);
    }
  }, [pathname]);

  useEffect(() => {
    if (
      isHeliosAgentMode &&
      selectedModel.length > prevSelectedModelLength.current &&
      !selectedModel.includes("documentation")
    ) {
      setShowHeliosTooltip(true);
      setTimeout(() => setShowHeliosTooltip(false), 4000);
    }
    prevSelectedModelLength.current = selectedModel.length;
  }, [selectedModel, isHeliosAgentMode]);

  useEffect(() => {
    restoreSavedWorkflow(id);
    restoredSavedModel(id);
    return () => {
      setSelectedWorkflowId(null);
      setSelectedModel([]);
    };
  }, [id]);

  const handlePaste = useCallback(
    (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;

      const newFiles = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type && item.type.indexOf("image/") === 0) {
          const blob = item.getAsFile();
          if (blob) {
            // Push the File exactly as provided by the clipboard
            newFiles.push(blob);
          }
        }
      }

      if (newFiles.length > 0) {
        setFiles((prev) => prev.concat(newFiles));
        // optional: toast feedback here
      }
    },
    [setFiles],
  );

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

  const textareaRef = useRef(null);

  // debouncedHandleChange now only commits row changes
  const debouncedHandleChange = useCallback(
    debounce((_, newRows) => {
      setRows(newRows);
    }, 50),
    [],
  );

  const handleChange = useCallback(
    (event) => {
      const textarea = event.target;
      const value = textarea.value;

      // 1️⃣ update text immediately so cursor stays put
      setInput(value);

      // 2️⃣ recalc rows
      const lineHeight = 24;
      const prevRows = textarea.rows;
      textarea.rows = 1; // reset to measure
      const currentRows = Math.floor(textarea.scrollHeight / lineHeight);
      const newRows = currentRows < maxRows ? currentRows : maxRows;

      // 3️⃣ apply immediate rows for responsiveness
      if (value.length < 5) {
        textarea.rows = 1;
      } else if (currentRows === prevRows) {
        textarea.rows = currentRows;
      } else if (currentRows >= maxRows) {
        textarea.rows = maxRows;
        textarea.scrollTop = textarea.scrollHeight;
      } else {
        textarea.rows = newRows;
      }

      // 4️⃣ debounce the state commit of rows only
      debouncedHandleChange(value, newRows);
    },
    [debouncedHandleChange, maxRows],
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

  const modes = [
    {
      name: "Agentic Helios",
      icon: <Aperture size={20} className="hover:rotate-90 transition-all" />,
      description: "Multi-Agent Orchestration with Full Audit Trail",
      onClick: () => {
        console.log("clicked aslakdjalskdjalskdj");
        if (
          selectedModel.length > 0 &&
          !selectedModel.includes("documentation")
        ) {
          setShowHeliosTooltip(true);
          setTimeout(() => setShowHeliosTooltip(false), 2000);
        }
        setIsHeliosAgentMode(true); // Toggle context state
        setIsSwarmMode(false); // Ensure Swarm mode is off
        setIsDeepThinkMode(false); // Ensure Deep Think mode is off
      },
    },
    {
      name: "Ablite8 ARX",
      icon: <Skull size={22} />,
      description: "Unrestricted, non-refusal, Jail-broken response mode.",
      onClick: () => {
        console.log("clicked abliterated mode");
        setIsHeliosAgentMode(false); // Ensure Helios mode is off
        setIsSwarmMode(false); // Ensure Swarm mode is off
        setIsDeepThinkMode(false); // Ensure Deep Think mode is off
        setIsAbliteratedMode(true); // Toggle context state
      },
    },
    {
      name: "Quick Response",
      icon: <Zap size={20} />,
      description: "Get instant replies for fast decisions.",
      onClick: () => {
        setIsHeliosAgentMode(false); // Set context state
        setIsSwarmMode(false); // Set context state
        setIsDeepThinkMode(false); // Set context state
      },
    },
    {
      name: "ARX Deep Thinking",
      icon: <Brain size={20} />,
      description: "Trigger deeper analysis and thoughtful exploration.",
      onClick: () => {
        setIsHeliosAgentMode(false); // Set context state
        setIsSwarmMode(false); // Set context state
        setIsDeepThinkMode(true); // Set context state
      },
    },
    {
      name: "Agentic ARX",
      icon: <SendToBack size={20} />,
      description: "Use multi-agent logic for advanced automation.",
      onClick: () => {
        setIsHeliosAgentMode(false); // Ensure Helios mode is off
        console.log(" isSwarmMode in ChatInput 1", isSwarmMode);
        setIsSwarmMode(true); // Toggle context state
      },
    },
  ];

  useEffect(() => {
    console.log(selectedCollections, "Selected Collections in ChatInput");
  }, []);

  const handleClick = useCallback(() => {
    if (isLoading && currConversationId && !isAborting) {
      console.log("Calling onAbort");
      onAbort();
    } else if (input.length == 0 && !pathname.includes("/dashboard")) {
      setIsVoiceMode(true);
      console.log("Click:", { isLoading, currConversationId, isAborting });
    } else {
      console.log("Calling handleSubmit");
      handleSubmit();
    }
  }, [isLoading, currConversationId, isAborting, onAbort, handleSubmit, input]);

  // More efficient method to prepare URL for voice agents - memoized to avoid recalculation
  return (
    <div className="relative ">
      {showHeliosTooltip && (
        <div className="absolute top-[-60px] left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50">
          Helios doesn't support intent models yet. Use other modes.
        </div>
      )}
      {/* scroll to bottom */}
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
      {isVoiceMode && (
        <div>
          <VoiceInputBlock
            setIsVoiceMode={setIsVoiceMode}
            setConversation={setConversation}
          />
        </div>
      )}
      <div
        className={`flex w-full flex-col animate-fade-in ${isVoiceMode && "hidden"}`}
      >
        <div
          className={`rounded-3xl p-2 hide-scrollbar bg-gray-900  border-2 
  ${isSwarmMode ? " border-blue-500 glow-outline-soft" : "border-transparent"}
`}
        >
          <div>
            <motion.div
              className={`relative flex items-center `}
              initial={{ opacity: 0, y: -10 }}
              animate={{
                opacity: 1,
                y: -10,
              }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div className="flex gap-2 ml-2 items-center w-full overflow-x-auto scroll-smooth hide-scrollbar flex-nowrap">
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
                          removeSelectedIntent(model, id);
                        }}
                        icon={<Boxes className="w-5 h-5" />}
                        isHeliosUnsupported={
                          isHeliosAgentMode && dataObj.name !== "Documentation"
                        }
                      />
                    );
                  })}

                {files.length > 0 &&
                  files.map((file, index) => {
                    const isVectorized = memorizedFiles.includes(file.name);
                    const isProcessing =
                      processingFiles.has(file.name) || !isVectorized;

                    return (
                      <AttachmentCard
                        key={index}
                        title={file.name}
                        type={file.type.replaceAll("application/", "")}
                        icon={<FileText className="w-5 h-5" />}
                        showIsRemove={false}
                        isProcessing={isProcessing}
                      />
                    );
                  })}

                {selectedWorkflowId !== null && selectedWorkflowId > 0 && (
                  <AttachmentCard
                    title={
                      getSelectedWorkflow()?.name || "No Workflow Selected"
                    }
                    key={selectedWorkflowId + "selectedWorkflowId" + id}
                    type="Workflow"
                    icon={<SquareDashed className="w-5 h-5" />}
                    showIsRemove={true}
                    onRemove={() => {
                      console.log(id, "selecting workflow");

                      selectWorkflow(null, id);
                    }}
                  />
                )}

                {selectedCollections.map((collection) => (
                  <AttachmentCard
                    key={collection.id}
                    title={collection.collectionName}
                    type="Knowledge Block"
                    icon={<Grid2x2 className="w-5 h-5" />}
                    showIsRemove={true}
                    onRemove={() =>
                      toggleCollectionSelection(collection.id, id)
                    }
                  />
                ))}
              </div>
            </motion.div>

            {/* <SelectedCollectionsDisplay /> */}

            <Textarea
              ref={textareaRef}
              value={input}
              onPaste={handlePaste}
              onChange={handleChange}
              rows={rows}
              maxRows={maxRows}
              className={`ring-0 resize-none border-0 focus:ring-0 focus-visible:ring-0 `}
              type="text"
              placeholder="Type a message"
              id="aiInputTextArea"
            />

            <div className="flex items-center w-full ">
              <div className="flex justify-between items-center w-full gap-2 ">
                <div className="flex gap-2">
                  <div className="flex gap-2 rounded-md">
                    <AudioRecorder
                      value={input}
                      setValue={setInput}
                      trigger={isTransribed}
                      setTrigger={setIsTransribed}
                    />
                  </div>
                  <FileUploadDialog />
                  <button
                    className="flex gap-2 hover:bg-slate-800 p-2 rounded-xl cursor-pointer border-none bg-transparent"
                    onClick={() => setIsPromptLibraryOpen(true)}
                    title="Open Prompt Library"
                    type="button"
                  >
                    <Anvil className="w-5 h-5 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                  </button>
                  {/* chat mode */}
                </div>

                <div className="flex justify-center items-center">
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
                              Attach Your Global Knowledge As Knowledge Block
                              For ARX
                            </p>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* ghost component */}
                  <InternalKnowledgeDialog
                    isDialogOpen={isKnowledgeBlockSelectorOpen}
                    setIsDialogOpen={setIsKnowledgeBlockSelectorOpen}
                  />

                  <ModelSelectionDialog
                    open={isIntentSelectionOpen}
                    onClose={setIsIntentSelectionOpen}
                  />

                  <ChatModes modes={modes} />

                  <button
                    disabled={isAborting || (isLoading && !currConversationId)}
                    onClick={handleClick}
                    className={`${
                      isAborting ||
                      input.length === 0 ||
                      (isLoading && !currConversationId)
                        ? "bg-white border-slate-600 hover:bg-gray-300 cursor-not-allowed"
                        : "bg-white hover:bg-slate-300"
                    } rounded-xl p-1 cursor-pointer`}
                  >
                    {isLoading && (!currConversationId || isAborting) ? (
                      <LoaderCircle className="animate-spin w-5 h-5 m-2 text-black" />
                    ) : isLoading && currConversationId && !isAborting ? (
                      <CirclePause className="w-5 h-5 text-black m-2" />
                    ) : input.length === 0 &&
                      !pathname.includes("/dashboard") ? (
                      <AudioLines className={`w-5 h-5 m-2 text-gray-800`} />
                    ) : (
                      <ArrowUp className="text-black font-thin w-5 h-5 m-2" />
                    )}
                  </button>
                </div>
              </div>
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

      {/* Prompt Library */}
      <PromptLibrary
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onImportPrompt={(prompt) => {
          setInput(prompt.output || "");
          toast({
            title: "Prompt imported",
            description: `"${prompt.promptName || "Untitled"}" has been imported to the input field.`,
          });
        }}
      />

      <div className="p-2 bg-black -mt-2"></div>
    </div>
  );
}

export default memo(ChatInput);
