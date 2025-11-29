/**
 * Signal Series - Re-exports from lightweight-charts-pro-core
 *
 * This file re-exports the Signal series implementation from the core library.
 * All functionality (ICustomSeries + optional Primitive) is in core.
 *
 * @see lightweight-charts-pro-core/src/plugins/signal/SignalSeries.ts
 */

export {
  SignalSeries,
  SignalSeriesPlugin,
  createSignalSeries,
  defaultSignalOptions,
  type SignalData,
  type SignalSeriesOptions,
} from 'lightweight-charts-pro-core/plugins/signal';
