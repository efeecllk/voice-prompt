import { useState } from 'react';
import { useAppStore } from '../stores/appStore';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const { apiKey, shortcut, theme, setApiKey, setShortcut, setTheme } = useAppStore();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localShortcut, setLocalShortcut] = useState(shortcut);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    setApiKey(localApiKey);
    setShortcut(localShortcut);
    onBack();
  };

  const shortcutOptions = [
    { value: 'CommandOrControl+Shift+R', label: 'Cmd+Shift+R' },
    { value: 'CommandOrControl+Shift+V', label: 'Cmd+Shift+V' },
    { value: 'CommandOrControl+Shift+M', label: 'Cmd+Shift+M' },
    { value: 'CommandOrControl+Alt+R', label: 'Cmd+Alt+R' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          ←
        </button>
        <span className="font-semibold">Settings</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* API Key */}
        <div>
          <label className="block text-sm font-medium mb-2">
            OpenAI API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Get your API key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:underline"
            >
              platform.openai.com
            </a>
          </p>
        </div>

        {/* Shortcut */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Global Shortcut
          </label>
          <select
            value={localShortcut}
            onChange={(e) => setLocalShortcut(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {shortcutOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`
                flex-1 py-2 px-3 rounded-lg border transition-all
                ${theme === 'light'
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }
              `}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`
                flex-1 py-2 px-3 rounded-lg border transition-all
                ${theme === 'dark'
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }
              `}
            >
              🌙 Dark
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
        >
          Save
        </button>
      </div>
    </div>
  );
}
