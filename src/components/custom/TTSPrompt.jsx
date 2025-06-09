import React, { useState, useRef, useEffect } from "react";

const TTSPrompt = ({
  startButton,
  loadingButton,
  StopButton,
  prompt = "dsdf",
}) => {
  const [text, setText] = useState("Error using Audio TTS, please try again.");
  const audioRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaSourceRef = useRef(null);
  const abortControllerRef = useRef(null);
  const shouldContinueRef = useRef(true);

  useEffect(() => {
    setText(prompt);
  });
  // Wait for updateend event helper
  async function waitForUpdateEnd(sourceBuffer) {
    return new Promise((resolve) =>
      sourceBuffer.addEventListener("updateend", resolve, { once: true }),
    );
  }

  // Helper to clean buffer when full
  async function forceCleanBuffer(sourceBuffer) {
    if (!sourceBuffer.buffered.length) return false;

    const currentTime = audioRef.current?.currentTime || 0;
    const bufferedStart = sourceBuffer.buffered.start(0);
    const bufferedEnd = sourceBuffer.buffered.end(
      sourceBuffer.buffered.length - 1,
    );

    // Try aggressive cleaning - remove most of the buffer except last few seconds
    const safePoint = Math.max(currentTime - 3, bufferedStart);

    if (safePoint > bufferedStart) {
      try {
        sourceBuffer.remove(bufferedStart, safePoint);
        await waitForUpdateEnd(sourceBuffer);
        return true;
      } catch (err) {
        console.error("Buffer clean failed:", err);
        return false;
      }
    }
    return false;
  }

  // Helper to sequentially append data with robust error handling
  async function appendChunk(sourceBuffer, chunk) {
    // Wait until not updating
    while (sourceBuffer.updating) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Always try to clean buffer if it's getting large
    if (sourceBuffer.buffered.length > 0 && audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const bufferedStart = sourceBuffer.buffered.start(0);
      const bufferedEnd = sourceBuffer.buffered.end(
        sourceBuffer.buffered.length - 1,
      );

      // More aggressive buffer management - lower threshold to 15 seconds
      const maxBufferSec = 15;
      const removeMarginSec = 3;

      if (
        bufferedEnd - currentTime > maxBufferSec ||
        bufferedEnd - bufferedStart > maxBufferSec * 1.5
      ) {
        try {
          const removalEnd = Math.max(
            currentTime - removeMarginSec,
            bufferedStart,
          );
          if (removalEnd > bufferedStart) {
            sourceBuffer.remove(bufferedStart, removalEnd);
            await waitForUpdateEnd(sourceBuffer);
          }
        } catch (err) {
          console.error("Remove error:", err);
        }
      }
    }

    // Try to append with retries on quota error
    let retries = 3;
    while (retries > 0) {
      try {
        sourceBuffer.appendBuffer(chunk);
        await waitForUpdateEnd(sourceBuffer);
        return; // Success - exit function
      } catch (err) {
        console.error(`appendBuffer error (retries left: ${retries}):`, err);

        // If this is a QuotaExceededError, try aggressive cleanup and retry
        if (err.name === "QuotaExceededError") {
          retries--;
          if (retries > 0) {
            const cleaned = await forceCleanBuffer(sourceBuffer);
            if (!cleaned) {
              // If we couldn't clean, wait for playback to advance
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            continue; // Try append again
          }
        }
        throw err; // Rethrow if not quota error or out of retries
      }
    }
  }

  const stopTTS = () => {
    // Cancel any ongoing fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Signal to the reading loop to stop
    shouldContinueRef.current = false;

    if (audioRef.current) {
      audioRef.current.pause();

      // Clean up media source if it exists
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current.src = "";
      }

      // Reset media source reference
      if (mediaSourceRef.current) {
        try {
          if (mediaSourceRef.current.readyState !== "closed") {
            mediaSourceRef.current.endOfStream();
          }
        } catch (err) {
          console.error("Error closing media source:", err);
        }
        mediaSourceRef.current = null;
      }

      setIsPlaying(false);
      setLoading(false);
    }
  };

  const startTTS = async () => {
    // Reset stop flag
    shouldContinueRef.current = true;

    // Validate non-empty input
    if (!text.trim()) {
      alert("Please enter text to speak.");
      return;
    }

    setLoading(true);

    try {
      // Reset any previous media source URL
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      // Create a new abort controller for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Create a MediaSource and attach it to the audio element
      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;
      const objectUrl = URL.createObjectURL(mediaSource);
      if (audioRef.current) {
        audioRef.current.src = objectUrl;
      }

      mediaSource.addEventListener("sourceopen", async () => {
        // Check that the MIME is supported. We use mp3.
        const mime = "audio/mpeg";
        if (!MediaSource.isTypeSupported(mime)) {
          console.error("MIME type not supported");
          mediaSource.endOfStream();
          return;
        }

        const sourceBuffer = mediaSource.addSourceBuffer(mime);

        // Add timeupdate listener to help with buffer management
        const timeUpdateHandler = () => {
          if (sourceBuffer.buffered.length > 0 && !sourceBuffer.updating) {
            const currentTime = audioRef.current.currentTime;
            const bufferedStart = sourceBuffer.buffered.start(0);

            // Clean old buffer as playback progresses
            if (currentTime - bufferedStart > 10) {
              try {
                sourceBuffer.remove(bufferedStart, currentTime - 3);
              } catch (e) {
                // Ignore errors during auto cleanup
              }
            }
          }
        };

        audioRef.current.addEventListener("timeupdate", timeUpdateHandler);

        try {
          setLoading(true);
          // Call the backend TTS endpoint with response_format "mp3"
          const response = await fetch(
            `${import.meta.env.VITE_SOCKET_URL}/api/utils/tts`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text,
                response_format: "mp3",
                // optionally pass voice, model, instructions if needed
              }),
              signal: abortControllerRef.current.signal, // Add the abort signal
            },
          );
          if (!response.ok || !response.body) {
            throw new Error("TTS request failed");
          }
          const reader = response.body.getReader();

          // Add a small buffer before starting to play
          let bufferStarted = false;

          // Keep reading until done or stopped
          while (shouldContinueRef.current) {
            const { done, value } = await reader.read();
            if (done) break;

            // Check if we should stop (user clicked stop during reading)
            if (!shouldContinueRef.current) break;

            // Don't try to append if the source buffer is gone
            if (
              !mediaSourceRef.current ||
              mediaSourceRef.current.readyState === "closed"
            )
              break;

            try {
              await appendChunk(sourceBuffer, value);
            } catch (err) {
              // If we get an error here, likely the source was closed
              console.error("Error appending chunk:", err);
              break;
            }

            // Start playing after initial buffer is built
            if (
              !bufferStarted &&
              sourceBuffer.buffered.length > 0 &&
              sourceBuffer.buffered.end(0) - sourceBuffer.buffered.start(0) > 1
            ) {
              if (audioRef.current && audioRef.current.paused) {
                audioRef.current
                  .play()
                  .then(() => setIsPlaying(true))
                  .catch((e) => console.error("Play failed:", e));
                bufferStarted = true;
              }
            }
          }

          // Cleanup and finalize only if we reached the end naturally
          if (
            shouldContinueRef.current &&
            mediaSourceRef.current &&
            mediaSourceRef.current.readyState !== "closed"
          ) {
            audioRef.current.removeEventListener(
              "timeupdate",
              timeUpdateHandler,
            );
            while (sourceBuffer.updating) {
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
            mediaSource.endOfStream();
          }
        } catch (error) {
          // Don't show errors for aborted requests
          if (error.name !== "AbortError") {
            console.error("Error streaming audio:", error);
          }

          audioRef.current.removeEventListener("timeupdate", timeUpdateHandler);
          if (
            mediaSourceRef.current &&
            mediaSourceRef.current.readyState !== "closed"
          ) {
            mediaSourceRef.current.endOfStream("network");
          }
        }
      });
    } catch (err) {
      console.error("Fatal TTS error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Add event listener to update isPlaying state when audio ends naturally
  useEffect(() => {
    const handleAudioEnd = () => {
      setIsPlaying(false);
    };

    if (audioRef.current) {
      audioRef.current.addEventListener("ended", handleAudioEnd);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleAudioEnd);
      }
    };
  }, []);

  return (
    <>
      {!isPlaying ? (
        <button onClick={startTTS} disabled={loading} className="h-fit p-0">
          {loading ? loadingButton || "Processing..." : startButton || "Speak"}
        </button>
      ) : (
        <button onClick={stopTTS}>{StopButton || "Stop"}</button>
      )}
      <br />
      <audio
        className="hidden"
        ref={audioRef}
        controls
        onEnded={() => setIsPlaying(false)}
      />
    </>
  );
};

export default TTSPrompt;
