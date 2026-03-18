import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getUserDecisions } from "@/services/mppt/mppt.api";
import {
    ListChecks,
    LoaderCircle,
    AlertCircle,
    Copy,
    Check,
    ArrowLeft,
    Brain,
    ChevronDown,
    ChevronUp,
    Shield,
    RefreshCw,
} from "lucide-react";

const LIMIT = 10;
const getUserId = () => localStorage.getItem("id");

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };
    return (
        <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            title="Copy"
        >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
        </button>
    );
}

function DecisionCard({ decision }) {
    const [showChain, setShowChain] = useState(false);

    const fullHash = decision.chain?.eHash ?? null;

    return (
        <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 rounded-2xl p-4 border border-white/5 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-xs text-gray-500 bg-white/5 rounded-lg px-2 py-1 mt-0.5 flex-shrink-0">
                        #{decision.id}
                    </span>
                    <p className="text-sm text-gray-200 leading-relaxed">{decision.decisions}</p>
                </div>
                <CopyButton text={decision.decisions} />
            </div>

            {/* Chain integrity */}
            {decision.chain && (
                <div>
                    <button
                        onClick={() => setShowChain((v) => !v)}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <Shield className="w-3 h-3 text-green-400" />
                        <span>Chain Verified</span>
                        {showChain ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showChain && (
                        <div className="mt-2 bg-white/5 rounded-xl p-3 space-y-1.5">
                            <div className="flex items-start gap-2">
                                <span className="text-xs text-gray-500 w-20 flex-shrink-0">Hash</span>
                                <span className="text-xs text-gray-300 font-mono break-all">{fullHash}</span>
                            </div>
                            {decision.chain.priorHash && (
                                <div className="flex items-start gap-2">
                                    <span className="text-xs text-gray-500 w-20 flex-shrink-0">Prior</span>
                                    <span className="text-xs text-gray-300 font-mono break-all">
                                        {decision.chain.priorHash}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-start gap-2">
                                <span className="text-xs text-gray-500 w-20 flex-shrink-0">Scenario</span>
                                <span className="text-xs text-gray-300 font-mono break-all">{decision.scenarioId}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function UserDecisions() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [decisions, setDecisions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const loadDecisions = async (pageToLoad = 1, append = false) => {
        const userId = getUserId();
        if (!userId) {
            setError("User not found. Please log in.");
            setIsLoading(false);
            return;
        }

        try {
            if (append) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
                setError(null);
            }

            const res = await getUserDecisions(userId, pageToLoad, LIMIT);

            if (res.success && Array.isArray(res.data)) {
                setDecisions((prev) => append ? [...prev, ...res.data] : res.data);
                if (res.pagination) {
                    setTotalPages(res.pagination.totalPages);
                    setTotal(res.pagination.total);
                    setPage(res.pagination.page);
                }
            } else {
                setError(res.message || "Failed to load decisions");
            }
        } catch (err) {
            setError("Failed to load decisions. Please try again.");
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        loadDecisions(nextPage, true);
    };

    const handleRefresh = () => {
        setDecisions([]);
        setPage(1);
        loadDecisions(1, false);
    };

    useEffect(() => {
        loadDecisions(1, false);
    }, []);

    // Group visible decisions by scenarioId
    const grouped = decisions.reduce((acc, d) => {
        const key = d.scenarioId || "unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push(d);
        return acc;
    }, {});

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/mppt/dashboard")}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 text-gray-400" />
                        </button>
                        <div className="w-8 h-8 bg-purple-500/10 rounded-xl flex items-center justify-center">
                            <ListChecks className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">My Decisions</p>
                            <p className="text-xs text-gray-400">
                                {total > 0 ? `${total} decision${total !== 1 ? "s" : ""} recorded` : "No decisions yet"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={() => navigate("/mppt/decision-agent")}
                            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-blue-500/10"
                        >
                            <Brain className="w-3.5 h-3.5" />
                            Ask Agent
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <LoaderCircle className="w-8 h-8 animate-spin text-purple-400" />
                        <p className="text-gray-400 text-sm">Loading decisions...</p>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                        <p className="text-gray-400 text-sm">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!isLoading && !error && decisions.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                        <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                            <ListChecks className="w-7 h-7 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium mb-1">No decisions yet</p>
                            <p className="text-gray-400 text-sm max-w-sm">
                                Run an MPPT analysis to generate AI-powered investment decisions
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/mppt/dashboard")}
                            className="bg-white hover:bg-gray-100 text-black text-sm font-medium px-4 py-2 rounded-xl transition-all"
                        >
                            Start Analysis
                        </button>
                    </div>
                )}

                {!isLoading && !error && Object.keys(grouped).length > 0 && (
                    <div className="space-y-6">
                        {Object.entries(grouped).map(([scenarioId, items]) => (
                            <div key={scenarioId}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-px flex-1 bg-white/10" />
                                    <span className="text-xs text-gray-500 font-mono">
                                        {scenarioId.slice(0, 8)}...
                                    </span>
                                    <div className="h-px flex-1 bg-white/10" />
                                </div>
                                <div className="space-y-2">
                                    {items.map((decision) => (
                                        <DecisionCard key={decision.id} decision={decision} />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Load More */}
                        {page < totalPages && (
                            <div className="flex justify-center pt-2 pb-4">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <LoaderCircle className="w-4 h-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            Load more
                                            <span className="text-xs text-gray-500">
                                                ({decisions.length} of {total})
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {page >= totalPages && total > LIMIT && (
                            <p className="text-center text-xs text-gray-600 pb-4">
                                All {total} decisions loaded
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
