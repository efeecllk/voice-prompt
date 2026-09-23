import { useEffect } from 'react';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../stores/appStore';

export const TOGGLE_RECORDING_EVENT = 'voice-prompt:toggle-recording';

export function useGlobalShortcut() {
  const { shortcut } = useAppStore();

  useEffect(() => {
    let currentShortcut = shortcut;

    const setupShortcut = async () => {
      try {
        await register(currentShortcut, async (event) => {
          if (event.state === 'Pressed') {
            await invoke('show_and_focus_window');
            window.dispatchEvent(new Event(TOGGLE_RECORDING_EVENT));
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
