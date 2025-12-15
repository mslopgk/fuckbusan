import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all addresses
    port: 8501,      // Frontend on 8501 as requested
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Backend moved to 8000
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
