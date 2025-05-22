import { LoaderCircle, Mic, MicOff } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { AudioContext } from "../../../context/AudioContext";
import { useToast } from "../../../hooks/use-toast";
import { TTS } from "../../../services/n8n-apis/_core/voiceToText.api";

const AudioRecorder = ({ value, setValue, trigger, setTrigger }) => {
  // Recorder setup
  const { startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder(
    {
      audio: true,
      mimeType: "audio/webm",
      onStop: (blobUrl, blob) => {
        console.log("✅ Recording stopped. Blob URL:", blobUrl);
        if (blobUrl) {
          const file = new File([blob], "recording.webm", { type: blob.type });
          setAudioFile(file);
        } else {
          console.error("❌ No blob URL received.");
        }
      },
    },
  );

  const { setAudioUrl } = useContext(AudioContext);
  const { toast } = useToast();

  // Component state
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Handle transcription
  const onAudioRecorded = async () => {
    if (!audioFile) return;

    console.log("📤 Sending file for transcription:", audioFile);
    setIsTranscribing(true);

    try {
      const response = await TTS(audioFile);
      if (response.success) {
        console.log("✅ Transcription received:", response.data);
        setValue(response.data);
        setTrigger(!trigger);
      } else {
        console.error("❌ Transcription failed:", response.message);
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ API Error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // Debugging mediaBlobUrl
  useEffect(() => {
    console.log("🔄 Current mediaBlobUrl:", mediaBlobUrl);
    if (mediaBlobUrl) {
      setAudioUrl(mediaBlobUrl);
    }
  }, [mediaBlobUrl]);

  // Trigger transcription when file is ready
  useEffect(() => {
    if (audioFile) {
      console.log("🎤 Audio file ready:", audioFile);
      onAudioRecorded();
    }
  }, [audioFile]);

  return (
    <div className="text-center">
      <button
        onClick={async () => {
          if (isTranscribing) return;

          if (isRecording) {
            console.log("⏹️ Stopping recording...");
            setIsRecording(false);
            stopRecording();
          } else {
            console.log("🎙️ Starting recording...");
            setIsRecording(true);
            startRecording();
          }
        }}
        className={`${!isRecording ? "bg-slate-900" : "bg-slate-800 animate-pulse"} hover:bg-slate-800 p-2 rounded-md`}
      >
        {isTranscribing ? (
          <LoaderCircle className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default AudioRecorder;
