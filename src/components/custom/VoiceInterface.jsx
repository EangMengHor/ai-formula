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
      <div className="flex items-center justify-center gap-6 bg-gray-900 rounded-3xl px-8 py-6 border border-gray-700 shadow-lg">
        
        {/* Close button */}
        <Button
          onClick={handleClose}
          variant="ghost"
          size="lg"
          className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full p-4"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Connection status */}
        <div className="flex items-center gap-3">
          {status.includes("Requesting") || status.includes("Fetching") || status.includes("Establishing") ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <span className="text-base text-gray-300">Connecting...</span>
            </div>
          ) : isSessionActive ? (
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${getStatusColor()}`} />
              <span className="text-base text-gray-300">{status}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-base text-red-400">{status}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Microphone toggle */}
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="lg"
            className={`rounded-full p-4 transition-colors ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            disabled={!isSessionActive}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          {/* Speaker toggle */}
          <Button
            onClick={toggleSpeakerMute}
            variant="ghost"
            size="lg"
            className={`rounded-full p-4 transition-colors ${
              isSpeakerMuted 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            disabled={!isSessionActive}
            title={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
          >
            {isSpeakerMuted ? (
              <VolumeX className="w-6 h-6" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* User transcript display */}
        {currentUserTranscript && (
          <div className="flex items-center">
            <span className="text-sm text-blue-400 max-w-[200px] truncate">
              "{currentUserTranscript}"
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 