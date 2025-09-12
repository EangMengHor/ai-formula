import { useState } from "react";
import { Copy, WrapText, ListCollapse } from "lucide-react";

export const Pre = ({ children }) => {
  const [isWrapped, setIsWrapped] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      children?.props?.children.replaceAll("*", "").replaceAll("#", "") || "",
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative  bg-gray-900 text-gray-100 rounded-lg shadow-md border border-gray-300">
      {/* Toolbar */}
      <div className="absolute right-2 top-2 flex gap-2 transition-opacity">
        <button
          onClick={handleCopy}
          style={{
            backgroundColor: "white",
            padding: "10px",
          }}
          className="rounded-md "
          title="Copy code"
        >
          {copied ? (
            <div className="text-black text-xs px-1">Copied!</div>
          ) : (
            <Copy size={16} className="text-black" />
          )}
        </button>
        <button
          style={{
            backgroundColor: "white",
            padding: "10px",
          }}
          onClick={() => setIsWrapped((prev) => !prev)}
          className="p-1 rounded-md"
          title="Toggle wrap"
        >
          {isWrapped ? (
            <WrapText size={16} className="text-black" />
          ) : (
            <ListCollapse size={16} className="text-black" />
          )}
        </button>
      </div>

      {/* Code block */}
      <div
        className={`overflow-x-auto text-sm px-4 py-3 font-mono leading-6 ${
          isWrapped ? "whitespace-pre-wrap break-words" : "whitespace-pre"
        }`}
      >
        {typeof children == "string"
          ? children
          : children?.props?.children
              ?.replaceAll("*", "")
              ?.replaceAll("#", "") || ""}
      </div>
    </div>
  );
};
