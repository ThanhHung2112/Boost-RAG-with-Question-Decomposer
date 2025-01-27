"use client";

import { useEffect, useState } from "react";
import Recorder from "recorder-js";
import { FaMicrophone, FaRegStopCircle } from "react-icons/fa";

import { postSingleFile } from "@/shared/api/uploadfiles";

export const VoiceRecord = ({
  syncData,
}: {
  syncData: (blob: Blob) => Promise<void>;
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<Recorder | null>(null);

  const startRecording = () => {
    if (recorder) {
      recorder.start().then(() => setIsRecording(true));
    }
  };

  const uploadRecording = async (recordingFormData: FormData | null) => {
    if (!recordingFormData) {
      console.error("Error uploading recording: recordingFormData is null");

      return;
    }

    try {
      await postSingleFile(recordingFormData);
    } catch (error) {
      console.error("Error uploading recording:", error);
    }
  };

  const stopRecording = (syncData: (blob: Blob) => Promise<void>) => {
    setIsRecording(false);

    if (recorder) {
      recorder.stop().then(({ blob }) => {
        const formData = new FormData();

        formData.append("file", blob, "recording.mp3");

        const syncDataPromise = syncData(blob).catch((err) =>
          console.error("Error syncing data:", err),
        );

        const uploadFilePromise = uploadRecording(formData);

        Promise.all([syncDataPromise, uploadFilePromise]).catch((error) =>
          console.error("Error handling promises:", error),
        );
      });
    }
  };

  useEffect(() => {
    const audioContext = new window.AudioContext();
    const rec = new Recorder(audioContext, {
      onAnalysed: (data) => ({
        analyserData: data,
      }),
    });

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => rec.init(stream))
      .catch((err) => console.error("Unable to get stream:", err));

    setRecorder(rec);
  }, []);

  return (
    <div>
      {isRecording ? (
        <button
          aria-label="Stop recording"
          className="text-gray-300 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
          type="button"
          onClick={() => stopRecording(syncData)}
        >
          <FaRegStopCircle className="w-6 h-6" />
        </button>
      ) : (
        <button
          aria-label="Start recording"
          className="text-gray-300 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
          type="button"
          onClick={startRecording}
        >
          <FaMicrophone className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
