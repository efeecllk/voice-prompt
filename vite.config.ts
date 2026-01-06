import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [react(), basicSsl()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    https: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
});
