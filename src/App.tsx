import { useState, useEffect } from 'react';
import MainView from './components/MainView';
import Settings from './components/Settings';
import { useAppStore } from './stores/appStore';

function App() {
  const [view, setView] = useState<'main' | 'settings'>('main');
  const { theme } = useAppStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="h-screen w-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {view === 'main' ? (
        <MainView onSettingsClick={() => setView('settings')} />
      ) : (
        <Settings onBack={() => setView('main')} />
      )}
    </div>
  );
}

export default App;
