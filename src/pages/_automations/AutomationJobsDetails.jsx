import { useToast } from "@/hooks/use-toast";
import {
  convertUrlsToMarkdown,
  getFavicon,
  sanitizeFileName,
} from "@/lib/utils";
import { getJobDataById } from "@/services/automations/getJobDataById.api";
import { getAutomationJobsById } from "@/services/n8n-agentic-auto/getAutomationJobsById.api";
import { Loader, Loader2, Clock, Calendar, FileDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import ReactMarkdown from "react-markdown";
import SourcesIndicator from "@/components/custom/CitationSources";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { downloadPdf } from "@/services/n8n-apis/_core/downloadPdf.api";
export default function AutomationJobDetails() {
  const { id } = useParams();

  const [isAutomationDataLoading, setIsAutomationDataLoading] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [error, setError] = useState(null);
  const [favicons, setFavicons] = useState([]);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isPdfDownloadLoading, setIsPdfDownloadLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    async function fetchJobData() {
      setIsAutomationDataLoading(true);
      try {
        const data = await getJobDataById(id);

        if (data) {
          console.log("Fetched Job Data:", data.data);
          setJobData(data.data);
        } else {
          console.error("No job data found for ID:", id);
          toast({
            title: "Error",
            description: "No job data found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching job data:", error);
        setError(error);
        toast({
          title: "Error",
          description: "Failed to fetch job data.",
          variant: "destructive",
        });
      } finally {
        setIsAutomationDataLoading(false);
      }
    }

    if (id) {
      fetchJobData();
    }
  }, [id]);

  useEffect(() => {
    if (jobData && jobData.citations && jobData.citations.length > 0) {
      const urls = jobData.citations.map((item) => item.url);
      const favicons = getFavicon(urls);
      setFavicons(favicons);
    }
  }, [jobData]);

  function getImagesSorted(images) {
    if (!images || !Array.isArray(images) || images.length === 0) return [];
    // Sort by width descending
    return [...images].sort((a, b) => b.width - a.width);
  }

  function timeAgo(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(months / 12);
    return `${years} years ago`;
  }

  console.log("Automation Job ID:", id, jobData);
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
  return (
    <div>
      {isAutomationDataLoading ? (
        <div className="w-full h-screen flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
          <p>Loading job details...</p>
        </div>
      ) : (
        <div className="w-full h-full flex items-center m-4 ">
          {jobData && (
            <div className="max-w-4xl mx-auto">
              <div>
                <p className="text-4xl font-bold text-gray-100 mb-2">
                  {jobData?.title || "No title"}
                </p>
                {/* Hook/Subtitle */}
                <p className="text-lg text-gray-300 mb-1">
                  {jobData?.hook ||
                    "Discover how Tesla's stock is balancing on a technical knife-edge—will it break down or bounce back? Dive into our advanced scenario mapping to see what the data reveals about TSLA's next big move!"}
                </p>
              </div>

              {/* Citations Cards - Grid, Only First 4, Dark UI, Not Scrollable */}
              <div className="mt-8">
                {jobData?.citations && jobData.citations.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {jobData.citations.slice(0, 4).map((citation, index) => {
                      const favicon = favicons.find((fav) =>
                        citation.url.includes(fav.root),
                      );
                      let hostname = "";
                      try {
                        hostname = new URL(citation.url).hostname.replace(
                          /^www\./,
                          "",
                        );
                      } catch {
                        hostname = citation.url;
                      }
                      return (
                        <div
                          key={index}
                          className="bg-[#23272f] rounded-xl px-4 py-3 flex flex-col shadow-sm transition-all duration-200 cursor-pointer hover:bg-[#31343c] hover:scale-[1.03] hover:shadow-lg"
                          onClick={() => window.open(citation.url, "_blank")}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-[#181b20] flex items-center justify-center ring-1 ring-[#363a40] flex-shrink-0">
                              {favicon?.favImage ? (
                                <img
                                  src={favicon.favImage}
                                  alt="Website favicon"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src =
                                      "/placeholder.svg?height=20&width=20";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-300 font-medium">
                                  {hostname.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-200 truncate">
                              {hostname}
                            </span>
                          </div>
                          <div className="text-gray-100 text-base font-normal leading-tight line-clamp-2">
                            {citation.title || "Untitled Source"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No sources available</p>
                  </div>
                )}
              </div>

              {/* Meta Info: Time to Read & Created At */}
              <div className="flex items-center justify-between bg-[#181b20] rounded-lg px-4 py-2 mt-6 mb-3 shadow border border-[#23272f]">
                <div>
                  <div className="text-base text-gray-100 font-semibold">
                    {jobData.timeToReadInMin
                      ? `${jobData.timeToReadInMin} min read`
                      : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock size={16} className="text-gray-500" />
                  {jobData.created_at && (
                    <span>Published {timeAgo(jobData.created_at)}</span>
                  )}
                </div>
              </div>

              {/* Images Section */}
              {jobData?.images &&
                Array.isArray(jobData.images) &&
                jobData.images.length > 0 &&
                (() => {
                  const sortedImages = getImagesSorted(jobData.images);
                  const [largest, ...rest] = sortedImages;
                  function getHost(url) {
                    try {
                      return new URL(url).hostname.replace(/^www\./, "");
                    } catch {
                      return url;
                    }
                  }
                  return (
                    <>
                      {/* Largest image */}
                      <div className="mt-4 mb-3 relative rounded-xl overflow-hidden shadow bg-gradient-to-br from-[#23272f] to-[#181b20]">
                        <a
                          href={largest.origin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <img
                            src={largest.image_url}
                            alt="Main visual"
                            className="w-full rounded-xl object-cover max-h-[320px] border border-[#23272f] shadow transition-transform duration-300 group-hover:scale-[1.025]"
                            style={{ background: "#181b20" }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none rounded-xl" />
                          <span className="absolute bottom-2 right-3 bg-black/70 text-xs text-gray-200 px-2 py-1 rounded shadow-lg backdrop-blur-sm font-semibold">
                            {getHost(largest.origin_url)}
                          </span>
                        </a>
                      </div>
                      {/* Next 4 images as grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {rest.slice(0, 4).map((img, idx) => (
                          <div
                            key={idx}
                            className="relative rounded-lg overflow-hidden shadow bg-[#181b20]"
                          >
                            <a
                              href={img.origin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block group"
                            >
                              <img
                                src={img.image_url}
                                alt={`Visual ${idx + 2}`}
                                className="w-full h-24 object-cover rounded-lg border border-[#23272f] shadow transition-transform duration-300 group-hover:scale-[1.025]"
                                style={{ background: "#181b20" }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none rounded-lg" />
                              <span className="absolute bottom-1.5 right-2 bg-black/70 text-xs text-gray-200 px-2 py-0.5 rounded shadow backdrop-blur-sm font-semibold">
                                {getHost(img.origin_url)}
                              </span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              {/* Job Data Details */}
              <hr className="my-4 border-2 border-slate-200" />
              <ReactMarkdown
                className={"module font-figtree"}
                children={jobData.finalReport.replace("undefined", "")}
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  table: ({ children }) => (
                    <table style={tableStyles.regular.table}>{children}</table>
                  ),
                  th: ({ children }) => (
                    <th style={tableStyles.regular.th}>{children}</th>
                  ),
                  td: ({ children }) => (
                    <td style={tableStyles.regular.td}>{children}</td>
                  ),
                }}
              />
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger>
                    <SourcesIndicator
                      citations={jobData.citations || []}
                      maxIcons={3}
                      onClick={() => {}}
                    />
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-3xl bg-slate-800 text-white">
                    {/* All Citations List */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-semibold">
                          {jobData.citations?.length || 0} sources
                        </span>
                      </div>
                      {jobData?.hook && (
                        <div className="text-gray-300 text-base mb-3">
                          {jobData.hook}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pb-2">
                      {(jobData.citations || []).map((citation, idx) => {
                        let hostname = "";
                        try {
                          hostname = new URL(citation.url).hostname.replace(
                            /^www\./,
                            "",
                          );
                        } catch {
                          hostname = citation.url;
                        }
                        return (
                          <div
                            key={idx}
                            className="bg-slate-700 rounded-xl px-4 py-3 flex flex-col shadow border border-[#23272f]"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-gray-400 font-semibold">
                                {idx + 1}.
                              </span>
                              <span className="flex items-center gap-1 text-sm font-medium text-gray-200">
                                {/* Favicon */}
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${hostname}`}
                                  alt=""
                                  className="w-5 h-5 rounded-full mr-1"
                                />
                                {citation.siteName || hostname}
                              </span>
                            </div>
                            <div className="text-base text-gray-100 font-semibold leading-snug mb-1">
                              {citation.title}
                            </div>
                            {citation.description && (
                              <div className="text-sm text-gray-400 mb-1">
                                {citation.description}
                              </div>
                            )}
                            <a
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:underline truncate"
                            >
                              {citation.url}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* PDF Download Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex gap-2 rounded-full items-center hover:bg-slate-500 px-2 border border-slate-400 text-sm">
                      <FileDown className="w-5 h-5" />
                      Download PDF
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg bg-slate-800">
                    <h1 className="font-semibold text-lg text-white mb-3">
                      Name And Download Your PDF
                    </h1>
                    <p className="text-white -mb-2">File Name</p>
                    <Textarea
                      className="w-full h-10 text-white"
                      placeholder="Document Name"
                      value={
                        pdfFileName === "" ? jobData?.title || "" : pdfFileName
                      }
                      onChange={(e) => setPdfFileName(e.target.value)}
                    />
                    <Button
                      className="bg-slate-600 hover:bg-slate-500 text-white mt-4"
                      onClick={async (e) => {
                        e.preventDefault();
                        if (isPdfDownloadLoading) {
                          toast({
                            title: "PDF Already In Processing...",
                            description: "Please Wait While It Completes!",
                            variant: "default",
                          });
                          return;
                        }
                        const fileName = sanitizeFileName(
                          pdfFileName && pdfFileName !== ""
                            ? pdfFileName
                            : jobData?.title || "automation-job-details",
                        );
                        const loadingToast = toast({
                          title: "Processing PDF...",
                          description: `The PDF is downloading and may take a few seconds. You will be notified once the download is complete. Feel free to continue working in the meantime.\n File Name : ${fileName} `,
                          variant: "default",
                          duration: Infinity,
                        });

                        try {
                          setIsPdfDownloadLoading(true);

                          const down = await downloadPdf({
                            content: `
# ${jobData.title || ""}

## ${jobData.hook || ""}

${
  jobData.images?.[0]?.image_url
    ? `
<!-- Large Top Image -->
<img src="${jobData.images[0].image_url}" alt="Main Chart" style="width:100%; border-radius:12px; margin-bottom:20px;" />
`
    : ""
}

<!-- Four Images Below in Full-Width Grid -->
<div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; width:100%; margin-bottom:20px;">
  ${jobData.images
    ?.slice(1, 5)
    .map(
      (
        img,
      ) => `<img src="${img.image_url}" alt="Chart" style="width:100%; border-radius:8px;" />
  `,
    )
    .join("\n")}
</div>

---

${jobData.finalReport || ""}

---

## Sources & Citations:
${convertUrlsToMarkdown(jobData.citations || [])}
`,
                            fileName,
                            type: "pdf",
                          });

                          loadingToast.dismiss?.();

                          if (down.success) {
                            toast({
                              title: "Success",
                              description: "PDF downloaded successfully",
                              variant: "success",
                            });
                            // Close dialog after success
                            document.activeElement?.blur();
                          } else {
                            toast({
                              title: "Error",
                              description: down.message,
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          loadingToast.dismiss?.();
                          console.error("Error downloading PDF:", error);
                          toast({
                            title: "Error",
                            description: error.message,
                            variant: "destructive",
                          });
                        } finally {
                          setIsPdfDownloadLoading(false);
                        }
                      }}
                      disabled={isPdfDownloadLoading}
                    >
                      {isPdfDownloadLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin" />
                          Downloading...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">Download</div>
                      )}
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="h-96"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
