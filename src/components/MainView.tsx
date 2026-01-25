import Recorder from './Recorder';
import ResultCard from './ResultCard';
import History from './History';
import { useAppStore } from '../stores/appStore';
import { SettingsIcon, AppLogoIcon, FileTextIcon } from './icons';

interface MainViewProps {
  onSettingsClick: () => void;
  onMyPromptsClick: () => void;
}

const RALPH_WIGGUM_ICON = 'https://static.simpsonswiki.com/images/1/14/Ralph_Wiggum.png';

export default function MainView({ onSettingsClick, onMyPromptsClick }: MainViewProps) {
  const { currentTurkish, currentEnglish, error, apiKey, outputPrompt, customOutputFormats } = useAppStore();
  const isRalphMode = outputPrompt === 'ralph-wiggum';

  // Check if a custom output format is selected
  const activeCustomFormat = outputPrompt.startsWith('output-')
    ? customOutputFormats.find(f => f.id === outputPrompt)
    : null;

  // Determine header display
  const getHeaderDisplay = () => {
    if (isRalphMode) {
      return {
        icon: <img src={RALPH_WIGGUM_ICON} alt="Ralph" className="w-6 h-6 rounded object-contain" />,
        title: 'Ralph Mode'
      };
    }
    if (activeCustomFormat) {
      return {
        icon: <span className="text-xl">{activeCustomFormat.icon || '✨'}</span>,
        title: activeCustomFormat.name
      };
    }
    return {
      icon: <AppLogoIcon size={22} className="text-surface-600 dark:text-surface-300" />,
      title: 'Voice Prompt'
    };
  };

  const headerDisplay = getHeaderDisplay();

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-2.5">
          {headerDisplay.icon}
          <span className="text-base font-medium text-surface-800 dark:text-surface-100">
            {headerDisplay.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMyPromptsClick}
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
            title="My Prompts"
          >
            <FileTextIcon size={18} className="text-surface-400 dark:text-surface-500" />
          </button>
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
            title="Settings"
          >
            <SettingsIcon size={18} className="text-surface-400 dark:text-surface-500" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* API Key Warning */}
        {!apiKey && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm text-warning-dark dark:text-warning-light">
            Please add your OpenAI API key in Settings
          </div>
        )}

        {/* Recorder */}
        <Recorder />

        {/* Error */}
        {error && (
          <div className="bg-error/10 border border-error/30 rounded-lg p-3 text-sm text-error-dark dark:text-error-light">
            {error}
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
