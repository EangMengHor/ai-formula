import { useToast } from "@/hooks/use-toast";
import { getUrlScrapper } from "@/services/getUrlScrapper";
import { useEffect, useState } from "react";
import { getFavicon } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function SidebarUrlShower({ jobId, name, numOfUrls }) {
  const { toast } = useToast();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getUrlScrapper(jobId);
        console.log("URL Scrapper Data:", data);
        if (data) {
          setUrls(data || []);
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to fetch URL scrapper data",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching URL scrapper data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch URL scrapper data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    if (jobId) {
      fetchData();
    } else {
      toast({
        title: "Error",
        description: "Job ID is required to fetch URL scrapper data",
        variant: "destructive",
      });
    }
  }, [jobId]);

  // Get favicons for all urls
  const favicons = getFavicon(urls.map((u) => u.url));

  
  return (
    <div className="p-4 min-h-[300px] rounded-lg shadow-inner">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-semibold text-blue-200">
          {name ? name : "Scraped URLs"}
        </h2>
        <span
          className="ml-3 px-2 py-0.5 rounded-full bg-blue-900 text-blue-200 text-xs font-bold border border-blue-700"
          title="Total URLs"
        >
          {urls.length > 0 ? urls.length : numOfUrls || 0} Urls Found!
        </span>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="animate-spin w-8 h-8 text-blue-400" />
        </div>
      ) : urls.length === 0 ? (
        <div className="text-slate-400 text-center py-8">No URLs found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {urls.map((item, idx) => (
            <div
              key={item.id}
              className="flex flex-col bg-[#001a3b] rounded-lg p-4 shadow border border-[#223355] hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center mb-2">
                <img
                  src={favicons[idx]?.favImage || "/favicon.ico"}
                  alt="favicon"
                  className="w-6 h-6 mr-2 rounded"
                  style={{ background: "#0a1429" }}
                  onError={(e) => (e.target.style.display = "none")}
                />
                <span
                  className="font-medium text-blue-300 truncate"
                  title={item.title}
                >
                  {item.title}
                </span>
              </div>
              <div className="text-slate-300 text-sm mb-2 line-clamp-3">
                {item.description}
              </div>
              <div className="mt-auto flex items-center gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-blue-400 hover:underline break-all"
                  title={item.url}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 14L21 3m0 0v7m0-7h-7M21 21H3V3h7"
                    />
                  </svg>
                  {item.url}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
