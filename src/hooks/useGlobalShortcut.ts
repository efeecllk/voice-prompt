import { useEffect } from 'react';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useAppStore } from '../stores/appStore';
import { useAudioRecorder } from './useAudioRecorder';

export function useGlobalShortcut() {
  const { shortcut } = useAppStore();
  const { startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    let currentShortcut = shortcut;

    const setupShortcut = async () => {
      try {
        await register(currentShortcut, async (event) => {
          if (event.state === 'Pressed') {
            // First, show and focus the window
            const window = getCurrentWindow();
            await window.show();
            await window.setFocus();

            // Then handle recording
            const store = useAppStore.getState();
            if (store.isRecording) {
              stopRecording();
            } else if (!store.isProcessing && store.apiKey) {
              startRecording();
            }
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
  }, [shortcut, startRecording, stopRecording]);
}
