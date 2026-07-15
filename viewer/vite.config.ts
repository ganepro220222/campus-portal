import { defineConfig } from 'vite'

/** 部署在 Nginx /craft/ 下；本地 dev 同样带此前缀便于路径一致 */
export default defineConfig({
  base: '/craft/',
  server: {
    host: true,
    port: 5174,
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
    emptyOutDir: true
  }
})
