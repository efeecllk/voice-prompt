import { useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

export default function Recorder() {
  const { isRecording, isProcessing, apiKey } = useAppStore();
  const { startRecording, stopRecording } = useAudioRecorder();

  const isDisabled = !apiKey || isProcessing;

  const handleToggle = useCallback(() => {
    if (isProcessing) return;

    if (isRecording) {
      stopRecording();
    } else if (apiKey) {
      startRecording();
    }
  }, [isRecording, isProcessing, apiKey, startRecording, stopRecording]);

  // Space key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && e.target === document.body) {
        e.preventDefault();
        handleToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle]);

  return (
    <div className="flex flex-col items-center py-4">
      <button
        onClick={handleToggle}
        disabled={isDisabled}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center text-3xl
          transition-all duration-200
          ${isDisabled
            ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50'
            : isRecording
              ? 'bg-red-500 hover:bg-red-600 animate-pulse-recording shadow-lg shadow-red-500/30'
              : 'bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/30'
          }
          text-white
        `}
      >
        {isProcessing ? (
          <span className="animate-spin">⏳</span>
        ) : isRecording ? (
          '⏹️'
        ) : (
          '🎤'
        )}
      </button>

      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        {isProcessing
          ? 'Processing...'
          : isRecording
            ? 'Recording... (click to stop)'
            : 'Click to record (or press Space)'}
      </p>
    </div>
  );
}
