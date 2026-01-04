import { useParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import {
  startContentTask,
  pollContentTask,
  uploadFileToBackend,
} from "@/services/contentAi/contentAi.api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, X, FileIcon, Send, LoaderCircle, Presentation } from "lucide-react";
import LoadingAnimation from "@/components/custom/Loading";
import MarkdownRenderer from "../_private/components/sidebarProvided/components/AnimatedMarkdown";
import Presentations from "./formatShowcase/Presentation";

// Helper function to get file type label from file name
const getFileTypeLabel = (fileName) => {
  if (!fileName) return "Document";

  const extension = fileName.split(".").pop()?.toLowerCase();

  const typeMap = {
    // Documents
    pdf: "PDF",
    doc: "Word Document",
    docx: "Word Document",
    txt: "Text File",
    rtf: "Rich Text",

    // Spreadsheets
    xls: "Excel",
    xlsx: "Excel",
    csv: "CSV",

    // Presentations
    ppt: "Presentation",
    pptx: "Presentation",
    key: "Keynote",

    // Archives
    zip: "Archive",
    rar: "Archive",
    "7z": "Archive",
    tar: "Archive",
    gz: "Archive",

    // Images
    png: "Image",
    jpg: "Image",
    jpeg: "Image",
    gif: "Image",
    webp: "Image",
    svg: "Image",
    bmp: "Image",

    // Other
    md: "Markdown",
    json: "JSON",
    xml: "XML",
  };

  return typeMap[extension] || "Document";
};

export default function ContentChat() {
  const { sessionId } = useParams();
  const { toast } = useToast();

  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [isTaskRunning, setIsTaskRunning] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [taskStatus, setTaskStatus] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const hasLoadedHistory = useRef(false);

  // Load previous conversation and files when component mounts
  useEffect(() => {
    const loadHistory = async () => {
      if (hasLoadedHistory.current) return;
      hasLoadedHistory.current = true;

      try {
        setIsLoadingHistory(true);
        const res = await pollContentTask(sessionId);

        if (res.success && res.data) {
          const { data, taskStatus: status, files, metadata } = res.data;

          // Load previous messages
          if (data && Array.isArray(data)) {
            setMessages(data);
          }

          // Load uploaded files list
          if (files && Array.isArray(files)) {
            setUploadedFiles(files);
          }

          // Set task status
          setTaskStatus(status);

          // If task is still running, start polling
          if (status === "running") {
            setIsTaskRunning(true);
            await startPolling();
          }
        }
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [sessionId]);

  // Load initial prompt from localStorage if available (for new chats)
  useEffect(() => {
    const initialPrompt = localStorage.getItem("contentAiPrompt");
    if (initialPrompt && messages.length === 0 && !isLoadingHistory) {
      localStorage.removeItem("contentAiPrompt");
      handleSubmit(initialPrompt);
    }
  }, [isLoadingHistory]);

  // Polling function
  const startPolling = useCallback(async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = async () => {
      try {
        const res = await pollContentTask(sessionId);
        if (res.success && res.data) {
          const { data, taskStatus: status, files, metadata } = res.data;

          setTaskStatus(status);

          if (data && Array.isArray(data)) {
            setMessages(data);
          }

          // Update files list
          if (files && Array.isArray(files)) {
            setUploadedFiles(files);
          }

          // Stop polling if task is completed
          if (status === "completed") {
            setIsTaskRunning(false);
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

    // Poll immediately, then every 1 second
    await poll();
    pollIntervalRef.current = setInterval(poll, 1000);
  }, [sessionId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    handleFiles(files);
  };

  // Process files
  const handleFiles = async (files) => {
    if (files.length === 0) return;

    // Initialize uploading state for each file
    const newUploadingFiles = files.map((file) => ({
      file,
      name: file.name,
      progress: 0,
      status: "uploading",
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // Upload each file with the same sessionId
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileIndex = uploadingFiles.length + i;

      try {
        // Upload file to backend with sessionId
        const uploadRes = await uploadFileToBackend(
          file,
          sessionId,
          (progress) => {
            setUploadingFiles((prev) =>
              prev.map((f, idx) =>
                idx === fileIndex ? { ...f, progress } : f,
              ),
            );
          },
        );

        if (uploadRes.success) {
          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "completed" } : f,
            ),
          );
        } else {
          throw new Error(uploadRes.message);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex
              ? { ...f, status: "failed", error: error.message }
              : f,
          ),
        );
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }
  };

  // Remove uploading/uploaded file
  const removeFile = (index) => {
    setUploadingFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Handle submit
  const handleSubmit = async (overridePrompt = null) => {
    const finalPrompt = overridePrompt || prompt;

    if (!finalPrompt.trim() && uploadingFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please enter a prompt or upload files",
        variant: "destructive",
      });
      return;
    }

    // Check if any files are still uploading
    if (uploadingFiles.some((f) => f.status === "uploading")) {
      toast({
        title: "Please wait",
        description: "Files are still uploading",
        variant: "default",
      });
      return;
    }

    try {
      setIsTaskRunning(true);

      // Start task (backend already has the uploaded files linked to sessionId)
      const res = await startContentTask(sessionId, finalPrompt.trim());

      if (res.success) {
        // Clear input and files
        setPrompt("");
        setUploadingFiles([]);

        // Start polling
        await startPolling();
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
      console.error("Error starting task:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start task",
        variant: "destructive",
      });
      setIsTaskRunning(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isTaskRunning) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Show loading state while fetching history
  if (isLoadingHistory) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="w-8 h-8 animate-spin" />
          <p className="text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="flex flex-col h-screen max-w-3xl w-full">
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isTaskRunning && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Start a conversation by typing a message below</p>
            </div>
          )}

          {messages.map((message, idx) => (
            <MessageBlock key={idx} message={message} />
          ))}

          {isTaskRunning && taskStatus !== "completed" && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-lg p-4 max-w-[80%]">
                <LoadingAnimation currentQuote="Generating content" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input container */}
        <div className="border-t border-gray-700 p-4">
          {/* Uploaded files and uploading files display */}
          {(uploadedFiles.length > 0 || uploadingFiles.length > 0) && (
            <div className="flex gap-2 ml-2 items-center w-full overflow-x-auto scroll-smooth hide-scrollbar flex-nowrap">
              {/* Display already uploaded files */}
              {uploadedFiles.map((fileName, idx) => (
                <div
                  key={`uploaded-${idx}`}
                  className="flex mt-3 items-center rounded-2xl justify-between mb-2 w-fit bg-slate-800"
                >
                  <div className="p-2 pl-3">
                    <FileIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex items-center gap-2 py-2 pr-4">
                    <span className="text-white text-xs h-full min-w-max">
                      {fileName}
                      <p className="text-slate-400">
                        {getFileTypeLabel(fileName)}
                      </p>
                    </span>
                  </div>
                </div>
              ))}

              {/* Display currently uploading files */}
              {uploadingFiles.map((file, idx) => (
                <div
                  key={`uploading-${idx}`}
                  className="flex mt-3 items-center rounded-2xl justify-between mb-2 w-fit bg-slate-800"
                >
                  <div className="p-2 pl-3">
                    {file.status === "uploading" ? (
                      <LoaderCircle className="w-5 h-5 text-blue-400 animate-spin" />
                    ) : file.status === "completed" ? (
                      <FileIcon className="w-5 h-5 text-green-400" />
                    ) : (
                      <FileIcon className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 py-2 pr-2">
                    <span className="text-white text-xs h-full min-w-max">
                      {file.name}
                      <p
                        className={`text-slate-400 ${
                          file.status === "uploading" ? "opacity-70" : ""
                        } ${file.status === "failed" ? "text-red-400" : ""}`}
                      >
                        {file.status === "uploading"
                          ? `${getFileTypeLabel(file.name)} - ${file.progress}%`
                          : file.status === "completed"
                            ? getFileTypeLabel(file.name)
                            : "Failed"}
                      </p>
                    </span>
                  </div>
                  {file.status !== "uploading" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-slate-800 rounded-xl p-2 m-2 hover:bg-slate-700 text-white"
                      onClick={() => removeFile(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div
            className={`relative border-2 rounded-lg transition-colors ${
              isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-700"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-lg z-10 pointer-events-none">
                <p className="text-lg font-semibold">Drop files here</p>
              </div>
            )}

            <div className="flex items-end gap-2 p-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isTaskRunning}
              >
                <Upload className="w-5 h-5" />
              </Button>

              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message or drag and drop files..."
                className="flex-1 min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0"
                disabled={isTaskRunning}
              />

              <Button
                onClick={() => handleSubmit()}
                disabled={
                  isTaskRunning ||
                  (!prompt.trim() &&
                    uploadingFiles.filter((f) => f.status === "completed")
                      .length === 0) ||
                  uploadingFiles.some((f) => f.status === "uploading")
                }
                size="icon"
              >
                {isTaskRunning ? (
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Message block component
function MessageBlock({ message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-950 rounded-lg p-3 max-w-[80%]">
          <p className="text-white whitespace-pre-wrap">{message.prompt}</p>
        </div>
      </div>
    );
  }

  if (message.role === "assistant") {
    return (
      <div className="flex justify-start">
        <div className=" rounded-lg p-4  space-y-3">
          {message.data &&
            Array.isArray(message.data) &&
            message.data.map((item, idx) => (
              <MessageItem key={idx} item={item} />
            ))}
        </div>
      </div>
    );
  }

  return null;
}

// Message item component (text, element, or presentation)
function MessageItem({ item }) {
  const [selectedSlide, setSelectedSlide] = useState(null);

  if (item.type === "text") {
    return (
      <div className="text-gray-200 whitespace-pre-wrap">
        <MarkdownRenderer content={item.content} />
      </div>
    );
  }

  // Handle presentation type (preprocessed by backend)
  if (item.type === "presentation") {
    return (
      <Presentations
        images={item.pngSlides}
        htmlSlides={item.htmlSlides}
        slidesQty={item.slideCount}
        title={item.fileName}
      />
    );
  }

  // Regular file element
  if (item.type === "element") {
    return (
      <a
        href={item.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-2 border-gray-600 rounded-lg p-4 hover:border-blue-500 hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <FileIcon className="w-8 h-8 text-blue-400" />
          <div className="flex-1">
            <p className="font-semibold text-white">{item.fileName}</p>
            <p className="text-sm text-gray-400">
              {item.format} • Click to open
            </p>
          </div>
        </div>
      </a>
    );
  }

  return null;
}
