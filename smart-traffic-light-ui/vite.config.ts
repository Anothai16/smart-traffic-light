import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dynamicImport from 'vite-plugin-dynamic-import'

export default defineConfig({
  plugins: [react({
    babel: {
      plugins: [
        'babel-plugin-macros'
      ]
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
    proxy: {
      '/api': {
        // ⚠️ แก้ตรงนี้: ชี้ไปหาชื่อ Container Backend และ Port 3000
        target: 'http://elysia-backend:3000', 
        changeOrigin: true,
        // ตัด /api ออกก่อนส่งไป Backend (เช่น /api/auth -> /auth)
        // ถ้า Backend คุณไม่ได้ขึ้นต้นด้วย /api ให้คงบรรทัดนี้ไว้
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    host: true, // อนุญาตให้เข้าถึงได้จากนอก Container
    port: 5173, // กำหนด Port ให้ชัดเจน
    watch: {
      usePolling: true // ช่วยเรื่อง Hot Reload ใน Docker (บางเครื่องจำเป็น)
    }
  },
});