import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist',
      // Disable rollupTypes to preserve proper module exports
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'plugins/index': resolve(__dirname, 'src/plugins/index.ts'),
        'plugins/band/index': resolve(__dirname, 'src/plugins/band/index.ts'),
        'plugins/ribbon/index': resolve(__dirname, 'src/plugins/ribbon/index.ts'),
        'plugins/gradient-ribbon/index': resolve(__dirname, 'src/plugins/gradient-ribbon/index.ts'),
        'plugins/signal/index': resolve(__dirname, 'src/plugins/signal/index.ts'),
        'plugins/trend-fill/index': resolve(__dirname, 'src/plugins/trend-fill/index.ts'),
        'utils/index': resolve(__dirname, 'src/utils/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['lightweight-charts', 'fancy-canvas'],
      output: {
        preserveModules: false,
        globals: {
          'lightweight-charts': 'LightweightCharts',
          'fancy-canvas': 'FancyCanvas',
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
