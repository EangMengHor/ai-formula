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
import { useState } from "react";
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
const buttonWrapperClass =
  "p-1 w-6 h-6 bg-transparent hover:bg-slate-800 rounded-md flex items-center justify-center";
const iconClass = "h-6 w-6";
export default function RenderActionButtons({
  content,
  blockIdx,
  citations,
  setpPdfFileName,
  copyToClipboard = () => {},
  setCurrentContent,
  currentContent,
  handlePdfDownload = () => {},
  pdfFileName = "Document",
  setPdfDialogOpen = () => {},
}) {
  const [isPdfDownloadLoading, setIsPdfDownloadLoading] = useState(false);
  const [isPdfAutonameLoading, setIsPdfAutonameLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
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
    <div className="flex gap-2">
      <div className="flex justify-start  p-1 rounded-md bg-slate-900  items-center gap-2 mt-4 ">
        {/* Copy */}
        <Button
          className={buttonWrapperClass}
          onClick={() => {
            copyToClipboard(content);
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
          onOpenChange={(open) => {
            if (!open) {
              setCurrentContent("");
            }
          }}
        >
          <DialogTrigger asChild className="p-0 m-0 h-fit">
            <Button
              className={buttonWrapperClass}
              onClick={() => {
                setCurrentContent(content || "No content available");
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
                    currContent: currentContent || "document",
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
