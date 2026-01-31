import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'use-sync-external-store/shim/with-selector': resolve(__dirname, 'src/shims/use-sync-external-store.ts')
    }
  },
  optimizeDeps: {
    include: ['zustand', 'react'],
    exclude: ['use-sync-external-store']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5174
  }
})
