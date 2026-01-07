import { useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { useAppStore } from '../stores/appStore';
import { BackIcon, EyeIcon, EyeOffIcon, LockIcon } from './icons';
import LanguageSelect from './LanguageSelect';
import PromptSelect from './PromptSelect';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const { apiKey, sourceLanguage, outputPrompt, shortcut, theme, setApiKey, setSourceLanguage, setOutputPrompt, setShortcut, setTheme } = useAppStore();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localLanguage, setLocalLanguage] = useState(sourceLanguage);
  const [localPrompt, setLocalPrompt] = useState(outputPrompt);
  const [localShortcut, setLocalShortcut] = useState(shortcut);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await setApiKey(localApiKey);
    setSourceLanguage(localLanguage);
    setOutputPrompt(localPrompt);
    setShortcut(localShortcut);
    setIsSaving(false);
    onBack();
  };

  const shortcutOptions = [
    { value: 'CommandOrControl+Shift+Space', label: 'Cmd+Shift+Space' },
    { value: 'CommandOrControl+Alt+Space', label: 'Cmd+Option+Space' },
    { value: 'CommandOrControl+Shift+Period', label: 'Cmd+Shift+.' },
    { value: 'CommandOrControl+Alt+V', label: 'Cmd+Option+V' },
  ];

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200 dark:border-surface-800">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
        >
          <BackIcon size={16} className="text-surface-500 dark:text-surface-400" />
        </button>
        <span className="font-medium text-surface-900 dark:text-surface-100">Settings</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* API Key */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
              OpenAI API Key
            </label>
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <LockIcon size={12} />
              Stored in Keychain
            </span>
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2.5 pr-10 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-200 placeholder:text-surface-300 dark:placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-accent-400/50 focus:border-accent-400"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
            >
              {showKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-surface-400 dark:text-surface-500">
            Get your API key from{' '}
            <button
              type="button"
              onClick={() => open('https://platform.openai.com/api-keys')}
              className="text-accent-500 hover:text-accent-600 dark:text-accent-400 dark:hover:text-accent-300 underline-offset-2 hover:underline"
            >
              platform.openai.com
            </button>
          </p>
        </div>

        {/* Source Language */}
        <div>
          <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
            Source Language
          </label>
          <LanguageSelect value={localLanguage} onChange={setLocalLanguage} />
          <p className="mt-1.5 text-xs text-surface-400 dark:text-surface-500">
            {localLanguage === 'auto'
              ? 'Whisper will automatically detect the language'
              : 'The language you will speak in'}
          </p>
        </div>

        {/* Output Prompt */}
        <div>
          <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
            Output Format
          </label>
          <PromptSelect value={localPrompt} onChange={setLocalPrompt} />
          <p className="mt-1.5 text-xs text-surface-400 dark:text-surface-500">
            How your voice input will be processed
          </p>
        </div>

        {/* Shortcut */}
        <div>
          <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
            Global Shortcut
          </label>
          <div className="grid grid-cols-2 gap-2">
            {shortcutOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLocalShortcut(opt.value)}
                className={`
                  py-2.5 px-3 rounded-lg border text-sm font-medium transition-all
                  ${localShortcut === opt.value
                    ? 'bg-surface-900 dark:bg-surface-100 border-surface-900 dark:border-surface-100 text-white dark:text-surface-900'
                    : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                  }
                `}
              >
                <kbd className="font-mono text-xs">{opt.label}</kbd>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
            Theme
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('system')}
              className={`
                flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all
                ${theme === 'system'
                  ? 'bg-surface-900 dark:bg-surface-100 border-surface-900 dark:border-surface-100 text-white dark:text-surface-900'
                  : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                }
              `}
            >
              System
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`
                flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all
                ${theme === 'light'
                  ? 'bg-surface-900 dark:bg-surface-100 border-surface-900 dark:border-surface-100 text-white dark:text-surface-900'
                  : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                }
              `}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`
                flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all
                ${theme === 'dark'
                  ? 'bg-surface-900 dark:bg-surface-100 border-surface-900 dark:border-surface-100 text-white dark:text-surface-900'
                  : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                }
              `}
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-surface-200 dark:border-surface-800">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-2.5 bg-surface-900 dark:bg-surface-100 hover:bg-surface-800 dark:hover:bg-surface-200 text-white dark:text-surface-900 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
