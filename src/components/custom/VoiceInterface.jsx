import { useEffect, useState, useRef } from "react";
import { X, Mic, MicOff, Loader2, Volume2, VolumeX, Bot, BotOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWebRTCVoice } from "@/hooks/use-webrtc-voice";

export default function VoiceInterface({ 
  sessionId, 
  onClose, 
  onTranscript, 
  isEnabled = false,
  integratedMode = true // New prop to control whether to use integrated chat pipeline
}) {
  const { toast } = useToast();
  const audioQueueRef = useRef([]);
  const currentAudioRef = useRef(null);
  const isPlayingRef = useRef(false);
  
  // Use the WebRTC hook
  const {
    status,
    isSessionActive,
    currentVolume,
    isMuted,
    isSpeakerMuted,
    isAssistantMuted,
    currentUserTranscript,
    startSession,
    stopSession,
    toggleMute,
    toggleSpeakerMute,
    toggleAssistantMute,
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

  // In integrated mode, mute the assistant by default
  useEffect(() => {
    if (integratedMode && !isAssistantMuted && isSessionActive) {
      toggleAssistantMute();
    }
  }, [integratedMode, isAssistantMuted, isSessionActive, toggleAssistantMute]);

  // TTS playback function
  const playTTS = async (text) => {
    if (!text || text.trim() === "") return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SOCKET_URL}/api/utils/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Voice-Interface": "true" // Indicate this is from voice interface
        },
        body: JSON.stringify({
          text: text,
          voice: "alloy",
          model: "tts-1",
          response_format: "mp3",
          speed: 1.0
        }),
      });

      if (!response.ok) {
        throw new Error("TTS request failed");
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      // Add to queue
      audioQueueRef.current.push(audioUrl);
      
      // Start playing if not already playing
      if (!isPlayingRef.current) {
        playNextInQueue();
      }
    } catch (error) {
      console.error("TTS Error:", error);
    }
  };

  // Play next audio in queue
  const playNextInQueue = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioUrl = audioQueueRef.current.shift();
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      URL.revokeObjectURL(currentAudioRef.current.src);
    }

    currentAudioRef.current = new Audio(audioUrl);
    currentAudioRef.current.volume = isSpeakerMuted ? 0 : 1;
    
    currentAudioRef.current.onended = () => {
      URL.revokeObjectURL(audioUrl);
      playNextInQueue();
    };

    currentAudioRef.current.play().catch(console.error);
  };

  // Handle close
  const handleClose = () => {
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    
    stopSession();
    onClose?.();
  };

  // Expose TTS function to parent
  useEffect(() => {
    if (integratedMode && window) {
      window.voiceInterfaceTTS = playTTS;
    }
    return () => {
      if (window.voiceInterfaceTTS) {
        delete window.voiceInterfaceTTS;
      }
    };
  }, [integratedMode]);

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
              <span className="text-base text-gray-300">
                {integratedMode ? "Voice Input Active" : status}
              </span>
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
            onClick={() => {
              toggleSpeakerMute();
              // Also mute current playing audio
              if (currentAudioRef.current) {
                currentAudioRef.current.volume = !isSpeakerMuted ? 0 : 1;
              }
            }}
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

          {/* Assistant toggle (only in non-integrated mode) */}
          {!integratedMode && (
            <Button
              onClick={toggleAssistantMute}
              variant="ghost"
              size="lg"
              className={`rounded-full p-4 transition-colors ${
                isAssistantMuted 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              disabled={!isSessionActive}
              title={isAssistantMuted ? 'Enable AI voice' : 'Disable AI voice'}
            >
              {isAssistantMuted ? (
                <BotOff className="w-6 h-6" />
              ) : (
                <Bot className="w-6 h-6" />
              )}
            </Button>
          )}
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