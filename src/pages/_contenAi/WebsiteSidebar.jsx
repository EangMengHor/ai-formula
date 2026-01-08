import { useRef } from "react";
import { Download, RefreshCw, ExternalLink } from "lucide-react";

export default function WebsiteSidebar({ url, downloadUrl }) {
  const iframeRef = useRef(null);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end gap-2 p-3 border-b border-white/10">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        {downloadUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          Open in New Tab
        </a>
      </div>
      <div className="flex-1">
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-0 rounded-b-2xl"
          title="Website Preview"
        />
      </div>
    </div>
  );
}
