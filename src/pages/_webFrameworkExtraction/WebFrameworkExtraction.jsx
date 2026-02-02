import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Globe, Loader2, ExternalLink, ArrowLeft } from "lucide-react";
import { getUserWebFrameworkJobs } from "@/services/web-framework/getUserWebFrameworkJobs";

// Utility function to get relative time
const getRelativeTime = (dateString) => {
  if (!dateString) return "Unknown";
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
};

export default function WebFrameworkExtraction() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = localStorage.getItem("id");

      if (!userId) {
        toast.error("User ID not found. Please log in again.");
        return;
      }

      const result = await getUserWebFrameworkJobs(userId);
      if (result.success) {
        setJobs(result.data || []);
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load web framework extraction jobs");
      toast.error("Failed to load web framework extraction jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate("/web-framework-extraction/create-new-job");
  };

  const handleJobClick = (jobId) => {
    navigate(`/web-framework-extraction/job-status/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white text-lg">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading web framework extraction jobs...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen p-4 md:p-6 overflow-y-auto mb-52">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Web Framework Extraction
            </h1>
            <p className="text-gray-400">
              Extract and analyze cognitive frameworks from websites
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Platform
          </button>
        </div>

        {/* Create New Job Button */}
        <div className="mb-8">
          <div
            onClick={handleCreateNew}
            className="bg-g1 hover:bg-g2 transition-all duration-300 rounded-xl p-6 cursor-pointer border border-slate-700 hover:border-slate-600 group max-w-md"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition-colors">
                <Plus className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  Create New Extraction
                </h3>
                <p className="text-gray-400">
                  Start extracting framework from a website
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Your Extractions ({jobs.length})
          </h2>
        </div>

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <div className="bg-g1 rounded-xl p-8 text-center border border-slate-700">
            <Globe className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No extractions yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first web framework extraction to get started
            </p>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Extraction
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, index) => {
              // Note: List API only returns id, websiteUrl, createdAt
              // Full status details are fetched when clicking on a job
              return (
                <div
                  key={job.id || index}
                  onClick={() => handleJobClick(job.id)}
                  className="bg-g1 hover:bg-g2 transition-all duration-300 rounded-xl p-5 cursor-pointer border border-slate-700 hover:border-slate-500 group"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">
                        Web Extraction
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
                  </div>

                  {/* URL */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm">Target URL</span>
                    </div>
                    <p
                      className="text-white font-medium truncate"
                      title={job.websiteUrl}
                    >
                      {job.websiteUrl || "Unknown URL"}
                    </p>
                  </div>

                  {/* Time */}
                  {job.createdAt && (
                    <div className="pt-4 border-t border-slate-700">
                      <p className="text-gray-500 text-xs">
                        Created {getRelativeTime(job.createdAt)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
