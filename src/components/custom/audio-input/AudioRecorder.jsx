import { Mic, MicOff } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";
import { AudioContext } from '../../../context/AudioContext';

const AudioRecorder = () => {
    const {
        startRecording,
        stopRecording,
        mediaBlobUrl,
    } = useReactMediaRecorder({ audio: true, mimeType: "audio/webm" });

    const {
        setAudioUrl,
    } = useContext(AudioContext);

    const [isPlaying, setIsPlaying] = useState(false); // Track play state
    const [isRecording, setIsRecording] = useState(false); // Track recording state
    const [audioFile, setAudioFile] = useState(null); // Store the audio file in state

    // Handle mediaBlobUrl changes
    useEffect(() => {
        if (mediaBlobUrl) {
            setAudioUrl(mediaBlobUrl); // Optional: Set URL for external use
            fetch(mediaBlobUrl)
                .then((response) => response.blob())
                .then((blob) => {
                    const file = new File([blob], "recording.webm", { type: blob.type });
                    setAudioFile(file); // Save the file in state
                })
                .catch((error) => console.error("Error fetching audio file:", error));
        }
    }, [mediaBlobUrl, setAudioUrl]);

    useEffect(() => {
        console.log("audioFile", audioFile);
    }, [audioFile]);


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
                className={`${!isRecording ? "bg-slate-700" : "bg-slate-800 animate-pulse"} p-2 rounded-md`}
            >
                {isRecording ? <Mic /> : <MicOff />}
            </button>
            {/* Display audio file information */}
            {audioFile && (
                <div className="mt-4">
                    <p>File Name: {audioFile.name}</p>
                    <p>File Size: {(audioFile.size / 1024).toFixed(2)} KB</p>
                    <audio controls src={URL.createObjectURL(audioFile)} />
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;
