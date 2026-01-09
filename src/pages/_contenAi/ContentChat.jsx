import { useParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  startContentTask,
  pollContentTask,
  publishWebsiteToVercel,
} from "@/services/contentAi/contentAi.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileIcon,
  LoaderCircle,
  Download,
  Clapperboard,
  ExternalLink,
  Globe,
  Copy,
  Check,
} from "lucide-react";
import LoadingAnimation from "@/components/custom/Loading";
import MarkdownRenderer from "../_private/components/sidebarProvided/components/AnimatedMarkdown";
import Presentations from "./formatShowcase/Presentation";
import AudioPlayer from "./formatShowcase/Audio";
import ContentChatInput from "./ContentChatInput";
import { parsePreviewLinks } from "./utils/parsePreviewLinks";
import { useStackSidebar } from "@/context/StackSidebarContext";
import WebsiteSidebar from "./WebsiteSidebar";

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
  const [isTaskRunning, setIsTaskRunning] = useState(false);
  const [taskStatus, setTaskStatus] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [deployedWebsites, setDeployedWebsites] = useState([]);

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const hasLoadedHistory = useRef(false);

  // Load previous conversation and files when component mounts
  useEffect(() => {
    const loadHistory = async () => {
      if (hasLoadedHistory.current) {
        setMessages([]);
        setUploadedFiles([]);
        setDeployedWebsites([]);
        setTaskStatus(null);
        pollIntervalRef.current && clearInterval(pollIntervalRef.current);
      }

      try {
        setIsLoadingHistory(true);
        const res = await pollContentTask(sessionId);

        if (res.success && res.data) {
          const {
            data,
            taskStatus: status,
            files,
            deployedWebsites: deployed,
          } = res.data;

          // Load previous messages
          if (data && Array.isArray(data)) {
            setMessages(data);
          }

          // Load uploaded files list
          if (files && Array.isArray(files)) {
            setUploadedFiles(files);
          }

          // Load deployed websites
          if (deployed && Array.isArray(deployed)) {
            setDeployedWebsites(deployed);
          }

          // Set task status
          setTaskStatus(status);

          // If task is still running, start polling
          if (status === "running") {
            setIsTaskRunning(true);
            await startPolling();
          }
        }
        hasLoadedHistory.current = true;
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    console.log("Loading history for session:", sessionId);
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
          const {
            data,
            taskStatus: status,
            files,
            deployedWebsites: deployed,
          } = res.data;
          setTaskStatus(status);
          if (data && Array.isArray(data)) {
            setMessages((prev) => {
              // If new messages arrived, only add the new ones
              if (data.length > prev.length) {
                const newMessages = data.slice(prev.length);
                return [...prev, ...newMessages];
              }
              // If last message was updated (same length but content changed)
              if (data.length === prev.length && data.length > 0) {
                const lastNewMessage = data[data.length - 1];
                const lastPrevMessage = prev[prev.length - 1];
                // Only update if the last message actually changed
                if (
                  JSON.stringify(lastNewMessage) !==
                  JSON.stringify(lastPrevMessage)
                ) {
                  const updated = [...prev];
                  updated[updated.length - 1] = lastNewMessage;
                  return updated;
                }
              }
              return prev;
            });
          }

          // Update files list
          if (files && Array.isArray(files)) {
            setUploadedFiles(files);
          }

          // Update deployed websites
          if (deployed && Array.isArray(deployed)) {
            setDeployedWebsites(deployed);
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
    setTimeout(() => poll(), 1000);
    pollIntervalRef.current = setInterval(poll, 3000);
  }, [sessionId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle submit
  const handleSubmit = async (overridePrompt = null) => {
    const finalPrompt = overridePrompt || prompt;
    console.log("Final prompt to submit:", messages);
    setMessages((prev) => [...prev, { role: "user", prompt: finalPrompt }]);
    if (!finalPrompt.trim() && uploadedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please enter a prompt or upload files",
        variant: "destructive",
      });
      return;
    }

    // Check if any files are still uploading
    if (uploadedFiles.some((f) => f.status === "uploading")) {
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
      const res = await startContentTask(
        sessionId,
        finalPrompt.trim(),
        messages.filter((m) => m.role === "user").map((m) => m.prompt) || [],
      );

      if (res.success) {
        // Clear input and files
        setUploadedFiles([]);

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

  // Handle when a new message is sent from the input
  const handleMessageSent = async () => {
    setIsTaskRunning(true);
    await startPolling();
  };

  // Handler for when a website is published - update local state
  const handleWebsitePublished = (chatIndex, vercelLink, websiteLink) => {
    setDeployedWebsites((prev) => [
      ...prev,
      {
        chatIndex,
        vercelLink,
        websiteLink,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  // Show loading state while fetching history
  if (isLoadingHistory) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="w-8 h-8 animate-spin" />
          <p className="text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full overflow-hidden">
      {/* Messages container - this is the only scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && !isTaskRunning && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Start a conversation by typing a message below</p>
          </div>
        )}

        {messages.map((message, idx) => (
          <MessageBlock
            key={idx}
            message={message}
            messageIndex={idx}
            sessionId={sessionId}
            deployedWebsites={deployedWebsites}
            onWebsitePublished={handleWebsitePublished}
          />
        ))}

        {isTaskRunning && taskStatus !== "completed" && (
          <div className="flex justify-start">
            <LoadingAnimation currentQuote="Generating content" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Uploaded files display - fixed at bottom above input */}

      {/* Input container - fixed at bottom */}
      <div className="flex-shrink-0 p-4 pt-2">
        <ContentChatInput
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          onMessageSent={handleMessageSent}
          disabled={isTaskRunning}
          handleSubmitProps={handleSubmit}
        />
      </div>
    </div>
  );
}

// Video Grid Component
function VideoGrid({ videos }) {
  const getGridClass = (count) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-2";
    if (count === 4) return "grid-cols-3";
    if (count <= 6) return "grid-cols-3";
    return "grid-cols-3";
  };

  return (
    <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 px-3 py-2 rounded-2xl">
      <div className="w-full flex justify-between items-center">
        <div className="flex gap-2  py-2 ">
          <Clapperboard />
          <p className="font-semibold">Generated Video(s)</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">{videos.length} videos</p>
        </div>
      </div>
      <div className={`grid ${getGridClass(videos.length)} gap-2`}>
        {videos.map((video, idx) => (
          <VideoItem key={idx} video={video} />
        ))}
      </div>
    </div>
  );
}

// Individual Video Component
function VideoItem({ video }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      setIsDownloading(true);
      const response = await fetch(video.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = video.fileName || "video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading video:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <video
        src={video.fileUrl}
        controls
        className="w-full h-auto rounded-2xl bg-black"
        preload="metadata"
      />
      {/* Download button overlay */}
      {isHovered && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            variant="secondary"
            size="sm"
            className="bg-white/90 hover:bg-white text-black shadow-lg"
          >
            {isDownloading ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4 mr-1" />
                Download
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Image Grid Component
function ImageGrid({ images }) {
  const getGridClass = (count) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-2";
    if (count === 4) return "grid-cols-3";
    if (count <= 6) return "grid-cols-4";
    return "grid-cols-3";
  };

  return (
    <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 px-3 py-2 rounded-2xl">
      <div className="w-full flex justify-between mb-1 items-center">
        <div className="flex gap-2  py-2 ">
          <Clapperboard />
          <p className="font-semibold">Image(s)</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">{images.length} Image</p>
        </div>
      </div>
      <div className={`grid ${getGridClass(images.length)} gap-2`}>
        {images.map((image, idx) => (
          <ImageItem key={idx} image={image} />
        ))}
      </div>
    </div>
  );
}

// Individual Image Component
function ImageItem({ image }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      setIsDownloading(true);
      const response = await fetch(image.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = image.fileName || "image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={image.fileUrl}
        alt={image.fileName || "Image"}
        className="w-full h-auto rounded-lg object-cover "
      />
      {/* Download button overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center transition-opacity">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            variant="secondary"
            size="sm"
            className="bg-white/90 hover:bg-white text-black"
          >
            {isDownloading ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4 mr-1" />
                Download
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Message block component
function MessageBlock({
  message,
  messageIndex,
  sessionId,
  deployedWebsites,
  onWebsitePublished,
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 p-3 max-w-[80%] rounded-2xl">
          <p className="text-white whitespace-pre-wrap">
            {message.prompt.split("---Additional info---")[0]}
          </p>
        </div>
      </div>
    );
  }

  if (message.role === "assistant") {
    // Check if this message index has a deployed website
    const deployedWebsite = deployedWebsites?.find(
      (dw) => dw.chatIndex === messageIndex,
    );

    // First, extract preview links from text items and find WEBSITE_CODE zip files
    let previewLinks = [];
    let websiteCodeZips = [];

    message.data?.forEach((item) => {
      // Extract preview links from text content
      if (item.type === "text") {
        const { segments } = parsePreviewLinks(item.content);
        segments.forEach((seg) => {
          if (seg.type === "preview_link") {
            previewLinks.push(seg.content);
          }
        });
      }
      // Find WEBSITE_CODE zip files
      if (
        item.type === "element" &&
        item.format === "zip" &&
        item.fileName?.includes("WEBSITE_CODE")
      ) {
        websiteCodeZips.push(item);
      }
    });

    // Determine if we should show a combined WebsiteResultBox
    const hasWebsiteResult =
      previewLinks.length > 0 && websiteCodeZips.length > 0;
    const websiteResultData = hasWebsiteResult
      ? {
          previewUrl: previewLinks[0],
          downloadUrl: websiteCodeZips[0].fileUrl,
          fileName: websiteCodeZips[0].fileName,
        }
      : null;

    // Group consecutive images and videos together
    const groupedItems = [];
    let currentImageGroup = [];
    let currentVideoGroup = [];
    let websiteResultAdded = false;

    message.data?.forEach((item, idx) => {
      if (item.type === "element" && item.format === "img") {
        // Flush video group if exists
        if (currentVideoGroup.length > 0) {
          groupedItems.push({ type: "videoGroup", videos: currentVideoGroup });
          currentVideoGroup = [];
        }
        currentImageGroup.push(item);
      } else if (item.type === "element" && item.format === "mp4") {
        // Flush image group if exists
        if (currentImageGroup.length > 0) {
          groupedItems.push({ type: "imageGroup", images: currentImageGroup });
          currentImageGroup = [];
        }
        currentVideoGroup.push(item);
      } else if (item.type === "element" && item.format === "preview_link") {
        // Skip - handled separately
      } else if (
        item.type === "element" &&
        item.format === "zip" &&
        item.fileName?.includes("WEBSITE_CODE") &&
        hasWebsiteResult
      ) {
        // Skip WEBSITE_CODE zip if we're showing combined result
        // Add the WebsiteResultBox at this position if not already added
        if (!websiteResultAdded) {
          if (currentImageGroup.length > 0) {
            groupedItems.push({
              type: "imageGroup",
              images: currentImageGroup,
            });
            currentImageGroup = [];
          }
          if (currentVideoGroup.length > 0) {
            groupedItems.push({
              type: "videoGroup",
              videos: currentVideoGroup,
            });
            currentVideoGroup = [];
          }
          groupedItems.push({ type: "websiteResult", ...websiteResultData });
          websiteResultAdded = true;
        }
      } else if (item.type === "text") {
        // Flush both groups if they exist
        if (currentImageGroup.length > 0) {
          groupedItems.push({ type: "imageGroup", images: currentImageGroup });
          currentImageGroup = [];
        }
        if (currentVideoGroup.length > 0) {
          groupedItems.push({ type: "videoGroup", videos: currentVideoGroup });
          currentVideoGroup = [];
        }
        // Mark text item to skip preview links if we have websiteResult
        groupedItems.push({ ...item, skipPreviewLinks: hasWebsiteResult });
      } else {
        // Flush both groups if they exist
        if (currentImageGroup.length > 0) {
          groupedItems.push({ type: "imageGroup", images: currentImageGroup });
          currentImageGroup = [];
        }
        if (currentVideoGroup.length > 0) {
          groupedItems.push({ type: "videoGroup", videos: currentVideoGroup });
          currentVideoGroup = [];
        }
        groupedItems.push(item);
      }
    });

    // Add remaining groups if any
    if (currentImageGroup.length > 0) {
      groupedItems.push({ type: "imageGroup", images: currentImageGroup });
    }
    if (currentVideoGroup.length > 0) {
      groupedItems.push({ type: "videoGroup", videos: currentVideoGroup });
    }

    // Add WebsiteResultBox at end if not added yet
    if (hasWebsiteResult && !websiteResultAdded) {
      groupedItems.push({ type: "websiteResult", ...websiteResultData });
    }

    return (
      <div className="flex justify-start">
        <div className="rounded-lg space-y-3 max-w-full">
          {groupedItems.map((item, idx) => {
            if (item.type === "imageGroup") {
              return <ImageGrid key={idx} images={item.images} />;
            }
            if (item.type === "videoGroup") {
              return <VideoGrid key={idx} videos={item.videos} />;
            }
            if (item.type === "websiteResult") {
              return (
                <WebsiteResultBox
                  key={idx}
                  previewUrl={item.previewUrl}
                  downloadUrl={item.downloadUrl}
                  fileName={item.fileName}
                  sessionId={sessionId}
                  chatIndex={messageIndex}
                  deployedWebsite={deployedWebsite}
                  onWebsitePublished={onWebsitePublished}
                />
              );
            }
            return <MessageItem key={idx} item={item} />;
          })}
        </div>
      </div>
    );
  }

  return null;
}

// Website Result Box Component - Combined preview link, download, and publish
function WebsiteResultBox({
  previewUrl,
  downloadUrl,
  fileName,
  sessionId,
  chatIndex,
  deployedWebsite,
  onWebsitePublished,
}) {
  const { setSidebarStack } = useStackSidebar();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  // Check if already published
  const isAlreadyPublished = !!deployedWebsite;
  const currentVercelLink = deployedWebsite?.vercelLink || publishedUrl;

  function handleOpenPreviewSidebar() {
    setSidebarStack([
      {
        header: "Website Preview",
        component: (
          <WebsiteSidebar url={previewUrl} downloadUrl={downloadUrl} />
        ),
        onClose: () => {},
      },
    ]);
  }

  const handleDownload = async (e) => {
    e.stopPropagation();
    window.open(downloadUrl, "_blank");
  };

  const handlePublish = async (e) => {
    e.stopPropagation();
    if (isPublishing || isAlreadyPublished) return;

    setIsPublishing(true);
    try {
      const res = await publishWebsiteToVercel(
        sessionId,
        downloadUrl,
        chatIndex,
        previewUrl,
      );

      if (res.success) {
        const vercelLink =
          res.data?.deployment?.vercelLink ||
          res.data?.deployment?.url ||
          res.data?.vercelLink;

        // Check if it was already deployed
        if (res.data?.alreadyDeployed) {
          setPublishedUrl(vercelLink);
          toast({
            title: "Already Published",
            description: "This website was already published.",
          });
        } else {
          setPublishedUrl(vercelLink);
          setShowSuccessDialog(true);
          // Notify parent to update state
          if (onWebsitePublished) {
            onWebsitePublished(chatIndex, vercelLink, previewUrl);
          }
          toast({
            title: "Published Successfully!",
            description: "Your website is now live.",
          });
        }
      } else {
        throw new Error(res.message || "Failed to publish website");
      }
    } catch (error) {
      console.error("Error publishing website:", error);
      toast({
        title: "Publish Failed",
        description: error.message || "Failed to publish website",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = async () => {
    const link = currentVercelLink;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleOpenPublishedSite = () => {
    if (currentVercelLink) {
      window.open(currentVercelLink, "_blank");
    }
  };

  return (
    <>
      <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">Website Result</p>
            <p className="text-sm text-gray-400">
              {isAlreadyPublished || publishedUrl
                ? "Your website is live!"
                : "Preview and download your website"}
            </p>
          </div>
          {(isAlreadyPublished || publishedUrl) && (
            <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-xs font-medium">
              <Globe className="w-3 h-3" />
              Published
            </div>
          )}
        </div>

        {/* Show published URL if available */}
        {currentVercelLink && (
          <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-sm text-gray-300 truncate flex-1">
              {currentVercelLink}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              title="Copy link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={handleOpenPublishedSite}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              title="Open website"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleOpenPreviewSidebar}
            className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-black rounded-xl py-2.5 px-4 transition-all font-medium text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Preview</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl py-2.5 px-4 transition-all font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>

          {/* {!isAlreadyPublished && !publishedUrl && (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl py-2.5 px-4 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Publish</span>
                </>
              )}
            </button>
          )} */}
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md bg-g1 border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              Website Published!
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Your website is now live and accessible to everyone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-2">Live URL</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white truncate flex-1">
                  {publishedUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleOpenPublishedSite}
                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-black rounded-xl py-2.5 px-4 transition-all font-medium text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Visit Website</span>
              </button>
              <button
                onClick={() => setShowSuccessDialog(false)}
                className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl py-2.5 px-4 transition-all font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Preview Link Box Component
function PreviewLinkBox({ url }) {
  const { setSidebarStack } = useStackSidebar();

  function handleOpenPreviewSidebar() {
    setSidebarStack([
      {
        header: "Website Preview",
        component: <WebsiteSidebar url={url} />,
        onClose: () => {},
      },
    ]);
  }

  return (
    <div
      onClick={handleOpenPreviewSidebar}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between bg-gradient-to-tr to-g1 via-g1 from-g1 hover:to-g1 hover:from-g2 transition-all rounded-3xl p-4 cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center">
          <ExternalLink className="w-5 h-5 " />
        </div>
        <div>
          <p className="font-semibold text-white">Website Link</p>
          <p className="text-sm text-gray-400 truncate max-w-[300px]">{url}</p>
        </div>
      </div>
      <div className="flex items-center gap-1  group-hover:text-blue-300 transition-colors">
        <span className="text-sm font-medium">Open</span>
        <ExternalLink className="w-4 h-4" />
      </div>
    </div>
  );
}

// Message item component (text, element, or presentation)
function MessageItem({ item }) {
  if (item.type === "text") {
    const { segments } = parsePreviewLinks(item.content);

    return (
      <div className="text-gray-200 whitespace-pre-wrap space-y-3">
        {segments.map((segment, idx) => {
          if (segment.type === "preview_link") {
            // Skip preview links if marked (when combined with WEBSITE_CODE)
            if (item.skipPreviewLinks) {
              return null;
            }
            return <PreviewLinkBox key={idx} url={segment.content} />;
          }
          return (
            <div key={idx}>
              <MarkdownRenderer content={segment.content} />
            </div>
          );
        })}
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

  // Handle MP3 audio files
  if (item.type === "element" && item.format === "mp3") {
    return <AudioPlayer fileUrl={item.fileUrl} fileName={item.fileName} />;
  }

  // Regular file element (skip images and videos as they're handled by their respective grids)
  if (
    item.type === "element" &&
    item.format !== "img" &&
    item.format !== "mp4"
  ) {
    return (
      <a
        href={item.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gradient-to-tr to-g2 via-g1 from-g1 hover:to-g1 hover:from-g2 transition-all block  rounded-2xl p-4  cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <FileIcon className="w-8 h-8 " />
          <div className="flex-1">
            <p className="font-semibold text-white">{item.fileName}</p>
            <p className="text-sm text-gray-400">
              {item.format == "other" ? "File" : item.format} • Click to open
            </p>
          </div>
        </div>
      </a>
    );
  }

  return null;
}
