import { useEffect, useState } from "react";
import { Diameter, ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function DeepThoughts({ text, isCollapsedByDefault = true }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const cleanedText = (text || "")
    .replaceAll("<endCot>", "")
    .replaceAll("endCot", "")
    .replaceAll("<search>", "")
    .replaceAll("<fdb>", "")
    .replaceAll("<vdb>", "")
    .replaceAll("undefined", "");
  useEffect(() => {
    if (isCollapsedByDefault !== isCollapsed) {
      setIsCollapsed(isCollapsedByDefault);
    }
  }, [isCollapsedByDefault]);
  const items = cleanedText.split("||").filter(Boolean);

  return (
    <div className="bg-gradient-to-r to-[#001B3F] from-[#101b31] rounded-2xl shadow-md border border-slate-700">
      <div
        className={`flex justify-between  p-4  items-center ${!isCollapsed && "mb-4 border-b border-slate-700 "}`}
      >
        <div className="flex gap-2 font-semibold items-center text-slate-200">
          <Diameter className="w-5 h-5" />
          <p>Deep Thoughts</p>
        </div>
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="text-slate-400 hover:text-slate-100 transition-colors duration-200 flex items-center gap-1"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          <span className="text-sm">{isCollapsed ? "Expand" : "Collapse"}</span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="space-y-3 mt-2  p-4 "
          >
            {items.map((item, index) => (
              <div
                key={index}
                className="flex gap-2 text-slate-300 min-h-[50px] h-full items-start"
              >
                <div className="flex items-center flex-col h-full">
                  <p className="px-2 py-1 h-fit w-fit rounded-lg bg-[#1b3456] border border-slate-700 text-md">
                    {index + 1}
                  </p>
                  <div className="h-full border-l border-[#2c4d7d] "></div>
                </div>
                <p className="text-md leading-relaxed">{item}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
