import { useEffect, useRef } from "react";

export default function FileBlock({
  genId,
  name,
  pages,
  handleFileBlockClick,
}) {
  return (
    <div
      onClick={() => handleFileBlockClick(genId, name, pages)}
      className={`p-3 bg-g1 cursor-pointer hover:bg-g2 flex justify-between items-center gap-2 relative rounded-2xl `}
    >
      <div
        className="text-md font-medium text-wrap text-white truncate px-3 flex items-start justify-between flex-col"
        style={{ maxWidth: "80%" }}
      >
        {name.replaceAll("_", " ") || "Document"}
        <p className="text-slate-600 text-  sm mt-3">Document(Click)</p>
      </div>
      <div className="flex-shrink-0 px-3 py-2">
        <img src="/docx.svg" className="opacity-70 w-16 h-1w-16 -rotate-6" />
      </div>
    </div>
  );
}
