import { useState, useEffect } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

// Checks the latest GitHub release once at startup; renders nothing unless a newer
// signed build exists.
export default function UpdateBanner() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    check().then(setUpdate).catch((err) => console.error('Update check failed:', err));
  }, []);

  if (!update) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await update.downloadAndInstall();
      await relaunch();
    } catch (err) {
      console.error('Update failed:', err);
      setInstalling(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 bg-accent-50 dark:bg-accent-900/20 border-b border-accent-200/50 dark:border-accent-800/30 text-xs">
      <span className="text-surface-700 dark:text-surface-200">Version {update.version} is available</span>
      <button
        onClick={handleInstall}
        disabled={installing}
        className="px-2.5 py-1 rounded-md bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 font-medium disabled:opacity-50"
      >
        {installing ? 'Updating…' : 'Update & restart'}
      </button>
    </div>
  );
}
