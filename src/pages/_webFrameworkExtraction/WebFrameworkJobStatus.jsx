import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Globe,
  FileText,
  CheckCircle,
  Brain,
  Clock,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWebFrameworkJobStatus } from "@/services/web-framework/getWebFrameworkJobStatus";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Format character count
const formatCharCount = (count) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export default function WebFrameworkJobStatus() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllPages, setShowAllPages] = useState(false);
  const [expandedOutput, setExpandedOutput] = useState(true);
  const pollingRef = useRef(null);
  const isPollingRef = useRef(false);

  const fetchJobStatus = useCallback(async () => {
    if (isPollingRef.current) return;

    try {
      isPollingRef.current = true;
      const result = await getWebFrameworkJobStatus(jobId);

      if (result.success) {
        setJobData(result.data);
        setError(null);

        // If status is "done", stop polling
        if (result.data?.status === "done") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Error fetching job status:", err);
      setError("Failed to fetch job status");
    } finally {
      setIsLoading(false);
      isPollingRef.current = false;
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      navigate("/web-framework-extraction");
      return;
    }

    // Initial fetch
    fetchJobStatus();

    // Start polling if job is not done
    pollingRef.current = setInterval(() => {
      if (jobData?.status !== "done") {
        fetchJobStatus();
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [jobId, navigate, fetchJobStatus]);

  // Stop polling when status is done
  useEffect(() => {
    if (jobData?.status === "done" && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [jobData?.status]);

  const handleBack = () => {
    navigate("/web-framework-extraction");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "done":
        return {
          label: "Completed",
          color: "text-green-400",
          bgColor: "bg-green-900/20",
          borderColor: "border-green-700/50",
          icon: CheckCircle,
          description: "Framework extraction completed successfully",
        };
      case "ai-processing":
        return {
          label: "AI Processing",
          color: "text-purple-400",
          bgColor: "bg-purple-900/20",
          borderColor: "border-purple-700/50",
          icon: Brain,
          description:
            "AI is analyzing the content and building cognitive framework",
        };
      case "processing":
        return {
          label: "Crawling",
          color: "text-yellow-400",
          bgColor: "bg-yellow-900/20",
          borderColor: "border-yellow-700/50",
          icon: Clock,
          description: "Crawling web pages and extracting content",
        };
      default:
        return {
          label: "Processing",
          color: "text-blue-400",
          bgColor: "bg-blue-900/20",
          borderColor: "border-blue-700/50",
          icon: Loader2,
          description: "Processing your request",
        };
    }
  };

  if (isLoading && !jobData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          <p className="text-white text-lg">Loading job status...</p>
        </div>
      </div>
    );
  }

  if (error && !jobData) {
    return (
      <div className="min-h-screen bg-slate-900 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6 text-center">
            <p className="text-red-400 text-lg">{error}</p>
            <Button
              onClick={fetchJobStatus}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(jobData?.status);
  const StatusIcon = statusInfo.icon;
  const pages = jobData?.data || [];
  const displayPages = showAllPages ? pages : pages.slice(0, 6);
  const totalChars = pages.reduce((acc, page) => acc + (page.content || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6 overflow-y-auto mb-20">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header with Status */}
        <div className="bg-g1 rounded-xl p-6 border border-slate-700 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Framework Extraction Job
              </h1>
              <div className="flex items-center gap-2 text-gray-400">
                <Globe className="w-4 h-4" />
                <a
                  href={jobData?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors underline"
                >
                  {jobData?.url || "Unknown URL"}
                </a>
              </div>
            </div>

            {/* Status Badge */}
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${statusInfo.bgColor} border ${statusInfo.borderColor}`}
            >
              <StatusIcon
                className={`w-6 h-6 ${statusInfo.color} ${
                  jobData?.status !== "done" ? "animate-spin" : ""
                }`}
              />
              <div>
                <p className={`font-semibold ${statusInfo.color}`}>
                  {statusInfo.label}
                </p>
                <p className="text-gray-400 text-sm">
                  {statusInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Pages Crawled</p>
              <p className="text-white font-semibold">{pages.length}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Total Content</p>
              <p className="text-white font-semibold">
                {formatCharCount(totalChars)} chars
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Status</p>
              <p className={`font-semibold ${statusInfo.color}`}>
                {statusInfo.label}
              </p>
            </div>
          </div>
        </div>

        {/* Processing Animation */}
        {jobData?.status !== "done" && (
          <div className="bg-g1 rounded-xl p-8 border border-slate-700 mb-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-600 rounded-full" />
                <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                <StatusIcon
                  className={`absolute inset-0 m-auto w-8 h-8 ${statusInfo.color}`}
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {jobData?.status === "processing"
                    ? "Crawling Web Pages..."
                    : "AI is Processing..."}
                </h3>
                <p className="text-gray-400">
                  {jobData?.status === "processing"
                    ? "Discovering and extracting content from all accessible pages"
                    : "Analyzing content and building cognitive framework"}
                </p>
              </div>
              {pages.length > 0 && (
                <p className="text-sm text-gray-500">
                  {pages.length} pages discovered so far
                </p>
              )}
            </div>
          </div>
        )}

        {/* Framework Output - Only show when done */}
        {jobData?.status === "done" && jobData?.output && (
          <div className="bg-g1 rounded-xl border border-slate-700 mb-6 overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
              onClick={() => setExpandedOutput(!expandedOutput)}
            >
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">
                  Extracted Framework
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(jobData.output);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                {expandedOutput ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            {expandedOutput && (
              <div className="p-6 pt-0 border-t border-slate-700">
                <div className="bg-slate-800/50 rounded-lg p-6 prose prose-invert prose-p:text-gray-200 prose-headings:text-white prose-strong:text-white prose-li:text-gray-200 max-w-none overflow-auto max-h-[600px] text-gray-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {jobData.output}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Crawled Pages */}
        {pages.length > 0 && (
          <div className="bg-g1 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Crawled Pages ({pages.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayPages.map((page, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm truncate flex-1"
                      title={page.url}
                    >
                      {page.url}
                    </a>
                    <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">
                      {formatCharCount(page.content || 0)} characters
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Show More/Less Button */}
            {pages.length > 6 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAllPages(!showAllPages)}
                  className="border-slate-600 text-gray-300 hover:bg-slate-800"
                >
                  {showAllPages ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show All {pages.length} Pages
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
