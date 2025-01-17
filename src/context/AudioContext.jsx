// AudioContext.js
import React, { createContext, useState, useRef } from "react";

export const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset audio to the beginning
      setIsPlaying(false);
    }
  };

  



  return (
    <AudioContext.Provider
      value={{
        audioUrl,
        setAudioUrl,
        audioRef,
        isPlaying,
        playAudio,
        stopAudio,
        setIsPlaying
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
