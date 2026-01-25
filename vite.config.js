import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Dev server
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:4001',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Preview (vite preview) — prod-like
  preview: {
    port: process.env.PORT || 4001,
    allowedHosts: [
      'scene-frontend-production.up.railway.app',
      'scenesa.com',
      'www.scenesa.com',
    ],
  },

  // ✅ Change here: build from src/
  root: path.resolve(__dirname, 'src'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/index.html'), // entrypoint inside src
    },
  },
})