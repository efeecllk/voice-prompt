import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { HistoryIcon, CopyIcon, CheckIcon, TrashIcon, StarIcon, StarFilledIcon } from './icons';

type Tab = 'history' | 'favorites';

export default function History() {
  const { history, clearHistory, toggleFavorite } = useAppStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('history');
  const timeoutRef = useRef<number | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const favorites = history.filter((item) => item.isFavorite);
  const displayItems = activeTab === 'history' ? history : favorites;

  if (history.length === 0) {
    return null;
  }

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setCopiedId(null);
        timeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="mt-4">
      {/* Tab Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('history')}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all
              ${activeTab === 'history'
                ? 'bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 shadow-sm'
                : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300'
              }
            `}
          >
            <HistoryIcon size={11} />
            History
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all
              ${activeTab === 'favorites'
                ? 'bg-white dark:bg-surface-700 text-warning dark:text-warning-light shadow-sm'
                : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300'
              }
            `}
          >
            <StarFilledIcon size={11} />
            Favorites
            {favorites.length > 0 && (
              <span className="text-[10px] text-surface-400 dark:text-surface-500">
                ({favorites.length})
              </span>
            )}
          </button>
        </div>
        {activeTab === 'history' && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 text-xs text-surface-400 hover:text-error dark:hover:text-error-light transition-colors"
          >
            <TrashIcon size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {displayItems.length === 0 ? (
        <div className="text-center py-6 text-surface-400 dark:text-surface-500">
          <StarIcon size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-xs">No favorites yet</p>
          <p className="text-[10px] mt-1 opacity-75">
            Tap the star on any result to save it
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className={`
                flex items-start justify-between rounded-lg px-3 py-2.5 text-sm group
                ${item.isFavorite
                  ? 'bg-warning/5 dark:bg-warning/10 border border-warning/20'
                  : 'bg-surface-50 dark:bg-surface-800/50'
                }
              `}
            >
              <div className="flex-1 min-w-0 mr-2 space-y-1">
                <p className="text-surface-400 dark:text-surface-500 text-xs truncate">
                  {item.turkishText}
                </p>
                <p className="text-surface-700 dark:text-surface-200 text-xs truncate font-medium">
                  {item.englishText}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className={`
                    p-1.5 rounded-md transition-all flex-shrink-0 mt-0.5
                    ${item.isFavorite
                      ? 'text-warning hover:text-warning/70'
                      : 'text-surface-300 dark:text-surface-600 hover:text-warning opacity-0 group-hover:opacity-100'
                    }
                  `}
                  title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {item.isFavorite ? <StarFilledIcon size={14} /> : <StarIcon size={14} />}
                </button>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
