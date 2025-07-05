import React, { memo, forwardRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { Mermaid } from "../../../../../components/custom/Mermaid";
import ChatSimulation from "../../../../../components/custom/AiInteraction/ChatSimulation";
import LoadingAnimation from "@/components/custom/Loading";
import {
  RotateCcw,
  FileDown,
  Loader2,
  Copy,
  Check,
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
import {
  copyToClipboard,
  extractContentFromBlocks,
  getFavicon,
  processAgenticCitations,
  sanitizeFileName,
  stripHtml,
  tableStyles,
} from "@/lib/utils";
import SourcesIndicator from "@/components/custom/CitationSources";
import CitationMiniCard from "../components/CitationMiniCard";
import DeepThoughts from "./DeepThoughts";
import AutomationCard from "./blocks/AutomationCard";
import { handlePdfDownload } from "./PdfDownload";
import CitationHoverCard from "./CitationsHoverCard";
import AgentCitationsHoverCard from "./AgentCitationsHoverCard";
import Visualization from "@/components/custom/DynamicCharts/Visualization";
import VectorStoreScrapper from "@/components/custom/webVectorStoreScrapper/VectorStoreScrapper";
import UrlShower from "@/components/custom/urlScraperSidebar/UrlShower";
import OsintNewInstance from "@/components/custom/osint/OsintNewInstance";
const buttonWrapperClass =
  "p-1 w-6 h-6 bg-transparent hover:bg-slate-800 rounded-md flex items-center justify-center";

const iconClass = "h-5 w-5";

const Conversation = forwardRef(
  (
    {
      conversation,
      isNextChatLoading,
      id,
      loadingMessage = "Thinking . . .",
      chatContainerRef, // This comes from Chat.jsx
      endRef, // This comes from Chat.jsx
      handleBlockSidebar,
      handleVectorStoreSidebar,
      handleMaterialSidebar,
      renderMermaidChart,
      handleUrlScraperSidebar,
      handleNewOsintInstance,
      errorMessage = "Something Went Wrong!!",
      onRetry,
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
    // Helper function to process PDF download

    useEffect(() => {
      console.log("Conversation data:", conversation);
    }, [conversation]);

    // Helper to render text blocks with appropriate styling
    const renderTextBlock = (
      block,
      blockIdx,
      isLastBlock,
      currContent,
      isDeepThink = false,
      citations,
      agentSimulationObj,
      agenticCitation,
    ) => {
      const styles = isDeepThink ? tableStyles.deepThink : tableStyles.regular;
      const data = block.content
        .replace("undefined", "")
        //  [|1|] > sup
        .replace(
          /\[\|(\d+)\|\]/g,
          (_, n) => `<sup data-source="agentCitations-${n}">[${n}]</sup>`,
        )
        // [1] > sup
        .replace(
          /\[(\d+)\]/g,
          (_, n) => `<sup data-source="searchCitations-${n}">[${n}]</sup>`,
        );

      return (
        <div key={`text-${blockIdx}`}>
          <ReactMarkdown
            className={"module"}
            children={data}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={{
              sup: ({ node, ...props }) => {
                try {
                  const sourceId = props["data-source"];

                  if (sourceId && sourceId.includes("searchCitations-")) {
                    const idx = Number(
                      sourceId.replaceAll("searchCitations-", ""),
                    );
                    const urls = citations.map((item) => ({ url: item }));

                    const url = urls[idx - 1];

                    if (url)
                      return (
                        <CitationHoverCard index={idx} metadata={url.url} />
                      );
                  } else if (sourceId && sourceId.includes("agentCitations-")) {
                    console.log(
                      {
                        sourceId,
                        agentSimulationObj,
                        agenticCitation,
                      },
                      "agenticCitation data",
                    );
                    const citationId = sourceId.replaceAll(
                      "agentCitations-",
                      "",
                    );
                    const citations = processAgenticCitations(
                      agenticCitation,
                      agentSimulationObj,
                    );

                    if (!citations[citationId]) {
                      return <sup {...props}>-</sup>;
                    }
                    return (
                      <span {...props} className="cursor-pointer">
                        <AgentCitationsHoverCard
                          agentData={citations[citationId] || {}}
                        />
                      </span>
                    );
                  }
                  // default <sup> if something’s wrong
                  return <sup {...props}>{props.children}</sup>;
                } catch (error) {
                  console.error("Error rendering sup:", error);
                  return <p></p>;
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
        className={` bg-slate-900 flex justify-between items-center gap-2 relative rounded-2xl p-1 ${
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
          className={` bg-g1 flex justify-between items-center gap-2 relative rounded-2xl p-1 ${
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

    const renderCot = (text, collapsed = true, index) => {
      console.log(text, typeof text, collapsed, index, "streaming 4");
      return (
        <DeepThoughts
          text={text || ""}
          isCollapsedByDefault={collapsed || false}
          isLoading={index + 1 == conversation.length && isNextChatLoading}
        />
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

    // Helper to render action buttons (copy and download)
    const renderActionButtons = (content, blockIdx, citations) => (
      <div className="flex gap-2">
        <div className="flex justify-start border-2 border-slate-800 p-1 rounded-md w-fit items-center gap-2 mt-4 h-fit">
          {/* Copy */}
          <Button
            className={buttonWrapperClass}
            onClick={() => {
              copyToClipboard(content);
              setIsCopied(true);
              toast({
                title: "Copied to clipboard",
                description: "Content copied to clipboard successfully",
                variant: "success",
              });
            }}
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
                onClick={() =>
                  handlePdfDownload({
                    currContent: currentContent,
                    pdfFileName: sanitizeFileName(pdfFileName || "Document"),
                    setIsPdfDownloadLoading,
                    setPdfDialogOpen,
                    toast,
                  })
                }
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
            {console.log(citations, "citations")}
            <Dialog>
              <DialogTrigger>
                <SourcesIndicator
                  citations={
                    citations.map((item) => ({
                      url: typeof item == "string" ? item : item.url,
                    })) || []
                  }
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
                              className="w-5 h-5
                               rounded-full"
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
                  <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 max-w-[80%]  px-3 py-4 rounded-2xl shadow break-words whitespace-pre-wrap">
                    {item.message
                      ? item.message.replaceAll(
                          "Provided Document : No document provided",
                          "",
                        )
                      : "{Message Not found}"}
                  </div>
                  {item?.isRetry && (
                    <div className="flex gap-1 items-center text-slate-500">
                      <RotateCcw className="w-4 h-4  " />
                      <p>Retried</p>
                    </div>
                  )}
                </div>
              );
            } else {
              const isLoadingAndFinalResponseIsNotThere =
                isNextChatLoading &&
                index + 1 == conversation.length &&
                !item.message.find((i) => i.type == "text");

              // For other AI responses
              return (
                <div
                  key={`ai-${index}`}
                  className="text-slate-300 rounded shadow space-y-4"
                >
                  {/* deep thoughts */}
                  {item?.cot &&
                    typeof item.cot === "string" &&
                    renderCot(
                      item.cot || ".",
                      !isLoadingAndFinalResponseIsNotThere,
                      isLoadingAndFinalResponseIsNotThere,
                    )}

                  {Array.isArray(item.message) &&
                    item.message.map((block, blockIdx) => {
                      // to show action buttons
                      const isLastBlock =
                        blockIdx === item.message.length - 1 &&
                        (!isNextChatLoading ||
                          conversation.length !== index + 1);
                      // for pdf download : combine all the content for pdf download
                      const currContent = extractContentFromBlocks(
                        item.message,
                      );
                      if (block.type === "showUniProt") {
                        return RenderMaterial(block, blockIdx);
                      } else if (block.type === "text") {
                        let simulation =
                          item.message.find((b) => b.type === "simulation") ||
                          null;

                        if (!simulation && conversation.length >= 2) {
                          const secondLast =
                            conversation[conversation.length - 2];
                          if (secondLast?.type === "simulation") {
                            simulation =
                              secondLast.message?.find(
                                (msg) => msg?.type === "simulation",
                              ) || null;
                          } else if (
                            secondLast &&
                            secondLast.message &&
                            secondLast.message.length > 0 &&
                            secondLast.message[0]?.type === "simulation"
                          ) {
                            simulation =
                              secondLast.message?.find(
                                (msg) => msg?.type === "simulation",
                              ) || null;
                          }
                          console.log(simulation, "2nd parse");
                        }

                        return renderTextBlock(
                          block,
                          blockIdx,
                          isLastBlock,
                          currContent,
                          true,
                          item.citations,
                          simulation,
                          item.agenticCitations,
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
                          <AutomationCard block={block} blockIdx={blockIdx} />
                        );
                      } else if (block.type == "chart") {
                        const dataId = block.dataId;
                        const dataName = block.dataName;
                        const dataLabel = block.dataLabel;
                        const type = block.chartType;
                        return (
                          <Visualization
                            dataId={dataId}
                            chartType={type}
                            dataName={dataName}
                            dataLabel={dataLabel}
                          />
                        );
                      } else if (block.type == "urlScraper") {
                        const jobId = block.jobId;
                        const name = block.name;
                        const numOfUrls = block.numOfUrls;
                        console.log(block, "urlScraper block");

                        return (
                          <UrlShower
                            jobId={jobId}
                            name={name || "Url Scraper"}
                            numOfUrls={numOfUrls || "0"}
                            handleUrlScraperSidebar={handleUrlScraperSidebar}
                          />
                        );
                      } else if (block.type == "vectorStoreJob") {
                        const databaseId = block.vsId;
                        console.log(block);
                        return (
                          <VectorStoreScrapper
                            databaseId={databaseId}
                            handleBlockSidebar={handleVectorStoreSidebar}
                            name={block.name || "Vector Store Scrapper"}
                          />
                        );
                      } else if (block.type == "osintInstance") {
                        console.log(block, "osintInstance block");

                        return (
                          <OsintNewInstance
                            workflowId={block.osintWorkflowId || ""}
                            name={block.name || "OSINT Instance"}
                            handleBlockSidebar={handleNewOsintInstance}
                          />
                        );
                      }
                    })}
                  {item && item?.isAbortManually && (
                    <div className="bg-yellow-700 flex gap-2 items-center justify-between text-white p-3 px-4 rounded-2xl">
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Paused</h2>
                        <p>Response Paused Manually !</p>
                      </div>
                    </div>
                  )}
                  {/* error */}
                  {item && item.isError && !item?.isAbortManually && (
                    <div className="bg-red-900 flex gap-2 items-center justify-between text-white p-3 px-4 rounded-2xl">
                      <div>
                        <h2 className="text-lg font-semibold mb-2">
                          Error Occurred
                        </h2>
                        <p>{item.errorMessage || errorMessage}</p>
                      </div>
                      <button
                        className=" bg-red-500 px-7 py-3 rounded-2xl hover:bg-red-600"
                        onClick={() => {
                          onRetry();
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  )}
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
