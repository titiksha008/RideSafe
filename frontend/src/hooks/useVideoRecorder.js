import { useState, useRef, useCallback } from "react";
import authFetch from "../utils/authFetch";

export const useVideoRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [recordings, setRecordings] = useState([]);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const videoPreviewRef = useRef(null);
  const startTimeRef = useRef(null);

  const getStream = useCallback(async (facing) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing },
      audio: true,
    });

    streamRef.current = stream;

    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = stream;
    }

    return stream;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);

    try {
      const stream = await getStream(facingMode);

      chunksRef.current = [];
      startTimeRef.current = new Date();

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const endTime = new Date();
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const name = `recording_${Date.now()}.webm`;

        const duration = Math.floor((endTime - startTimeRef.current) / 1000);

        try {
          const formData = new FormData();

          formData.append("video", blob, name);
          formData.append("date", startTimeRef.current.toLocaleDateString());
          formData.append("startTime", startTimeRef.current.toLocaleTimeString());
          formData.append("endTime", endTime.toLocaleTimeString());
          formData.append("duration", duration);

          await authFetch("/api/video-recordings/upload", {
            method: "POST",
            body: formData,
          });
        } catch (err) {
          console.error("Video upload failed:", err);
        }

        setRecordings((prev) => [
          ...prev,
          { url, name, blob, timestamp: new Date() },
        ]);

        stream.getTracks().forEach((t) => t.stop());

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };

      recorder.start(1000);

      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Camera access denied");
    }
  }, [facingMode, getStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  }, []);

  const flipCamera = useCallback(async () => {
    const newFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);

    if (!isRecording) {
      await getStream(newFacing);
    }
  }, [facingMode, isRecording, getStream]);

  const downloadRecording = (rec) => {
    const a = document.createElement("a");
    a.href = rec.url;
    a.download = rec.name;
    a.click();
  };

  return {
    isRecording,
    recordings,
    error,
    facingMode,
    videoPreviewRef,
    startRecording,
    stopRecording,
    flipCamera,
    downloadRecording,
  };
};