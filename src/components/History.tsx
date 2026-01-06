import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { HistoryIcon, CopyIcon, CheckIcon, TrashIcon } from './icons';

export default function History() {
  const { history, clearHistory } = useAppStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (history.length === 0) {
    return null;
  }

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-surface-400 dark:text-surface-500 flex items-center gap-1.5 uppercase tracking-wider">
          <HistoryIcon size={12} />
          History
        </h3>
        <button
          onClick={clearHistory}
          className="flex items-center gap-1 text-xs text-surface-400 hover:text-error dark:hover:text-error-light transition-colors"
        >
          <TrashIcon size={12} />
          Clear
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between bg-surface-50 dark:bg-surface-800/50 rounded-lg px-3 py-2.5 text-sm group"
          >
            <div className="flex-1 min-w-0 mr-2 space-y-1">
              <p className="text-surface-400 dark:text-surface-500 text-xs truncate">
                {item.turkishText}
              </p>
              <p className="text-surface-700 dark:text-surface-200 text-xs truncate font-medium">
                {item.englishText}
              </p>
            </div>
            <button
              onClick={() => handleCopy(item.id, item.englishText)}
              className={`
                p-1.5 rounded-md transition-all flex-shrink-0 mt-0.5
                ${copiedId === item.id
                  ? 'text-success'
                  : 'text-surface-300 dark:text-surface-600 hover:text-surface-500 dark:hover:text-surface-400 opacity-0 group-hover:opacity-100'
                }
              `}
              title="Copy English"
            >
              {copiedId === item.id ? (
                <CheckIcon size={14} />
              ) : (
                <CopyIcon size={14} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
