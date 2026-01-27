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

  preview: {
    port: process.env.PORT || 4001,
    allowedHosts: [
      'scene-frontend-production.up.railway.app',
      'scenesa.com',
      'www.scenesa.com',
    ],
  },

  // Fix here — point root to current folder (index.html is here)
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'), // <-- now correct
    },
  },
})