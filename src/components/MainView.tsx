import Recorder from './Recorder';
import ResultCard from './ResultCard';
import History from './History';
import { useAppStore } from '../stores/appStore';

interface MainViewProps {
  onSettingsClick: () => void;
}

export default function MainView({ onSettingsClick }: MainViewProps) {
  const { currentTurkish, currentEnglish, error, apiKey } = useAppStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎙️</span>
          <span className="font-semibold">Voice Prompt</span>
        </div>
        <button
          onClick={onSettingsClick}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* API Key Warning */}
        {!apiKey && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Please add your OpenAI API key in Settings
          </div>
        )}

        {/* Recorder */}
        <Recorder />

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
            ❌ {error}
          </div>
        )}

        {/* Result */}
        {(currentTurkish || currentEnglish) && (
          <ResultCard turkish={currentTurkish} english={currentEnglish} />
        )}

        {/* History */}
        <History />
      </div>
    </div>
  );
}
