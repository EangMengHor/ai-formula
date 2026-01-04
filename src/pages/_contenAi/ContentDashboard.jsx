import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import { getNewSession } from "@/services/n8n-apis/_core/getNewSession.api";
import { uploadFileToBackend } from "@/services/contentAi/contentAi.api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Upload, X, FileIcon } from "lucide-react";

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

export default function ContentDashboard() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  // Generate sessionId once when component mounts
  useEffect(() => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
  }, []);

  const handleSubmit = async () => {
    if (!prompt.trim() && uploadingFiles.length === 0) {
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
      setIsLoading(true);

      // Create new chat session with the same sessionId used for file uploads
      const res = await getNewSession(prompt, localStorage.getItem("id"), sessionId);

      if (res.success) {
        // Navigate to content chat with session ID
        navigate(`/content-ai/chat/${sessionId}`);
        // Store prompt for initial message
        localStorage.setItem("contentAiPrompt", prompt);
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to create chat session",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating content chat:", error);
      toast({
        title: "Error",
        description: "An error occurred while creating the chat",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit();
    }
  };

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
                idx === fileIndex ? { ...f, progress } : f
              )
            );
          }
        );

        if (uploadRes.success) {
          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "completed" } : f
            )
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
              : f
          )
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

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Content AI</h1>
          <p className="text-gray-400">
            Generate reports, documents, and content with AI assistance
          </p>
        </div>

        <div className="space-y-4">
          {/* Uploading files display */}
          {uploadingFiles.length > 0 && (
            <div className="flex gap-2 ml-2 items-center w-full overflow-x-auto scroll-smooth hide-scrollbar flex-nowrap">
              {uploadingFiles.map((file, idx) => (
                <div
                  key={idx}
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

          {/* Input area with drag and drop */}
          <div
            className={`relative border-2 rounded-lg transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-700"
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
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp"
                className="hidden"
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="w-5 h-5" />
              </Button>

              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What would you like to create? (e.g., Generate a 4-page report on Tesla stock) or drag and drop files..."
                className="flex-1 min-h-[120px] resize-none border-0 focus-visible:ring-0"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              (!prompt.trim() && uploadingFiles.filter(f => f.status === "completed").length === 0) ||
              uploadingFiles.some((f) => f.status === "uploading")
            }
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Creating Chat...
              </>
            ) : (
              "Start Content Chat"
            )}
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p className="mb-2">Examples:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Generate a 5-page market analysis report with charts</li>
            <li>Create a business proposal with financial projections</li>
            <li>Generate a research paper with citations and references</li>
            <li>Upload documents and ask questions about them</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
