import { useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { MicrophoneIcon, SpinnerIcon } from './icons';

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

  // Space key listener - respects disabled state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && e.target === document.body && !isDisabled) {
        e.preventDefault();
        handleToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle, isDisabled]);

  return (
    <div className="flex flex-col items-center py-6">
      {/* Button container with pulse ring */}
      <div className="relative">
        {/* Animated ring for recording state */}
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-2xl bg-surface-800 dark:bg-surface-200 animate-recording-ring" />
            <span className="absolute inset-[-4px] rounded-2xl bg-surface-600/20 dark:bg-surface-300/20 animate-breathe" />
          </>
        )}

        <button
          onClick={handleToggle}
          disabled={isDisabled}
          className={`
            relative w-16 h-16 flex items-center justify-center
            transition-all duration-300 ease-out
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            ${isDisabled
              ? 'rounded-full bg-surface-100 dark:bg-surface-800 cursor-not-allowed opacity-40 border border-surface-200 dark:border-surface-700'
              : isRecording
                ? 'rounded-2xl bg-surface-900 dark:bg-surface-100 scale-105 shadow-soft-lg'
                : 'rounded-full bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700 shadow-soft-md hover:shadow-soft-lg'
            }
            focus-visible:ring-surface-400
          `}
        >
          {/* Icon states with transitions */}
          {isProcessing ? (
            <SpinnerIcon size={22} className="text-surface-400 dark:text-surface-500" />
          ) : isRecording ? (
            // Stop indicator - rounded square
            <span className="w-5 h-5 rounded bg-surface-100 dark:bg-surface-900 animate-pulse-subtle" />
          ) : (
            // Microphone icon
            <MicrophoneIcon
              size={22}
              className="text-surface-500 dark:text-surface-400 transition-colors"
            />
          )}
        </button>
      </div>

      {/* Status text */}
      <p className="mt-4 text-sm text-surface-400 dark:text-surface-500 text-center">
        {!apiKey
          ? 'Add API key in Settings first'
          : isProcessing
            ? 'Processing...'
            : isRecording
              ? 'Recording... (click to stop)'
              : 'Click to record'}
      </p>

      {/* Keyboard hint */}
      {apiKey && !isProcessing && (
        <p className="mt-1 text-xs text-surface-300 dark:text-surface-600">
          or press <kbd className="px-1.5 py-0.5 bg-surface-100 dark:bg-surface-800 rounded text-surface-500 dark:text-surface-400 font-mono text-[10px]">Space</kbd>
        </p>
      )}
    </div>
  );
}
