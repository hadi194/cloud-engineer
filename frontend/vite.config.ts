import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server proxies /api/* and /auth/* to the Go backend.
// In production (Docker), Nginx handles this instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api':  { target: 'http://localhost:8080', changeOrigin: true },
      '/auth': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
