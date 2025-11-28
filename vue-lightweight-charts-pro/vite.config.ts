import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
      // Disable rollupTypes to avoid issues with Vue's internal type helpers
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'composables/index': resolve(__dirname, 'src/composables/index.ts'),
        'components/index': resolve(__dirname, 'src/components/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['vue', 'lightweight-charts', 'lightweight-charts-pro-core'],
      output: {
        preserveModules: false,
        globals: {
          vue: 'Vue',
          'lightweight-charts': 'LightweightCharts',
          'lightweight-charts-pro-core': 'LightweightChartsProCore',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
