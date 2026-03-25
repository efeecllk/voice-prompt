import { useState, useRef, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CopyIcon, CheckIcon, StarIcon, StarFilledIcon, SendIcon } from './icons';
import { useAppStore, SUPPORTED_LANGUAGES } from '../stores/appStore';

interface ResultCardProps {
  turkish: string;
  english: string;
}

export default function ResultCard({ turkish, english }: ResultCardProps) {
  const [copiedTr, setCopiedTr] = useState(false);
  const [copiedEn, setCopiedEn] = useState(false);
  const { sourceLanguage, history, toggleFavorite, targetTerminal } = useAppStore();
  const [sentToTerminal, setSentToTerminal] = useState(false);
  const [terminalError, setTerminalError] = useState<string | null>(null);
  const sourceTimeoutRef = useRef<number | null>(null);
  const englishTimeoutRef = useRef<number | null>(null);
  const terminalTimeoutRef = useRef<number | null>(null);

  // Find if current result is in history and favorited
  const currentHistoryItem = useMemo(() => {
    return history.find(
      (item) => item.turkishText === turkish && item.englishText === english
    );
  }, [history, turkish, english]);

  const isFavorited = currentHistoryItem?.isFavorite ?? false;

  const handleToggleFavorite = () => {
    if (currentHistoryItem) {
      toggleFavorite(currentHistoryItem.id);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (sourceTimeoutRef.current) clearTimeout(sourceTimeoutRef.current);
      if (englishTimeoutRef.current) clearTimeout(englishTimeoutRef.current);
      if (terminalTimeoutRef.current) clearTimeout(terminalTimeoutRef.current);
    };
  }, []);

  // Get the display name for the source language
  const sourceLanguageName = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === sourceLanguage
  )?.name || 'Source';

  const handleCopySource = async () => {
    try {
      await navigator.clipboard.writeText(turkish);
      setCopiedTr(true);

      if (sourceTimeoutRef.current) clearTimeout(sourceTimeoutRef.current);
      sourceTimeoutRef.current = window.setTimeout(() => {
        setCopiedTr(false);
        sourceTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyEnglish = async () => {
    try {
      await navigator.clipboard.writeText(english);
      setCopiedEn(true);

      if (englishTimeoutRef.current) clearTimeout(englishTimeoutRef.current);
      englishTimeoutRef.current = window.setTimeout(() => {
        setCopiedEn(false);
        englishTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSendToTerminal = async (text: string) => {
    try {
      setTerminalError(null);
      await navigator.clipboard.writeText(text);

      const terminalNames: Record<string, string> = {
        ghostty: 'Ghostty',
        warp: 'Warp',
        terminal: 'Terminal',
        iterm2: 'iTerm2',
      };

      const appName = terminalNames[targetTerminal];
      if (!appName) {
        setTerminalError('No terminal selected');
        return;
      }

      // Hide Voice Prompt window so it doesn't steal focus from the terminal
      await invoke('hide_window');
      await invoke('send_to_terminal', { appName, autoSubmit: false });

      setSentToTerminal(true);
      if (terminalTimeoutRef.current) clearTimeout(terminalTimeoutRef.current);
      terminalTimeoutRef.current = window.setTimeout(() => {
        setSentToTerminal(false);
        terminalTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to send to terminal:', message);
      setTerminalError(message);
      setTimeout(() => setTerminalError(null), 5000);
    }
  };

  return (
    <div className="space-y-3">
      {/* Source Language */}
      {turkish && (
        <div className="bg-surface-100/50 dark:bg-surface-800 rounded-lg p-3 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] tracking-wider text-surface-400 dark:text-surface-500 uppercase font-semibold">
              {sourceLanguageName}
            </span>
            <div className="flex items-center gap-1">
              {currentHistoryItem && (
                <button
                  onClick={handleToggleFavorite}
                  className={`
                    p-1 rounded transition-all duration-200
                    ${isFavorited
                      ? 'text-warning opacity-100'
                      : 'text-surface-300 dark:text-surface-600 hover:text-warning opacity-0 group-hover:opacity-100'
                    }
                  `}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorited ? <StarFilledIcon size={12} /> : <StarIcon size={12} />}
                </button>
              )}
              <button
                onClick={handleCopySource}
                className={`
                  p-1 rounded transition-all duration-200
                  ${copiedTr
                    ? 'text-success opacity-100'
                    : 'text-surface-300 dark:text-surface-600 hover:text-surface-400 dark:hover:text-surface-500 opacity-0 group-hover:opacity-100'
                  }
                `}
                title={copiedTr ? 'Copied!' : `Copy ${sourceLanguageName}`}
              >
                {copiedTr ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              </button>
            </div>
          </div>
          <p className="text-surface-600 dark:text-surface-300 text-sm leading-relaxed">{turkish}</p>
        </div>
      )}

      {/* English */}
      {english && (
        <div className="bg-accent-50/50 dark:bg-accent-900/10 border border-accent-200/50 dark:border-accent-800/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] tracking-wider text-accent-500 dark:text-accent-400 uppercase font-semibold">
              English
            </span>
            <div className="flex items-center gap-1">
              {targetTerminal && (
                <button
                  onClick={() => handleSendToTerminal(english)}
                  className={`
                    p-1.5 rounded-md transition-all duration-200
                    ${sentToTerminal
                      ? 'bg-success/10 text-success'
                      : 'hover:bg-accent-100 dark:hover:bg-accent-800/20 text-accent-400 dark:text-accent-500'
                    }
                  `}
                  title={sentToTerminal ? 'Sent!' : 'Send to terminal'}
                >
                  {sentToTerminal ? (
                    <CheckIcon size={14} />
                  ) : (
                    <SendIcon size={14} />
                  )}
                </button>
              )}
              <button
                onClick={handleCopyEnglish}
                className={`
                  p-1.5 rounded-md transition-all duration-200
                  ${copiedEn
                    ? 'bg-success/10 text-success'
                    : 'hover:bg-accent-100 dark:hover:bg-accent-800/20 text-accent-400 dark:text-accent-500'
                  }
                `}
                title={copiedEn ? 'Copied!' : 'Copy to clipboard'}
              >
                {copiedEn ? (
                  <CheckIcon size={14} />
                ) : (
                  <CopyIcon size={14} />
                )}
              </button>
            </div>
          </div>
          <p className="text-surface-800 dark:text-surface-100 text-sm leading-relaxed font-medium">{english}</p>
          {terminalError && (
            <div className="mt-2 text-xs text-error bg-error/10 rounded px-2 py-1">
              Terminal: {terminalError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
