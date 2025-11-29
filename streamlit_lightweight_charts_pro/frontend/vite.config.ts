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
  esbuild: {
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['lightweight-charts-pro-core'],
  },
  build: {
    target: 'es2020',
    outDir: 'build',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/lightweight-charts-pro-core/, /node_modules/],
    },
    rollupOptions: {
      output: {
        format: 'umd',
        name: 'StreamlitLightweightCharts',
        entryFileNames: 'static/js/[name].[hash].js',
        chunkFileNames: 'static/js/[name].[hash].js',
        assetFileNames: 'static/css/[name].[hash].[ext]',
        inlineDynamicImports: true, // Inline for Streamlit compatibility
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
