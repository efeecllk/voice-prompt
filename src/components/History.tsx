import { useState } from 'react';
import { useAppStore } from '../stores/appStore';

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
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <span>📜</span> History
        </h3>
        <button
          onClick={clearHistory}
          className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm group"
          >
            <div className="flex-1 min-w-0 mr-2">
              <span className="text-gray-500 dark:text-gray-400 truncate block">
                "{item.turkishText}"
              </span>
              <span className="text-gray-400 dark:text-gray-500 mx-1">→</span>
              <span className="text-gray-900 dark:text-gray-100 truncate block">
                "{item.englishText}"
              </span>
            </div>
            <button
              onClick={() => handleCopy(item.id, item.englishText)}
              className={`
                p-1 rounded transition-all flex-shrink-0
                ${copiedId === item.id
                  ? 'text-green-500'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100'
                }
              `}
              title="Copy English"
            >
              {copiedId === item.id ? '✓' : '📋'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
