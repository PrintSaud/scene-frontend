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
    // ❌ Remove host:true to stop exposing over LAN/IP
    port: 5173,
    proxy: {
      // All frontend calls to /api → backend in dev
      '/api': {
        target: 'http://localhost:4001', // ← match your server.js PORT
        changeOrigin: true,
        secure: false,
      },
      // If you serve socket.io on same backend origin, this helps in some setups:
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

  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
})
