import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Globe,
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startWebFrameworkJob } from "@/services/web-framework/startWebFrameworkJob";

export default function WebFrameworkCreateNewJob() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Validate URL
  const isValidUrl = (urlString) => {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate URL
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL (including http:// or https://)");
      return;
    }

    const userId = localStorage.getItem("id");
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);
      const result = await startWebFrameworkJob(url, userId);

      if (result.success) {
        toast.success("Job started successfully!");
        // Navigate to job status page with the dbId (numeric database ID)
        const dbId = result.data?.dbId;
        if (dbId) {
          navigate(`/web-framework-extraction/job-status/${dbId}`);
        } else {
          // If no dbId is returned, navigate back to dashboard
          toast.info("Job created, please check dashboard for status");
          navigate("/web-framework-extraction");
        }
      } else {
        setError(result.message || "Failed to start job");
        toast.error(result.message || "Failed to start job");
      }
    } catch (err) {
      console.error("Error starting job:", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/web-framework-extraction");
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Create New Framework Extraction
          </h1>
          <p className="text-gray-400">
            Enter a website URL to extract and analyze its cognitive framework
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-g1 rounded-xl p-6 border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input */}
            <div className="space-y-2">
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-300"
              >
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="url"
                  type="text"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError("");
                  }}
                  className="pl-11 bg-slate-800 border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              {url && isValidUrl(url) && !error && (
                <div className="flex items-center gap-2 text-green-400 text-sm mt-2">
                  <CheckCircle className="w-4 h-4" />
                  Valid URL
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                What happens next?
              </h4>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">1.</span>
                  <span>
                    <strong className="text-gray-300">Web Crawling:</strong> Our
                    system will crawl all accessible pages from the provided URL
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">2.</span>
                  <span>
                    <strong className="text-gray-300">AI Processing:</strong> AI
                    analyzes the content to extract the cognitive framework
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">3.</span>
                  <span>
                    <strong className="text-gray-300">Results:</strong> View the
                    extracted framework and page analysis
                  </span>
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Starting Extraction...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Framework Scraping
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          <h4 className="text-sm font-medium text-gray-300 mb-2">💡 Tips</h4>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>
              • Use the main domain URL for best results (e.g.,
              https://example.com)
            </li>
            <li>
              • The process may take several minutes depending on the website
              size
            </li>
            <li>
              • Complex websites with many pages will generate more
              comprehensive frameworks
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
