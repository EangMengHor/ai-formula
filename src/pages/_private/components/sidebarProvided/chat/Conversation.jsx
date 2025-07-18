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
  Sparkle,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TTSPrompt from "@/components/custom/TTSPrompt";
import rehypeRaw from "rehype-raw";
import {
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
import { generateFileName } from "@/services/genereteFileName";
import RenderActionButtons from "./ChatActionButtons";
import OmniResilience from "@/components/custom/OmniResilience";
import UserMessage from "@/components/custom/UserMessage";
const buttonWrapperClass =
  "p-1 w-6 h-6 bg-transparent hover:bg-slate-800 rounded-md flex items-center justify-center";

const iconClass = "h-6 w-6";

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
      handleSubmit = () => {},
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
      item,
    ) => {
      const styles = isDeepThink ? tableStyles.deepThink : tableStyles.regular;
      const data = block.content
        .replace("undefined", "")
        .replaceAll("Error: Aborted", "")
        .replaceAll("Error: Timeout", "")
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

          {isLastBlock && (
            <RenderActionButtons
              currContent={currContent}
              blockIdx={blockIdx}
              citations={citations}
              content={block.content}
              setpPdfFileName={setpPdfFileName}
              currentContent={currentContent}
              setCurrentContent={setCurrentContent}
              handlePdfDownload={handlePdfDownload}
              pdfFileName={pdfFileName}
              setPdfDialogOpen={setPdfDialogOpen}
              item={item}
              handleSubmit={handleSubmit}
            />
          )}
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
                <UserMessage
                  content={item.message || ""}
                  isRetried={item.isRetry}
                  key={index}
                />
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
                          item,
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
                      } else if (block.type == "omni") {
                        console.log(block, "omni block");

                        return <OmniResilience block={block} />;
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
