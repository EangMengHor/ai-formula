import React, { useContext } from "react";
import { AudioContext } from "../../../context/AudioContext";

const Player = () => {
    const { audioUrl, audioRef, isPlaying, playAudio, stopAudio } = useContext(AudioContext);

    if (!audioUrl) {
        return <p className="text-center">No audio recorded yet.</p>;
    }

    return (
        <div className="text-center mt-5">
            <h2 className="text-2xl font-bold mb-4">Audio Player</h2>
            <audio ref={audioRef} src={audioUrl} className="mb-4" />
            <button
                onClick={playAudio}
                disabled={isPlaying}
                className={`mx-2 px-4 py-2 text-lg rounded ${isPlaying ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 cursor-pointer'} text-white`}
            >
                Play
            </button>
            <button
                onClick={stopAudio}
                disabled={!isPlaying}
                className={`mx-2 px-4 py-2 text-lg rounded ${!isPlaying ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 cursor-pointer'} text-white`}
            >
                Stop
            </button>
            <a href={audioUrl} download="recording.webm" className="mx-2 px-4 py-2 text-lg rounded bg-blue-500 text-white">
                Download Audio
            </a>
        </div>
    );
};

export default Player;