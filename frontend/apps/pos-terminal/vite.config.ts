import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Enterprise POS Terminal',
        short_name: 'POS',
        description: 'Enterprise Point of Sale Terminal',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@pos/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@pos/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
      '@pos/offline-sync': path.resolve(__dirname, '../../packages/offline-sync/src'),
    },
  },
  server: { port: 5173 },
});
