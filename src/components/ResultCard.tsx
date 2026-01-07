import { useState } from 'react';
import { CopyIcon, CheckIcon } from './icons';
import { useAppStore, SUPPORTED_LANGUAGES } from '../stores/appStore';

interface ResultCardProps {
  turkish: string;
  english: string;
}

export default function ResultCard({ turkish, english }: ResultCardProps) {
  const [copiedTr, setCopiedTr] = useState(false);
  const [copiedEn, setCopiedEn] = useState(false);
  const sourceLanguage = useAppStore((state) => state.sourceLanguage);

  // Get the display name for the source language
  const sourceLanguageName = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === sourceLanguage
  )?.name || 'Source';

  const handleCopySource = async () => {
    try {
      await navigator.clipboard.writeText(turkish);
      setCopiedTr(true);
      setTimeout(() => setCopiedTr(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyEnglish = async () => {
    try {
      await navigator.clipboard.writeText(english);
      setCopiedEn(true);
      setTimeout(() => setCopiedEn(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
          <p className="text-surface-800 dark:text-surface-100 text-sm leading-relaxed font-medium">{english}</p>
        </div>
      )}
    </div>
  );
}
