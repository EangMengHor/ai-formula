import React, { useContext, useEffect } from "react";
import { AudioContext } from "../../../context/AudioContext";
import { CircleStop, Play } from "lucide-react";

const Player = () => {
    const { audioUrl, audioRef, isPlaying, playAudio, stopAudio, setIsPlaying } = useContext(AudioContext);

    useEffect(() => {
        const handleAudioEnd = () => {
            setIsPlaying(false);
            stopAudio(); // Stop audio playback when it ends
        };

        const audioElement = audioRef.current;
        if (audioElement) {
            audioElement.addEventListener("ended", handleAudioEnd);
        }

        return () => {
            if (audioElement) {
                audioElement.removeEventListener("ended", handleAudioEnd);
            }
        };
    }, [audioRef, setIsPlaying, stopAudio]);

    if (!audioUrl) {
        return <></>
    }

    return (
        <div className="text-center">
            <audio ref={audioRef} src={audioUrl} className="mb-4" />
            {isPlaying ? (
                <button
                    onClick={stopAudio}
                    disabled={!isPlaying}
                    className="bg-red-200 text-black p-2 rounded-md"
                >
                    <CircleStop />
                </button>
            ) : (
                <button
                    onClick={playAudio}
                    disabled={isPlaying}
                    className="bg-slate-700 p-2 rounded-md"
                >
                    <Play />
                </button>
            )}
        </div>
    );
};

export default Player;
