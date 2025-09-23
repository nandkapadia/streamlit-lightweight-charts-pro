import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    global: 'globalThis',
    'import.meta.env': 'undefined',
    'import.meta.hot': 'undefined',
  },
  build: {
    target: 'es2015',
    outDir: 'build',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'static/js/[name].[hash].js',
        chunkFileNames: 'static/js/[name].[hash].js',
        assetFileNames: 'static/css/[name].[hash].[ext]',
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  preview: {
    port: 3000,
  },
})