import React, {
  memo,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
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
  Download,
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

const Conversation = forwardRef(
  (
    {
      conversation,
      isNextChatLoading,
      isShowInteractionLogs,
      chatContainerRef,
      bottomRef,
      scrollTimeoutRef,
      sidebarStack,
      id,
      handleBlockSidebar,
      renderMermaidChart,
      currentLoadingMessage,
      interactionLogs,
      isChanged,
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

    console.log(conversation, "interactionLogs");

    useEffect(() => {
      if (
        bottomRef.current &&
        conversation[conversation.length - 1]?.role !== "ai"
      ) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }
      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, [conversation, isNextChatLoading, bottomRef, scrollTimeoutRef]);

    // Expose a method to force scroll to bottom
    useImperativeHandle(ref, () => ({
      forceScrollToBottom() {
        if (bottomRef.current) {
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
          // Scroll immediately and smoothly
          bottomRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }
      },
    }));

    const sanitizeFileName = (name) => {
      return name.replace(/[/\\?%*:|"<>]/g, "-").trim();
    };

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
        console.log("PDF content:", currentContent);

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

    // Helper to render text blocks with appropriate styling
    const renderTextBlock = (
      block,
      blockIdx,
      isLastBlock,
      currContent,
      isDeepThink = false,
    ) => {
      const styles = isDeepThink ? tableStyles.deepThink : tableStyles.regular;

      return (
        <div key={`text-${blockIdx}`}>
          <ReactMarkdown
            className={isDeepThink ? "module font-figtree" : "module"}
            children={block.content.replace("undefined", "")}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              table: ({ children }) => (
                <table style={styles.table}>{children}</table>
              ),
              th: ({ children }) => <th style={styles.th}>{children}</th>,
              td: ({ children }) => <td style={styles.td}>{children}</td>,
            }}
          />

          {isLastBlock && renderActionButtons(currContent, blockIdx)}
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

    // Helper to render action buttons (copy and download)
    const renderActionButtons = (content, blockIdx) => (
      <div className="flex justify-start gap-2 mt-4">
        <Button
          variant="outline"
          className="hover: font-semibold px-3 py-2 rounded-md cursor-pointer focus:outline-none flex items-center gap-2"
          onClick={() => copyToClipboard(content)}
        >
          {isCopied ? (
            <Check className="h-4 w-4" />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Copy className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy Content</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Button>
        <Dialog
          open={blockIdx === currDialogIndexOpen && pdfDialogOpen}
          onOpenChange={(val) => {
            if (val) {
              // Ensure content is set when dialog opens
              setCurrentContent(content || "No content available");
              setCurrDialogIndexOpen(blockIdx);
              setPdfDialogOpen(true);
            } else {
              setPdfDialogOpen(false);
              setCurrDialogIndexOpen(-1);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="hover:bg-slate-800 font-semibold px-3 py-2 rounded-md cursor-pointer focus:outline-none flex items-center gap-2"
              onClick={() => {
                // Set content immediately when button is clicked
                setCurrentContent(content || "No content available");
                setCurrDialogIndexOpen(blockIdx);
              }}
            >
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <Download className="h-4 w-4" />
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
      </div>
    );

    return (
      <div
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('./Frame2.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className={`flex-1 overflow-y-auto font-figtree p-4 pt-8 space-y-2 w-full ${sidebarStack.length > 0 ? "max-w-2xl" : "max-w-4xl"} mx-auto`}
      >
        {conversation.map((item, index) => {
          if (item.role === "human") {
            return (
              <div className="flex flex-col items-end w-full justify-end">
                <div
                  ref={
                    index === conversation.length - 1 ? chatContainerRef : null
                  }
                  className="bg-gradient-to-r from-[#001B3F] to-[#0A1429] max-w-[80%] border-2 border-slate-800 px-3 py-4 rounded-lg shadow break-words whitespace-pre-wrap"
                >
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
                className="text-slate-300 rounded shadow space-y-4"
              >
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
                        <StreamingResponse content={item.markdownBuffer} />
                      </div>
                    </div>
                  </div>
                )}

                {Array.isArray(item.message) &&
                  item.message.map((block, blockIdx) => {
                    const isLastBlock =
                      blockIdx === item.message.length - 1 &&
                      (!isNextChatLoading || conversation.length !== index + 1);
                    const currContent = extractContentFromBlocks(item.message);

                    if (block.type === "simulation") {
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
                      );
                    } else if (block.type === "mermaid") {
                      return renderMermaidBlock(block, blockIdx);
                    } else if (block.type === "document") {
                      return renderDocumentBlock(block, blockIdx);
                    } else if (block.type === "visual") {
                      return renderVisualBlock(block, blockIdx);
                    }
                    return null;
                  })}
              </div>
            );
          } else {
            // For other AI responses
            return (
              <div
                key={`ai-${index}`}
                className="text-slate-300 rounded shadow space-y-4"
                ref={
                  index === conversation.length - 1 ? chatContainerRef : null
                }
              >
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
                      (!isNextChatLoading || conversation.length !== index + 1);
                    const currContent = extractContentFromBlocks(item.message);

                    if (block.type === "text") {
                      return renderTextBlock(
                        block,
                        blockIdx,
                        isLastBlock,
                        currContent,
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
                    }
                    return null;
                  })}
              </div>
            );
          }
        })}

        {isNextChatLoading && (
          <div className="flex mb-[60%] items-center space-x-2 text-blue-400">
            <LoadingAnimation currentQuote={currentLoadingMessage} />
          </div>
        )}

        <div ref={scrollTimeoutRef} className="h-1 w-full" />
        <div ref={bottomRef} className="h-1 w-full" />
      </div>
    );
  },
);

export default memo(Conversation);
