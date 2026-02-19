import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';

const webPort = Number(process.env.WEB_PORT || 5173);
const apiUrl = process.env.VITE_API_URL;

const normalizeBasePath = (value: string | undefined) => {
  const candidate = (value || '/dashboard').trim();
  const withLeadingSlash = candidate.startsWith('/') ? candidate : `/${candidate}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return `${withoutTrailingSlash || '/'}/`;
};

const appBase = normalizeBasePath(process.env.VITE_BASE_PATH);

export default defineConfig(({ mode }) => {
  const analyzeBundle = process.env.ANALYZE === '1' || mode === 'analyze';

  return {
    base: appBase,
    plugins: [
      react(),
      analyzeBundle &&
        visualizer({
          filename: '../../stats-web.html',
          template: 'flamegraph',
          gzipSize: true,
          brotliSize: true,
          open: false
        })
    ],
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
          manualChunks(id) {
            const normalizedId = id.replaceAll('\\', '/');

            if (!normalizedId.includes('/node_modules/')) {
              return undefined;
            }

            if (
              normalizedId.includes('/node_modules/recharts/') ||
              normalizedId.includes('/node_modules/lodash/') ||
              normalizedId.includes('/node_modules/d3-') ||
              normalizedId.includes('/node_modules/victory-vendor/')
            ) {
              return 'charts';
            }

            if (normalizedId.includes('/node_modules/@tanstack/react-query/')) {
              return 'query';
            }

            return 'vendor';
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
  };
});
