import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dynamicImport from 'vite-plugin-dynamic-import'

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
      // ✅ 1. ตั้งค่า Socket.io (สำคัญมาก ถ้าไม่ใส่จะต่อ Socket ไม่ได้)
      '/socket.io': {
        target: 'http://elysia-backend:3000',
        ws: true, // เปิดใช้งาน WebSocket Proxy
        changeOrigin: true,
      },

      // ✅ 2. รูปภาพ
      '/static': {
        target: 'http://elysia-backend:3000',
        changeOrigin: true,
      },

      // ✅ 3. API หลัก (ต้องสอดคล้องกับ VITE_API_URL=/api)
      '/api': {
        target: 'http://elysia-backend:3000',
        changeOrigin: true,
        // สำคัญ: ตัด /api ออกก่อนส่งให้ Backend
        // Frontend ส่ง: /api/auth/login -> Backend รับ: /auth/login
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
});