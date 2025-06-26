import { useEffect, useState, useRef, useCallback } from "react";
import { X, Mic, MicOff, Loader2, Volume2, VolumeX, Bot, BotOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWebRTCVoice } from "@/hooks/use-webrtc-voice";
import { debounce } from "lodash";

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
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  
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
  } = useWebRTCVoice(sessionId, onTranscript, integratedMode);

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

  // TTS playback function with better error handling and queue management
  const playTTS = async (text) => {
    if (!text || text.trim() === "") return;

    console.log("🔊 TTS playTTS called with:", text.substring(0, 200));
    console.log("🔊 Full text length:", text.length);
    console.log("🔊 First 300 characters:", text.substring(0, 300));
    console.log("🔊 Last 100 characters:", text.substring(Math.max(0, text.length - 100)));

    try {
      console.log("🔊 Making TTS request to:", `${import.meta.env.VITE_SOCKET_URL}/api/utils/tts`);
      
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

      console.log("🔊 TTS response status:", response.status, response.ok);

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const blob = await response.blob();
      console.log("🔊 TTS blob received, size:", blob.size);
      
      const audioUrl = URL.createObjectURL(blob);
      
      // Add to queue
      audioQueueRef.current.push(audioUrl);
      console.log("🔊 Added to audio queue, queue length:", audioQueueRef.current.length);
      
      // Start playing if not already playing
      if (!isPlayingRef.current) {
        console.log("🔊 Starting audio playback");
        playNextInQueue();
      }
    } catch (error) {
      console.error("🔊 TTS Error:", error);
      toast({
        title: "TTS Error",
        description: "Failed to play audio response",
        variant: "destructive",
      });
    }
  };

  // Debounced TTS function to prevent too many rapid calls
  const debouncedPlayTTS = useCallback(
    debounce((text) => {
      console.log("🔊 Debounced TTS called with:", text.substring(0, 50));
      playTTS(text);
    }, 100),
    []
  );

  // Play next audio in queue with better state management
  const playNextInQueue = () => {
    console.log("🔊 playNextInQueue called, queue length:", audioQueueRef.current.length);
    
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsPlayingTTS(false);
      console.log("🔊 Audio queue empty, stopping playback");
      return;
    }

    isPlayingRef.current = true;
    setIsPlayingTTS(true);
    const audioUrl = audioQueueRef.current.shift();
    
    console.log("🔊 Playing audio from URL");
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      URL.revokeObjectURL(currentAudioRef.current.src);
    }

    currentAudioRef.current = new Audio(audioUrl);
    currentAudioRef.current.volume = isSpeakerMuted ? 0 : 1;
    
    currentAudioRef.current.onended = () => {
      console.log("🔊 Audio playback ended");
      URL.revokeObjectURL(audioUrl);
      playNextInQueue();
    };

    currentAudioRef.current.onerror = (error) => {
      console.error("🔊 Audio playback error:", error);
      URL.revokeObjectURL(audioUrl);
      playNextInQueue();
    };

    currentAudioRef.current.play().then(() => {
      console.log("🔊 Audio playback started successfully");
    }).catch(error => {
      console.error("🔊 Audio play error:", error);
      URL.revokeObjectURL(audioUrl);
      playNextInQueue();
    });
  };

  // Stop all TTS playback
  const stopTTS = () => {
    // Clear queue
    audioQueueRef.current.forEach(url => URL.revokeObjectURL(url));
    audioQueueRef.current = [];
    
    // Stop current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      URL.revokeObjectURL(currentAudioRef.current.src);
      currentAudioRef.current = null;
    }
    
    isPlayingRef.current = false;
    setIsPlayingTTS(false);
  };

  // Handle close
  const handleClose = () => {
    stopTTS();
    stopSession();
    onClose?.();
  };

  // Handle retry/reset
  const handleRetry = useCallback(() => {
    console.log("Retrying voice session...");
    stopTTS();
    stopSession();
    
    // Wait a moment then restart
    setTimeout(() => {
      startSession().catch(error => {
        console.error("Failed to restart voice session:", error);
        toast({
          title: "Voice Error",
          description: error.message,
          variant: "destructive",
        });
      });
    }, 1000);
  }, [stopTTS, stopSession, startSession, toast]);

  // Expose TTS functions to parent with better error handling
  useEffect(() => {
    if (integratedMode && window) {
      console.log("🔧 Exposing TTS functions to window in integrated mode");
      
      // Wrap functions with error handling
      window.voiceInterfaceTTS = (text) => {
        try {
          console.log("🔧 window.voiceInterfaceTTS called with:", text?.substring(0, 50));
          if (text && text.trim()) {
            debouncedPlayTTS(text.trim());
          }
        } catch (error) {
          console.error("🔧 Error in voiceInterfaceTTS:", error);
        }
      };
      
      window.voiceInterfaceStopTTS = () => {
        try {
          console.log("🔧 window.voiceInterfaceStopTTS called");
          stopTTS();
        } catch (error) {
          console.error("🔧 Error in voiceInterfaceStopTTS:", error);
        }
      };
      
      console.log("🔧 Voice interface TTS functions exposed successfully");
    }
    
    return () => {
      if (window.voiceInterfaceTTS) {
        console.log("🔧 Cleaning up TTS functions from window");
        delete window.voiceInterfaceTTS;
      }
      if (window.voiceInterfaceStopTTS) {
        delete window.voiceInterfaceStopTTS;
      }
    };
  }, [integratedMode, debouncedPlayTTS]);

  if (!isEnabled) return null;

  // Get status color based on current state
  const getStatusColor = () => {
    if (!isSessionActive || status.includes("Error")) return "bg-red-500";
    if (status.includes("speaking")) return "bg-green-400 animate-pulse";
    if (isMuted) return "bg-yellow-500";
    if (isPlayingTTS) return "bg-purple-400 animate-pulse";
    if (currentVolume > 0.1) return "bg-blue-400 animate-pulse";
    return "bg-green-400";
  };

  // Check if we're in an error state
  const isErrorState = status.includes("Error") || status.includes("error");

  // Debug information (only in development)
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    console.log("Voice Interface Debug:", {
      isEnabled,
      isSessionActive,
      status,
      isPlayingTTS,
      isMuted,
      isSpeakerMuted,
      currentUserTranscript,
      hasVoiceTTSFunction: !!window.voiceInterfaceTTS,
      hasStopTTSFunction: !!window.voiceInterfaceStopTTS,
      queueLength: audioQueueRef.current?.length || 0,
      isPlaying: isPlayingRef.current
    });
  }

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
          ) : isErrorState ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-base text-red-400">{status}</span>
              <Button
                onClick={handleRetry}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-white hover:bg-red-800 rounded-md px-2 py-1"
              >
                Retry
              </Button>
            </div>
          ) : isSessionActive ? (
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${getStatusColor()}`} />
              <span className="text-base text-gray-300">
                {integratedMode ? (
                  isPlayingTTS ? "Speaking..." : 
                  status.includes("speaking") ? "Listening..." : 
                  status.includes("Processing") ? "AI Thinking..." :
                  "Voice Active"
                ) : status}
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

          {/* Stop TTS button (only in integrated mode) */}
          {integratedMode && isPlayingTTS && (
            <Button
              onClick={stopTTS}
              variant="ghost"
              size="lg"
              className="rounded-full p-4 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              title="Stop AI speech"
            >
              <BotOff className="w-6 h-6" />
            </Button>
          )}

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