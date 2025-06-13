import React, { memo, forwardRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import ExecutionTimeline from "./ExecutionTimeline";
import { Mermaid } from "../../../../../components/custom/Mermaid";
import ChatSimulation from "../../../../../components/custom/AiInteraction/ChatSimulation";
import { StreamingResponse } from "./StreamingRendered";
import LoadingAnimation from "@/components/custom/Loading";
import PollStatus from "../../../../../components/custom/PolledStatus";
import {
  RotateCcw,
  FileDown,
  Loader2,
  Copy,
  Check,
  CalendarCheck,
  Clock,
  Book,
  Volume2,
  FolderDown,
  CircleStop,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { downloadPdf } from "@/services/n8n-apis/_core/downloadPdf.api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TTSPrompt from "@/components/custom/TTSPrompt";
import rehypeRaw from "rehype-raw";
import { getFavicon } from "@/lib/utils";
import SourcesIndicator from "@/components/custom/CitationSources";
import CitationMiniCard from "./CitationMiniCard";
const buttonWrapperClass =
  "p-1 w-6 h-6 bg-transparent hover:bg-slate-800 rounded-md flex items-center justify-center";

const iconClass = "h-5 w-5";

const Conversation = forwardRef(
  (
    {
      conversation,
      isNextChatLoading,
      isShowInteractionLogs,
      sidebarStack,
      id,
      handleBlockSidebar,
      handleMaterialSidebar,
      renderMermaidChart,
      currentLoadingMessage,
      interactionLogs,
      isChanged,
      loadingMessage = "Thinking . . .",
      chatContainerRef, // This comes from Chat.jsx
      endRef, // This comes from Chat.jsx
    },
    ref,
  ) => {
    const [pdfFileName, setpPdfFileName] = useState("");
    const [isPdfDownloadLoading, setIsPdfDownloadLoading] = useState(false);
    const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [currentContent, setCurrentContent] = useState("No PDF data found");
    const [currDialogIndexOpen, setCurrDialogIndexOpen] = useState(-1);
    const { toast } = useToast();

    const sanitizeFileName = (name) => {
      return name.replace(/[/\\?%*:|"<>]/g, "-").trim();
    };
    // In your Chat.jsx
    // Remove this useEffect - it's not needed here:
    // useEffect(() => {
    //   if (chatContainerRef.current) {
    //     const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    //     console.log("Scroll metrics:", {
    //       scrollTop,
    //       scrollHeight,
    //       clientHeight,
    //       distanceFromBottom: scrollHeight - scrollTop - clientHeight,
    //       showButton: showScrollButton,
    //     });
    //   }
    // }, [showScrollButton]);
    const copyToClipboard = async (content) => {
      try {
        // Extract plain text from markdown
        const plainText = content
          .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
          .replace(/\*(.*?)\*/g, "$1") // Italic
          .replace(/\[(.*?)\]\((.*?)\)/g, "$1: $2") // Links
          .replace(/#{1,6}\s(.*?)(\n|$)/g, "$1\n") // Headers
          .replace(/```[a-zA-Z]*\n([\s\S]*?)```/g, "$1") // Code blocks
          .replace(/`(.*?)`/g, "$1"); // Inline code

        await navigator.clipboard.writeText(plainText);
        setIsCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "Content copied to clipboard successfully",
          variant: "success",
        });
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy: ", error);
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    };

    // Helper function to process PDF download
    const handlePdfDownload = async (currentContent) => {
      // Safety check - if no content, show error and exit
      if (!currentContent || currentContent === "No PDF data found") {
        toast({
          title: "Error",
          description: "No content available to download. Please try again.",
          variant: "destructive",
        });
        setPdfDialogOpen(false);
        return;
      }

      const loadingToast = toast({
        title: "Processing PDF...",
        description: `The PDF is downloading and may take a few seconds. You will be notified once the download is complete. Feel free to continue working in the meantime.\n File Name : ${sanitizeFileName(pdfFileName || "Document")} `,
        variant: "default",
        duration: Infinity,
      });

      try {
        setIsPdfDownloadLoading(true);

        const contentToDownload = currentContent || "No content available";

        const down = await downloadPdf({
          content: contentToDownload,
          fileName: sanitizeFileName(pdfFileName || "Document"),
          type: "pdf",
        });

        // Remove loading toast
        loadingToast.dismiss?.();

        if (down.success) {
          toast({
            title: "Success",
            description: "PDF downloaded successfully",
            variant: "success",
          });
        } else {
          toast({
            title: "Error",
            description: down.message || "Failed to download PDF",
            variant: "destructive",
          });
        }
      } catch (error) {
        loadingToast.dismiss?.();
        console.error("Error downloading PDF:", error);
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setPdfDialogOpen(false);
        setIsPdfDownloadLoading(false);
      }
    };

    useEffect(() => {
      console.log("Conversation data:", conversation);
    }, [conversation]);

    // Helper function to extract content from blocks
    const extractContentFromBlocks = (blocks) => {
      return blocks
        .map((block) => {
          let gatheredBlock = "";
          if (block.type === "text") {
            gatheredBlock += block.content.replace("undefined", "");
          } else if (block.type === "visual") {
            gatheredBlock += `<visual>
<name>${block?.name || "No Name"}</name>
${block.content}
</visual>`;
          } else {
            gatheredBlock += block.content;
          }

          return gatheredBlock;
        })
        .join("\n");
    };

    // Common table styling for ReactMarkdown
    const tableStyles = {
      deepThink: {
        table: {
          borderCollapse: "collapse",
          width: "100%",
          borderColor: "#65AFFF",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "#000C1B",
          margin: "1rem 0",
        },
        th: {
          border: "1px solid #444",
          padding: "8px",
          backgroundColor: "#001A3B",
          textAlign: "left",
        },
        td: {
          border: "1px solid #444",
          padding: "8px",
          backgroundColor: "#0A1429",
        },
      },
      regular: {
        table: {
          borderCollapse: "collapse",
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          color: "#e0e0e0",
          margin: "1rem 0",
        },
        th: {
          border: "1px solid #444",
          padding: "8px",
          backgroundColor: "transparent",
          textAlign: "left",
        },
        td: {
          border: "1px solid #444",
          padding: "8px",
          backgroundColor: "#222",
          color: "#e0e0e0",
        },
      },
    };

    function siteName(url) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, ""); // youtube.com
        const first = host.split(".")[0]; // youtube
        return first.charAt(0).toUpperCase() + first.slice(1); // Youtube
      } catch {
        return url;
      }
    }

    function CitationHoverCard({ index, metadata }) {
      // 1️⃣ Normalise input
      const data = typeof metadata === "string" ? { url: metadata } : metadata;
      const { url = "", title = "", description = "", siteName = "" } = data;

      // 2️⃣ Host + rock-solid favicon (Google service, 64-px)
      let hostname = url;
      try {
        hostname = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        /* keep raw url */
      }
      const icon = `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;

      // 3️⃣ Clean title / description (strip tags, trim)
      const cleanTitle = stripHtml(title).trim();
      const finalTitle =
        cleanTitle.length >= 4 && !/^https?:/i.test(cleanTitle)
          ? cleanTitle
          : siteName || hostname;

      const cleanDesc = stripHtml(description).trim();
      const finalDesc = cleanDesc.length >= 10 ? cleanDesc : "";

      return (
        <span className="relative inline-block group ml-1 mr-1 mt-2">
          {/* superscript number */}
          <sup
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            className="cursor-pointer text-white px-2 py-1 bg-slate-800 rounded-sm hover:bg-slate-900 text-md"
          >
            {index}
          </sup>

          {/* pop-over */}
          <div className="absolute z-20 hidden group-hover:block bg-slate-900 text-white p-3 rounded-lg shadow-lg w-80 mt-2">
            {/* favicon + host */}
            <div className="flex items-center gap-2 mb-2">
              <img src={icon} alt="" className="w-5 h-5 rounded-full" />
              <span className="font-semibold text-sm">
                {hostname ? hostname : ""}
              </span>
            </div>

            {/* title */}
            {finalTitle && (
              <p className="text-xs font-medium leading-snug mb-1">
                {finalTitle}
              </p>
            )}

            {/* description (clamped) */}
            {finalDesc &&
              !finalDesc?.toLowerCase().includes("no description") && (
                <p className="text-xs text-gray-300 leading-snug line-clamp-3">
                  {finalDesc}
                </p>
              )}

            {/* raw link */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline text-xs break-all mt-2 inline-block"
            >
              {url}
            </a>
          </div>
        </span>
      );
    }

    // Helper to render text blocks with appropriate styling
    const renderTextBlock = (
      block,
      blockIdx,
      isLastBlock,
      currContent,
      isDeepThink = false,
      citations,
    ) => {
      console.log(citations, "streaming 3");
      const styles = isDeepThink ? tableStyles.deepThink : tableStyles.regular;
      const data = block.content
        .replace("undefined", "")
        .replace(
          /\[(\d+)\]/g,
          (_, n) => `<sup data-source="${n}">[${n}]</sup>`,
        );
      return (
        <div key={`text-${blockIdx}`}>
          <ReactMarkdown
            className={isDeepThink ? "module font-figtree" : "module"}
            children={data}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={{
              sup: ({ node, ...props }) => {
                try {
                  const sourceId = props["data-source"];
                  if (sourceId) {
                    const idx = Number(sourceId);
                    const urls = citations.map((item) => ({ url: item }));

                    const url = urls[idx - 1];
                    if (url)
                      return (
                        <CitationHoverCard index={idx} metadata={url.url} />
                      );
                  }
                  // default <sup> if something’s wrong
                  return <sup {...props}>{props.children}</sup>;
                } catch (error) {
                  console.error("Error rendering sup:", error);
                  return <div />;
                }
              },
              table: ({ children }) => (
                <table style={styles.table}>{children}</table>
              ),
              th: ({ children }) => <th style={styles.th}>{children}</th>,
              td: ({ children }) => <td style={styles.td}>{children}</td>,
            }}
          />

          {isLastBlock && renderActionButtons(currContent, blockIdx, citations)}
        </div>
      );
    };

    // Helper to render document blocks
    const renderDocumentBlock = (block, blockIdx) => (
      <div
        onClick={() =>
          handleBlockSidebar(block.content, block.type, block.name)
        }
        key={`doc-${blockIdx}`}
        className={`border-2 border-slate-800 bg-slate-900 flex justify-between items-center gap-2 relative rounded-lg p-1 ${
          block.isComplete
            ? "cursor-pointer hover:bg-slate-800 text-white flex"
            : ""
        }`}
      >
        <div
          className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col"
          style={{ maxWidth: "80%" }}
        >
          {block.name || "Document"}
          <p className="text-slate-600 text-sm">Document (Click)</p>
        </div>
        <div className="flex-shrink-0 px-3 py-2">
          <img src="/docx.svg" className="opacity-70 w-h-14 h-14 -rotate-6" />
        </div>
      </div>
    );

    // Helper to render visual blocks
    const renderVisualBlock = (block, blockIdx) => {
      const sanitizedMermaid = block.isComplete
        ? renderMermaidChart(block.content)
        : "";
      return (
        <div
          onClick={() =>
            handleBlockSidebar(sanitizedMermaid, block.type, block.name)
          }
          key={`visual-${blockIdx}`}
          className={`border-2 border-slate-800 bg-slate-900 flex justify-between items-center gap-2 relative rounded-lg p-1 ${
            block.isComplete
              ? "cursor-pointer hover:bg-slate-800 text-white flex"
              : ""
          }`}
        >
          <div
            className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col"
            style={{ maxWidth: "80%" }}
          >
            {block.name || "Document"}
            <p className="text-slate-600 text-sm">Visualization (Click)</p>
          </div>
          <div className="flex-shrink-0 px-3 py-2">
            <img src="/h.svg" className="opacity-70 w-h-14 h-14 -rotate-6" />
          </div>
        </div>
      );
    };

    // Helper to render mermaid charts
    const renderMermaidBlock = (block, blockIdx) => {
      const sanitizedContent = renderMermaidChart(block.content);
      return (
        <div
          key={`mermaid-${blockIdx}`}
          className="overflow-auto flex items-center justify-center"
        >
          <Mermaid chart={sanitizedContent} />
        </div>
      );
    };

    const RenderMaterial = (block, blockIdx) => (
      <div
        key={`material-${blockIdx}`}
        onClick={() => {
          const uniProtId =
            block.uniProt
              .match(/<showUniProt>(.*?)<\/showUniProt>/s)?.[1]
              ?.trim() || block.uniProt;
          handleMaterialSidebar(uniProtId, block.name);
        }}
        className={`border-2 border-slate-800 bg-slate-900 flex justify-between items-center gap-2 relative rounded-lg p-1 ${
          block.isComplete
            ? "cursor-pointer hover:bg-slate-800 text-white flex"
            : ""
        }`}
      >
        <div
          className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col"
          style={{ maxWidth: "80%" }}
        >
          {block.name || "Document"}
          <p className="text-slate-600 text-sm">Material (Click)</p>
        </div>
        <div className="flex-shrink-0 px-3 py-2">
          <img
            src="/materialSvg.png"
            className="w-16 h-14 -rotate-6 brightness-150 contrast-125 drop-shadow-lg"
          />
        </div>
      </div>
    );
    const stripHtml = (html = "") =>
      html
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/\s+/g, " ")
        .trim();
    // Helper to render action buttons (copy and download)
    const renderActionButtons = (content, blockIdx, citations) => (
      <div className="flex gap-2">
        <div className="flex justify-start border-2 border-slate-800 p-1 rounded-md w-fit items-center gap-2 mt-4 h-fit">
          {/* Copy */}
          <Button
            className={buttonWrapperClass}
            onClick={() => copyToClipboard(content)}
          >
            {isCopied ? (
              <Check className={iconClass} />
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="p-0">
                    <Copy className={iconClass} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy Content</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </Button>

          {/* Download */}
          <Dialog
            open={blockIdx === currDialogIndexOpen && pdfDialogOpen}
            onOpenChange={(val) => {
              if (val) {
                setCurrentContent(content || "No content available");
                setCurrDialogIndexOpen(blockIdx);
                setPdfDialogOpen(true);
              } else {
                setPdfDialogOpen(false);
                setCurrDialogIndexOpen(-1);
              }
            }}
          >
            <DialogTrigger asChild className="p-0 m-0 h-fit">
              <Button
                className={buttonWrapperClass}
                onClick={() => {
                  setCurrentContent(content || "No content available");
                  setCurrDialogIndexOpen(blockIdx);
                }}
              >
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger>
                      <FolderDown className={iconClass} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download Content</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl bg-slate-800">
              <h1 className="font-semibold text-lg text-white mb-3">
                Name And Download Your PDF
              </h1>
              <p className="text-white -mb-2">File Name</p>
              <Textarea
                className="w-full h-10 text-white"
                placeholder="Document Name"
                value={pdfFileName || "Document"}
                onChange={(e) => setpPdfFileName(e.target.value)}
              />
              <Button
                className="bg-slate-600 hover:bg-slate-500 text-white mt-4"
                onClick={() => handlePdfDownload(currentContent)}
                disabled={isPdfDownloadLoading}
              >
                {isPdfDownloadLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" />
                    Downloading...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileDown /> Downloads
                  </div>
                )}
              </Button>
            </DialogContent>
          </Dialog>

          {/* TTS */}
          <TTSPrompt
            prompt={content || "No Content available"}
            startButton={
              <div className={buttonWrapperClass}>
                <Volume2 className={iconClass} />
              </div>
            }
            StopButton={
              <div className={buttonWrapperClass}>
                <CircleStop className={iconClass} />
              </div>
            }
            loadingButton={
              <div className={buttonWrapperClass}>
                <Loader2 className={iconClass + " animate-spin"} />
              </div>
            }
          />
        </div>
        {citations && citations.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <Dialog>
              <DialogTrigger>
                <SourcesIndicator
                  citations={citations.map((item) => ({ url: item.url })) || []}
                  maxIcons={3}
                  onClick={() => {}}
                />
              </DialogTrigger>
              <DialogContent className="w-full max-w-3xl bg-slate-800 text-white">
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pb-2">
                  {citations.map((raw, idx) => {
                    // 1️⃣  normalise shape
                    const c = typeof raw === "string" ? { url: raw } : raw;
                    const { url = "" } = c;

                    // 2️⃣  hostname + favicon (always Google service, 64-px for retina)
                    let hostname = url;
                    try {
                      hostname = new URL(url).hostname.replace(/^www\./, "");
                    } catch {
                      /* keep raw url */
                    }
                    const icon = `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;

                    // 3️⃣  title logic
                    const rawTitle = c.title ? stripHtml(c.title) : "";
                    const title =
                      rawTitle.length >= 4 && !/^https?:/i.test(rawTitle)
                        ? rawTitle
                        : c.siteName || hostname;

                    // 4️⃣  description logic
                    const rawDesc = c.description
                      ? stripHtml(c.description)
                      : "";
                    const description = rawDesc.length >= 10 ? rawDesc : "";

                    return (
                      <div
                        key={idx}
                        className="bg-slate-700 rounded-xl px-4 py-3 flex flex-col shadow border border-[#23272f] hover:bg-slate-600 transition"
                      >
                        {/* line 1 — index, favicon, site name */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-400 font-semibold">
                            {idx + 1}.
                          </span>
                          <span className="flex items-center gap-1 text-sm font-medium text-gray-200">
                            <img
                              src={icon}
                              alt=""
                              className="w-5 h-5 rounded-full"
                            />
                            {c.siteName || hostname}
                          </span>
                        </div>

                        {/* title */}
                        {title && (
                          <p className="text-base font-semibold leading-snug text-gray-100 mb-1">
                            {title}
                          </p>
                        )}

                        {/* description */}
                        {description && (
                          <p className="text-sm text-gray-300 leading-snug mb-1 line-clamp-3">
                            {description}
                          </p>
                        )}

                        {/* raw link */}
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline break-all"
                        >
                          {url}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    );
    return (
      <div
        ref={chatContainerRef}
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('./Frame2.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className={`flex-1 overflow-y-auto font-figtree p-2 pt-8 space-y-2 w-full max-w-4xl mx-auto`}
      >
        <div
          className={`flex-1 overflow-y-auto font-figtree pb-56 pt-8 space-y-2 w-full`}
        >
          {conversation.map((item, index) => {
            if (item.role === "human") {
              return (
                <div className="flex flex-col items-end w-full justify-end">
                  <div className="bg-gradient-to-r from-[#001B3F] to-[#0A1429] max-w-[80%] border-2 border-slate-800 px-3 py-4 rounded-lg shadow break-words whitespace-pre-wrap">
                    {item.message
                      ? item.message.replaceAll(
                          "Provided Document : No document provided",
                          "",
                        )
                      : "{Message Not found}"}
                  </div>
                  {item.isRetry && (
                    <div className="flex gap-1 items-center text-slate-500">
                      <RotateCcw className="w-4 h-4  " />
                      <p>Retried</p>
                    </div>
                  )}
                </div>
              );
            } else if (item.type === "deepThink") {
              return (
                <div
                  key={`ai-deep-${index}`}
                  className="text-slate-300 rounded shadow "
                >
                  <hr className="my-2 border border-slate-700" />
                  <div className="flex gap-2">
                    {console.log(item.citations, "streaming 4")}
                    {item.citations
                      ?.filter((item) => item?.title.length >= 7)
                      .slice(0, 4) // first three
                      .map((cite, i) => (
                        <CitationMiniCard key={i} cite={cite} />
                      ))}
                  </div>
                  {item?.steps && item.steps.length > 0 && (
                    <ExecutionTimeline
                      steps={item.steps || []}
                      isComplete={item.isComplete}
                      isLoading={item.isLoading}
                      newStepIndex={
                        item.steps && item.steps.length > 0
                          ? item.steps.length - 1
                          : null
                      }
                    />
                  )}

                  {item.markdownBuffer && (
                    <div className="final-response p-4 border border-gray-800 rounded-lg bg-gray-900 shadow-lg w-full items-center">
                      <h2 className="text-xl font-bold mb-4 flex items-center">
                        Final Response
                        {item.isStreaming && (
                          <span className="ml-2 inline-flex">
                            <span className="h-2 w-2 bg-purple-600 rounded-full animate-pulse mx-0.5"></span>
                            <span
                              className="h-2 w-2 bg-purple-600 rounded-full animate-pulse mx-0.5"
                              style={{ animationDelay: "0.2s" }}
                            ></span>
                            <span
                              className="h-2 w-2 bg-purple-600 rounded-full animate-pulse mx-0.5"
                              style={{ animationDelay: "0.4s" }}
                            ></span>
                          </span>
                        )}
                      </h2>
                      <div className="text-stream flex w-full items-center justify-center">
                        <div className="prose prose-invert max-w-3xl">
                          <StreamingResponse
                            content={item.markdownBuffer}
                            handleMaterialSidebar={handleMaterialSidebar}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {Array.isArray(item.message) &&
                    item.message.map((block, blockIdx) => {
                      const isLastBlock =
                        blockIdx === item.message.length - 1 &&
                        (!isNextChatLoading ||
                          conversation.length !== index + 1);
                      const currContent = extractContentFromBlocks(
                        item.message,
                      );
                      console.log(item, " streaming 5asd");
                      if (block.type === "showUniProt") {
                        return RenderMaterial(block, blockIdx);
                      } else if (block.type === "simulation") {
                        return (
                          <ChatSimulation
                            key={`simulation-${blockIdx}`}
                            personas={block.items}
                            isLoading={false}
                          />
                        );
                      } else if (block.type === "text") {
                        return renderTextBlock(
                          block,
                          blockIdx,
                          isLastBlock,
                          currContent,
                          true,
                          item.citations || [],
                        );
                      } else if (block.type === "mermaid") {
                        return renderMermaidBlock(block, blockIdx);
                      } else if (block.type === "document") {
                        return renderDocumentBlock(block, blockIdx);
                      } else if (block.type === "visual") {
                        return renderVisualBlock(block, blockIdx);
                      } else if (block.type == "automationDaily") {
                        return (
                          <div
                            key={`automation-${blockIdx}`}
                            className="bg-gradient-to-r from-[#001B3F] to-[#0A1429] max-w-[80%] border-2 border-slate-800 px-3 py-4 rounded-lg shadow break-words whitespace-pre-wrap space-y-2"
                          >
                            <h2 className="text-lg font-semibold mb-2">
                              {block.name}
                            </h2>
                            <div className="items-center flex gap-2">
                              <CalendarCheck className="w-4 h-4" />
                              <p>Task</p>
                            </div>
                            <p className="text-sm text-slate-400">
                              {block.task}
                            </p>
                            <div className="items-center flex gap-2">
                              <Clock className="w-4 h-4" />
                              <p>Trigger Time</p>
                            </div>
                            <p className="text-sm text-slate-400 mt-2">
                              {block.time}
                            </p>
                            <div className="items-center flex gap-2">
                              <Book className="w-4 h-4" />
                              <p>Output Format</p>
                            </div>
                            <p className="text-sm text-slate-400 mt-2">
                              {block.outputFormat}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })}
                </div>
              );
            } else {
              console.log(item, "steaming 1");
              // For other AI responses
              return (
                <div
                  key={`ai-${index}`}
                  className="text-slate-300 rounded shadow space-y-4"
                >
                  <hr className="my-2 border border-slate-700" />
                  <div className="flex gap-2">
                    {console.log(item.citations, "streaming 4")}
                    {item.citations
                      ?.filter((item) => item?.title.length >= 7)
                      .slice(0, 4) // first three
                      .map((cite, i) => (
                        <CitationMiniCard key={i} cite={cite} />
                      ))}
                  </div>
                  {item.workflow && item.workflow.length > 0 && (
                    <PollStatus
                      workflow={item.workflow}
                      updated={item.updated || []}
                      isActive={isChanged}
                      isOpen={true}
                      sessionId={id}
                      isCompleted={item?.message}
                    />
                  )}
                  {Array.isArray(item.message) &&
                    item.message.map((block, blockIdx) => {
                      const isLastBlock =
                        blockIdx === item.message.length - 1 &&
                        (!isNextChatLoading ||
                          conversation.length !== index + 1);
                      const currContent = extractContentFromBlocks(
                        item.message,
                      );
                      if (block.type === "showUniProt") {
                        return RenderMaterial(block, blockIdx);
                      } else if (block.type === "text") {
                        console.log(item.citations, "streaming 2123123");
                        return renderTextBlock(
                          block,
                          blockIdx,
                          isLastBlock,
                          currContent,
                          true,
                          item.citations,
                        );
                      } else if (block.type === "mermaid") {
                        return renderMermaidBlock(block, blockIdx);
                      } else if (block.type === "simulation") {
                        return (
                          <ChatSimulation
                            key={`simulation-${blockIdx}`}
                            personas={block.items}
                            isLoading={
                              conversation.length === index + 1 &&
                              isNextChatLoading
                            }
                          />
                        );
                      } else if (block.type === "document") {
                        return renderDocumentBlock(block, blockIdx);
                      } else if (block.type === "visual") {
                        return renderVisualBlock(block, blockIdx);
                      } else if (block.type == "automationDaily") {
                        return (
                          <div
                            key={`automation-${blockIdx}`}
                            className="bg-gradient-to-r from-[#001B3F] to-[#0A1429] max-w-[80%] border-2 border-slate-800 px-3 py-4 rounded-lg shadow break-words whitespace-pre-wrap space-y-2"
                          >
                            <h2 className="text-lg font-semibold mb-2">
                              {block.name}
                            </h2>
                            <div className="items-center flex gap-2">
                              <CalendarCheck className="w-4 h-4" />
                              <p>Task</p>
                            </div>
                            <p className="text-sm text-slate-400">
                              {block.task}
                            </p>
                            <div className="items-center flex gap-2">
                              <Clock className="w-4 h-4" />
                              <p>Trigger Time</p>
                            </div>
                            <p className="text-sm text-slate-400 mt-2">
                              {block.time}
                            </p>
                            <div className="items-center flex gap-2">
                              <Book className="w-4 h-4" />
                              <p>Output Format</p>
                            </div>
                            <p className="text-sm text-slate-400 mt-2">
                              {block.outputFormat}
                            </p>
                          </div>
                        );
                      }
                    })}
                </div>
              );
            }
          })}
          {/* {
    "type": "automationDaily",
    "name": "Daily Google Stock Analysis",
    "task": "Automated daily analysis of Alphabet Inc. (GOOGL) stock, integrating real-time price movement, trading volume, technical indicators (moving averages, RSI, MACD), news sentiment, and comparative performance versus key technology sector peers. The automation synthesizes actionable insights, risk metrics, and concise summary charts for immediate decision support. All frameworks and advanced formulas for market analysis, sentiment quantification, and volatility assessment are directly applied to the latest available data each day.",
    "time": "16:00 UTC daily (you will have next report after 1 hour)",
    "outputFormat": "1. Executive Summary of Google Stock Performance\n2. Price Movement and Volume Analysis\n3. Technical Indicators Breakdown (Moving Averages, RSI, MACD)\n4. Real-Time News Sentiment Impact\n5. Comparative Analysis with Tech Sector Peers\n6. Actionable Insights and Risk Metrics\n7. Visual Charts and Data Tables\n8. Strategic Recommendations",
    "isComplete": true
} */}
          <div ref={endRef} />
          {isNextChatLoading && (
            <div className="flex h-fit items-center space-x-2 text-blue-400">
              <LoadingAnimation
                currentQuote={loadingMessage || "Thinking . . ."}
              />
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default memo(Conversation);
