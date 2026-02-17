import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const webPort = Number(process.env.WEB_PORT || 5173);
const apiUrl = process.env.VITE_API_URL;

const normalizeBasePath = (value: string | undefined) => {
  const candidate = (value || '/dashboard').trim();
  const withLeadingSlash = candidate.startsWith('/') ? candidate : `/${candidate}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return `${withoutTrailingSlash || '/'}/`;
};

const appBase = normalizeBasePath(process.env.VITE_BASE_PATH);

export default defineConfig({
  base: appBase,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query']
        }
      }
    }
  },
  server: {
    allowedHosts: ['chess-dashboard.enzogivernaud.fr', 'localhost'],
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
