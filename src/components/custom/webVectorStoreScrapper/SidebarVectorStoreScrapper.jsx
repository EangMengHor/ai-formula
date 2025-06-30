import { pollVectorStoreStatus } from "@/services/personal-knowledge/pollVectorStoreStatus";
import { useEffect, useState, useRef } from "react";
import { getFavicon } from "@/lib/utils";

export default function SidebarVectorStoreScrapper({ dbId, name, onClose }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [citations, setCitations] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const pollingRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await pollVectorStoreStatus(dbId);
        const data = res?.data?.data || {};
        if (isMounted) {
          setStatus(data.status || "");
          setCitations(data.citations || []);
          setSuccessMsg(res.message || "");
        }
      } catch (e) {
        if (isMounted) {
          setStatus("error");
          setCitations([]);
          setSuccessMsg("Failed to fetch status");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();

    // Polling mechanism
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await pollVectorStoreStatus(dbId);
        const data = res?.data?.data || {};
        setStatus(data.status || "");
        setCitations(data.citations || []);
        setSuccessMsg(res.message || "");
        // Stop polling if done or error
        if (data.status === "done" || data.status === "error") {
          clearInterval(pollingRef.current);
        }
      } catch (e) {
        setStatus("error");
        setCitations([]);
        setSuccessMsg("Failed to fetch status");
        clearInterval(pollingRef.current);
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      isMounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [dbId]);

  // Helper to get favicon for a citation
  const getCitationFavicon = (citation) => {
    if (!citation?.citationUrl) return null;
    const fav = getFavicon([citation.citationUrl]);
    return fav[0]?.favImage || null;
  };

  // Progress bar for loading/in-progress
  const ProgressBar = ({ percent = 0 }) => (
    <div className="w-full bg-blue-950/40 rounded-full h-2 mb-4">
      <div
        className="bg-gradient-to-r from-blue-500 to-blue-700 h-2 rounded-full transition-all duration-500"
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  );

  // Header
  const Header = () => (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-900/60 shadow">
          <svg
            className="w-6 h-6 text-blue-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M8 12l2 2 4-4"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </span>
        <span className="text-blue-100 font-bold text-xl tracking-wide">
          {name || "Web Scrapper"}
        </span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-blue-300 transition-colors rounded-full p-2 focus:outline-none"
          title="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );

  // Loading animation
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a2233] to-[#232946] min-h-screen flex flex-col items-center justify-center rounded-2xl shadow-2xlw-full mx-auto p-8">
        <Header />
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="w-12 h-12 border-4 border-[#232946] border-t-[#2761ff] rounded-full animate-spin"></div>
          <div className="text-blue-200 font-semibold text-lg">Loading...</div>
          <ProgressBar percent={30} />
        </div>
      </div>
    );
  }

  // Not done: show status, some citations, show more
  if (status !== "done") {
    const displayCitations = showAll ? citations : citations.slice(0, 5);
    const isError = status === "error";
    return (
      <div className="bg-gradient-to-br from-[#1a2233] to-[#232946] min-h-screen rounded-2xl shadow-2xl  w-full mx-auto p-8 flex flex-col">
        <Header />
        <div className="flex flex-col items-center mb-6">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-base shadow ${
              isError
                ? "bg-red-900/30 text-red-300"
                : "bg-blue-900/30 text-blue-300"
            }`}
          >
            {isError ? (
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M15 9l-6 6M9 9l6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-blue-400 animate-pulse"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M12 8v4l2 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            <span className={isError ? "text-red-400" : "text-blue-400"}>
              {status}
            </span>
          </div>
          {!isError && (
            <ProgressBar
              percent={
                citations.length > 0
                  ? Math.min(90, 10 + citations.length * 10)
                  : 10
              }
            />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-4 w-full">
          {displayCitations.map((c, i) => (
            <a
              key={i}
              href={c.citationUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-5 py-4 rounded-xl bg-[#232946] border border-blue-800 shadow hover:shadow-xl hover:bg-blue-950/80 transition-all duration-150 cursor-pointer min-w-0 w-full overflow-hidden group"
              title={c.title}
              style={{ minHeight: "72px" }}
            >
              {getCitationFavicon(c) ? (
                <img
                  src={getCitationFavicon(c)}
                  alt="favicon"
                  className="w-8 h-8 rounded-full bg-slate-800 border border-blue-900 flex-shrink-0"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </span>
              )}
              <div className="flex flex-col min-w-0">
                <span className="truncate font-medium text-blue-100 group-hover:text-blue-300 transition text-base">
                  {c.title || c.id || "Citation"}
                </span>
                {c.citationUrl && (
                  <span className="truncate text-blue-400 text-xs group-hover:text-blue-200">
                    {c.citationUrl}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
        {citations.length > 5 && (
          <div className="flex justify-center mt-2">
            <button
              className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-lg px-5 py-2 font-semibold shadow hover:from-blue-600 hover:to-blue-800 transition"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Show less" : "Show more"}
            </button>
          </div>
        )}
        <div className="mt-auto pt-8 text-xs text-slate-500 text-center">
          {isError
            ? "There was an error fetching the status."
            : "Fetching and processing sources..."}
        </div>
      </div>
    );
  }

  // Done: show all citations and success message
  return (
    <div className="bg-gradient-to-br from-[#1a2233] to-[#232946] min-h-screen rounded-2xl shadow-2xl w-full mx-auto p-8 flex flex-col">
      <Header />
      <div className="flex items-center justify-center mb-6">
        <span className="inline-flex items-center gap-2 bg-green-900/30 text-green-300 px-4 py-2 rounded-lg font-bold text-base shadow">
          <svg
            className="w-5 h-5 text-green-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {successMsg}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
        {citations.map((c, i) => (
          <div
            key={i}
            className="bg-[#21263a] border border-blue-900 rounded-xl p-5 shadow hover:shadow-xl transition group flex flex-col gap-2 min-w-0"
            style={{ minHeight: "110px" }}
          >
            <div className="flex items-center gap-4 mb-1">
              {getCitationFavicon(c) ? (
                <img
                  src={getCitationFavicon(c)}
                  alt="favicon"
                  className="w-9 h-9 rounded-full bg-slate-800 border border-blue-900 flex-shrink-0"
                />
              ) : (
                <span className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </span>
              )}
              <div className="font-semibold text-blue-200 text-lg truncate group-hover:text-blue-300 transition min-w-0">
                {c.title || "Untitled"}
              </div>
            </div>
            <div className="text-slate-300 text-sm mb-1 line-clamp-3 min-h-[40px]">
              {c.description || (
                <span className="text-slate-600">No description</span>
              )}
            </div>
            {c.citationUrl && (
              <a
                href={c.citationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline break-all hover:text-blue-200 transition text-xs"
              >
                {c.citationUrl}
              </a>
            )}
          </div>
        ))}
      </div>
      <div className="mt-auto pt-8 text-xs text-slate-500 text-center">
        {citations.length > 0
          ? `Total citations: ${citations.length}`
          : "No sources were found for this run."}
      </div>
    </div>
  );
}
