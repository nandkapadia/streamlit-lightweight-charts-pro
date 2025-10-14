/**
 * @fileoverview Tests for SignalSeries plugin
 *
 * Tests the signal series implementation including:
 * - Factory function
 * - Series creation
 * - Data handling
 * - Options management
 * - Primitive integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSignalSeries, SignalData } from '../../plugins/series/signalSeriesPlugin';
import { IChartApi } from 'lightweight-charts';

describe('SignalSeries Plugin', () => {
  let mockChart: any;
  let mockSeries: any;

  beforeEach(() => {
    mockSeries = {
      setData: vi.fn(),
      options: vi.fn(() => ({
        neutralColor: 'rgba(128, 128, 128, 0.1)',
        signalColor: 'rgba(76, 175, 80, 0.2)',
        alertColor: 'rgba(244, 67, 54, 0.2)',
      })),
      applyOptions: vi.fn(),
      attachPrimitive: vi.fn(),
    };

    mockChart = {
      addCustomSeries: vi.fn(() => mockSeries),
      timeScale: vi.fn(() => ({
        coordinateToTime: vi.fn(),
      })),
    } as unknown as IChartApi;
  });

  describe('Factory Function', () => {
    it('should create signal series with default options', () => {
      const series = createSignalSeries(mockChart);

      expect(mockChart.addCustomSeries).toHaveBeenCalled();
      expect(series).toBeDefined();
    });

    it('should apply custom colors', () => {
      createSignalSeries(mockChart, {
        neutralColor: 'rgba(100, 100, 100, 0.1)',
        signalColor: 'rgba(0, 255, 0, 0.2)',
        alertColor: 'rgba(255, 0, 0, 0.2)',
      });

      const call = mockChart.addCustomSeries.mock.calls[0];
      const options = call[1];

      expect(options.neutralColor).toBe('rgba(100, 100, 100, 0.1)');
      expect(options.signalColor).toBe('rgba(0, 255, 0, 0.2)');
      expect(options.alertColor).toBe('rgba(255, 0, 0, 0.2)');
    });

    it('should set _seriesType for identification', () => {
      createSignalSeries(mockChart);

      const call = mockChart.addCustomSeries.mock.calls[0];
      const options = call[1];

      expect(options._seriesType).toBe('Signal');
    });

    it('should configure lastValueVisible based on usePrimitive', () => {
      createSignalSeries(mockChart, { usePrimitive: true });

      const call = mockChart.addCustomSeries.mock.calls[0];
      const options = call[1];

      expect(options.lastValueVisible).toBe(false);
    });

    it('should set default title', () => {
      createSignalSeries(mockChart);

      const call = mockChart.addCustomSeries.mock.calls[0];
      const options = call[1];

      expect(options.title).toBe('Signal');
    });

    it('should allow custom title', () => {
      createSignalSeries(mockChart, {
        title: 'My Signals',
      });

      const call = mockChart.addCustomSeries.mock.calls[0];
      const options = call[1];

      expect(options.title).toBe('My Signals');
    });

    it('should set priceLineVisible to false by default', () => {
      createSignalSeries(mockChart);

      const call = mockChart.addCustomSeries.mock.calls[0];
      const options = call[1];

      expect(options.priceLineVisible).toBe(false);
    });

    it('should set default priceScaleId', () => {
      createSignalSeries(mockChart);

      const call = mockChart.addCustomSeries.mock.calls[0];
      const options = call[1];

      expect(options.priceScaleId).toBe('right');
    });

    it('should allow custom priceScaleId', () => {
      createSignalSeries(mockChart, {
        priceScaleId: 'left',
      });

      const call = mockChart.addCustomSeries.mock.calls[0];
      const options = call[1];

      expect(options.priceScaleId).toBe('left');
    });
  });

  describe('Data Handling', () => {
    it('should set data when provided in options', () => {
      const data: SignalData[] = [
        { time: '2024-01-01' as any, value: 1 },
        { time: '2024-01-02' as any, value: 0 },
        { time: '2024-01-03' as any, value: 2 },
      ];

      createSignalSeries(mockChart, { data });

      expect(mockSeries.setData).toHaveBeenCalledWith(data);
    });

    it('should not call setData when data is empty', () => {
      createSignalSeries(mockChart, { data: [] });

      expect(mockSeries.setData).not.toHaveBeenCalled();
    });

    it('should not call setData when data is not provided', () => {
      createSignalSeries(mockChart);

      expect(mockSeries.setData).not.toHaveBeenCalled();
    });

    it('should handle data with different signal values', () => {
      const data: SignalData[] = [
        { time: '2024-01-01' as any, value: 0 }, // neutral
        { time: '2024-01-02' as any, value: 1 }, // signal
        { time: '2024-01-03' as any, value: 2 }, // alert
        { time: '2024-01-04' as any, value: 0 }, // back to neutral
      ];

      createSignalSeries(mockChart, { data });

      expect(mockSeries.setData).toHaveBeenCalledWith(data);
      expect(data).toHaveLength(4);
    });

    it('should handle data with custom colors', () => {
      const data: SignalData[] = [
        { time: '2024-01-01' as any, value: 1, color: '#FF0000' },
        { time: '2024-01-02' as any, value: 2, color: '#00FF00' },
      ];

      createSignalSeries(mockChart, { data });

      expect(mockSeries.setData).toHaveBeenCalledWith(data);
    });
  });

  describe('Primitive Integration', () => {
    it('should not attach primitive when usePrimitive is false', () => {
      createSignalSeries(mockChart, { usePrimitive: false });

      expect(mockSeries.attachPrimitive).not.toHaveBeenCalled();
    });

    it('should attach primitive when usePrimitive is true', async () => {
      createSignalSeries(mockChart, { usePrimitive: true });

      // Wait for dynamic import
      await vi.waitFor(() => {
        expect(mockSeries.attachPrimitive).toHaveBeenCalled();
      });
    });

    it('should set _usePrimitive flag', () => {
      createSignalSeries(mockChart, { usePrimitive: true });

      const call = mockChart.addCustomSeries.mock.calls[0];
      const options = call[1];

      expect(options._usePrimitive).toBe(true);
    });
  });

  describe('Series Options', () => {
    it('should respect visible option', () => {
      createSignalSeries(mockChart, { visible: false });

      const call = mockChart.addCustomSeries.mock.calls[0];
      const options = call[1];

      expect(options.visible).toBe(false);
    });

    it('should default visible to true', () => {
      createSignalSeries(mockChart);

      const call = mockChart.addCustomSeries.mock.calls[0];
      const options = call[1];

      expect(options.visible).toBe(true);
    });

    it('should return series API', () => {
      const series = createSignalSeries(mockChart);

      expect(series).toBe(mockSeries);
      expect(series.setData).toBeDefined();
      expect(series.options).toBeDefined();
    });
  });

  describe('Signal Values', () => {
    it('should handle neutral signal (0)', () => {
      const data: SignalData[] = [{ time: '2024-01-01' as any, value: 0 }];

      createSignalSeries(mockChart, { data });

      expect(mockSeries.setData).toHaveBeenCalledWith(data);
    });

    it('should handle positive signal (1)', () => {
      const data: SignalData[] = [{ time: '2024-01-01' as any, value: 1 }];

      createSignalSeries(mockChart, { data });

      expect(mockSeries.setData).toHaveBeenCalledWith(data);
    });

    it('should handle alert signal (2)', () => {
      const data: SignalData[] = [{ time: '2024-01-01' as any, value: 2 }];

      createSignalSeries(mockChart, { data });

      expect(mockSeries.setData).toHaveBeenCalledWith(data);
    });

    it('should handle mixed signals', () => {
      const data: SignalData[] = [
        { time: '2024-01-01' as any, value: 0 },
        { time: '2024-01-02' as any, value: 1 },
        { time: '2024-01-03' as any, value: 2 },
        { time: '2024-01-04' as any, value: 0 },
        { time: '2024-01-05' as any, value: 1 },
      ];

      createSignalSeries(mockChart, { data });

      expect(mockSeries.setData).toHaveBeenCalledWith(data);
      expect(data).toHaveLength(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty chart gracefully', () => {
      expect(() => createSignalSeries(mockChart)).not.toThrow();
    });

    it('should handle undefined options', () => {
      expect(() => createSignalSeries(mockChart, undefined)).not.toThrow();
    });

    it('should handle null data', () => {
      expect(() => createSignalSeries(mockChart, { data: null as any })).not.toThrow();
    });

    it('should combine multiple options correctly', () => {
      const data: SignalData[] = [{ time: '2024-01-01' as any, value: 1 }];

      createSignalSeries(mockChart, {
        neutralColor: 'rgba(50, 50, 50, 0.1)',
        signalColor: 'rgba(0, 200, 0, 0.2)',
        alertColor: 'rgba(200, 0, 0, 0.2)',
        title: 'Custom Signals',
        visible: true,
        priceScaleId: 'left',
        data,
      });

      const call = mockChart.addCustomSeries.mock.calls[0];
      const options = call[1];

      expect(options.neutralColor).toBe('rgba(50, 50, 50, 0.1)');
      expect(options.signalColor).toBe('rgba(0, 200, 0, 0.2)');
      expect(options.alertColor).toBe('rgba(200, 0, 0, 0.2)');
      expect(options.title).toBe('Custom Signals');
      expect(options.visible).toBe(true);
      expect(options.priceScaleId).toBe('left');
      expect(mockSeries.setData).toHaveBeenCalledWith(data);
    });
  });

  describe('Return Value', () => {
    it('should return the series instance', () => {
      const series = createSignalSeries(mockChart);

      expect(series).toBeDefined();
      expect(series).toBe(mockSeries);
    });

    it('should allow chaining setData calls', () => {
      const series = createSignalSeries(mockChart);
      const data: SignalData[] = [{ time: '2024-01-01' as any, value: 1 }];

      series.setData(data);

      expect(series.setData).toHaveBeenCalledWith(data);
    });

    it('should allow accessing options', () => {
      const series = createSignalSeries(mockChart);
      const options = series.options();

      expect(options).toBeDefined();
      expect(options.neutralColor).toBeDefined();
      expect(options.signalColor).toBeDefined();
      expect(options.alertColor).toBeDefined();
    });
  });
});
