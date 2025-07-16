import { useState } from "react";
import {
  ChartCandlestick,
  Coins,
  Text,
  TrendingUpDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function OmniResilience({ block }) {
  const [showShortTerm, setShowShortTerm] = useState(false);
  const [showLongTerm, setShowLongTerm] = useState(false);

  const assetType = block?.assetType || "N/A";
  const ticker = block?.ticker || "N/A";
  const summary = block?.summary || "No summary available.";
  const shortTerm = block?.shortTerm || {};
  const longTerm = block?.longTerm || {};
  const shortTermMode = shortTerm.mode || "N/A";
  const longTermMode = longTerm.mode || "N/A";

  const collapseVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { height: "auto", opacity: 1 },
  };

  const toggleShortTerm = () => {
    setShowShortTerm((prev) => !prev);
    setShowLongTerm((prev) => !prev);
  };

  const toggleLongTerm = () => {
    setShowLongTerm((prev) => !prev);
    setShowShortTerm((prev) => !prev);
  };

  return (
    <div className="md:min-w-[560px] mt-5 mb-2 bg-gradient-to-r from-g2/70 to-g1/70 w-full px-4 py-4 rounded-2xl max-w-4xl">
      <div className="flex gap-2 w-full justify-between items-center">
        <div className="flex gap-2 font-semibold items-center">
          <TrendingUpDown width={20} height={20} />
          <p className="capitalize">Omni-resilience • {assetType}</p>
        </div>

        <div className="flex gap-2 items-center">
          {assetType === "stock" ? (
            <ChartCandlestick width={20} height={20} />
          ) : (
            <Coins width={20} height={20} />
          )}
          <p className="font-semibold text-sm">{ticker}</p>
        </div>
      </div>

      <hr className="border border-slate-600 my-3" />

      <div>
        <div className="flex gap-2 my-3 font-semibold items-center">
          <Text width={20} height={20} />
          <p>Insights</p>
        </div>
        <p>{summary}</p>
      </div>

      <div className="flex gap-6 text-base w-full my-4">
        {/* Short Term */}
        <div className="w-1/2 bg-[#101c3a] p-6 rounded-2xl shadow-md">
          <div
            className={`flex items-center justify-between ${showShortTerm && "mb-4"}`}
          >
            <h3 className="font-bold text-[#b3c6f7] text-lg flex items-center gap-2">
              Short Term
              <span className="bg-[#22305a] text-xs px-2 py-1 rounded-full">
                {shortTermMode}
              </span>
            </h3>
            <button
              onClick={toggleShortTerm}
              className="text-[#c9d4ef] hover:text-white transition"
            >
              {showShortTerm ? (
                <ChevronUp className="w-6 h-6" />
              ) : (
                <ChevronDown className="w-6 h-6" />
              )}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showShortTerm && (
              <motion.div
                key="short"
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={collapseVariants}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden grid grid-cols-2 gap-4"
              >
                {Object.entries(shortTerm)
                  .filter(([key]) => key !== "mode")
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col rounded-lg bg-[#16244a] p-3 min-h-[56px] justify-center shadow-sm"
                    >
                      <span className="text-xs text-[#7ea2e0] font-medium mb-1">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                      <span className="font-semibold text-[#eaf1ff] text-lg tracking-wide">
                        {value !== undefined && value !== null && value !== ""
                          ? value
                          : "N/A"}
                      </span>
                    </div>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Long Term */}
        <div className="w-1/2 bg-[#0a1a2f] p-6 rounded-2xl shadow-md">
          <div
            className={`flex items-center justify-between ${showLongTerm && "mb-4"}`}
          >
            <h3 className="font-bold text-[#b0d8ff] text-lg flex items-center gap-2">
              Long Term
              <span className="bg-[#1e3a5a] text-xs px-2 py-1 rounded-full">
                {longTermMode}
              </span>
            </h3>
            <button
              onClick={toggleLongTerm}
              className="text-[#c9d4ef] hover:text-white transition"
            >
              {showLongTerm ? (
                <ChevronUp className="w-6 h-6" />
              ) : (
                <ChevronDown className="w-6 h-6" />
              )}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showLongTerm && (
              <motion.div
                key="long"
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={collapseVariants}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden grid grid-cols-2 gap-4"
              >
                {Object.entries(longTerm)
                  .filter(([key]) => key !== "mode")
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col rounded-lg bg-[#142b46] p-3 min-h-[56px] justify-center shadow-sm"
                    >
                      <span className="text-xs text-[#7cb4e0] font-medium mb-1">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                      <span className="font-semibold text-[#d8ecff] text-lg tracking-wide">
                        {value !== undefined && value !== null && value !== ""
                          ? value
                          : "N/A"}
                      </span>
                    </div>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
