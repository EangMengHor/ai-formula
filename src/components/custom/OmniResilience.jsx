    import { ChartCandlestick, Coins, Text, TrendingUpDown } from "lucide-react";

    export default function OmniResilience({ block }) {
    console.log(block, "omni block");
    // Fallbacks for missing block or properties
    const assetType = block?.assetType || "N/A";
    const ticker = block?.ticker || "N/A";
    const summary = block?.summary || "No summary available.";
    const shortTerm = block?.shortTerm || {};
    const longTerm = block?.longTerm || {};
    const shortTermMode = shortTerm.mode || "N/A";
    const longTermMode = longTerm.mode || "N/A";

    return (
        <div className=" md:min-w-[560px]  mt-5 mb-2 bg-gradient-to-r from-g2/70 to-g1/70 w-full px-4 py-4 rounded-2xl max-w-4xl">
        <div className="flex gap-2 w-full justify-between items-center">
            <div className="flex gap-2 font-semibold items-center ">
            <TrendingUpDown width={20} height={20} />
            <p className="capitalize">Omni-resilience • {assetType}</p>
            </div>

            <div>
            <div className="flex gap-2 items-center">
                {assetType === "stock" ? (
                <ChartCandlestick width={20} height={20} />
                ) : (
                <Coins width={20} height={20} />
                )}
                <p className="font-semibold text-sm">{ticker}</p>
            </div>
            </div>
        </div>
        <hr className="border border-slate-600 my-3" />
        <div>
            <div className="flex gap-2 my-3 font-semibold items-center ">
            <Text width={20} height={20} />
            <p>Insights</p>
            </div>

            <p>{summary}</p>
        </div>
        <div className="flex gap-6 text-base w-full my-4">
            {/* Short Term Card */}
            <div className="w-1/2 bg-[#101c3a] p-6 rounded-2xl shadow-md">
            <h3 className="font-bold text-[#b3c6f7] mb-4 text-lg flex items-center gap-2">
                Short Term
                <span className="bg-[#22305a] text-xs px-2 py-1 rounded-full">
                {shortTermMode}
                </span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
                {Object.keys(shortTerm).length === 1 && !shortTerm.mode && (
                <div className="col-span-2 text-center text-[#7ea2e0]">
                    No short term data available.
                </div>
                )}
            </div>
            </div>
            {/* Long Term Card */}
            <div className="w-1/2 bg-[#0a1a2f] p-6 rounded-2xl shadow-md">
            <h3 className="font-bold text-[#b0d8ff] mb-4 text-lg flex items-center gap-2">
                Long Term
                <span className="bg-[#1e3a5a] text-xs px-2 py-1 rounded-full">
                {longTermMode}
                </span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
                {Object.keys(longTerm).length === 1 && !longTerm.mode && (
                <div className="col-span-2 text-center text-[#7cb4e0]">
                    No long term data available.
                </div>
                )}
            </div>
            </div>
        </div>
        </div>
    );
    }
