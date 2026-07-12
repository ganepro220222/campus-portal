import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/echarts')) return 'echarts'
          if (id.includes('node_modules/@wangeditor')) return 'wangeditor'
          if (id.includes('node_modules/element-plus')) return 'element-plus'
          if (
            id.includes('node_modules/vue/')
            || id.includes('node_modules/vue-router')
            || id.includes('node_modules/pinia')
          ) {
            return 'vue-vendor'
          }
        }
      }
    }
  }
})
