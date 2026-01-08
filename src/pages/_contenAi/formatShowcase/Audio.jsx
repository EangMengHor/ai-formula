import React, { useState, useRef, useEffect } from "react";
import { Download, Play, Pause, LoaderCircle, AudioLines, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";

// Waveform visualization component
function WaveformBars({ isPlaying, progress }) {
  const bars = 35;

  // Generate random heights for bars to simulate waveform
  const [barHeights] = useState(() =>
    Array.from({ length: bars }, () => Math.random() * 0.7 + 0.3),
  );

  return (
    <div className="flex items-center gap-[2px] h-8 flex-1">
      {barHeights.map((height, index) => {
        const barProgress = (index / bars) * 100;
        const isActive = barProgress <= progress;

        return (
          <div
            key={index}
            className={`w-[3px] rounded-full transition-all duration-150 ${
              isActive ? "bg-white" : "bg-white/30"
            } ${isPlaying && isActive ? "animate-pulse" : ""}`}
            style={{
              height: `${height * 100}%`,
              animationDelay: `${index * 30}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

// Format duration to display like "5 Second" or "1 Minute 30 Second"
function formatDuration(seconds) {
  if (isNaN(seconds) || seconds === 0) return "0 Second";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  if (mins === 0) {
    return `${secs} Second`;
  } else if (secs === 0) {
    return `${mins} Minute`;
  } else {
    return `${mins} Minute ${secs} Second`;
  }
}

export default function AudioPlayer({ fileUrl, fileName, onDownload }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoaded(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload();
      return;
    }

    try {
      setIsDownloading(true);
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "audio.mp3";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-gradient-to-tr to-g2 via-g1 from-g1 rounded-3xl p-4 max-w-md w-full ">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={fileUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="flex items-center gap-3">
        {/* Waveform icon and visualization */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Animated waveform icon */}
          <AudioLines />

          {/* File info */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-white text-sm font-medium truncate">
              {fileName || "audio.mp3"}
            </span>
            <span className="text-slate-400 text-xs">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-10 h-10 flex items-center justify-center  hover:bg-slate-700/50 rounded-xl transition-colors"
            title="Download"
          >
            {isDownloading ? (
              <LoaderCircle className="w-5 h-5 text-white animate-spin" />
            ) : (
              <ArrowDownToLine className="w-5 h-5 text-white" />
            )}
          </button>     

          {/* Play/Pause button */}
          <button
            onClick={handlePlayPause}
            className="w-10 h-10 bg-slate-200 hover:bg-white rounded-xl flex items-center justify-center transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-slate-900" fill="currentColor" />
            ) : (
              <Play
                className="w-5 h-5 text-slate-900 ml-0.5"
                fill="currentColor"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
