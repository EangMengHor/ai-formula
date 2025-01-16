import { Mic, MicOff } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";

const AudioRecorder = () => {
    const {
        startRecording,
        stopRecording,
        mediaBlobUrl,
    } = useReactMediaRecorder({ audio: true, mimeType: "audio/webm" });

    const audioRef = useRef(null); // Reference to the audio element for playback
    const [isPlaying, setIsPlaying] = useState(false); // Track play state
    const [isRecording, setIsRecording] = useState(false); // Track recording state
    const handlePlay = () => {
        if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleStop = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // Reset audio to the beginning
            setIsPlaying(false);
        }
    };

    return (
        <div className="text-center">
            <button
                onClick={() => {
                    if (isRecording) {
                        setIsPlaying(false);
                        setIsRecording(false);
                        stopRecording();
                    } else {
                        setIsPlaying(true);
                        setIsRecording(true);
                        startRecording();
                    }
                }}
            >
                {
                    isRecording ? <Mic /> : <MicOff />
                }
            </button>

            {/* {mediaBlobUrl && (
                <div>
                    <audio ref={audioRef} src={mediaBlobUrl} />
                    <div className="mt-5">
                        <button
                            onClick={handlePlay}
                            disabled={isPlaying}
                            className={`btn ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Play
                        </button>
                        <button
                            onClick={handleStop}
                            disabled={!isPlaying}
                            className={`btn ${!isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Stop
                        </button>
                        <a href={mediaBlobUrl} download="recording.webm" className="btn">
                            Download Audio
                        </a>
                    </div>
                </div>
            )} */}
        </div>
    );
};

const buttonStyle = `m-2 px-4 py-2 text-lg cursor-pointer bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed`;

export default AudioRecorder;
