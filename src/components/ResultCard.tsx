import { useState } from 'react';

interface ResultCardProps {
  turkish: string;
  english: string;
}

export default function ResultCard({ turkish, english }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(english);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-3">
      {/* Turkish */}
      {turkish && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🇹🇷</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
              Turkish
            </span>
          </div>
          <p className="text-gray-900 dark:text-gray-100">{turkish}</p>
        </div>
      )}

      {/* English */}
      {english && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">🇬🇧</span>
              <span className="text-xs text-primary-600 dark:text-primary-400 uppercase font-medium">
                English
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={`
                p-1.5 rounded-md transition-all
                ${copied
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'hover:bg-primary-100 dark:hover:bg-primary-800/30 text-primary-600 dark:text-primary-400'
                }
              `}
              title={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          <p className="text-gray-900 dark:text-gray-100 font-medium">{english}</p>
        </div>
      )}
    </div>
  );
}
