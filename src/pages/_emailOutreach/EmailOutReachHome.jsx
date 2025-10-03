import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";

import { getUserEmailOutreachJobs } from "@/services/email-outreach/getUserEmailOutreachJobs";

// Utility function to get relative time
const getRelativeTime = (dateString) => {
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

export default function EmailOutReachHome() {
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

      const jobsData = await getUserEmailOutreachJobs(userId);
      setJobs(jobsData || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load email outreach jobs");
      toast.error("Failed to load email outreach jobs");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (job) => {
    if (job.isError) {
      return {
        status: "Error",
        color: "text-red-400",
        bgColor: "bg-red-900/20",
        icon: XCircle,
      };
    } else if (job.isCompleted) {
      return {
        status: "Completed",
        color: "text-green-400",
        bgColor: "bg-green-900/20",
        icon: CheckCircle,
      };
    } else {
      return {
        status: "Processing",
        color: "text-yellow-400",
        bgColor: "bg-yellow-900/20",
        icon: Clock,
      };
    }
  };

  const handleCreateNew = () => {
    navigate("/create-new-email-outreach");
  };

  const handleCheckEngagements = () => {
    // TODO: Implement check engagements functionality
    navigate("/email-outreach-analytics");
  };

  const handleJobClick = (jobId) => {
    navigate(`/email-outreach-details/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading email outreach jobs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 md:p-6 overflow-y-auto mb-52">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Email Outreach</h1>
          <p className="text-gray-400">Manage your email outreach campaigns</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create New Email Outreach */}
          <div
            onClick={handleCreateNew}
            className="bg-g1 hover:bg-g2 transition-all duration-300 rounded-xl p-6 cursor-pointer border border-slate-700 hover:border-slate-600 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition-colors">
                <Plus className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  Create New Outreach
                </h3>
                <p className="text-gray-400">
                  Start a new email outreach campaign
                </p>
              </div>
            </div>
          </div>

          {/* Check Engagements */}
          <div
            onClick={handleCheckEngagements}
            className="bg-g1 hover:bg-g2 transition-all duration-300 rounded-xl p-6 cursor-pointer border border-slate-700 hover:border-slate-600 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600/20 rounded-lg group-hover:bg-green-600/30 transition-colors">
                <BarChart3 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  Check Engagements
                </h3>
                <p className="text-gray-400">
                  View engagement analytics and reports
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Your Campaigns ({jobs.length})
          </h2>
        </div>

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <div className="bg-g1 rounded-xl p-8 text-center border border-slate-700">
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first email outreach campaign to get started
            </p>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create New Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6  max-h-[calc(100vh-400px)]">
            {jobs.map((job) => {
              const statusInfo = getStatusInfo(job);
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={job.id}
                  className="bg-g1 hover:bg-g2 transition-all duration-300 rounded-xl p-6 border border-slate-700 hover:border-slate-600 group"
                >
                  {/* Status Badge */}
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${statusInfo.bgColor}`}
                  >
                    <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                    <span className={statusInfo.color}>
                      {statusInfo.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {job.expandedQuery?.[0] || "Untitled Campaign"}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {job.userPrompt || "No description available"}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400">
                        {job.expandedQuery?.length || 0} queries
                      </span>
                    </div>
                    <div className="text-gray-500">
                      {getRelativeTime(job.created_at)}
                    </div>
                  </div>

                  {/* Articles Count */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Articles</span>
                      <span className="text-white font-medium">
                        {job.numberOfArticles || 0}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/email-outreach-engagement/${job.id}`);
                      }}
                      className="flex-1 bg-g1 hover:bg-g2 text-white border border-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Show Analytics
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/email-outreach-details/${job.id}`);
                      }}
                      className="flex-1 bg-g1 hover:bg-g2 text-white border border-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Show Campaign
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-6 bg-red-900/20 border border-red-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
