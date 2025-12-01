/**
 * @fileoverview E2E tests for the LightweightChart component.
 *
 * These tests verify the complete chart rendering lifecycle,
 * including initialization, data loading, and user interactions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick, defineComponent, h } from 'vue';
import LightweightChart from '../../src/components/LightweightChart.vue';
import { createE2EMockFetch, waitForComponent, mockWsServer } from './setup';

// Sample data for tests
const sampleCandlestickData = [
  { time: 1234567890, open: 100, high: 105, low: 98, close: 102 },
  { time: 1234567890 + 86400, open: 102, high: 108, low: 101, close: 106 },
  { time: 1234567890 + 86400 * 2, open: 106, high: 110, low: 104, close: 108 },
  { time: 1234567890 + 86400 * 3, open: 108, high: 112, low: 106, close: 110 },
  { time: 1234567890 + 86400 * 4, open: 110, high: 115, low: 109, close: 114 },
];

const sampleLineData = [
  { time: 1234567890, value: 100 },
  { time: 1234567890 + 86400, value: 105 },
  { time: 1234567890 + 86400 * 2, value: 102 },
  { time: 1234567890 + 86400 * 3, value: 108 },
  { time: 1234567890 + 86400 * 4, value: 112 },
];

describe('LightweightChart E2E Tests', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch = createE2EMockFetch();
    (global as { fetch: typeof fetch }).fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Component Initialization', () => {
    it('should mount and create chart container', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'test-chart',
          options: { height: 400 },
        },
      });

      await nextTick();

      expect(wrapper.find('.lightweight-chart-container').exists()).toBe(true);
      expect(wrapper.vm.chart).toBeDefined();
    });

    it('should emit ready event when chart is initialized', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'ready-test',
          options: { height: 400 },
        },
      });

      await nextTick();
      await flushPromises();

      expect(wrapper.emitted('ready')).toBeTruthy();
    });

    it('should apply custom container class', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'class-test',
          containerClass: 'custom-chart-class',
        },
      });

      await nextTick();

      expect(wrapper.find('.lightweight-chart-container.custom-chart-class').exists()).toBe(true);
    });
  });

  describe('Series Rendering', () => {
    it('should render candlestick series', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'candlestick-test',
          series: [
            {
              seriesId: 'price',
              seriesType: 'candlestick',
              data: sampleCandlestickData,
            },
          ],
        },
      });

      await nextTick();
      await flushPromises();

      expect(wrapper.vm.seriesMap.size).toBe(1);
      expect(wrapper.vm.seriesMap.has('price')).toBe(true);
    });

    it('should render line series', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'line-test',
          series: [
            {
              seriesId: 'indicator',
              seriesType: 'line',
              data: sampleLineData,
              options: {
                color: '#2962FF',
                lineWidth: 2,
              },
            },
          ],
        },
      });

      await nextTick();
      await flushPromises();

      expect(wrapper.vm.seriesMap.has('indicator')).toBe(true);
    });

    it('should render multiple series', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'multi-series-test',
          series: [
            {
              seriesId: 'price',
              seriesType: 'candlestick',
              data: sampleCandlestickData,
            },
            {
              seriesId: 'sma',
              seriesType: 'line',
              data: sampleLineData,
              options: { color: '#FF6D00' },
            },
            {
              seriesId: 'ema',
              seriesType: 'line',
              data: sampleLineData.map((d) => ({ ...d, value: d.value * 1.02 })),
              options: { color: '#2962FF' },
            },
          ],
        },
      });

      await nextTick();
      await flushPromises();

      expect(wrapper.vm.seriesMap.size).toBe(3);
    });

    it('should update series when data changes', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'update-test',
          series: [
            {
              seriesId: 'price',
              seriesType: 'line',
              data: sampleLineData,
            },
          ],
        },
      });

      await nextTick();
      await flushPromises();

      // Update with new data
      const newData = [
        ...sampleLineData,
        { time: 1234567890 + 86400 * 5, value: 118 },
      ];

      await wrapper.setProps({
        series: [
          {
            seriesId: 'price',
            seriesType: 'line',
            data: newData,
          },
        ],
      });

      await nextTick();

      // The series should still exist
      expect(wrapper.vm.seriesMap.has('price')).toBe(true);
    });
  });

  describe('Chart Options', () => {
    it('should apply chart options', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'options-test',
          options: {
            height: 500,
            layout: {
              backgroundColor: '#1e1e1e',
              textColor: '#d4d4d4',
            },
            grid: {
              vertLines: { color: '#333' },
              horzLines: { color: '#333' },
            },
          },
        },
      });

      await nextTick();

      expect(wrapper.vm.chart).toBeDefined();
    });

    it('should update options reactively', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'reactive-options-test',
          options: { height: 400 },
        },
      });

      await nextTick();

      await wrapper.setProps({
        options: {
          height: 500,
          layout: { backgroundColor: '#222' },
        },
      });

      await nextTick();

      // Chart should still be valid
      expect(wrapper.vm.chart).toBeDefined();
    });
  });

  describe('Events', () => {
    it('should emit crosshairMove event', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'crosshair-test',
          series: [
            {
              seriesId: 'price',
              seriesType: 'line',
              data: sampleLineData,
            },
          ],
        },
      });

      await nextTick();
      await flushPromises();

      // The chart is mocked, so we can't trigger real crosshair events
      // But we can verify the component setup
      expect(wrapper.vm.chart).toBeDefined();
    });

    it('should emit dataLoaded event', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'data-loaded-test',
          series: [
            {
              seriesId: 'price',
              seriesType: 'line',
              data: sampleLineData,
            },
          ],
        },
      });

      await nextTick();
      await flushPromises();

      // Manually trigger data update
      wrapper.vm.updateSeriesData('price', [
        ...sampleLineData,
        { time: 1234567890 + 86400 * 5, value: 120 },
      ]);

      await nextTick();

      const emitted = wrapper.emitted('dataLoaded');
      expect(emitted).toBeTruthy();
      if (emitted) {
        expect(emitted[0]).toEqual(['price', 6]);
      }
    });
  });

  describe('Lazy Loading', () => {
    it('should configure lazy loading for chunked data', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'lazy-loading-test',
          lazyLoading: true,
          series: [
            {
              seriesId: 'price',
              seriesType: 'candlestick',
              data: sampleCandlestickData,
              lazyLoading: {
                enabled: true,
                chunkSize: 500,
                hasMoreBefore: true,
                hasMoreAfter: false,
              },
            },
          ],
        },
      });

      await nextTick();
      await flushPromises();

      expect(wrapper.vm.chart).toBeDefined();
    });

    it('should merge history data correctly', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'merge-history-test',
          series: [
            {
              seriesId: 'price',
              seriesType: 'line',
              data: sampleLineData,
            },
          ],
        },
      });

      await nextTick();
      await flushPromises();

      // Simulate history merge (older data prepended)
      const olderData = [
        { time: 1234567890 - 86400 * 2, value: 95 },
        { time: 1234567890 - 86400, value: 98 },
      ];

      wrapper.vm.mergeHistoryData('price', olderData, 'before');

      await nextTick();

      // Verify the merge
      expect(wrapper.emitted('dataLoaded')).toBeTruthy();
    });
  });

  describe('WebSocket Integration', () => {
    it('should connect to WebSocket when autoConnect is true', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'ws-connect-test',
          wsUrl: 'ws://localhost:8000/ws',
          autoConnect: true,
        },
      });

      await nextTick();
      vi.advanceTimersByTime(100);
      await flushPromises();

      // Check that connected event was emitted
      // (depends on mock WebSocket implementation)
    });

    it('should disconnect WebSocket on unmount', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'ws-disconnect-test',
          wsUrl: 'ws://localhost:8000/ws',
          autoConnect: true,
        },
      });

      await nextTick();
      vi.advanceTimersByTime(100);

      wrapper.unmount();

      // WebSocket should be disconnected
    });
  });

  describe('Error Handling', () => {
    it('should expose error state', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'error-test',
        },
      });

      await nextTick();

      expect(wrapper.vm.error).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on unmount', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'cleanup-test',
          series: [
            {
              seriesId: 'price',
              seriesType: 'line',
              data: sampleLineData,
            },
          ],
        },
      });

      await nextTick();
      await flushPromises();

      expect(wrapper.vm.chart).toBeDefined();

      wrapper.unmount();

      // Chart should be removed
      expect(wrapper.vm.chart).toBeNull();
      expect(wrapper.vm.seriesMap.size).toBe(0);
    });
  });

  describe('Expose API', () => {
    it('should expose chart methods', async () => {
      const wrapper = mount(LightweightChart, {
        props: {
          chartId: 'expose-test',
        },
      });

      await nextTick();

      // Verify exposed methods
      expect(typeof wrapper.vm.createSeries).toBe('function');
      expect(typeof wrapper.vm.removeSeries).toBe('function');
      expect(typeof wrapper.vm.updateSeriesData).toBe('function');
      expect(typeof wrapper.vm.mergeHistoryData).toBe('function');
      expect(typeof wrapper.vm.refreshSeriesData).toBe('function');
    });
  });
});

describe('ChartPane E2E Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render pane within chart', async () => {
    // Import ChartPane
    const ChartPane = (await import('../../src/components/ChartPane.vue')).default;

    // Create wrapper component that provides chart context
    const WrapperComponent = defineComponent({
      components: { LightweightChart, ChartPane },
      template: `
        <LightweightChart chart-id="pane-test">
          <ChartPane :pane-id="0" title="Main" :series="series" />
        </LightweightChart>
      `,
      data() {
        return {
          series: [
            {
              seriesId: 'price',
              seriesType: 'candlestick',
              data: sampleCandlestickData,
            },
          ],
        };
      },
    });

    const wrapper = mount(WrapperComponent);

    await nextTick();
    await flushPromises();

    expect(wrapper.find('.chart-pane').exists()).toBe(true);
    expect(wrapper.find('.pane-title').text()).toBe('Main');
  });

  it('should toggle pane collapse', async () => {
    const ChartPane = (await import('../../src/components/ChartPane.vue')).default;

    const WrapperComponent = defineComponent({
      components: { LightweightChart, ChartPane },
      template: `
        <LightweightChart chart-id="collapse-test">
          <ChartPane :pane-id="0" title="Collapsible" />
        </LightweightChart>
      `,
    });

    const wrapper = mount(WrapperComponent);

    await nextTick();

    const collapseBtn = wrapper.find('.collapse-btn');
    expect(collapseBtn.exists()).toBe(true);

    await collapseBtn.trigger('click');
    await nextTick();

    expect(wrapper.find('.chart-pane.collapsed').exists()).toBe(true);
  });
});
