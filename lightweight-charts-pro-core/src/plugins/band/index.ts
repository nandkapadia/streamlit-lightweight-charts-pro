/**
 * @fileoverview Band Series plugin exports
 */

// Export ICustomSeries implementation
export {
  BandSeries,
  BandSeriesPlugin,
  defaultBandOptions,
  type BandData,
  type BandSeriesOptions,
} from './BandSeries';

// Export factory function from plugin wrapper
export { createBandSeries } from './bandSeriesPlugin';
