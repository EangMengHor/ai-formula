import { useToast } from "@/hooks/use-toast";
import { generateFileName } from "@/services/genereteFileName";
import {
  Check,
  CircleStop,
  Copy,
  FileDown,
  FolderDown,
  Loader2,
  Sparkle,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeFileName, stripHtml } from "@/lib/utils";
import TTSPrompt from "@/components/custom/TTSPrompt";
import SourcesIndicator from "@/components/custom/CitationSources";
import ReactDOM from "react-dom/client";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import rehypeRaw from "rehype-raw";

const buttonWrapperClass =
  "px-3  bg-transparent bg-slate-900 hover:bg-slate-700 rounded-xl flex items-center justify-center";
const iconClass = "h-6 w-6";

export default function RenderActionButtons({
  content,
  blockIdx,
  citations,
  setpPdfFileName,
  setCurrentContent,
  currentContent,
  handlePdfDownload = () => {},
  pdfFileName = "Document",
  setPdfDialogOpen = () => {},
  item = {},
}) {
  const [isPdfDownloadLoading, setIsPdfDownloadLoading] = useState(false);
  const [isPdfAutonameLoading, setIsPdfAutonameLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const [fullContent, setFullContent] = useState("");
  const [isCopyLoading, setIsCopyLoading] = useState(false);

  // ⬇️ 2.  unchanged helpers (setIsCopyLoading, toast, …)

  /**
   * Copy BOTH:
   *   • text/plain  → untouched Markdown (with LaTeX)
   *   • text/html   → rendered Markdown (LaTeX still visible as \text{…})
   */
  async function copyToClipboard(markdownText, citations = []) {
    try {
      console.log(markdownText, "markdownText in copyToClipboard", citations);
      setIsCopyLoading(true);

      /* 1️⃣  link-ify [1] → <a href> while still in Markdown */
      const linked = markdownText.replace(/\[(\d+)\]/g, (_, n) => {
        const key = `[${n}]`;
        const href = citations[n - 1]
          ? typeof citations[n - 1] === "string"
            ? citations[n - 1]
            : citations[n - 1].url
          : null;
        return href ? `<a href="${href}" target="_blank">${key}</a>` : key;
      });

      /* append refs list */
      const refs = citations.length
        ? "\n\n### References\n" +
          citations
            .map((c, i) => {
              const url = typeof c === "string" ? c : c.url;
              const title = c?.title || c?.siteName || url;
              return `${i + 1}. [${title}](${url})`;
            })
            .join("\n")
        : "";
      const finalMD = linked + refs;

      /* 2️⃣  render to HTML (KaTeX + tables) in a hidden container */
      const host = document.createElement("div");
      host.style.cssText =
        "position:fixed;left:-9999px;top:0;pointer-events:none;opacity:0;";
      document.body.appendChild(host);

      const root = ReactDOM.createRoot(host);
      await new Promise((done) => {
        root.render(
          <ReactMarkdown
            children={finalMD}
            remarkPlugins={[remarkGfm]} // ⬅️ drop remarkMath
            rehypePlugins={[rehypeRaw]}
            components={{
              table: (p) => (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "1.5rem",
                    fontSize: "0.95rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  {p.children}
                </table>
              ),
              thead: (p) => (
                <thead
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#111827",
                    borderBottom: "1px solid #d1d5db",
                  }}
                >
                  {p.children}
                </thead>
              ),
              th: (p) => (
                <th
                  style={{
                    padding: "12px 16px",
                    fontWeight: 600,
                    background: "#e5e7eb",
                    borderBottom: "1px solid #d1d5db",
                  }}
                >
                  {p.children}
                </th>
              ),
              td: (p) => (
                <td
                  style={{
                    padding: "12px 16px",
                    color: "#374151",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  {p.children}
                </td>
              ),
              tr: (p) => (
                <tr
                  style={{ transition: "background-color 0.15s ease" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f3f4f6")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#ffffff")
                  }
                >
                  {p.children}
                </tr>
              ),
            }}
          />,
        );
        setTimeout(done, 200); // let KaTeX & copy-tex finish
      });

      const htmlBlob = new Blob([`<div>${host.innerHTML}</div>`], {
        type: "text/html",
      });
      const textBlob = new Blob([finalMD], { type: "text/plain" });

      /* 3️⃣  write both flavours */
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": htmlBlob, "text/plain": textBlob }),
      ]);

      root.unmount();
      document.body.removeChild(host);
    } catch (err) {
      console.error("Copy failed:", err);
    } finally {
      setIsCopyLoading(false);
    }
  }
  useEffect(() => {
    if (item) {
      setFullContent(
        item?.message
          .filter((item) => item.type == "text")
          ?.map((item) => item.content)
          ?.join("\n\n") ||
          "Error" ||
          "document",
      );
    }
  }, [item]);

  useEffect(() => {
    console.log(fullContent, "fullContent in RenderActionButtons");
  }, [fullContent]);

  console.log(item, "item in RenderActionButtons");
  async function fetchAutoFileName() {
    setIsPdfAutonameLoading(true);
    try {
      const res = await generateFileName(content); // Limit to first 1000 characters

      if (res.success) {
        setpPdfFileName(res.fileName);
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to generate file name",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating file name:", error);
      toast({
        title: "Error",
        description: "Failed to generate file name",
        variant: "destructive",
      });
    } finally {
      setIsPdfAutonameLoading(false);
    }
  }

  return (
    <div className="flex w-full">
      <div className="flex justify-start rounded-md w-fit  items-center gap-2 mt-4 ">
        {/* Copy */}
        <Button
          className={buttonWrapperClass}
          onClick={async () => {
            await copyToClipboard(
              fullContent || "No content available",
              citations,
            );
            setIsCopied(true);
            setTimeout(() => {
              setIsCopied(false);
            }, 1000);
            toast({
              title: "Copied to clipboard",
              description: "Content copied to clipboard successfully",
              variant: "success",
            });
          }}
        >
          {isCopyLoading ? (
            <div className="flex gap-2 items-center">
              <Loader2 className={`animate-spin ${iconClass}`} />
              <p>Copying...</p>
            </div>
          ) : isCopied ? (
            <div className="flex gap-2 items-center">
              <Check className={iconClass} />
              <p>Copied</p>
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex gap-2 items-center mr-3">
                  <Copy className={iconClass} />
                  <p>Copy</p>
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
          onOpenChange={(open) => {
            if (!open) {
              setCurrentContent("");
            }
          }}
        >
          <DialogTrigger asChild className="">
            <Button
              className={buttonWrapperClass}
              onClick={() => {
                setCurrentContent(content || "No content available");
              }}
            >
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger className="flex gap-2 items-center">
                    <FolderDown className={iconClass} />
                    <p>Download</p>
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
              value={pdfFileName}
              onChange={(e) => setpPdfFileName(e.target.value)}
            />
            <div className="w-full flex gap-2">
              <Button
                onClick={fetchAutoFileName}
                className="bg-slate-600 w-1/2 hover:bg-slate-500 text-white mt-4"
                disabled={isPdfAutonameLoading}
              >
                {isPdfAutonameLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" />
                    Generating Name...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkle /> Generate Name
                  </div>
                )}
              </Button>
              <Button
                className="bg-slate-600 w-1/2 hover:bg-slate-500 text-white mt-4"
                onClick={() =>
                  handlePdfDownload({
                    currContent: fullContent || "Error" || "document",
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
            </div>
          </DialogContent>
        </Dialog>

        {/* TTS */}
        <TTSPrompt
          prompt={fullContent || "No Content available"}
          startButton={
            <Button className={buttonWrapperClass}>
              <div className="flex items-center gap-2">
                <Volume2 className={iconClass} />
                <p>Voice</p>
              </div>
            </Button>
          }
          StopButton={
            <Button className={`${buttonWrapperClass} border-2 border-white `}>
              <div className="flex items-center gap-2">
                <CircleStop className={iconClass} />
                <p>Stop</p>
              </div>
            </Button>
          }
          loadingButton={
            <Button className={buttonWrapperClass}>
              <div className="flex items-center gap-2">
                <Loader2 className={`${iconClass} animate-spin`} />
                <p>Starting...</p>
              </div>
            </Button>
          }
        />
      </div>
      {citations && citations.length > 0 && (
        <div className="flex items-center gap-2 mt-4">
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
                  const rawDesc = c.description ? stripHtml(c.description) : "";
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
}
