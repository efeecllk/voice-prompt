import { invoke } from '@tauri-apps/api/core';

export async function sendToTerminal(text: string, terminal: string, autoSubmit: boolean) {
  await invoke('copy_text', { text });
  // Hide Voice Prompt window so it doesn't steal focus from the terminal
  await invoke('hide_window');
  await invoke('send_to_terminal', { terminal, autoSubmit });
}
