import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const webPort = Number(process.env.WEB_PORT || 5173);
const apiUrl = process.env.VITE_API_URL;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    allowedHosts: ['chess-dashboard.enzogivernaud.fr'],
    host: '0.0.0.0',
    port: webPort,
    proxy: apiUrl
      ? undefined
      : {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true
          },
          '/health': {
            target: 'http://localhost:3001',
            changeOrigin: true
          }
        }
  }
});
