"use client";

import { getFavicon } from "@/lib/utils";
import { useState } from "react";

export default function SourcesIndicator({ citations, maxIcons = 3, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  // Extract URLs from citations
  const urls = citations.map((citation) => citation.url);

  // Get favicons for the URLs
  const faviconData = getFavicon(urls);

  // Limit the number of icons to display
  const displayIcons = faviconData.slice(0, maxIcons);
  return (
    <div
      className={`inline-flex bg-slate-900 items-center gap-1 px-3 py-2 rounded-xl transition-all ${
        isHovered ? "hover:bg-slate-800" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role={onClick ? "button" : "status"}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${citations.length} sources`}
    >
      <div className="flex -space-x-1.5">
        {console.log("item.favImage", citations)}
        {displayIcons.map((item, index) => (
          <div
            key={index}
            className="w-5 h-5 rounded-full overflow-hidden bg-white flex items-center justify-center ring-1 ring-slate-700"
          >
            {item.favImage ? (
              <img
                src={item.favImage || "/placeholder.svg"}
                alt={item.root || "Website"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback for failed favicon loads
                  e.target.src = "/placeholder.svg?height=20&width=20";
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                {item.root?.charAt(0) || "?"}
              </div>
            )}
          </div>
        ))}
      </div>
      <span className="text-sm text-gray-300 font-medium ml-1">
        {citations.length} sources
      </span>
    </div>
  );
}
