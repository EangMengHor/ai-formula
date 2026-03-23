import {
  Paperclip,
  Send,
  LoaderCircle,
  Loader2,
  Folder,
  Globe,
  AlertTriangle,
  X,
  Check,
  AudioLines,
  SlidersHorizontal,
  Square,
  Anvil,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { vectorizeMpptDocument } from "@/services/mppt/mppt.api";
import { TTS } from "@/services/n8n-apis/_core/voiceToText.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import useStartTTS from "@/hooks/StartTTS";
import PromptLibrary from "@/components/custom/PromptLibrary";

const DEFAULT_VOICE_SETTINGS = {
  reasoning: true,
  answer: true,
  keyDecision: true,
};

const ACCEPTED_TYPES = ".pdf,.csv,.xlsx,.txt";
const ACCEPTED_EXTENSIONS = ["pdf", "csv", "xlsx", "txt"];
const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB total
const MAX_PROMPT_LENGTH = 20000;
const WAVEFORM_HISTORY = 80; // number of bars in the scrolling history
const MPPT_PROGRESS_TTS_MESSAGES = [
  "Starting MPPT process now.",
  "MPPT calculation has begun.",
  "Initiating MPPT tracking.",
  "MPPT operation started.",
  "Beginning MPPT computation.",
  "MPPT process is now active.",
  "Starting maximum power point tracking.",
  "MPPT routine has commenced.",
  "Initiated MPPT analysis.",
  "MPPT tracking in progress.",
  "Beginning MPPT sequence.",
  "MPPT has started — please wait.",
  "Launching MPPT procedure.",
  "MPPT calculation underway.",
  "Process initialization complete.",
  "Starting MPPT evaluation.",
  "MPPT algorithm now running.",
  "Commencing MPPT operation.",
  "MPPT tracking initiated.",
  "Beginning processing cycle.",
  "MPPT execution has started.",
  "Now performing MPPT calculation.",
  "MPPT process launched.",
  "Starting point tracking routine.",
  "MPPT analysis in progress.",
  "Initiating computation sequence.",
  "MPPT operation is underway.",
  "Beginning tracking procedure.",
  "MPPT cycle has started.",
  "Process started — one moment.",
];

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileTypeLabel = (fileName) => {
  if (!fileName) return "File";
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map = { pdf: "PDF", csv: "CSV", xlsx: "Excel", txt: "Text" };
  return map[ext] || "File";
};

export default function MpptChatInput({
  sessionId,
  disabled = false,
  onSubmit,
  isUsedInDashboard = false,
  uploadedFiles = [],
  voiceActive = false,
  setVoiceActive = () => {},
  isNarrating = false,
  onStopVoice = () => {},
  setUploadedFiles = () => {},
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const historyRef = useRef(new Array(WAVEFORM_HISTORY).fill(0));
  const frameCountRef = useRef(0);
  // Push a new bar only every FRAME_SKIP frames → controls scroll speed
  const FRAME_SKIP = 16; // ~4 new bars/sec at 60fps → 80 bars = ~20s of history
  const { toast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [isInternetSearch, setIsInternetSearch] = useState(true);
  const [uploadedFileSizes, setUploadedFileSizes] = useState({});

  // Voice recording state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const voiceInputRef = useRef(false); // true when current prompt came from voice transcription

  // Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [voiceSettings, setVoiceSettings] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("mpptVoiceSettings") || "null",
      );
      // Merge saved over defaults so new keys get their defaults
      return saved
        ? { ...DEFAULT_VOICE_SETTINGS, ...saved }
        : DEFAULT_VOICE_SETTINGS;
    } catch {
      return DEFAULT_VOICE_SETTINGS;
    }
  });
  // Stop button visibility is driven by the voiceActive prop from MpptChat
  const [stopState, setStopState] = useState(true);

  const {
    audioRef,
    startTTS,
    stopTTS,
    isPlaying,
    isLoading,
    handleAudioEnded,
  } = useStartTTS({
    stopState,
    onComplete: () => {
      // optional cleanup when audio ends/stops
      setStopState(true);
    },
  });
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);


  const updateVoiceSetting = (key, value) => {
    setVoiceSettings((prev) => {
      // Enforce at least one toggle must remain on
      if (!value) {
        const enabledCount = Object.values(prev).filter(Boolean).length;
        if (enabledCount <= 1 && prev[key]) return prev; // block: would leave none enabled
      }
      const next = { ...prev, [key]: value };
      localStorage.setItem("mpptVoiceSettings", JSON.stringify(next));
      return next;
    });
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const minH = 72;
    const maxH = 160;
    const newH = Math.max(minH, Math.min(textarea.scrollHeight, maxH));
    textarea.style.height = `${newH}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxH ? "auto" : "hidden";
  }, [prompt]);

  // Reset on session change
  useEffect(() => {
    setIsDragging(false);
    setUploadingFiles([]);
    setUploadedFileSizes({});
  }, [sessionId]);

  // ─── Waveform visualizer ────────────────────────────────────────────────────
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    // Ensure canvas is sized (may have been 0 on first call if layout hadn't resolved)
    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width =
        canvas.parentElement?.offsetWidth || canvas.offsetWidth || 600;
      canvas.height =
        canvas.parentElement?.offsetHeight || canvas.offsetHeight || 72;
    }

    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    // Peak amplitude: max deviation from silence (128), normalized to 0-1
    let peak = 0;
    for (let i = 0; i < bufferLength; i++) {
      const abs = Math.abs(dataArray[i] - 128);
      if (abs > peak) peak = abs;
    }
    // 128 = max possible peak; boost small signals so quiet speech is visible
    const normalized = Math.min(1, (peak / 128) * 3);

    // Only push a new bar every FRAME_SKIP frames so bars scroll slowly
    frameCountRef.current += 1;
    if (frameCountRef.current >= FRAME_SKIP) {
      frameCountRef.current = 0;
      historyRef.current.push(normalized);
      if (historyRef.current.length > WAVEFORM_HISTORY) {
        historyRef.current.shift();
      }
    }

    // Draw
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const centerY = H / 2;
    const barW = Math.max(2, Math.floor(W / WAVEFORM_HISTORY) - 1);
    const maxBarH = centerY * 0.88;

    // Dotted center line (full width)
    ctx.save();
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(W, centerY);
    ctx.stroke();
    ctx.restore();

    // Bars
    historyRef.current.forEach((val, i) => {
      const x = i * (W / WAVEFORM_HISTORY) + (W / WAVEFORM_HISTORY - barW) / 2;
      const barH = Math.max(2, val * maxBarH);

      // Gradient: brighter for taller bars
      const alpha = 0.4 + val * 0.6;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;

      // Rounded rect (top half)
      const radius = Math.min(barW / 2, 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, centerY - barH);
      ctx.lineTo(x + barW - radius, centerY - barH);
      ctx.quadraticCurveTo(
        x + barW,
        centerY - barH,
        x + barW,
        centerY - barH + radius,
      );
      ctx.lineTo(x + barW, centerY);
      ctx.lineTo(x, centerY);
      ctx.lineTo(x, centerY - barH + radius);
      ctx.quadraticCurveTo(x, centerY - barH, x + radius, centerY - barH);
      ctx.closePath();
      ctx.fill();

      // Mirror (bottom half)
      ctx.beginPath();
      ctx.moveTo(x, centerY);
      ctx.lineTo(x + barW, centerY);
      ctx.lineTo(x + barW, centerY + barH - radius);
      ctx.quadraticCurveTo(
        x + barW,
        centerY + barH,
        x + barW - radius,
        centerY + barH,
      );
      ctx.lineTo(x + radius, centerY + barH);
      ctx.quadraticCurveTo(x, centerY + barH, x, centerY + barH - radius);
      ctx.closePath();
      ctx.fill();
    });

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  // Once voice mode is active, size the canvas and kick off the draw loop
  useEffect(() => {
    if (!isVoiceMode) return;
    let rafId;
    let observer;

    // Defer one rAF so flex layout has resolved and offsetWidth is non-zero
    rafId = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = canvas.parentElement?.offsetWidth || canvas.offsetWidth || 600;
      const h = canvas.parentElement?.offsetHeight || canvas.offsetHeight || 72;
      canvas.width = w;
      canvas.height = h;

      observer = new ResizeObserver(() => {
        if (!canvasRef.current) return;
        canvasRef.current.width =
          canvasRef.current.parentElement?.offsetWidth ||
          canvasRef.current.offsetWidth ||
          600;
        canvasRef.current.height =
          canvasRef.current.parentElement?.offsetHeight ||
          canvasRef.current.offsetHeight ||
          72;
      });
      observer.observe(canvas);

      animationFrameRef.current = requestAnimationFrame(drawWaveform);
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isVoiceMode, drawWaveform]);

  // Tear down audio resources
  const tearDownAudio = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Start voice recording — getUserMedia gives us the stream immediately with tracks
  const handleMicStart = useCallback(async () => {
    setVoiceActive(true);
    if (disabled || isSubmitting) return;

    // Guard: browser support
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }
    if (!window.MediaRecorder) {
      toast({
        title: "Not Supported",
        description: "Audio recording is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const messages = {
        NotAllowedError:
          "Microphone access was denied. Please allow mic access in your browser settings.",
        PermissionDeniedError:
          "Microphone access was denied. Please allow mic access in your browser settings.",
        NotFoundError:
          "No microphone found. Please connect a microphone and try again.",
        NotReadableError:
          "Microphone is already in use by another application.",
        OverconstrainedError:
          "Microphone does not meet the required constraints.",
      };
      toast({
        title: "Microphone Error",
        description:
          messages[err.name] || err.message || "Could not access microphone.",
        variant: "destructive",
      });
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    historyRef.current = new Array(WAVEFORM_HISTORY).fill(0);
    frameCountRef.current = 0;

    // Set up AudioContext visualizer now that the stream has tracks
    let audioCtx;
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtxClass();
      // Some browsers start context in suspended state — resume it
      if (audioCtx.state === "suspended") await audioCtx.resume();
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop());
      toast({
        title: "Audio Error",
        description: "Could not initialize audio processing.",
        variant: "destructive",
      });
      return;
    }
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;

    // Set up MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch (err) {
      tearDownAudio();
      toast({
        title: "Recording Error",
        description: "Could not start recording. Try a different browser.",
        variant: "destructive",
      });
      return;
    }

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      tearDownAudio();
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      if (blob.size === 0) {
        toast({
          title: "No Audio",
          description: "Recording was empty. Please try again.",
          variant: "destructive",
        });
        setIsVoiceMode(false);
        return;
      }

      const file = new File([blob], "recording.webm", { type: mimeType });
      setIsTranscribing(true);
      try {
        const response = await TTS(file);
        if (response.success) {
          setPrompt(response.data);
          voiceInputRef.current = true; // flag: this prompt came from voice
        } else {
          toast({
            title: "Transcription Failed",
            description: response.message || "Could not transcribe audio.",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Transcription Error",
          description: err.message || "Something went wrong.",
          variant: "destructive",
        });
      } finally {
        setIsTranscribing(false);
        setIsVoiceMode(false);
      }
    };
    // Handle unexpected recorder errors
    recorder.onerror = (e) => {
      tearDownAudio();
      setIsVoiceMode(false);
      toast({
        title: "Recording Error",
        description:
          e.error?.message || "An unexpected recording error occurred.",
        variant: "destructive",
      });
    };
    // timeslice=100ms ensures ondataavailable fires regularly,
    // so chunks are populated before onstop is called
    recorder.start(100);
    mediaRecorderRef.current = recorder;

    // setIsVoiceMode(true) triggers the useEffect that mounts the canvas
    // and starts the draw loop — do NOT call requestAnimationFrame here
    setIsVoiceMode(true);
  }, [disabled, isSubmitting, toast, tearDownAudio, drawWaveform]);

  // Confirm: stop recording → onstop will transcribe
  const handleVoiceConfirm = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  // Cancel: stop recording, discard audio
  const handleVoiceCancel = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null; // suppress transcription
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    tearDownAudio();
    chunksRef.current = [];
    historyRef.current = new Array(WAVEFORM_HISTORY).fill(0);
    frameCountRef.current = 0;
    setIsVoiceMode(false);
  }, [tearDownAudio]);

  // ─── File handling ──────────────────────────────────────────────────────────
  const uploadedBytes = Object.values(uploadedFileSizes).reduce(
    (sum, s) => sum + s,
    0,
  );
  const uploadingBytes = uploadingFiles.reduce(
    (sum, f) => sum + (f.file?.size || 0),
    0,
  );
  const totalUsedBytes = uploadedBytes + uploadingBytes;
  const totalFileCount = uploadedFiles.length + uploadingFiles.length;

  const isAtSizeLimit = totalUsedBytes >= MAX_TOTAL_BYTES;
  const isAtCountLimit = totalFileCount >= MAX_FILES;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFiles(files);
  };
  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFiles(files);
    e.target.value = "";
  };

  const validateFile = (file) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext))
      return `${file.name}: Only PDF, CSV, Excel, and TXT files are supported`;
    return null;
  };

  const handleFiles = useCallback(
    async (files) => {
      if (!sessionId) {
        toast({
          title: "Session Required",
          description: "Please start a session first",
          variant: "destructive",
        });
        return;
      }
      const availableSlots = MAX_FILES - totalFileCount;
      if (availableSlots <= 0) {
        toast({
          title: "File Limit Reached",
          description: `You can upload a maximum of ${MAX_FILES} files. Remove a file to add another.`,
          variant: "destructive",
        });
        return;
      }
      const incoming = files.slice(0, availableSlots);
      if (incoming.length < files.length) {
        toast({
          title: "Some Files Skipped",
          description: `Only ${availableSlots} slot${availableSlots !== 1 ? "s" : ""} remaining. ${files.length - incoming.length} file${files.length - incoming.length !== 1 ? "s were" : " was"} skipped.`,
          variant: "destructive",
        });
      }
      const incomingBytes = incoming.reduce((sum, f) => sum + f.size, 0);
      if (totalUsedBytes + incomingBytes > MAX_TOTAL_BYTES) {
        const remaining = MAX_TOTAL_BYTES - totalUsedBytes;
        toast({
          title: "Storage Limit Exceeded",
          description:
            remaining > 0
              ? `Only ${formatBytes(remaining)} remaining (50 MB total limit). Your files add ${formatBytes(incomingBytes)}.`
              : "You have reached the 50 MB total file size limit. Remove a file to upload more.",
          variant: "destructive",
        });
        return;
      }
      const validFiles = [];
      for (const file of incoming) {
        const err = validateFile(file);
        if (err) {
          toast({
            title: "Invalid File",
            description: err,
            variant: "destructive",
          });
        } else {
          validFiles.push(file);
        }
      }
      if (validFiles.length === 0) return;

      const newUploading = validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        fileName: file.name,
        progress: 0,
        status: "uploading",
      }));
      setUploadingFiles((prev) => [...prev, ...newUploading]);

      for (const fileData of newUploading) {
        try {
          const uploadRes = await vectorizeMpptDocument(
            fileData.file,
            sessionId,
            (progress) => {
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === fileData.id ? { ...f, progress } : f,
                ),
              );
            },
          );
          if (uploadRes.success) {
            setUploadingFiles((prev) =>
              prev.filter((f) => f.id !== fileData.id),
            );
            setUploadedFiles((prev) => [fileData.fileName, ...prev]);
            setUploadedFileSizes((prev) => ({
              ...prev,
              [fileData.fileName]: fileData.file.size,
            }));
          } else {
            throw new Error(uploadRes.message || "Upload failed");
          }
        } catch (error) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id
                ? { ...f, status: "failed", error: error.message }
                : f,
            ),
          );
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${fileData.fileName}`,
            variant: "destructive",
          });
        }
      }
    },
    [sessionId, totalFileCount, totalUsedBytes, setUploadedFiles, toast],
  );

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    console.log("Submitting voice input with prompt:", prompt, isVoiceMode);
    if (voiceActive) {
      const randomMessage =
        MPPT_PROGRESS_TTS_MESSAGES[
          Math.floor(Math.random() * MPPT_PROGRESS_TTS_MESSAGES.length)
        ];
      startTTS(randomMessage);
    }
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
      toast({
        title: "Message Too Long",
        description: `Keep it under ${MAX_PROMPT_LENGTH} characters`,
        variant: "destructive",
      });
      return;
    }
    if (!trimmedPrompt && uploadedFiles.length === 0) {
      toast({
        title: "Empty Message",
        description: "Please enter a message or upload files",
        variant: "destructive",
      });
      return;
    }
    const isUploading = uploadingFiles.some((f) => f.status === "uploading");
    if (isUploading) {
      toast({
        title: "Please Wait",
        description: "Files are still uploading",
        variant: "default",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const isVoice = voiceInputRef.current;
      voiceInputRef.current = false; // reset before navigating away
      await onSubmit({ prompt: trimmedPrompt, isInternetSearch, isVoice });
      setPrompt("");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isSubmitting && !disabled) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = prompt.trim() || uploadedFiles.length > 0;
  const isUploading = uploadingFiles.some((f) => f.status === "uploading");
  const isDisabled = disabled || isSubmitting;

  return (
    <div className="w-full max-w-[770px] mx-auto px-0">
      <div
        className={`relative bg-gradient-to-t from-g1 to-g2 rounded-2xl sm:rounded-3xl transition-all ${
          isDragging ? "ring-2 ring-blue-500 bg-blue-500/10" : ""
        } ${isDisabled ? "opacity-70" : ""}`}
        onDragOver={!isDisabled && !isVoiceMode ? handleDragOver : undefined}
        onDragLeave={!isDisabled && !isVoiceMode ? handleDragLeave : undefined}
        onDrop={!isDisabled && !isVoiceMode ? handleDrop : undefined}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10 pointer-events-none">
            <span className="text-white font-medium text-lg">
              Drop files here
            </span>
          </div>
        )}

        <div className="px-3 pt-3 pb-2 sm:px-4">
          {/* File badges */}
          {!isVoiceMode &&
            (uploadedFiles.length > 0 || uploadingFiles.length > 0) && (
              <div className="flex gap-2 items-center w-full overflow-x-auto hide-scrollbar flex-nowrap mb-3">
                {uploadingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center rounded-2xl w-fit bg-blue-950 flex-shrink-0"
                  >
                    <div className="p-2 pl-3">
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    </div>
                    <div className="flex items-center gap-2 py-2 pr-3">
                      <span className="text-white text-xs min-w-max">
                        {file.fileName}
                        <p className="text-slate-400">{file.progress}%</p>
                      </span>
                    </div>
                  </div>
                ))}
                {uploadedFiles.map((fileName, idx) => (
                  <div
                    key={`${fileName}-${idx}`}
                    className="flex items-center rounded-2xl w-fit bg-blue-950 flex-shrink-0"
                  >
                    <div className="p-2 pl-3">
                      <Folder className="w-4 h-4 text-blue-300" />
                    </div>
                    <div className="flex items-center gap-1 py-2 pr-3">
                      <span className="text-white text-xs min-w-max">
                        {fileName}
                        <p className="text-slate-400">
                          {getFileTypeLabel(fileName)}
                        </p>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* Limit warnings */}
          {!isVoiceMode && (isAtSizeLimit || isAtCountLimit) && (
            <div className="mb-3 flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>
                {isAtSizeLimit && isAtCountLimit
                  ? "File limit and storage limit reached. Remove files to add more."
                  : isAtSizeLimit
                    ? "50 MB storage limit reached. Remove a file to upload more."
                    : `Maximum ${MAX_FILES} files reached. Remove a file to upload more.`}
              </span>
            </div>
          )}

          {/* Voice mode: waveform */}
          {isVoiceMode ? (
            <div
              className="flex items-center gap-2 w-full"
              style={{ minHeight: 60 }}
            >
              {isTranscribing ? (
                <div
                  className="flex-1 flex items-center justify-center gap-2"
                  style={{ minHeight: 60 }}
                >
                  <LoaderCircle className="w-4 h-4 animate-spin text-white" />
                  <span className="text-white text-sm">Transcribing...</span>
                </div>
              ) : (
                <>
                  <div
                    className="flex-1 relative overflow-hidden"
                    style={{ height: 60 }}
                  >
                    <canvas ref={canvasRef} className="w-full h-full" />
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={handleVoiceCancel}
                      className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      title="Cancel"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={handleVoiceConfirm}
                      className="p-1.5 sm:p-2 rounded-lg text-white bg-white/15 hover:bg-white/25 transition-all"
                      title="Done"
                    >
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Normal text input */
            <>
              <textarea
                ref={textareaRef}
                className="bg-transparent outline-none border-none w-full text-white resize-none leading-relaxed break-words whitespace-pre-wrap placeholder:text-gray-400 text-sm sm:text-base"
                placeholder={
                  isDisabled
                    ? "Analyzing..."
                    : isUsedInDashboard
                      ? "Ask MPPT anything..."
                      : "Ask a follow-up question..."
                }
                value={prompt}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_PROMPT_LENGTH)
                    setPrompt(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                disabled={isDisabled}
                rows={2}
                maxLength={MAX_PROMPT_LENGTH}
              />

              {prompt.length > MAX_PROMPT_LENGTH * 0.8 && (
                <div
                  className={`text-xs text-right mt-1 ${prompt.length >= MAX_PROMPT_LENGTH ? "text-red-400" : "text-yellow-400"}`}
                >
                  {prompt.length}/{MAX_PROMPT_LENGTH}
                </div>
              )}
            </>
          )}

          {/* Bottom toolbar */}
          {!isVoiceMode && (
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10">
              {/* Left: Paperclip + Web + Settings + Prompt Library */}
              <div className="flex items-center gap-1 min-w-0">
                {/* File upload */}
                <label
                  className={`p-2 rounded-lg transition-all flex-shrink-0 text-gray-400 hover:text-white hover:bg-white/10 ${
                    isDisabled || isAtCountLimit || isAtSizeLimit
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                  title={
                    isAtCountLimit
                      ? `Maximum ${MAX_FILES} files reached`
                      : isAtSizeLimit
                        ? "50 MB storage limit reached"
                        : "Upload PDF, CSV, Excel, or TXT"
                  }
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept={ACCEPTED_TYPES}
                    onChange={handleFileInput}
                    disabled={isDisabled || isAtCountLimit || isAtSizeLimit}
                  />
                  <Paperclip className="w-4 h-4" />
                </label>

                {/* Web Search */}
                <button
                  onClick={() => !isDisabled && setIsInternetSearch((v) => !v)}
                  className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                    isInternetSearch
                      ? "text-blue-400 hover:text-blue-300 hover:bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  title={isInternetSearch ? "Web search on" : "Web search off"}
                >
                  <Globe className="w-4 h-4" />
                </button>

                {/* Settings */}
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                  title="Voice settings"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>

                {/* Prompt Library */}
                <button
                  onClick={() => setIsPromptLibraryOpen(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                  title="Open Prompt Library"
                  type="button"
                >
                  <Anvil className="w-4 h-4" />
                </button>
              </div>

              {/* Right: Stop (conditional) + Send/AudioLines */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                {/* Stop — only while speech is actively playing */}
                {voiceActive && isNarrating && (
                  <button
                    onClick={onStopVoice}
                    className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                    title="Stop voice"
                  >
                    <Square className="w-3 h-3 fill-current flex-shrink-0" />
                    <span className="hidden sm:inline">Stop</span>
                  </button>
                )}

                {/* Send / AudioLines — based on typed text only, not files */}
                {prompt.trim() ? (
                  <button
                    className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                      !isUploading && !isDisabled
                        ? "bg-white hover:bg-gray-100 text-black"
                        : "bg-white/20 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={isUploading || isDisabled}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <button
                    className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                      isDisabled
                        ? "bg-white/20 text-gray-500 cursor-not-allowed"
                        : "bg-white hover:bg-gray-100 text-black"
                    }`}
                    disabled={isDisabled}
                    onClick={isDisabled ? undefined : handleMicStart}
                    title="Voice input"
                  >
                    <AudioLines className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Settings — Dialog on desktop, Drawer on mobile */}
      {isMobile ? (
        <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DrawerContent
            style={{
              background: "#0d1117",
              borderColor: "rgba(255,255,255,0.08)",
            }}
            className="text-white"
          >
            <DrawerHeader className="pb-2 border-b border-white/10">
              <DrawerTitle className="text-white text-base">
                Voice Settings
              </DrawerTitle>
            </DrawerHeader>
            <VoiceSettingsBody
              settings={voiceSettings}
              onChange={updateVoiceSetting}
            />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent
            style={{
              background: "#0d1117",
              borderColor: "rgba(255,255,255,0.08)",
            }}
            className="text-white sm:max-w-sm"
          >
            <DialogHeader className="border-b border-white/10 pb-3">
              <DialogTitle className="text-white text-base">
                Voice Settings
              </DialogTitle>
            </DialogHeader>
            <VoiceSettingsBody
              settings={voiceSettings}
              onChange={updateVoiceSetting}
            />
          </DialogContent>
        </Dialog>
      )}
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />

      {/* Prompt Library */}
      <PromptLibrary
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        warnAtLength={MAX_PROMPT_LENGTH}
        onImportPrompt={(prompt) => {
          setPrompt(prompt.output || "");
          toast({
            title: "Prompt imported",
            description: `"${prompt.promptName || "Untitled"}" has been imported to the input field.`,
          });
        }}
      />
    </div>
  );
}

function VoiceSettingsBody({ settings, onChange }) {
  const options = [
    {
      key: "reasoning",
      label: "Voice with Reasoning",
      description: "Include chain-of-thought reasoning",
    },
    {
      key: "answer",
      label: "Voice with Answer",
      description: "Include the direct answer",
    },
    {
      key: "keyDecision",
      label: "Voice with Key Decision",
      description: "Include key decisions extracted",
    },
  ];

  const enabledCount = Object.values(settings).filter(Boolean).length;

  return (
    <div className="px-4 py-5 space-y-5">
      {options.map(({ key, label, description }) => {
        const isOn = !!settings[key];
        const isLastOn = isOn && enabledCount === 1;
        return (
          <div key={key} className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label
                htmlFor={`vs-${key}`}
                className={`text-sm font-medium cursor-pointer ${isOn ? "text-white" : "text-gray-400"}`}
              >
                {label}
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              {isLastOn && (
                <p className="text-xs text-amber-400/80 mt-1">
                  At least one option must stay enabled
                </p>
              )}
            </div>
            <Switch
              id={`vs-${key}`}
              checked={isOn}
              disabled={isLastOn}
              onCheckedChange={(v) => onChange(key, v)}
              className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-white/15 disabled:opacity-40 [&>span]:bg-white [&>span]:shadow-sm"
            />
          </div>
        );
      })}
    </div>
  );
}
