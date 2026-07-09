import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const devApiPort = process.env.DEV_API_PORT || '5147';
const devApiTarget = `http://localhost:${devApiPort}`;

export default defineConfig({
  envDir: path.resolve(__dirname, '../../env'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pos/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
    },
  },
  server: {
    port: 5178,
    host: true,
    proxy: {
      '/api': { target: devApiTarget, changeOrigin: true },
    },
  },
});
