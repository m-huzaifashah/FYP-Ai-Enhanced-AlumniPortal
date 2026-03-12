import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envDir: '..',
  server: {
    port: 5175,
    watch: {
      ignored: ['**/ml/venv/**']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3008',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

