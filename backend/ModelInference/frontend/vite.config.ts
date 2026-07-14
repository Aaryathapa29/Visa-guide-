import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // These paths get forwarded to your FastAPI backend automatically
      // So you won't get any CORS errors during development
      '/chat':    { target: 'http://localhost:8000', changeOrigin: true },
      '/upload':  { target: 'http://localhost:8000', changeOrigin: true },
      '/history': { target: 'http://localhost:8000', changeOrigin: true },
      '/health':  { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})