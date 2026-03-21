import { useCallback, useEffect, useRef, useState } from "react";

export default function useStartTTS({
  prompt = "",
  stopState = true,
  onComplete,
} = {}) {
  const [text, setText] = useState(prompt || "");
  const audioRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaSourceRef = useRef(null);
  const abortControllerRef = useRef(null);
  const shouldContinueRef = useRef(true);

  useEffect(() => {
    if (prompt && prompt.trim()) {
      setText(prompt);
    }
  }, [prompt]);

  async function waitForUpdateEnd(sourceBuffer) {
    return new Promise((resolve) =>
      sourceBuffer.addEventListener("updateend", resolve, { once: true }),
    );
  }

  async function forceCleanBuffer(sourceBuffer) {
    if (!sourceBuffer.buffered.length) return false;

    const currentTime = audioRef.current?.currentTime || 0;
    const bufferedStart = sourceBuffer.buffered.start(0);
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

  async function appendChunk(sourceBuffer, chunk) {
    while (sourceBuffer.updating) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (sourceBuffer.buffered.length > 0 && audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const bufferedStart = sourceBuffer.buffered.start(0);
      const bufferedEnd = sourceBuffer.buffered.end(
        sourceBuffer.buffered.length - 1,
      );

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

    let retries = 3;
    while (retries > 0) {
      try {
        sourceBuffer.appendBuffer(chunk);
        await waitForUpdateEnd(sourceBuffer);
        return;
      } catch (err) {
        console.error(`appendBuffer error (retries left: ${retries}):`, err);

        if (err.name === "QuotaExceededError") {
          retries -= 1;
          if (retries > 0) {
            const cleaned = await forceCleanBuffer(sourceBuffer);
            if (!cleaned) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            continue;
          }
        }
        throw err;
      }
    }
  }

  const stopTTS = useCallback(
    ({ triggerComplete = true } = {}) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      shouldContinueRef.current = false;

      if (audioRef.current) {
        audioRef.current.pause();

        if (audioRef.current.src) {
          try {
            URL.revokeObjectURL(audioRef.current.src);
          } catch {
            // Ignore revoke errors.
          }
          audioRef.current.src = "";
        }

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
        setIsLoading(false);

        if (triggerComplete && onComplete) {
          onComplete();
        }
      }
    },
    [onComplete],
  );

  const startTTS = useCallback(
    async (overrideText = null) => {
      shouldContinueRef.current = true;

      // Latest wins: cancel existing stream/audio before starting new one.
      stopTTS({ triggerComplete: false });
      shouldContinueRef.current = true;

      let textToSpeak =
        overrideText !== null && overrideText !== undefined
          ? overrideText
          : text;

      if (
        typeof textToSpeak === "object" &&
        textToSpeak !== null &&
        "nativeEvent" in textToSpeak
      ) {
        textToSpeak = text;
      }

      if (typeof textToSpeak !== "string") {
        textToSpeak = String(textToSpeak ?? "");
      }

      const safeText = textToSpeak;

      if (
        !safeText.trim() ||
        safeText.includes("Sorry, I'm having trouble") ||
        safeText.includes("Error using Audio TTS")
      ) {
        return;
      }

      setIsLoading(true);

      try {
        if (audioRef.current) {
          audioRef.current.pause();
          try {
            URL.revokeObjectURL(audioRef.current.src);
          } catch {
            // Ignore revoke errors.
          }
        }

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;
        const objectUrl = URL.createObjectURL(mediaSource);
        if (audioRef.current) {
          audioRef.current.src = objectUrl;
          audioRef.current.muted = false;
          audioRef.current.volume = 1;
        }

        mediaSource.addEventListener("sourceopen", async () => {
          const mime = "audio/mpeg";
          if (!MediaSource.isTypeSupported(mime)) {
            console.error("MIME type not supported");
            mediaSource.endOfStream();
            return;
          }

          const sourceBuffer = mediaSource.addSourceBuffer(mime);

          const timeUpdateHandler = () => {
            if (!audioRef.current) return;
            if (sourceBuffer.buffered.length > 0 && !sourceBuffer.updating) {
              const currentTime = audioRef.current.currentTime;
              const bufferedStart = sourceBuffer.buffered.start(0);

              if (currentTime - bufferedStart > 10) {
                try {
                  sourceBuffer.remove(bufferedStart, currentTime - 3);
                } catch {
                  // Ignore auto cleanup errors.
                }
              }
            }
          };

          audioRef.current?.addEventListener("timeupdate", timeUpdateHandler);

          try {
            setIsLoading(true);
            const response = await fetch(
              `${import.meta.env.VITE_SOCKET_URL}/api/utils/tts`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Voice-Interface": "true",
                },
                body: JSON.stringify({
                  text: safeText,
                  response_format: "mp3",
                }),
                signal: abortControllerRef.current.signal,
              },
            );

            if (!response.ok || !response.body) {
              throw new Error("TTS request failed");
            }

            const reader = response.body.getReader();
            let bufferStarted = false;

            while (shouldContinueRef.current) {
              const { done, value } = await reader.read();
              if (done) break;

              if (!shouldContinueRef.current) break;

              if (
                !mediaSourceRef.current ||
                mediaSourceRef.current.readyState === "closed"
              ) {
                break;
              }

              try {
                await appendChunk(sourceBuffer, value);
              } catch (err) {
                console.error("Error appending chunk:", err);
                break;
              }

              if (!bufferStarted && sourceBuffer.buffered.length > 0) {
                if (audioRef.current && audioRef.current.paused) {
                  audioRef.current
                    .play()
                    .then(() => setIsPlaying(true))
                    .catch((e) => console.error("Play failed:", e));
                  bufferStarted = true;
                }
              }
            }

            // For short clips, ensure we still attempt playback once stream completes.
            if (
              !bufferStarted &&
              sourceBuffer.buffered.length > 0 &&
              audioRef.current &&
              audioRef.current.paused
            ) {
              audioRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch((e) => console.error("Final play attempt failed:", e));
            }

            if (
              shouldContinueRef.current &&
              mediaSourceRef.current &&
              mediaSourceRef.current.readyState !== "closed"
            ) {
              audioRef.current?.removeEventListener(
                "timeupdate",
                timeUpdateHandler,
              );
              while (sourceBuffer.updating) {
                await new Promise((resolve) => setTimeout(resolve, 50));
              }
              mediaSource.endOfStream();
            }
          } catch (error) {
            if (error.name !== "AbortError") {
              console.error("Error streaming audio:", error);
            }

            audioRef.current?.removeEventListener(
              "timeupdate",
              timeUpdateHandler,
            );
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
        setIsLoading(false);
      }
    },
    [stopTTS, text],
  );

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    if (stopState === false) {
      stopTTS({ triggerComplete: true });
    }
  }, [stopState, stopTTS]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    audioRef,
    startTTS,
    stopTTS,
    isPlaying,
    isLoading,
    handleAudioEnded,
  };
}
