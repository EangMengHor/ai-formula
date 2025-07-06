import { useEffect, useRef, useState } from "react";

export default function VADVisualization({
  audioStream,
  remoteAudioStream,
  isSessionActive,
  onStart,
  onStop,
}) {
  const [userVoiceActive, setUserVoiceActive] = useState(false);
  const [aiVoiceActive, setAiVoiceActive] = useState(false);
  const [userVoiceLevel, setUserVoiceLevel] = useState(0);
  const [aiVoiceLevel, setAiVoiceLevel] = useState(0);

  const userAnalyzerRef = useRef(null);
  const aiAnalyzerRef = useRef(null);
  const userAudioContextRef = useRef(null);
  const aiAudioContextRef = useRef(null);
  const userAnimationFrameRef = useRef(null);
  const aiAnimationFrameRef = useRef(null);

  // VAD configuration
  const VAD_THRESHOLD = 0.01; // Adjust this value to fine-tune sensitivity
  const SMOOTHING_FACTOR = 0.6;

  // Initialize user microphone VAD
  useEffect(() => {
    if (!audioStream || !isSessionActive) return;

    const setupUserVAD = async () => {
      try {
        userAudioContextRef.current = new AudioContext();
        const source =
          userAudioContextRef.current.createMediaStreamSource(audioStream);
        userAnalyzerRef.current = userAudioContextRef.current.createAnalyser();

        userAnalyzerRef.current.fftSize = 256;
        userAnalyzerRef.current.smoothingTimeConstant = SMOOTHING_FACTOR;

        source.connect(userAnalyzerRef.current);

        startUserVADAnalysis();
      } catch (error) {
        console.error("Failed to setup user VAD:", error);
      }
    };

    setupUserVAD();

    return () => {
      if (userAudioContextRef.current) {
        userAudioContextRef.current.close();
      }
    };
  }, [audioStream, isSessionActive]);

  // Initialize AI audio VAD
  useEffect(() => {
    if (!remoteAudioStream || !isSessionActive) return;

    const setupAiVAD = async () => {
      try {
        aiAudioContextRef.current = new AudioContext();
        const source =
          aiAudioContextRef.current.createMediaStreamSource(remoteAudioStream);
        aiAnalyzerRef.current = aiAudioContextRef.current.createAnalyser();

        aiAnalyzerRef.current.fftSize = 256;
        aiAnalyzerRef.current.smoothingTimeConstant = SMOOTHING_FACTOR;

        source.connect(aiAnalyzerRef.current);

        startAiVADAnalysis();
      } catch (error) {
        console.error("Failed to setup AI VAD:", error);
      }
    };

    setupAiVAD();

    return () => {
      if (aiAudioContextRef.current) {
        aiAudioContextRef.current.close();
      }
    };
  }, [remoteAudioStream, isSessionActive]);

  const analyzeAudio = (analyzer) => {
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteFrequencyData(dataArray);

    // Calculate RMS (Root Mean Square) for volume level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength) / 255;

    return {
      level: rms,
      isActive: rms > VAD_THRESHOLD,
    };
  };

  // Use refs to avoid stale closure and batching delays
  const userVoiceLevelRef = useRef(0);
  const aiVoiceLevelRef = useRef(0);

  // Fast, direct update for user VAD
  const startUserVADAnalysis = () => {
    const analyze = () => {
      if (userAnalyzerRef.current) {
        const { level, isActive } = analyzeAudio(userAnalyzerRef.current);
        // Directly update refs for immediate feedback
        userVoiceLevelRef.current = level;
        setUserVoiceLevel(level);
        setUserVoiceActive(isActive);
      }
      if (isSessionActive) {
        userAnimationFrameRef.current = requestAnimationFrame(analyze);
      }
    };
    userAnimationFrameRef.current = requestAnimationFrame(analyze);
  };

  // Fast, direct update for AI VAD
  const startAiVADAnalysis = () => {
    const analyze = () => {
      if (aiAnalyzerRef.current) {
        const { level, isActive } = analyzeAudio(aiAnalyzerRef.current);
        aiVoiceLevelRef.current = level;
        setAiVoiceLevel(level);
        setAiVoiceActive(isActive);
      }
      if (isSessionActive) {
        aiAnimationFrameRef.current = requestAnimationFrame(analyze);
      }
    };
    aiAnimationFrameRef.current = requestAnimationFrame(analyze);
  };

  // Cleanup animation frames on unmount or session end
  useEffect(() => {
    return () => {
      if (userAnimationFrameRef.current) {
        cancelAnimationFrame(userAnimationFrameRef.current);
      }
      if (aiAnimationFrameRef.current) {
        cancelAnimationFrame(aiAnimationFrameRef.current);
      }
    };
  }, []);

  // Calculate pulse scale based on voice level (use refs for instant UI)
  const getUserPulseScale = () => {
    if (!userVoiceActive) return 1;
    return 1 + userVoiceLevelRef.current * 4;
  };

  const getAiPulseScale = () => {
    if (!aiVoiceActive) return 1;
    return 1 + aiVoiceLevelRef.current * 4;
  };

  return (
    <div className="flex items-center justify-center w-full h-full ">
      <div
        className="relative flex items-center justify-center"
        style={{ width: "60px", height: "60px" }}
      >
        {aiVoiceActive ? (
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-white to-slate-500 transition-all duration-150"
            style={{
              width: "60px",
              height: "60px",
              transform: `scale(${getAiPulseScale()})`,
              opacity: 0.4 + aiVoiceLevel * 0.4,
              filter: `blur(${2 - aiVoiceLevel * 2}px)`,
              zIndex: 10,
            }}
          />
        ) : (
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-300 to-blue-600 transition-all duration-150"
            style={{
              width: "60px",
              height: "60px",
              transform: `scale(${getUserPulseScale()})`,
              opacity: 0.4 + userVoiceLevel * 0.4,
              filter: `blur(${2 - userVoiceLevel * 2}px)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
