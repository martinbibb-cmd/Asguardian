import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    base: process.env.CF_PAGES ? '/' : (mode === 'production' ? '/Asguardian/' : '/'),
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test-setup.ts',
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }
})
