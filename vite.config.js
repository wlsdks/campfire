import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import compression from 'vite-plugin-compression'
import path from 'path'
import { fileURLToPath } from 'node:url'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Brotli pre-compression — ~15-25% smaller than gzip
    compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
    // Gzip fallback for older clients
    compression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(srcDir),
    },
  },
  // 순수 로직 단위 테스트 (vitest) — node 환경, 빠름. 리팩터 안전망.
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/database'],
          'vendor-motion': ['framer-motion'],
          'vendor-ui': ['lucide-react', 'qrcode.react'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
  },
})
