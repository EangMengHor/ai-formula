import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  startMpptJob,
  pollMpptJob,
  getMpptChatHistory,
  getContentToDownload,
  addMpptFavorite,
  removeMpptFavorite,
} from "@/services/mppt/mppt.api";
import { handlePdfDownload } from "@/pages/_private/components/sidebarProvided/chat/PdfDownload";
import {
  LoaderCircle,
  ChevronDown,
  ChevronUp,
  GitBranch,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ListChecks,
  Brain,
  FolderDown,
  Loader2,
  Volume2,
  CircleStop,
  Star,
} from "lucide-react";
import LoadingAnimation from "@/components/custom/Loading";
import MarkdownRenderer from "../_private/components/sidebarProvided/components/AnimatedMarkdown";
import MpptChatInput from "./MpptChatInput";
import useStartTTS from "@/hooks/StartTTS";
import TTSPrompt from "@/components/custom/TTSPrompt";

// ── shared button styles (matches ChatActionButtons.jsx) ─────────────────────
const btnClass =
  "px-2.5 py-1.5 gap-1.5 text-sm bg-slate-900 hover:bg-slate-700 rounded-xl flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const iconClass = "h-4 w-4 flex-shrink-0";

// ── helpers ──────────────────────────────────────────────────────────────────

const getUserId = () => localStorage.getItem("id");
const DEFAULT_VOICE_SETTINGS = {
  reasoning: true,
  answer: true,
  keyDecision: true,
};

const statusIcon = (status) => {
  if (status === "completed")
    return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
  if (status === "error")
    return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
  return <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />;
};

// ── Sub-components ────────────────────────────────────────────────────────────

function BranchTask({ task }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white/5 rounded-xl p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {statusIcon(task.status)}
          <span className="text-xs text-white font-medium leading-tight">
            {task.title}
          </span>
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0">
          P{task.phase}
        </span>
      </div>
      {task.goal && (
        <>
          <p
            className={`text-xs text-gray-400 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}
          >
            {task.goal}
          </p>
          {task.goal.length > 80 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  More
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function BranchesViewer({ branches, status }) {
  const [isExpanded, setIsExpanded] = useState(status !== "completed");

  const taskCount = branches.reduce(
    (acc, b) => (Array.isArray(b) ? acc + b.length : acc),
    0,
  );
  const phaseCount = branches.filter((b) => Array.isArray(b)).length;

  return (
    <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 rounded-2xl overflow-hidden border border-white/5">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <GitBranch className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Reasoning Process</p>
            <p className="text-xs text-gray-400">
              {phaseCount} phase{phaseCount !== 1 ? "s" : ""} · {taskCount} task
              {taskCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "completed" && (
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              Done
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {branches.map((item, idx) => {
            if (typeof item === "string" && item.trim()) {
              return (
                <p
                  key={idx}
                  className="text-xs text-gray-400 italic leading-relaxed pl-2 border-l border-blue-500/30"
                >
                  {item}
                </p>
              );
            }
            if (Array.isArray(item) && item.length > 0) {
              const phase = item[0]?.phase;
              return (
                <div key={idx} className="space-y-1.5">
                  {phase && (
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Phase {phase}
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.map((task) => (
                      <BranchTask key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}

function DecisionsList({ decisions }) {
  return (
    <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-purple-500/10 rounded-lg flex items-center justify-center">
          <ListChecks className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <p className="text-sm font-medium text-white">Key Decisions</p>
      </div>
      <ul className="space-y-2">
        {decisions.map((decision, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-purple-400 text-xs mt-0.5 flex-shrink-0">
              {idx + 1}.
            </span>
            <p className="text-sm text-gray-300 leading-relaxed">{decision}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
  return (
    <button onClick={handleCopy} className={btnClass} title="Copy answer">
      {copied ? (
        <>
          <Check className={iconClass} />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className={iconClass} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function MpptDownloadButton({ jobId }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!jobId || isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await getContentToDownload(jobId);
      if (!res.success || !res.data?.s) {
        throw new Error("Failed to fetch content");
      }
      await handlePdfDownload({
        currContent: res.data.s,
        pdfFileName: `mppt-response-${jobId}`,
        setIsPdfDownloadLoading: setIsDownloading,
        setPdfDialogOpen: () => {},
        toast,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error.message || "Could not download content",
        variant: "destructive",
      });
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={btnClass}
      title="Download as PDF"
    >
      {isDownloading ? (
        <>
          <Loader2 className={`${iconClass} animate-spin`} />
          <span>Downloading...</span>
        </>
      ) : (
        <>
          <FolderDown className={iconClass} />
          <span>Download</span>
        </>
      )}
    </button>
  );
}

function MessageBlock({ message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 p-3 max-w-[80%] rounded-2xl">
          <p className="text-white whitespace-pre-wrap">{message.prompt}</p>
        </div>
      </div>
    );
  }

  // assistant message
  const { branches, answer, decisions, status, jobId } = message;
  const hasBranches = branches && branches.length > 0;
  const hasAnswer = answer && answer.trim();
  const hasDecisions = decisions && decisions.length > 0;

  return (
    <div className="flex justify-start">
      <div className="w-full space-y-3 max-w-full">
        {/* Branches */}
        {hasBranches && <BranchesViewer branches={branches} status={status} />}

        {/* Answer */}
        {hasAnswer && (
          <div className="relative">
            <div className="text-gray-200">
              <MarkdownRenderer content={answer} />
            </div>
            <div className="flex justify-start items-center mt-3 gap-2 flex-wrap">
              <CopyButton text={answer} />
              {jobId && status === "completed" && (
                <MpptDownloadButton jobId={jobId} />
              )}
              <TTSPrompt
                prompt={answer}
                startButton={
                  <button className={btnClass}>
                    <Volume2 className={iconClass} />
                    <span>Voice</span>
                  </button>
                }
                StopButton={
                  <button className={`${btnClass} border border-white/30`}>
                    <CircleStop className={iconClass} />
                    <span>Stop</span>
                  </button>
                }
                loadingButton={
                  <button className={btnClass}>
                    <Loader2 className={`${iconClass} animate-spin`} />
                    <span>Starting...</span>
                  </button>
                }
              />
            </div>
          </div>
        )}

        {/* Decisions */}
        {hasDecisions && <DecisionsList decisions={decisions} />}

        {/* Error state */}
        {status === "error" && !hasAnswer && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>An error occurred during analysis. Please try again.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MpptChat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [messages, setMessages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [activeJobId, setActiveJobId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [voiceActive, setVoiceActive] = useState(() => {
    // If user submitted via voice from dashboard, auto-activate voice responses
    const flag = localStorage.getItem("mpptVoiceInitiated");
    if (flag === "true") {
      localStorage.removeItem("mpptVoiceInitiated"); // consume once
      return true;
    }
    return false;
  });
  const [voiceSettings, setVoiceSettings] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("mpptVoiceSettings") || "null",
      );
      return saved
        ? { ...DEFAULT_VOICE_SETTINGS, ...saved }
        : DEFAULT_VOICE_SETTINGS;
    } catch {
      return DEFAULT_VOICE_SETTINGS;
    }
  });
  const [narrationStage, setNarrationStage] = useState(null);
  const [stopState, setStopState] = useState(true);
  const [isNarrating, setIsNarrating] = useState(false);

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const hasLoadedHistory = useRef(false);
  const voiceActiveRef = useRef(voiceActive);
  const voiceSettingsRef = useRef(voiceSettings);
  const narrationQueueRef = useRef([]);
  const isNarrationStoppedRef = useRef(false);
  const currentNarrationRef = useRef(null);
  const spokenReasoningRef = useRef(new Set());
  const spokenAnswerRef = useRef(new Set());
  const spokenDecisionRef = useRef(new Set());
  const narrationCompleteRef = useRef(() => {});

  const { audioRef, startTTS, stopTTS, handleAudioEnded } = useStartTTS({
    stopState,
    onComplete: () => narrationCompleteRef.current(),
  });

  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

  useEffect(() => {
    voiceSettingsRef.current = voiceSettings;
  }, [voiceSettings]);

  useEffect(() => {
    if (stopState === false) {
      setStopState(true);
    }
  }, [stopState]);

  const playNextNarration = useCallback(() => {
    if (isNarrationStoppedRef.current) {
      setIsNarrating(false);
      setNarrationStage(null);
      currentNarrationRef.current = null;
      return;
    }

    const next = narrationQueueRef.current.shift();
    if (!next) {
      setIsNarrating(false);
      setNarrationStage(null);
      currentNarrationRef.current = null;
      return;
    }

    currentNarrationRef.current = next;
    setIsNarrating(true);
    setNarrationStage(next.stage);
    startTTS(next.text);
  }, [startTTS]);

  useEffect(() => {
    narrationCompleteRef.current = () => {
      currentNarrationRef.current = null;
      if (isNarrationStoppedRef.current) {
        setIsNarrating(false);
        setNarrationStage(null);
        return;
      }
      playNextNarration();
    };
  }, [playNextNarration]);

  const enqueueNarration = useCallback(
    (item) => {
      if (!voiceActiveRef.current) return;
      if (!item?.text?.trim()) return;

      narrationQueueRef.current.push(item);
      if (!currentNarrationRef.current) {
        playNextNarration();
      }
    },
    [playNextNarration],
  );

  const stopAllNarration = useCallback(() => {
    isNarrationStoppedRef.current = true;
    narrationQueueRef.current = [];
    currentNarrationRef.current = null;
    setIsNarrating(false);
    setNarrationStage(null);
    setVoiceActive(false);
    stopTTS({ triggerComplete: false });
    setStopState(false);
  }, [stopTTS]);

  const skipCurrentNarration = useCallback(() => {
    if (!currentNarrationRef.current) return;
    stopTTS({ triggerComplete: true });
  }, [stopTTS]);

  // cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (hasLoadedHistory.current) {
        setMessages([]);
        setUploadedFiles([]);
        setActiveJobId(null);
        setIsPolling(false);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }

      try {
        setIsLoadingHistory(true);
        const userId = getUserId();
        const res = await getMpptChatHistory(sessionId, userId);

        if (res.success && res.data) {
          const { chatHistory, files, isFavorited: favStatus } = res.data;
          if (typeof favStatus === "boolean") setIsFavorited(favStatus);

          if (Array.isArray(chatHistory) && chatHistory.length > 0) {
            const loadedMessages = chatHistory.flatMap((item) => [
              { role: "user", prompt: item.prompt },
              {
                role: "assistant",
                jobId: item.id,
                answer: item.answer || "",
                branches: item.branches || [],
                decisions: item.decisions || [],
                quantumRankings: item.quantumRankings || [],
                status: item.status,
              },
            ]);
            setMessages(loadedMessages);

            // Resume polling for any pending/running jobs
            const pendingJob = chatHistory.find(
              (h) => h.status === "pending" || h.status === "running",
            );
            if (pendingJob) {
              setActiveJobId(pendingJob.id);
              setIsPolling(true);
              startPolling(pendingJob.id);
            }
          }

          if (Array.isArray(files)) {
            setUploadedFiles(files.map((f) => f.fileName).filter(Boolean));
          }
        }

        hasLoadedHistory.current = true;
      } catch (error) {
        console.error("Error loading MPPT history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [sessionId]);

  // Pick up initial prompt from localStorage (coming from dashboard)
  useEffect(() => {
    const initialPrompt = localStorage.getItem("mpptPrompt");
    if (initialPrompt && messages.length === 0 && !isLoadingHistory) {
      const internetSearch =
        localStorage.getItem("mpptInternetSearch") !== "false";
      localStorage.removeItem("mpptPrompt");
      localStorage.removeItem("mpptInternetSearch");
      handleNewMessage({
        prompt: initialPrompt,
        isInternetSearch: internetSearch,
      });
    }
  }, [isLoadingHistory]);

  const handleToggleFavorite = async () => {
    const userId = getUserId();
    if (!userId || isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorited) {
        await removeMpptFavorite(userId, sessionId);
        setIsFavorited(false);
      } else {
        await addMpptFavorite(userId, sessionId);
        setIsFavorited(true);
      }
    } catch {
      toast({ title: "Error", description: "Failed to update favorite", variant: "destructive" });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const startPolling = useCallback((jobId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    const poll = async () => {
      try {
        console.log("[POLLING] Checking status", {
          jobId,
          voiceActive: voiceActiveRef.current,
        });
        const res = await pollMpptJob(jobId);
        if (res.success && res.data) {
          const { status, answer, branches, decisions, quantumRankings } =
            res.data;

          if (voiceActiveRef.current) {
            const settings = voiceSettingsRef.current;

            if (settings.reasoning && Array.isArray(branches)) {
              for (let i = 0; i < branches.length; i++) {
                const item = branches[i];
                if (typeof item !== "string" || !item.trim()) continue;

                const next = branches[i + 1];
                const branchCountText = Array.isArray(next)
                  ? ` ${next.length} branches.`
                  : "";
                const speech = `${item.trim()}${branchCountText}`;
                const reasoningId = `${jobId}-reasoning-${i}`;

                if (!spokenReasoningRef.current.has(reasoningId)) {
                  spokenReasoningRef.current.add(reasoningId);
                  isNarrationStoppedRef.current = false;
                  enqueueNarration({
                    id: reasoningId,
                    stage: "reasoning",
                    text: speech,
                  });
                }
              }
            }

            if (status === "completed") {
              if (
                settings.answer &&
                typeof answer === "string" &&
                answer.trim() &&
                !spokenAnswerRef.current.has(jobId)
              ) {
                spokenAnswerRef.current.add(jobId);
                isNarrationStoppedRef.current = false;
                enqueueNarration({
                  id: `${jobId}-answer`,
                  stage: "answer",
                  text: answer,
                });
              }

              if (
                settings.keyDecision &&
                Array.isArray(decisions) &&
                decisions.length > 0 &&
                !spokenDecisionRef.current.has(jobId)
              ) {
                spokenDecisionRef.current.add(jobId);
                isNarrationStoppedRef.current = false;
                const decisionsSpeech = decisions
                  .map((decision, idx) => `Decision ${idx + 1}. ${decision}`)
                  .join(" ");
                enqueueNarration({
                  id: `${jobId}-decisions`,
                  stage: "keyDecision",
                  text: decisionsSpeech,
                });
              }
            }
          }

          setMessages((prev) => {
            const updated = [...prev];
            // Find the assistant message with this jobId
            const idx = updated.findIndex(
              (m) => m.role === "assistant" && m.jobId === jobId,
            );
            console.log("[POLL DEBUG]", {
              jobId,
              jobIdType: typeof jobId,
              idx,
              totalMessages: updated.length,
              assistantJobIds: updated
                .filter((m) => m.role === "assistant")
                .map((m) => ({ jobId: m.jobId, type: typeof m.jobId })),
            });
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                answer: answer || updated[idx].answer || "",
                branches: branches || updated[idx].branches || [],
                decisions: decisions || updated[idx].decisions || [],
                quantumRankings:
                  quantumRankings || updated[idx].quantumRankings || [],
                status,
              };
            }
            return updated;
          });

          if (status === "completed" || status === "error") {
            setIsPolling(false);
            setActiveJobId(null);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Poll immediately, then every 3 seconds
    poll();
    setTimeout(() => poll(), 1500);
    pollIntervalRef.current = setInterval(poll, 20000);
  }, []);

  const handleNewMessage = async ({ prompt, isInternetSearch }) => {
    const userId = getUserId();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    // Build chatMemory from previous completed user+assistant pairs
    const chatMemory = [];
    for (let i = 0; i < messages.length - 1; i += 2) {
      const userMsg = messages[i];
      const assistantMsg = messages[i + 1];
      if (
        userMsg?.role === "user" &&
        assistantMsg?.role === "assistant" &&
        assistantMsg?.answer?.trim()
      ) {
        chatMemory.push({
          role: "user",
          content: userMsg.prompt.slice(0, 5000),
        });
        chatMemory.push({
          role: "assistant",
          content: assistantMsg.answer.slice(0, 5000),
        });
      }
    }

    // Add user message
    const userMsg = { role: "user", prompt: trimmed };
    const assistantMsg = {
      role: "assistant",
      jobId: null,
      answer: "",
      branches: [],
      decisions: [],
      quantumRankings: [],
      status: "pending",
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsPolling(true);

    try {
      const res = await startMpptJob({
        prompt: trimmed,
        chatMemory,
        userId,
        sessionId,
        isInternetSearch,
      });

      if (res.success && res.data?.jobId) {
        const jobId = res.data.jobId;
        setActiveJobId(jobId);

        // Tag the assistant message with jobId
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "assistant" && last.jobId === null) {
            updated[updated.length - 1] = { ...last, jobId, status: "running" };
          }
          return updated;
        });

        startPolling(jobId);
      } else {
        throw new Error(res.message || "Failed to start MPPT job");
      }
    } catch (error) {
      console.error("Error starting MPPT job:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start analysis",
        variant: "destructive",
      });
      setIsPolling(false);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant") {
          updated[updated.length - 1] = { ...last, status: "error" };
        }
        return updated;
      });
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && !isPolling && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Start the analysis by typing a prompt below</p>
          </div>
        )}

        {messages.map((message, idx) => (
          <MessageBlock key={idx} message={message} />
        ))}

        {isPolling && (
          <div className="flex justify-start">
            <LoadingAnimation currentQuote="Analyzing with multi-phase parallel thinking" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 sm:p-4 pt-2">
        {/* Single meta row: nav links left, skip right */}
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/mppt/decisions")}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ListChecks className="w-3 h-3 flex-shrink-0" />
              <span>My Decisions</span>
            </button>
            <span className="text-gray-700 select-none">·</span>
            <button
              onClick={() => navigate("/mppt/decision-agent")}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Brain className="w-3 h-3 flex-shrink-0" />
              <span>Decision Agent</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isNarrating && (
              <button
                onClick={skipCurrentNarration}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <span>
                  {narrationStage === "reasoning"
                    ? "Skip reasoning"
                    : narrationStage === "answer"
                    ? "Skip answer"
                    : "Skip decisions"}
                </span>
              </button>
            )}
            <button
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={`w-3.5 h-3.5 transition-colors ${
                  isFavorited ? "text-yellow-400 fill-yellow-400" : ""
                }`}
              />
              <span>{isFavorited ? "Favorited" : "Favorite"}</span>
            </button>
          </div>
        </div>

        <MpptChatInput
          sessionId={sessionId}
          disabled={isPolling}
          onSubmit={handleNewMessage}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          setVoiceActive={setVoiceActive}
          voiceActive={voiceActive}
          voiceSettings={voiceSettings}
          setVoiceSettings={setVoiceSettings}
          isNarrating={isNarrating}
          onStopVoice={stopAllNarration}
        />
      </div>
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
    </div>
  );
}
