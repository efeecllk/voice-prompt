import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import MainView from './components/MainView';
import { useAppStore } from './stores/appStore';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';

// Lazy load views - not needed at startup
const Settings = lazy(() => import('./components/Settings'));
const MyPrompts = lazy(() => import('./components/MyPrompts'));

function App() {
  const [view, setView] = useState<'main' | 'settings' | 'my-prompts'>('main');
  const { theme, loadApiKey } = useAppStore();

  // Register global shortcut
  useGlobalShortcut();

  // Load API key from storage on app start
  useEffect(() => {
    loadApiKey();
  }, [loadApiKey]);

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
