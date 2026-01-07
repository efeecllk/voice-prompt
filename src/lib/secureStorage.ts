import { invoke } from '@tauri-apps/api/core';

/**
 * Secure storage for sensitive data using macOS Keychain
 */
export const secureStorage = {
  /**
   * Get the API key from macOS Keychain
   */
  async getApiKey(): Promise<string> {
    try {
      return await invoke<string>('get_api_key');
    } catch (error) {
      console.error('Failed to get API key from keychain:', error);
      return '';
    }
  },

  /**
   * Save the API key to macOS Keychain
   */
  async setApiKey(apiKey: string): Promise<boolean> {
    try {
      // Tauri expects snake_case parameter names matching Rust function signature
      await invoke('set_api_key', { api_key: apiKey });
      return true;
    } catch (error) {
      console.error('Failed to save API key to keychain:', error);
      return false;
    }
  },

  /**
   * Delete the API key from macOS Keychain
   */
  async deleteApiKey(): Promise<boolean> {
    try {
      await invoke('delete_api_key');
      return true;
    } catch (error) {
      console.error('Failed to delete API key from keychain:', error);
      return false;
    }
  },
};
