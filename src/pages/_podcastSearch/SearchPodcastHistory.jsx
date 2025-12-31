import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Podcast,
  FileText,
  Loader2,
} from "lucide-react";

import { getUserPodcastJobs } from "@/services/podcast-search/getUserPodcastJobs";
import { getRelativeTime, getStatusInfo } from "./utils";

export default function SearchPodcastHistory() {
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
        navigate("/login");
        return;
      }

      const jobsData = await getUserPodcastJobs(userId);
      setJobs(jobsData || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load podcast search history");
      toast.error("Failed to load podcast search history");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate("/search-podcast");
  };

  const handleJobClick = (jobId) => {
    navigate(`/found-podcast/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <div className="text-white text-lg">Loading search history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 overflow-y-auto mb-52">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <Podcast className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Podcast Search History</h1>
              <p className="text-gray-400">View and manage your podcast searches</p>
            </div>
          </div>
        </div>

        {/* Create New Button */}
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
                  New Search
                </h3>
                <p className="text-gray-400">
                  Start a new podcast search
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Your Searches ({jobs.length})
          </h2>
        </div>

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <div className="bg-g1 rounded-xl p-12 text-center border border-slate-700">
            <Podcast className="w-20 h-20 text-gray-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">
              No search history yet
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Start your first podcast search to discover podcasts with fresh content and contact information
            </p>
            <button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              Create First Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[calc(100vh-400px)]">
            {jobs.map((job) => {
              const statusInfo = getStatusInfo(job);
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={job.id}
                  onClick={() => handleJobClick(job.id)}
                  className="bg-g1 hover:bg-g2 transition-all duration-300 rounded-xl p-6 border border-slate-700 hover:border-blue-600 group cursor-pointer"
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

                  {/* Query */}
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {job.userPrompt || "Untitled Search"}
                  </h3>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Podcast className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400">
                        {job.numberOfArticles || 0} requested
                      </span>
                    </div>
                    <div className="text-gray-500">
                      {getRelativeTime(job.created_at)}
                    </div>
                  </div>

                  {/* Freshness Info */}
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Freshness</span>
                      <span className="text-white font-medium capitalize text-sm">
                        {job.userPrompt?.includes("hour") ? "Hour" :
                         job.userPrompt?.includes("day") ? "Day" :
                         job.userPrompt?.includes("week") ? "Week" : "Month"}
                      </span>
                    </div>
                  </div>

                  {/* View Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJobClick(job.id);
                    }}
                    className="mt-4 w-full bg-slate-700/50 hover:bg-blue-600/20 text-white border border-slate-600 hover:border-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View Results
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-6 bg-red-900/20 border border-red-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
