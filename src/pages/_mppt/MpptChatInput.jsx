import { Paperclip, Send, LoaderCircle, Loader2, Folder, Globe, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { vectorizeMpptDocument } from "@/services/mppt/mppt.api";

const ACCEPTED_TYPES = ".pdf,.csv,.xlsx,.txt";
const ACCEPTED_EXTENSIONS = ["pdf", "csv", "xlsx", "txt"];
const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB total
const MAX_PROMPT_LENGTH = 5000;

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
    setUploadedFiles = () => {},
}) {
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const { toast } = useToast();

    const [prompt, setPrompt] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState([]);
    const [isInternetSearch, setIsInternetSearch] = useState(true);
    // tracks size (bytes) of each successfully uploaded file by fileName
    const [uploadedFileSizes, setUploadedFileSizes] = useState({});

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

    // Total bytes used: uploaded + currently uploading
    const uploadedBytes = Object.values(uploadedFileSizes).reduce((sum, s) => sum + s, 0);
    const uploadingBytes = uploadingFiles.reduce((sum, f) => sum + (f.file?.size || 0), 0);
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
        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
            return `${file.name}: Only PDF, CSV, Excel, and TXT files are supported`;
        }
        return null;
    };

    const handleFiles = useCallback(async (files) => {
        if (!sessionId) {
            toast({ title: "Session Required", description: "Please start a session first", variant: "destructive" });
            return;
        }

        // Count check
        const availableSlots = MAX_FILES - totalFileCount;
        if (availableSlots <= 0) {
            toast({
                title: "File Limit Reached",
                description: `You can upload a maximum of ${MAX_FILES} files. Remove a file to add another.`,
                variant: "destructive",
            });
            return;
        }

        // Clamp incoming files to available slots
        const incoming = files.slice(0, availableSlots);
        if (incoming.length < files.length) {
            toast({
                title: "Some Files Skipped",
                description: `Only ${availableSlots} slot${availableSlots !== 1 ? "s" : ""} remaining. ${files.length - incoming.length} file${files.length - incoming.length !== 1 ? "s were" : " was"} skipped.`,
                variant: "destructive",
            });
        }

        // Total size check
        const incomingBytes = incoming.reduce((sum, f) => sum + f.size, 0);
        if (totalUsedBytes + incomingBytes > MAX_TOTAL_BYTES) {
            const remaining = MAX_TOTAL_BYTES - totalUsedBytes;
            toast({
                title: "Storage Limit Exceeded",
                description: remaining > 0
                    ? `Only ${formatBytes(remaining)} remaining (50 MB total limit). Your files add ${formatBytes(incomingBytes)}.`
                    : "You have reached the 50 MB total file size limit. Remove a file to upload more.",
                variant: "destructive",
            });
            return;
        }

        // Type validation per file
        const validFiles = [];
        for (const file of incoming) {
            const err = validateFile(file);
            if (err) {
                toast({ title: "Invalid File", description: err, variant: "destructive" });
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
                            prev.map((f) => (f.id === fileData.id ? { ...f, progress } : f))
                        );
                    }
                );

                if (uploadRes.success) {
                    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileData.id));
                    setUploadedFiles((prev) => [fileData.fileName, ...prev]);
                    setUploadedFileSizes((prev) => ({ ...prev, [fileData.fileName]: fileData.file.size }));
                } else {
                    throw new Error(uploadRes.message || "Upload failed");
                }
            } catch (error) {
                setUploadingFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileData.id ? { ...f, status: "failed", error: error.message } : f
                    )
                );
                toast({
                    title: "Upload Failed",
                    description: `Failed to upload ${fileData.fileName}`,
                    variant: "destructive",
                });
            }
        }
    }, [sessionId, totalFileCount, totalUsedBytes, setUploadedFiles, toast]);

    const handleSubmit = async () => {
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
            toast({ title: "Empty Message", description: "Please enter a message or upload files", variant: "destructive" });
            return;
        }

        const isUploading = uploadingFiles.some((f) => f.status === "uploading");
        if (isUploading) {
            toast({ title: "Please Wait", description: "Files are still uploading", variant: "default" });
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ prompt: trimmedPrompt, isInternetSearch });
            setPrompt("");
        } catch (error) {
            toast({ title: "Error", description: error.message || "Something went wrong", variant: "destructive" });
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
        <div className="w-full max-w-[770px] mx-auto">
            <div
                className={`relative bg-gradient-to-t from-g1 to-g2 rounded-3xl transition-all ${
                    isDragging ? "ring-2 ring-blue-500 bg-blue-500/10" : ""
                } ${isDisabled ? "opacity-70" : ""}`}
                onDragOver={!isDisabled ? handleDragOver : undefined}
                onDragLeave={!isDisabled ? handleDragLeave : undefined}
                onDrop={!isDisabled ? handleDrop : undefined}
            >
                {isDragging && (
                    <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10 pointer-events-none">
                        <span className="text-white font-medium text-lg">Drop files here</span>
                    </div>
                )}

                <div className="px-4 pt-3 pb-2">
                    {/* File badges */}
                    {(uploadedFiles.length > 0 || uploadingFiles.length > 0) && (
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
                                            <p className="text-slate-400">{getFileTypeLabel(fileName)}</p>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Limit warnings — only shown when a limit is actually hit */}
                    {(isAtSizeLimit || isAtCountLimit) && (
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

                    <textarea
                        ref={textareaRef}
                        className="bg-transparent outline-none border-none w-full text-white resize-none leading-relaxed break-words whitespace-pre-wrap placeholder:text-gray-400"
                        placeholder={
                            isDisabled
                                ? "Analyzing..."
                                : isUsedInDashboard
                                ? "Ask MPPT to research and analyze anything... (e.g., Should I invest in Tesla stock?)"
                                : "Ask a follow-up question..."
                        }
                        value={prompt}
                        onChange={(e) => {
                            if (e.target.value.length <= MAX_PROMPT_LENGTH) setPrompt(e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={isDisabled}
                        rows={3}
                        maxLength={MAX_PROMPT_LENGTH}
                    />

                    {prompt.length > MAX_PROMPT_LENGTH * 0.8 && (
                        <div className={`text-xs text-right mt-1 ${prompt.length >= MAX_PROMPT_LENGTH ? "text-red-400" : "text-yellow-400"}`}>
                            {prompt.length}/{MAX_PROMPT_LENGTH}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10">
                        <div className="flex items-center gap-1">
                            {/* File upload button */}
                            <label
                                className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
                                    isDisabled || isAtCountLimit || isAtSizeLimit
                                        ? "cursor-not-allowed opacity-50"
                                        : "cursor-pointer"
                                }`}
                                title={
                                    isAtCountLimit
                                        ? `Maximum ${MAX_FILES} files reached`
                                        : isAtSizeLimit
                                        ? "50 MB storage limit reached"
                                        : "Upload PDF, CSV, Excel, or TXT (max 10 files, 50 MB total)"
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
                                <Paperclip className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                            </label>

                            {/* Internet search toggle */}
                            <button
                                onClick={() => !isDisabled && setIsInternetSearch((v) => !v)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                    isInternetSearch
                                        ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                        : "bg-white/5 text-gray-500 hover:bg-white/10"
                                } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                title={isInternetSearch ? "Internet search enabled" : "Internet search disabled"}
                            >
                                <Globe className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Web Search</span>
                            </button>
                        </div>

                        <button
                            className={`p-2 rounded-lg transition-all ${
                                hasContent && !isUploading && !isDisabled
                                    ? "bg-white hover:bg-gray-100 text-black"
                                    : "bg-white/20 text-gray-500 cursor-not-allowed"
                            }`}
                            disabled={!hasContent || isUploading || isDisabled}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? (
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
