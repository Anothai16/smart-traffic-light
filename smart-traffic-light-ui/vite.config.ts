import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dynamicImport from 'vite-plugin-dynamic-import'


const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [react({
    babel: {
      plugins: ['babel-plugin-macros']
    }
  }),
  dynamicImport()],
  assetsInclude: ['**/*.md'],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'build'
  },
  server: {
    allowedHosts: true,
    host: true, 
    port: 5173,
    watch: {
      usePolling: true
    },
    proxy: {
      // ✅ 1. Socket.io (ใช้ตัวแปร backendUrl)
      '/socket.io': {
        target: backendUrl,
        ws: true,
        changeOrigin: true,
      },

      // ✅ 2. รูปภาพ (ใช้ตัวแปร backendUrl)
      '/static': {
        target: backendUrl,
        changeOrigin: true,
      },

      // ✅ 3. API หลัก (ใช้ตัวแปร backendUrl)
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
});