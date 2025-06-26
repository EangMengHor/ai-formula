import { useState, useRef, useEffect, useCallback } from "react";

export function useWebRTCVoice(sessionId, onTranscript) {
  // Connection/session states
  const [status, setStatus] = useState("Disconnected");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isAssistantMuted, setIsAssistantMuted] = useState(false);

  // WebRTC references
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const volumeIntervalRef = useRef(null);
  const audioElementRef = useRef(null);

  // Conversation state
  const ephemeralUserMessageIdRef = useRef(null);
  const [currentUserTranscript, setCurrentUserTranscript] = useState("");

  /**
   * Fetch ephemeral token from backend
   */
  const getEphemeralToken = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SOCKET_URL}/api/voiceToVoice/realtime/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get session token: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract the client secret value
      if (data.client_secret && data.client_secret.value) {
        return data.client_secret.value;
      } else if (typeof data.client_secret === 'string') {
        return data.client_secret;
      } else {
        throw new Error("No valid client secret found in response");
      }
    } catch (error) {
      console.error("Error getting session token:", error);
      throw error;
    }
  }, [sessionId]);

  /**
   * Configure the data channel on open
   */
  const configureDataChannel = useCallback((dataChannel) => {
    const sessionUpdate = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: "You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise and engaging.",
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800
        },
        temperature: 0.8,
        max_response_output_tokens: isAssistantMuted ? 1 : 4096
      }
    };
    
    dataChannel.send(JSON.stringify(sessionUpdate));
    console.log("Session update sent:", sessionUpdate);
  }, [isAssistantMuted]);

  /**
   * Handle data channel messages
   */
  const handleDataChannelMessage = useCallback(async (event) => {
    try {
      const msg = JSON.parse(event.data);
      console.log("Received message:", msg.type);

      switch (msg.type) {
        case "session.created":
          console.log("Session created successfully");
          setStatus("Connected");
          break;

        case "session.updated":
          console.log("Session updated successfully");
          break;

        case "input_audio_buffer.speech_started":
          setStatus("You're speaking...");
          setCurrentUserTranscript("");
          break;

        case "input_audio_buffer.speech_stopped":
          setStatus("Processing...");
          if (currentUserTranscript.trim() && onTranscript) {
            onTranscript(currentUserTranscript.trim(), "user_complete");
          }
          if (isAssistantMuted && dataChannelRef.current) {
            const cancelResponse = {
              type: "response.cancel"
            };
            dataChannelRef.current.send(JSON.stringify(cancelResponse));
          }
          break;

        case "conversation.item.input_audio_transcription":
          if (msg.transcript) {
            setCurrentUserTranscript(prev => prev + msg.transcript);
            if (onTranscript) {
              onTranscript(msg.transcript, "user");
            }
          }
          break;

        case "conversation.item.input_audio_transcription.completed":
          if (msg.transcript && onTranscript) {
            onTranscript(msg.transcript, "user_complete");
          }
          break;

        case "response.audio_transcript.delta":
          if (!isAssistantMuted && onTranscript && msg.delta) {
            onTranscript(msg.delta, "assistant");
          }
          break;

        case "response.audio_transcript.done":
          setStatus("Listening...");
          break;

        case "error":
          console.error("Realtime API error:", msg.error);
          setStatus("Error occurred");
          break;

        default:
          console.log("Unhandled message type:", msg.type);
          break;
      }
    } catch (error) {
      console.error("Error handling data channel message:", error);
    }
  }, [onTranscript, currentUserTranscript, isAssistantMuted]);

  /**
   * Calculate volume from audio
   */
  const getVolume = useCallback(() => {
    if (!analyserRef.current) return 0;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const float = (dataArray[i] - 128) / 128;
      sum += float * float;
    }
    return Math.sqrt(sum / dataArray.length);
  }, []);

  /**
   * Start WebRTC session
   */
  const startSession = useCallback(async () => {
    try {
      setStatus("Requesting microphone access...");
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1,
        }
      });
      
      audioStreamRef.current = stream;

      setStatus("Fetching session token...");
      const ephemeralToken = await getEphemeralToken();

      setStatus("Establishing connection...");
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Create audio element for playback
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.muted = isSpeakerMuted;
      audioElementRef.current = audioEl;

      // Handle incoming audio track (assistant speech)
      pc.ontrack = (event) => {
        console.log("Received audio track");
        audioEl.srcObject = event.streams[0];

        // Set up volume monitoring for assistant audio (always set up, regardless of mute state)
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const src = audioCtx.createMediaStreamSource(event.streams[0]);
        const analyzer = audioCtx.createAnalyser();
        analyzer.fftSize = 256;
        src.connect(analyzer);
        analyserRef.current = analyzer;

        // Start volume monitoring
        volumeIntervalRef.current = setInterval(() => {
          setCurrentVolume(getVolume());
        }, 100);
      };

      // Create data channel for messages
      const dataChannel = pc.createDataChannel("response");
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        console.log("Data channel opened");
        configureDataChannel(dataChannel);
      };

      dataChannel.onmessage = handleDataChannelMessage;

      // Add local audio track
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to OpenAI
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const voice = "alloy";
      
      const response = await fetch(`${baseUrl}?model=${model}&voice=${voice}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!response.ok) {
        throw new Error(`WebRTC connection failed: ${response.status}`);
      }

      // Set remote description
      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setIsSessionActive(true);
      setStatus("Session established");

    } catch (error) {
      console.error("Error starting session:", error);
      setStatus(`Error: ${error.message}`);
      stopSession();
    }
  }, [getEphemeralToken, configureDataChannel, handleDataChannelMessage, isSpeakerMuted, getVolume]);

  /**
   * Stop WebRTC session
   */
  const stopSession = useCallback(() => {
    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop audio stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clear volume monitoring
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }

    analyserRef.current = null;
    ephemeralUserMessageIdRef.current = null;

    // Clean up audio element
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }

    setCurrentVolume(0);
    setIsSessionActive(false);
    setStatus("Disconnected");
    setCurrentUserTranscript("");
  }, []);

  /**
   * Toggle microphone mute
   */
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (audioStreamRef.current) {
        audioStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !newMuted;
        });
      }
      setStatus(newMuted ? "Microphone muted" : "Listening...");
      return newMuted;
    });
  }, []);

  /**
   * Toggle speaker mute
   */
  const toggleSpeakerMute = useCallback(() => {
    setIsSpeakerMuted(prev => {
      const newMuted = !prev;
      if (audioElementRef.current) {
        audioElementRef.current.muted = newMuted;
      }
      return newMuted;
    });
  }, []);

  /**
   * Toggle assistant mute (prevents OpenAI from generating voice responses)
   */
  const toggleAssistantMute = useCallback(() => {
    setIsAssistantMuted(prev => !prev);
    if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
      configureDataChannel(dataChannelRef.current);
    }
  }, [configureDataChannel]);

  /**
   * Send text message through data channel
   */
  const sendTextMessage = useCallback((text) => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
      console.error("Data channel not ready");
      return;
    }

    const message = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: text,
          },
        ],
      },
    };

    const response = {
      type: "response.create",
    };

    dataChannelRef.current.send(JSON.stringify(message));
    dataChannelRef.current.send(JSON.stringify(response));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return {
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
    sendTextMessage,
  };
} 