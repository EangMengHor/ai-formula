import { Paperclip, Send, LoaderCircle, Loader2, Folder } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { uploadFileToBackend } from "@/services/contentAi/contentAi.api";
import { getNewSession } from "@/services/n8n-apis/_core/getNewSession.api";

const promptTemplates = [
  {
    icon: "/manus/image.webp",
    title: "Create Images",
    description:
      "Generate stunning AI-powered images tailored to your creative vision.",
    prompt: "Generate 2 images for ",
  },
  {
    icon: "/manus/video.webp",
    title: "Create Videos",
    description:
      "Produce engaging short videos with AI-generated visuals and animations.",
    prompt: "Generate a short video about ",
  },
  {
    icon: "/manus/report.webp",
    title: "PDF Report",
    description:
      "Create comprehensive PDF reports with professional formatting and insights.",
    prompt: "Generate a detailed PDF report on ",
  },
  {
    icon: "/manus/slides.webp",
    title: "Create Slides",
    description:
      "Design polished presentation decks ready for your next meeting or pitch.",
    prompt: "Generate a slide deck on ",
  },
  {
    icon: "/manus/web.webp",
    title: "Create Website",
    description:
      "Build a clean, responsive website with modern design elements.",
    prompt: "Generate a simple website about ",
  },
  {
    icon: "/manus/platform-api.webp",
    title: "Create Website App with platform API",
    description:
      "Develop a fully functional AI web app integrated with platform APIs.",
    prompt: "Generate a website with app using platform API on ",
  },
  {
    icon: "/manus/report.webp",
    title: "Report with Images",
    description:
      "Generate detailed reports enriched with relevant images and visuals.",
    prompt: "Generate a detailed report with images about ",
  },
  {
    icon: "/manus/visual.webp",
    title: "Data Visualization",
    description:
      "Create compelling data visualizations to illustrate key insights.",
    prompt: "Generate data visualizations for ",
  },
  {
    icon: "/manus/audio.webp",
    title: "Create Audio",
    description:
      "Produce high-quality AI-generated audio content for various uses.",
    prompt: "Generate an audio clip about ",
  },
];

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

// Constants for input limits
const MAX_PROMPT_LENGTH = 5000;
const MAX_FILES = 15;

export default function ContentChatInput({
  isUsedInDashboard = false,
  setUploadedFiles = () => {},
  uploadedFiles = [],
  disabled = false,
  handleSubmitProps,
}) {
  const sid = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if we're on the main content-ai route (not in a chat session)
  const isMainContentAiRoute = location.pathname === "/content-ai";

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

    setIsDragging(false);
    setUploadingFiles([]);
    setPrompt("");
  }, [routeSessionId, isUsedInDashboard]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const minHeight = 72; // ~3 rows
    const maxHeight = 160;
    const newHeight = Math.max(
      minHeight,
      Math.min(textarea.scrollHeight, maxHeight),
    );
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

      // Check total file limit
      const totalFiles = uploadedFiles.length + files.length;
      if (totalFiles > MAX_FILES) {
        toast({
          title: "File Limit Exceeded",
          description: `You can only upload up to ${MAX_FILES} files. Currently have ${uploadedFiles.length}, trying to add ${files.length}.`,
          variant: "destructive",
        });
        return;
      }

      const newFiles = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        fileName: file.name,
        size: file.size,
        progress: 0,
        status: "uploading",
      }));
      console.log("Uploading files:", newFiles);
      setUploadingFiles([...newFiles]);

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
            setUploadingFiles([]);
            setUploadedFiles((prev) => [fileData.fileName, ...prev]);
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
    [toast, uploadedFiles.length],
  );

  const handleSubmit = async () => {
    const trimmedPrompt = prompt.trim();
    const completedFiles = uploadingFiles.filter(
      (f) => f.status === "completed",
    );

    // Check prompt length
    if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
      toast({
        title: "Message Too Long",
        description: `Your message exceeds ${MAX_PROMPT_LENGTH} characters. Please shorten it.`,
        variant: "destructive",
      });
      return;
    }

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
        await handleSubmitProps(trimmedPrompt);
        setPrompt("");
        setUploadingFiles([]);
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

  // Handle template click - add template prompt to input
  const handleTemplateClick = (templatePrompt) => {
    if (isDisabled) return;
    setPrompt(templatePrompt);
    // Focus the textarea after setting the prompt
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full max-w-[770px] mx-auto">
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
          {(uploadedFiles.length > 0 || uploadingFiles.length > 0) && (
            <div className="flex-shrink-0 ">
              <div className="flex gap-2 items-center w-full overflow-x-auto scroll-smooth hide-scrollbar flex-nowrap">
                {uploadingFiles.map((file, idx) => (
                  <div
                    key={`uploaded-${idx}`}
                    className="flex items-center rounded-2xl justify-between w-fit bg-blue-950 hover:bg-blue-900 transition-all mb-3"
                  >
                    <div className="p-2 pl-3">
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    </div>
                    <div className="flex items-center gap-2 py-2 pr-4">
                      <span className="text-white text-xs h-full min-w-max">
                        {file.fileName}
                        <p className="text-slate-400">{file.progress}%</p>
                      </span>
                    </div>
                  </div>
                ))}
                {uploadedFiles.map((fileName, idx) => (
                  <div
                    key={`uploaded-${idx}`}
                    className="flex items-center rounded-2xl justify-between w-fit bg-blue-950 transition-all mb-3"
                  >
                    <div className="p-2 pl-3">
                      <Folder className="w-5 h-5 " />
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
              </div>
            </div>
          )}
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
            onChange={(e) => {
              // Limit prompt to MAX_PROMPT_LENGTH characters
              if (e.target.value.length <= MAX_PROMPT_LENGTH) {
                setPrompt(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            rows={3}
            maxLength={MAX_PROMPT_LENGTH}
          />
          {/* Character count indicator */}
          {prompt.length > MAX_PROMPT_LENGTH * 0.8 && (
            <div
              className={`text-xs text-right mt-1 ${prompt.length >= MAX_PROMPT_LENGTH ? "text-red-400" : "text-yellow-400"}`}
            >
              {prompt.length}/{MAX_PROMPT_LENGTH} characters
            </div>
          )}
          {/* Controls */}
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10">
            <div className="flex items-center gap-1">
              <label
                className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${isDisabled || uploadedFiles.length >= MAX_FILES ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.gif,.webp,.csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  disabled={isDisabled || uploadedFiles.length >= MAX_FILES}
                />
                <Paperclip className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </label>
              {uploadedFiles.length > 0 && (
                <span
                  className={`text-xs ${uploadedFiles.length >= MAX_FILES ? "text-red-400" : "text-gray-400"}`}
                >
                  {uploadedFiles.length}/{MAX_FILES} files
                </span>
              )}
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
      {isMainContentAiRoute && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 mt-2">
          {promptTemplates.map((template, index) => (
            <div
              className="bg-g1 px-4 py-3 flex gap-2 rounded-2xl hover:bg-g2 cursor-pointer transition-all"
              key={index}
              onClick={() => handleTemplateClick(template.prompt)}
            >
              <div className="w-[70%] flex justify-between flex-col">
                <p>{template.title}</p>
                <p className="text-sm text-gray-400">{template.description}</p>
              </div>
              <img
                src={template.icon}
                className="w-20 h-20"
                alt={template.title}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
