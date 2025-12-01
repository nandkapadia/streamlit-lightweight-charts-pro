import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/__tests__/**'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'plugins/index': resolve(__dirname, 'src/plugins/index.ts'),
        'primitives/index': resolve(__dirname, 'src/primitives/index.ts'),
        'series/index': resolve(__dirname, 'src/series/index.ts'),
        'services/index': resolve(__dirname, 'src/services/index.ts'),
        'utils/index': resolve(__dirname, 'src/utils/index.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['lightweight-charts'],
      output: {
        preserveModules: false,
        globals: {
          'lightweight-charts': 'LightweightCharts',
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
