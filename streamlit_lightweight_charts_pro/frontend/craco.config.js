const path = require('path')
const CompressionPlugin = require('compression-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  webpack: {
    configure: (webpackConfig, {env, paths}) => {
      if (env === 'production') {
        // Enable aggressive tree shaking
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          usedExports: true,
          sideEffects: false,
          minimize: true,
          moduleIds: 'deterministic',
          chunkIds: 'deterministic',
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: false, // Keep console.error and console.warn, remove only via pure_funcs
                  drop_debugger: true,
                  pure_funcs: ['console.log', 'console.info', 'console.debug'],
                  passes: 2,
                  unsafe: true,
                  unsafe_comps: true,
                  unsafe_Function: true,
                  unsafe_math: true,
                  unsafe_proto: true,
                  unsafe_regexp: true,
                  unsafe_undefined: true
                },
                mangle: {
                  safari10: true
                },
                format: {
                  comments: false
                }
              },
              extractComments: false
            })
          ],
          splitChunks: {
            chunks: 'all',
            minSize: 20000,
            maxSize: 200000,
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
                enforce: true
              },
              lightweightCharts: {
                test: /[\\/]node_modules[\\/]lightweight-charts[\\/]/,
                name: 'lightweight-charts',
                chunks: 'all',
                priority: 20,
                enforce: true
              },
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                name: 'react',
                chunks: 'all',
                priority: 30,
                enforce: true
              },
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                priority: 5,
                reuseExistingChunk: true,
                enforce: true
              }
            }
          }
        }

        // Add compression plugin
        webpackConfig.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
            deleteOriginalAssets: false
          })
        )

        // Enable scope hoisting
        webpackConfig.optimization.concatenateModules = true

        // Set production mode explicitly
        webpackConfig.mode = 'production'

        // Optimize module resolution
        webpackConfig.resolve = {
          ...webpackConfig.resolve,
          extensions: ['.tsx', '.ts', '.jsx', '.js'],
          alias: {
            ...webpackConfig.resolve.alias
          }
        }

        // Add bundle analyzer in production
        if (process.env.ANALYZE === 'true') {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: 'bundle-report.html'
            })
          )
        }
      }

      return webpackConfig
    }
  }
}
