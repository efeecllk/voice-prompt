import { useState, useEffect } from 'react';
import MainView from './components/MainView';
import Settings from './components/Settings';
import { useAppStore } from './stores/appStore';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';

function App() {
  const [view, setView] = useState<'main' | 'settings'>('main');
  const { theme, loadApiKey } = useAppStore();

  // Register global shortcut
  useGlobalShortcut();

  // Load API key from macOS Keychain on app start
  useEffect(() => {
    loadApiKey();
  }, [loadApiKey]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="h-screen w-screen bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100">
      {view === 'main' ? (
        <MainView onSettingsClick={() => setView('settings')} />
      ) : (
        <Settings onBack={() => setView('main')} />
      )}
    </div>
  );
}

export default App;
