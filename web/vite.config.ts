/// <reference types="vitest/config" />
import type { ServerResponse } from 'node:http'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { ProxyOptions } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // When MSW is on, do not proxy /api — a down Nest was surfacing as HTTP 500
  // ("Unable to load data") whenever the service worker bypassed a request.
  const useMockApi = env.VITE_ENABLE_MOCK_API !== 'false'

  const nestProxy: Record<string, string | ProxyOptions> | undefined = useMockApi
    ? undefined
    : {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          configure(proxy) {
            proxy.on('error', (_err, _req, res) => {
              const response = res as ServerResponse | undefined
              if (response && !response.headersSent) {
                response.writeHead(502, { 'Content-Type': 'application/json' })
                response.end(
                  JSON.stringify({
                    statusCode: 502,
                    message: 'API server is unreachable. Start the Nest backend on :3000.',
                    error: 'Bad Gateway',
                    code: 'API_UNREACHABLE',
                  }),
                )
              }
            })
          },
        },
        '/socket.io': {
          target: 'http://127.0.0.1:3000',
          ws: true,
          changeOrigin: true,
        },
      }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: nestProxy,
    },
    build: {
      target: 'es2022',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            query: ['@tanstack/react-query'],
            table: ['@tanstack/react-table'],
            charts: ['recharts'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    },
  }
})
