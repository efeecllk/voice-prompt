import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { invoke } from '@tauri-apps/api/core';
import MainView from './components/MainView';
import { useAppStore } from './stores/appStore';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';

// Lazy load views - not needed at startup
const Settings = lazy(() => import('./components/Settings'));
const MyPrompts = lazy(() => import('./components/MyPrompts'));

function App() {
  const [view, setView] = useState<'main' | 'settings' | 'my-prompts'>('main');
  const { theme, loadApiKey, targetTerminal, setTargetTerminal } = useAppStore();

  // Register global shortcut
  useGlobalShortcut();

  // Load API key from storage on app start
  useEffect(() => {
    loadApiKey();
  }, [loadApiKey]);

  // Detect terminals on app start and auto-select the best one
  // Priority: ghostty > warp > iterm2 > terminal (dev terminals first)
  useEffect(() => {
    invoke<Array<{id: string, name: string, running: boolean}>>('detect_terminals')
      .then((terminals) => {
        const runningTerminals = terminals.filter(t => t.running);
        if (runningTerminals.length === 0) return;

        // If user manually selected a terminal and it's running, keep it
        // But if it's "terminal" (default macOS) and a dev terminal is also running, prefer the dev one
        const devTerminals = runningTerminals.filter(t => t.id !== 'terminal');
        if (devTerminals.length > 0 && (!targetTerminal || targetTerminal === 'terminal')) {
          setTargetTerminal(devTerminals[0].id);
        } else if (!targetTerminal) {
          setTargetTerminal(runningTerminals[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Apply theme based on preference
  const applyTheme = useCallback((isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      // Use system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      // Listen for system theme changes
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme, applyTheme]);

  const renderView = () => {
    if (view === 'main') {
      return (
        <MainView
          onSettingsClick={() => setView('settings')}
          onMyPromptsClick={() => setView('my-prompts')}
        />
      );
    }

    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-surface-300 border-t-surface-600" />
          </div>
        }
      >
        {view === 'settings' && <Settings onBack={() => setView('main')} />}
        {view === 'my-prompts' && <MyPrompts onBack={() => setView('main')} />}
      </Suspense>
    );
  };

  return (
    <div className="h-screen w-screen bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100">
      {renderView()}
    </div>
  );
}

export default App;
