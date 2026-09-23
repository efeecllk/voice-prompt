import { useRef } from 'react';

// Shared MediaRecorder plumbing. Callers own their UI state; start() resolves to
// true once recording has begun, and onRecorded fires with the audio after stop().
export function useMicRecorder(
  onRecorded: (audio: Blob) => void,
  onError: (message: string) => void
) {
  const recorderRef = useRef<MediaRecorder | null>(null);

  const start = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (chunks.length === 0) {
          onError('No audio recorded');
        } else {
          onRecorded(new Blob(chunks, { type: 'audio/webm' }));
        }
      };

      recorderRef.current = recorder;
      recorder.start(100); // Collect data every 100ms
      return true;
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to access microphone');
      return false;
    }
  };

  const stop = () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  return { start, stop };
}
