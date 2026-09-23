import { useEffect } from 'react';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { useAppStore } from '../stores/appStore';

export const TOGGLE_RECORDING_EVENT = 'voice-prompt:toggle-recording';

export function useGlobalShortcut() {
  const { shortcut } = useAppStore();

  useEffect(() => {
    let currentShortcut = shortcut;

    const setupShortcut = async () => {
      try {
        await register(currentShortcut, async (event) => {
          // Record without showing the window: focus stays in the user's app, so the
          // result can be pasted there. Sounds signal start, stop and done.
          if (event.state === 'Pressed') {
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
