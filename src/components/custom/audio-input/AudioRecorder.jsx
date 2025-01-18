import { LoaderCircle, Mic, MicOff } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";
import { AudioContext } from '../../../context/AudioContext';
import { useToast } from '../../../hooks/use-toast';
import { TTS } from '../../../services/n8n-apis/_core/voiceToText.api';

const AudioRecorder = ({
    value,
    setValue,
    trigger,
    setTrigger
}) => {

    // global state
    const {
        startRecording,
        stopRecording,
        mediaBlobUrl,
    } = useReactMediaRecorder({ audio: true, mimeType: "audio/webm" });

    const {
        setAudioUrl,
    } = useContext(AudioContext);

    const { toast } = useToast();
    // component state
    const [isPlaying, setIsPlaying] = useState(false); // Track play state
    const [isRecording, setIsRecording] = useState(false); // Track recording state
    const [audioFile, setAudioFile] = useState(null); // Store the audio file in state
    const [isTranscribing, setIsTranscribing] = useState(false); // Track transcription state
    // FN

    const onAudioRecorded = async () => {
        try {
            const response = await TTS(audioFile);
            if (response.success) {
                setValue(response.data);
                setTrigger(!trigger);
            }
            else {
                toast({
                    title: 'Error',
                    description: response.message,
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: "destructive"
            })
        }
    }




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
        if (audioFile) {
            onAudioRecorded();
        }
    }, [audioFile]);




    return (
        <div className="text-center">
            <button
                onClick={async () => {
                    if (isTranscribing) return;
                    if (isRecording) {
                        console.log("giving api audioElement")
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
                {isTranscribing ? <LoaderCircle /> : (isRecording ? <Mic /> : <MicOff />)}
            </button>
            {/* Display audio file information */}
            {/* {audioFile && (
                <div className="mt-4">
                    <p>File Name: {audioFile.name}</p>
                    <p>File Size: {(audioFile.size / 1024).toFixed(2)} KB</p>
                    <audio controls src={URL.createObjectURL(audioFile)} />
                </div>
            )} */}
        </div>
    );
};

export default AudioRecorder;
