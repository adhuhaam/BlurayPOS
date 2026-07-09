import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const adminSrc = path.resolve(__dirname, '../admin-portal/src');
const devApiPort = process.env.DEV_API_PORT || '5147';
const devApiTarget = `http://localhost:${devApiPort}`;

export default defineConfig({
  envDir: path.resolve(__dirname, '../../env'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': adminSrc,
      '@hr': path.resolve(__dirname, './src'),
      '@pos/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
    },
  },
  server: {
    port: 5179,
    host: true,
    proxy: {
      '/api': { target: devApiTarget, changeOrigin: true },
      '/hubs': { target: devApiTarget, changeOrigin: true, ws: true },
    },
  },
});
