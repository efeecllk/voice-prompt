import { useRef, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { transcribeAudio, translateToEnglish } from '../lib/openai';

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const {
    apiKey,
    setRecording,
    setProcessing,
    setResult,
    setError,
    addToHistory,
    clearCurrent,
  } = useAppStore();

  const startRecording = useCallback(async () => {
    try {
      clearCurrent();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        if (chunksRef.current.length === 0) {
          setError('No audio recorded');
          return;
        }

        setProcessing(true);

        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

          // Step 1: Transcribe Turkish audio
          const turkishText = await transcribeAudio(audioBlob, apiKey);

          if (!turkishText.trim()) {
            setError('Could not transcribe audio. Please try again.');
            return;
          }

          // Step 2: Translate to English
          const englishText = await translateToEnglish(turkishText, apiKey);

          // Set results and add to history
          setResult(turkishText, englishText);
          addToHistory(turkishText, englishText);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'An error occurred';
          setError(message);
        } finally {
          setProcessing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setRecording(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
    }
  }, [apiKey, clearCurrent, setRecording, setProcessing, setResult, setError, addToHistory]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, [setRecording]);

  return { startRecording, stopRecording };
}
