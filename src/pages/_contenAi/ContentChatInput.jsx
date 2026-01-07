import { Paperclip, Send, X, FileIcon, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  startContentTask,
  uploadFileToBackend,
} from "@/services/contentAi/contentAi.api";
import { getNewSession } from "@/services/n8n-apis/_core/getNewSession.api";

// Helper function to get file type label from file name
const getFileTypeLabel = (fileName) => {
  if (!fileName) return "Document";
  const extension = fileName.split(".").pop()?.toLowerCase();
  const typeMap = {
    pdf: "PDF",
    doc: "Word",
    docx: "Word",
    txt: "Text",
    rtf: "RTF",
    xls: "Excel",
    xlsx: "Excel",
    csv: "CSV",
    ppt: "PPT",
    pptx: "PPT",
    key: "Keynote",
    zip: "Archive",
    rar: "Archive",
    png: "Image",
    jpg: "Image",
    jpeg: "Image",
    gif: "GIF",
    webp: "Image",
    svg: "SVG",
    md: "Markdown",
    json: "JSON",
    xml: "XML",
  };
  return typeMap[extension] || "File";
};

export default function ContentChatInput({
  isUsedInDashboard = false,
  onMessageSent,
  disabled = false,
}) {
  const sid = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  // Session ID management
  useEffect(() => {
    if (isUsedInDashboard) {
      sid.current = crypto.randomUUID();
    } else {
      sid.current = routeSessionId;
    }
  }, [routeSessionId, isUsedInDashboard]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 160;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [prompt]);

  // Drag and drop handlers
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
    e.target.value = ""; // Reset input so same file can be selected again
  };

  // Process and upload files
  const handleFiles = useCallback(
    async (files) => {
      if (files.length === 0) return;

      const newFiles = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "uploading",
      }));

      setUploadingFiles((prev) => [...prev, ...newFiles]);

      for (const fileData of newFiles) {
        try {
          const uploadRes = await uploadFileToBackend(
            fileData.file,
            sid.current,
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
              prev.map((f) =>
                f.id === fileData.id
                  ? { ...f, status: "completed", progress: 100 }
                  : f,
              ),
            );
          } else {
            throw new Error(uploadRes.message || "Upload failed");
          }
        } catch (error) {
          console.error("File upload error:", error);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id
                ? { ...f, status: "failed", error: error.message }
                : f,
            ),
          );
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${fileData.name}`,
            variant: "destructive",
          });
        }
      }
    },
    [toast],
  );

  const removeFile = (fileId) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = async () => {
    const trimmedPrompt = prompt.trim();
    const completedFiles = uploadingFiles.filter(
      (f) => f.status === "completed",
    );

    if (!trimmedPrompt && completedFiles.length === 0) {
      toast({
        title: "Empty Message",
        description: "Please enter a message or upload files",
        variant: "destructive",
      });
      return;
    }

    if (uploadingFiles.some((f) => f.status === "uploading")) {
      toast({
        title: "Please Wait",
        description: "Files are still uploading",
        variant: "default",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isUsedInDashboard) {
        const res = await getNewSession(
          trimmedPrompt,
          localStorage.getItem("id"),
          sid.current,
        );
        if (res.success) {
          localStorage.setItem("contentAiPrompt", trimmedPrompt);
          navigate(`/content-ai/chat/${sid.current}`);
        } else {
          throw new Error(res.message || "Failed to create session");
        }
      } else {
        const res = await startContentTask(sid.current, trimmedPrompt);
        if (res.success) {
          setPrompt("");
          setUploadingFiles([]);
          onMessageSent?.();
        } else {
          throw new Error(res.message || "Failed to send message");
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
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

  const hasContent =
    prompt.trim() ||
    uploadingFiles.filter((f) => f.status === "completed").length > 0;
  const isUploading = uploadingFiles.some((f) => f.status === "uploading");
  const isDisabled = disabled || isSubmitting;

  return (
    <div className="w-full max-w-[720px] mx-auto">
      {/* Uploaded Files Display */}
      {uploadingFiles.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-2 hide-scrollbar">
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm shrink-0 ${
                file.status === "uploading"
                  ? "bg-blue-500/20 border border-blue-500/30"
                  : file.status === "completed"
                    ? "bg-green-500/20 border border-green-500/30"
                    : "bg-red-500/20 border border-red-500/30"
              }`}
            >
              {file.status === "uploading" ? (
                <LoaderCircle className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
              ) : file.status === "completed" ? (
                <FileIcon className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <FileIcon className="w-4 h-4 text-red-400 shrink-0" />
              )}

              <div className="flex flex-col min-w-0">
                <span className="text-white text-xs truncate max-w-[120px]">
                  {file.name}
                </span>
                <span className="text-[10px] text-gray-400">
                  {file.status === "uploading"
                    ? `${file.progress}%`
                    : file.status === "completed"
                      ? getFileTypeLabel(file.name)
                      : "Failed"}
                </span>
              </div>

              {file.status !== "uploading" && (
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0"
                  disabled={isDisabled}
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Container */}
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
            <span className="text-white font-medium text-lg">
              Drop files here
            </span>
          </div>
        )}

        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            className="bg-transparent outline-none border-none w-full text-white resize-none leading-relaxed break-words whitespace-pre-wrap placeholder:text-gray-400"
            placeholder={
              isDisabled
                ? "Generating response..."
                : isUsedInDashboard
                  ? "What would you like to create? (e.g., Generate a report on Tesla stock)"
                  : "Type your message..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            rows={1}
          />

          {/* Controls */}
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10">
            <div className="flex items-center gap-1">
              <label
                className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.gif,.webp,.csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  disabled={isDisabled}
                />
                <Paperclip className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </label>
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
