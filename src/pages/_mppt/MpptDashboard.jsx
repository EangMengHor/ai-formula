import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import MpptChatInput from "./MpptChatInput";
import { getUserMpptJobs, addMpptFavorite, removeMpptFavorite } from "@/services/mppt/mppt.api";
import {
    Brain,
    ListChecks,
    Clock,
    CheckCircle2,
    AlertCircle,
    History,
    ChevronRight,
    Sparkles,
    Star,
} from "lucide-react";

const statusIcon = (status) => {
    if (status === "completed") return <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />;
    if (status === "error") return <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
    return <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse flex-shrink-0" />;
};

const statusLabel = (status) => {
    if (status === "completed") return "text-green-400";
    if (status === "error") return "text-red-400";
    return "text-yellow-400";
};

function SessionRow({ session, onNavigate, onToggleFavorite, isToggling }) {
    return (
        <button
            onClick={onNavigate}
            className="w-full flex items-center justify-between bg-g1 hover:bg-g2 px-4 py-3 rounded-xl transition-all text-left group"
        >
            <div className="flex items-center gap-3 min-w-0">
                {statusIcon(session.status)}
                <p className="text-sm text-gray-200 font-mono truncate">{session.sessionId}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className={`text-xs capitalize font-medium ${statusLabel(session.status)}`}>
                    {session.status}
                </span>
                <button
                    onClick={onToggleFavorite}
                    disabled={isToggling}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    title={session.isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                    <Star
                        className={`w-3.5 h-3.5 transition-colors ${
                            session.isFavorited
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-600 group-hover:text-gray-400"
                        }`}
                    />
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
        </button>
    );
}

export default function MpptDashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [sessionId] = useState(() => crypto.randomUUID());
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [userJobs, setUserJobs] = useState([]);

    const [togglingFavorite, setTogglingFavorite] = useState(null);

    useEffect(() => {
        const userId = localStorage.getItem("id");
        if (!userId) return;
        getUserMpptJobs(userId).then((res) => {
            if (res.success && Array.isArray(res.data)) {
                setUserJobs(res.data);
            }
        });
    }, []);

    // Group jobs by sessionId — one session row per unique sessionId.
    // Status priority: running > pending > error > completed
    const STATUS_PRIORITY = { running: 3, pending: 2, error: 1, completed: 0 };
    const sessions = useMemo(() => {
        const map = new Map();
        for (const job of userJobs) {
            if (!map.has(job.sessionId)) {
                map.set(job.sessionId, {
                    sessionId: job.sessionId,
                    isFavorited: job.isFavorited,
                    status: job.status,
                });
            } else {
                const existing = map.get(job.sessionId);
                if ((STATUS_PRIORITY[job.status] ?? 0) > (STATUS_PRIORITY[existing.status] ?? 0)) {
                    existing.status = job.status;
                }
            }
        }
        return Array.from(map.values());
    }, [userJobs]);

    const favoritedSessions = useMemo(() => sessions.filter((s) => s.isFavorited), [sessions]);
    const recentSessions = useMemo(() => sessions.filter((s) => !s.isFavorited), [sessions]);

    const handleToggleFavorite = async (e, session) => {
        e.stopPropagation();
        const userId = localStorage.getItem("id");
        if (!userId || togglingFavorite === session.sessionId) return;

        setTogglingFavorite(session.sessionId);
        try {
            if (session.isFavorited) {
                await removeMpptFavorite(userId, session.sessionId);
            } else {
                await addMpptFavorite(userId, session.sessionId);
            }
            setUserJobs((prev) =>
                prev.map((j) =>
                    j.sessionId === session.sessionId
                        ? { ...j, isFavorited: !j.isFavorited }
                        : j
                )
            );
        } catch {
            toast({ title: "Error", description: "Failed to update favorite", variant: "destructive" });
        } finally {
            setTogglingFavorite(null);
        }
    };

    const handleSubmit = async ({ prompt, isInternetSearch, isVoice }) => {
        if (!prompt.trim() && uploadedFiles.length === 0) return;
        localStorage.setItem("mpptPrompt", prompt.trim());
        localStorage.setItem("mpptInternetSearch", String(isInternetSearch));
        if (isVoice) {
            localStorage.setItem("mpptVoiceInitiated", "true");
        } else {
            localStorage.removeItem("mpptVoiceInitiated");
        }
        navigate(`/mppt/chat/${sessionId}`);
    };

    return (
        <div className="flex flex-col h-full w-full overflow-y-auto">
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-3xl mx-auto w-full">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                            <Brain className="w-5 h-5 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">MPPT</h1>
                    </div>
                    <p className="text-gray-400 text-sm max-w-md">
                        Multi-Phase Parallel Thinking — deep research and analysis using parallel AI branches for comprehensive insights
                    </p>
                </div>

                {/* Chat Input */}
                <div className="w-full mb-8">
                    <MpptChatInput
                        sessionId={sessionId}
                        onSubmit={handleSubmit}
                        isUsedInDashboard={true}
                        uploadedFiles={uploadedFiles}
                        setUploadedFiles={setUploadedFiles}
                    />
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
                    {/* My Decisions */}
                    <button
                        onClick={() => navigate("/mppt/decisions")}
                        className="group bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl p-5 text-left transition-all hover:bg-purple-500/15"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center">
                                <ListChecks className="w-5 h-5 text-purple-400" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-purple-400/50 group-hover:text-purple-400 transition-colors mt-1" />
                        </div>
                        <p className="text-white font-semibold text-sm mb-1">My Decisions</p>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            View all AI-generated investment decisions from your previous analyses, verified on-chain.
                        </p>
                    </button>

                    {/* Decision Agent */}
                    <button
                        onClick={() => navigate("/mppt/decision-agent")}
                        className="group bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl p-5 text-left transition-all hover:bg-blue-500/15"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-blue-400" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-blue-400/50 group-hover:text-blue-400 transition-colors mt-1" />
                        </div>
                        <p className="text-white font-semibold text-sm mb-1">Decision Agent</p>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            Chat with an AI agent trained on your decisions to get personalized investment guidance.
                        </p>
                    </button>
                </div>

                {/* Sessions */}
                {sessions.length > 0 && (
                    <div className="w-full space-y-4">

                        {/* Favorited Sessions */}
                        {favoritedSessions.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Favorites</p>
                                </div>
                                <div className="space-y-1.5">
                                    {favoritedSessions.map((session) => (
                                        <SessionRow
                                            key={session.sessionId}
                                            session={session}
                                            onNavigate={() => navigate(`/mppt/chat/${session.sessionId}`)}
                                            onToggleFavorite={(e) => handleToggleFavorite(e, session)}
                                            isToggling={togglingFavorite === session.sessionId}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Sessions */}
                        {recentSessions.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <History className="w-3.5 h-3.5 text-gray-500" />
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Recent Sessions</p>
                                </div>
                                <div className="space-y-1.5">
                                    {recentSessions.map((session) => (
                                        <SessionRow
                                            key={session.sessionId}
                                            session={session}
                                            onNavigate={() => navigate(`/mppt/chat/${session.sessionId}`)}
                                            onToggleFavorite={(e) => handleToggleFavorite(e, session)}
                                            isToggling={togglingFavorite === session.sessionId}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
}
