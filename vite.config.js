import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          router: ['react-router-dom'],
          sanitize: ['dompurify'],
          icons: ['lucide-react'],
        },
      },
    },
    // Optimize chunk sizes
    chunkSizeWarningLimit: 600,
    // Minification (esbuild is Vite's default — fast & efficient)
    minify: 'esbuild',
  },
  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '*.config.*'],
    },
  },
})
