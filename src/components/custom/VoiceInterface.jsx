import { useEffect } from "react";
import { X, Mic, MicOff, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWebRTCVoice } from "@/hooks/use-webrtc-voice";

export default function VoiceInterface({ 
  sessionId, 
  onClose, 
  onTranscript, 
  isEnabled = false 
}) {
  const { toast } = useToast();
  
  // Use the WebRTC hook
  const {
    status,
    isSessionActive,
    currentVolume,
    isMuted,
    isSpeakerMuted,
    currentUserTranscript,
    startSession,
    stopSession,
    toggleMute,
    toggleSpeakerMute,
  } = useWebRTCVoice(sessionId, onTranscript);

  // Auto-start session when enabled
  useEffect(() => {
    if (isEnabled && !isSessionActive) {
      startSession().catch(error => {
        console.error("Failed to start voice session:", error);
        toast({
          title: "Voice Error",
          description: error.message,
          variant: "destructive",
        });
      });
    }
  }, [isEnabled, isSessionActive, startSession, toast]);

  // Auto-stop session when disabled
  useEffect(() => {
    if (!isEnabled && isSessionActive) {
      stopSession();
    }
  }, [isEnabled, isSessionActive, stopSession]);

  // Handle close
  const handleClose = () => {
    stopSession();
    onClose?.();
  };

  if (!isEnabled) return null;

  // Get status color based on current state
  const getStatusColor = () => {
    if (!isSessionActive) return "bg-red-500";
    if (status.includes("speaking")) return "bg-green-400 animate-pulse";
    if (isMuted) return "bg-yellow-500";
    if (currentVolume > 0.1) return "bg-blue-400 animate-pulse";
    return "bg-green-400";
  };

  return (
    <div className="flex items-center justify-center w-full py-4">
      <div className="flex items-center gap-4 bg-gray-900 rounded-3xl px-6 py-4 border border-gray-700 shadow-lg">
        
        {/* Close button */}
        <Button
          onClick={handleClose}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full p-2"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Connection status */}
        <div className="flex items-center gap-3 min-w-[120px]">
          {status.includes("Requesting") || status.includes("Fetching") || status.includes("Establishing") ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <span className="text-sm text-gray-300">Connecting...</span>
            </div>
          ) : isSessionActive ? (
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
              <span className="text-sm text-gray-300">{status}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-red-400">{status}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Microphone toggle */}
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="sm"
            className={`rounded-full p-3 transition-colors ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            disabled={!isSessionActive}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          {/* Speaker toggle */}
          <Button
            onClick={toggleSpeakerMute}
            variant="ghost"
            size="sm"
            className={`rounded-full p-3 transition-colors ${
              isSpeakerMuted 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            disabled={!isSessionActive}
            title={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
          >
            {isSpeakerMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Status text and debug info */}
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500">
            Voice conversation active
          </span>
          {currentUserTranscript && (
            <span className="text-xs text-blue-400 max-w-[200px] truncate">
              "{currentUserTranscript}"
            </span>
          )}
          {/* Volume indicator */}
          {currentVolume > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="text-xs text-gray-500">AI:</div>
              <div className="w-12 h-1 bg-gray-700 rounded">
                <div 
                  className="h-full bg-blue-400 rounded transition-all duration-100"
                  style={{ width: `${Math.min(currentVolume * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 