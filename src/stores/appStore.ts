import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { secureStorage } from '../lib/secureStorage';

export interface HistoryItem {
  id: string;
  turkishText: string;
  englishText: string;
  timestamp: number;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', name: 'Auto-detect', nativeName: 'Auto-detect' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
];

interface AppState {
  // Settings
  apiKey: string;
  apiKeyLoaded: boolean;
  sourceLanguage: string;
  outputPrompt: string;
  shortcut: string;
  theme: 'light' | 'dark' | 'system';

  // History
  history: HistoryItem[];

  // Current state
  isRecording: boolean;
  isProcessing: boolean;
  currentTurkish: string;
  currentEnglish: string;
  error: string | null;

  // Actions
  loadApiKey: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  setSourceLanguage: (language: string) => void;
  setOutputPrompt: (promptId: string) => void;
  setShortcut: (shortcut: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setRecording: (isRecording: boolean) => void;
  setProcessing: (isProcessing: boolean) => void;
  setResult: (turkish: string, english: string) => void;
  setError: (error: string | null) => void;
  addToHistory: (turkish: string, english: string) => void;
  clearHistory: () => void;
  clearCurrent: () => void;
}

const HISTORY_LIMIT = 20;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Settings
      apiKey: '',
      apiKeyLoaded: false,
      sourceLanguage: 'tr',
      outputPrompt: 'default-translation',
      shortcut: 'CommandOrControl+Shift+Space',
      theme: 'system',

      // History
      history: [],

      // Current state
      isRecording: false,
      isProcessing: false,
      currentTurkish: '',
      currentEnglish: '',
      error: null,

      // Actions
      loadApiKey: async () => {
        const apiKey = await secureStorage.getApiKey();
        set({ apiKey, apiKeyLoaded: true });
      },
      setApiKey: async (apiKey) => {
        const success = await secureStorage.setApiKey(apiKey);
        if (success) {
          set({ apiKey });
        }
      },
      setSourceLanguage: (sourceLanguage) => set({ sourceLanguage }),
      setOutputPrompt: (outputPrompt) => set({ outputPrompt }),
      setShortcut: (shortcut) => set({ shortcut }),
      setTheme: (theme) => set({ theme }),
      setRecording: (isRecording) => set({ isRecording }),
      setProcessing: (isProcessing) => set({ isProcessing }),
      setResult: (currentTurkish, currentEnglish) =>
        set({ currentTurkish, currentEnglish, error: null }),
      setError: (error) => set({ error, isProcessing: false }),

      addToHistory: (turkishText, englishText) => {
        const newItem: HistoryItem = {
          id: crypto.randomUUID(),
          turkishText,
          englishText,
          timestamp: Date.now(),
        };

        const currentHistory = get().history;
        const newHistory = [newItem, ...currentHistory].slice(0, HISTORY_LIMIT);
        set({ history: newHistory });
      },

      clearHistory: () => set({ history: [] }),

      clearCurrent: () =>
        set({ currentTurkish: '', currentEnglish: '', error: null }),
    }),
    {
      name: 'voice-prompt-storage',
      partialize: (state) => ({
        // Note: apiKey is NOT stored here - it's securely stored in macOS Keychain
        sourceLanguage: state.sourceLanguage,
        outputPrompt: state.outputPrompt,
        shortcut: state.shortcut,
        theme: state.theme,
        history: state.history,
      }),
    }
  )
);
