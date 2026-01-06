import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryItem {
  id: string;
  turkishText: string;
  englishText: string;
  timestamp: number;
}

interface AppState {
  // Settings
  apiKey: string;
  shortcut: string;
  theme: 'light' | 'dark';

  // History
  history: HistoryItem[];

  // Current state
  isRecording: boolean;
  isProcessing: boolean;
  currentTurkish: string;
  currentEnglish: string;
  error: string | null;

  // Actions
  setApiKey: (key: string) => void;
  setShortcut: (shortcut: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
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
      shortcut: 'CommandOrControl+Shift+R',
      theme: 'light',

      // History
      history: [],

      // Current state
      isRecording: false,
      isProcessing: false,
      currentTurkish: '',
      currentEnglish: '',
      error: null,

      // Actions
      setApiKey: (apiKey) => set({ apiKey }),
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
        apiKey: state.apiKey,
        shortcut: state.shortcut,
        theme: state.theme,
        history: state.history,
      }),
    }
  )
);
