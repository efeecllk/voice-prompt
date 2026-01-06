import { useEffect } from 'react';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { useAppStore } from '../stores/appStore';
import { useAudioRecorder } from './useAudioRecorder';

export function useGlobalShortcut() {
  const { shortcut, isRecording } = useAppStore();
  const { startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    let currentShortcut = shortcut;

    const setupShortcut = async () => {
      try {
        await register(currentShortcut, (event) => {
          if (event.state === 'Pressed') {
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
