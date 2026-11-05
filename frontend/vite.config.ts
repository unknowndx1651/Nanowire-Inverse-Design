import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Dev server only: where /api requests are forwarded. BACKEND_URL has no
  // VITE_ prefix, so it is never exposed to the browser bundle.
  const env = loadEnv(mode, '.', '')
  const backend = env.BACKEND_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
          // The backend has no /api prefix: /api/simulate -> /simulate
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})