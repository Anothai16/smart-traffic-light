// vite.config.ts (Corrected)

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
  // --- Add this block ---
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8091', // <-- Make sure this is your backend's URL and port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    host: true,
  },
});