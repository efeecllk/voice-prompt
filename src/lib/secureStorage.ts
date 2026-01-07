import { load } from '@tauri-apps/plugin-store';

const STORE_NAME = 'settings.json';
const API_KEY_KEY = 'apiKey';

// Lazy-loaded store instance
let storeInstance: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (!storeInstance) {
    storeInstance = await load(STORE_NAME);
  }
  return storeInstance;
}

/**
 * Simple storage for settings using Tauri Store plugin
 * Stores data in app data directory as JSON file
 */
export const secureStorage = {
  /**
   * Get the API key from store
   */
  async getApiKey(): Promise<string> {
    try {
      const store = await getStore();
      const key = await store.get<string>(API_KEY_KEY);
      return key || '';
    } catch (error) {
      console.error('Failed to get API key from store:', error);
      return '';
    }
  },

  /**
   * Save the API key to store
   */
  async setApiKey(apiKey: string): Promise<boolean> {
    try {
      const store = await getStore();
      await store.set(API_KEY_KEY, apiKey);
      await store.save();
      return true;
    } catch (error) {
      console.error('Failed to save API key to store:', error);
      return false;
    }
  },

  /**
   * Delete the API key from store
   */
  async deleteApiKey(): Promise<boolean> {
    try {
      const store = await getStore();
      await store.delete(API_KEY_KEY);
      await store.save();
      return true;
    } catch (error) {
      console.error('Failed to delete API key from store:', error);
      return false;
    }
  },
};
