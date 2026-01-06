import { useEffect } from 'react';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../stores/appStore';

export function useGlobalShortcut() {
  const { shortcut } = useAppStore();

  useEffect(() => {
    let currentShortcut = shortcut;

    const setupShortcut = async () => {
      try {
        await register(currentShortcut, async (event) => {
          if (event.state === 'Pressed') {
            // Only show and focus window - user will click to record
            await invoke('show_and_focus_window');
          }
        });
        console.log(`Global shortcut registered: ${currentShortcut}`);
      } catch (err) {
        console.error('Failed to register shortcut:', err);
      }
    };

    setupShortcut();

    return () => {
      unregister(currentShortcut).catch(console.error);
    };
  }, [shortcut]);
}
