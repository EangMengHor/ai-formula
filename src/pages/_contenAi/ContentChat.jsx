import { useParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  startContentTask,
  pollContentTask,
} from "@/services/contentAi/contentAi.api";
import { Button } from "@/components/ui/button";
import { FileIcon, LoaderCircle, Download, Clapperboard } from "lucide-react";
import LoadingAnimation from "@/components/custom/Loading";
import MarkdownRenderer from "../_private/components/sidebarProvided/components/AnimatedMarkdown";
import Presentations from "./formatShowcase/Presentation";
import AudioPlayer from "./formatShowcase/Audio";
import ContentChatInput from "./ContentChatInput";

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

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle when a new message is sent from the input
  const handleMessageSent = async () => {
    setIsTaskRunning(true);
    await startPolling();
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
          <MessageBlock key={idx} message={message} />
        ))}

        {isTaskRunning && taskStatus !== "completed" && (
          <div className="flex justify-start">
            <LoadingAnimation currentQuote="Generating content" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Uploaded files display - fixed at bottom above input */}
      {uploadedFiles.length > 0 && (
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="flex gap-2 items-center w-full overflow-x-auto scroll-smooth hide-scrollbar flex-nowrap">
            {uploadedFiles.map((fileName, idx) => (
              <div
                key={`uploaded-${idx}`}
                className="flex items-center rounded-2xl justify-between w-fit bg-slate-800"
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
          </div>
        </div>
      )}

      {/* Input container - fixed at bottom */}
      <div className="flex-shrink-0 p-4 pt-2">
        <ContentChatInput
          onMessageSent={handleMessageSent}
          disabled={isTaskRunning}
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
          <p className="font-semibold">Generated Image(s)</p>
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

  if (message.role === "assistant") {
    // Group consecutive images and videos together
    const groupedItems = [];
    let currentImageGroup = [];
    let currentVideoGroup = [];

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
            return <MessageItem key={idx} item={item} />;
          })}
        </div>
      </div>
    );
  }

  return null;
}

// Message item component (text, element, or presentation)
function MessageItem({ item }) {
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
