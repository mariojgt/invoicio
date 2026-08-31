import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Serves from the root by default; set BASE_PATH to host under a subpath
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
