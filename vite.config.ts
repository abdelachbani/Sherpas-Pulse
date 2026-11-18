import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteRelayPlugin } from './server/viteRelayPlugin';

// https://vite.dev/config/
export default defineConfig({
  envPrefix: ['VITE_VOICE_', 'VITE_PORT'],
  plugins: [
    react(),
    tailwindcss(),
    viteRelayPlugin(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
  },
});
