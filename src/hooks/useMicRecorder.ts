import { invoke } from '@tauri-apps/api/core';

// Recording runs natively in Rust (src-tauri/src/recorder.rs): WebKit holds microphone
// requests while the window is hidden, which breaks recording from the global shortcut.
// Callers own their UI state; start() resolves to true once recording has begun, and
// onRecorded fires with the audio after stop().
export function useMicRecorder(
  onRecorded: (audio: Blob) => void,
  onError: (message: string) => void
) {
  const start = async (): Promise<boolean> => {
    try {
      await invoke('start_recording');
      return true;
    } catch (err) {
      onError(String(err));
      return false;
    }
  };

  const stop = () => {
    invoke<ArrayBuffer>('stop_recording')
      .then((wav) => onRecorded(new Blob([wav], { type: 'audio/wav' })))
      .catch((err) => onError(String(err)));
  };

  return { start, stop };
}
