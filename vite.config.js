import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Self-hosted builds serve from the root; GitHub Pages sets BASE_PATH=/invoicio/
export default defineConfig({
  plugins: [vue()],
  base: process.env.BASE_PATH || '/',
  server: {
    proxy: {
      '/api': process.env.API_PROXY || 'http://localhost:3001',
      '/mcp': process.env.API_PROXY || 'http://localhost:3001'
    }
  }
})
