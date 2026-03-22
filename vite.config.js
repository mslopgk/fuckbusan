import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const isDebug = env.VITE_DEBUG === 'true'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 8501,
      ...(isDebug && {
        proxy: {
          '/api': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
        },
      }),
    },
  }
})
