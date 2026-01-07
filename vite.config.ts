import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    // Target modern browsers for smaller bundle
    target: 'esnext',
    // Minify with esbuild (faster) or terser (smaller)
    minify: 'esbuild',
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@headlessui/react'],
          'vendor-state': ['zustand'],
        },
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 500,
  },
  // Pre-bundle dependencies for faster dev startup
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', '@headlessui/react'],
  },
});
