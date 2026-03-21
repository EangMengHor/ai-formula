import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import MpptChatInput from "./MpptChatInput";
import { getUserMpptJobs } from "@/services/mppt/mppt.api";
import {
    Brain,
    ListChecks,
    Clock,
    CheckCircle2,
    AlertCircle,
    History,
    ChevronRight,
    Sparkles,
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

export default function MpptDashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [sessionId] = useState(() => crypto.randomUUID());
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [userJobs, setUserJobs] = useState([]);

    useEffect(() => {
        const userId = localStorage.getItem("id");
        if (!userId) return;
        getUserMpptJobs(userId).then((res) => {
            if (res.success && Array.isArray(res.data)) {
                setUserJobs(res.data);
            }
        });
    }, []);

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

                {/* Recent Sessions */}
                {userJobs.length > 0 && (
                    <div className="w-full">
                        <div className="flex items-center gap-2 mb-3">
                            <History className="w-3.5 h-3.5 text-gray-500" />
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Recent Sessions</p>
                        </div>
                        <div className="space-y-1.5">
                            {userJobs.map((job) => (
                                <button
                                    key={job.id}
                                    onClick={() => navigate(`/mppt/chat/${job.sessionId}`)}
                                    className="w-full flex items-center justify-between bg-g1 hover:bg-g2 px-4 py-3 rounded-xl transition-all text-left group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {statusIcon(job.status)}
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-200 truncate">Session #{job.id}</p>
                                            <p className="text-xs text-gray-500 font-mono truncate">{job.sessionId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                        <span className={`text-xs capitalize font-medium ${statusLabel(job.status)}`}>
                                            {job.status}
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
