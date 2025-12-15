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
    allowedHosts: true,
    host: true, 
    port: 5173, 
    watch: {
      usePolling: true 
    },
    proxy: {
      // ✅ 1. สำหรับรูปภาพ (สำคัญที่สุด! เพื่อแก้ Mixed Content)
      // เมื่อ Frontend เรียก /static/... ให้ส่งไป Backend
      '/static': {
        target: 'http://elysia-backend:3000', 
        changeOrigin: true,
      },

      // ✅ 2. สำหรับ Upload รูป (จำเป็นเพราะเราลบ Base URL ออกแล้ว)
      '/upload': {
        target: 'http://elysia-backend:3000',
        changeOrigin: true,
      },

      // ✅ 3. สำหรับ API อื่นๆ (ถ้าคุณเรียกผ่าน /api)
      '/api': {
        target: 'http://elysia-backend:3000',
        changeOrigin: true,
        // ถ้า Backend คุณไม่ได้ขึ้นต้นด้วย /api ให้ใช้ rewrite ตัดออก
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      
      // (ถ้ามี API Login/Auth อื่นๆ ที่ไม่ได้ขึ้นต้นด้วย /api ให้เพิ่มตรงนี้ได้ครับ)
    },
  },
});