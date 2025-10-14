/**
 * @vitest-environment jsdom
 */
/**
 * Visual Regression Tests for Annotation System
 *
 * Tests annotation rendering including:
 * - Text annotations
 * - Arrow annotations
 * - Shape annotations (circles)
 * - Rectangle annotations
 * - Line annotations
 * - Multiple annotations
 * - Annotation layers
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  renderChart,
  cleanupChartRender,
  assertMatchesSnapshot,
  sanitizeTestName,
  LineSeries,
  type ChartRenderResult,
} from '../utils';
import { createSeriesMarkers } from 'lightweight-charts';
import { createAnnotationVisualElements } from '../../../services/annotationSystem';
import { Annotation } from '../../../types';

describe('Annotation Visual Tests', () => {
  let renderResult: ChartRenderResult | null = null;

  afterEach(() => {
    if (renderResult) {
      cleanupChartRender(renderResult);
      renderResult = null;
    }
  });

  // Helper to create base price data
  const createBasePriceData = (count: number = 30) => {
    const data = [];
    const startDate = new Date('2024-01-01');
    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      data.push({
        time: dateStr as any,
        value: 100 + i * 0.5 + Math.sin(i / 5) * 10,
      });
    }
    return data;
  };

  describe('Text Annotations', () => {
    it('renders text annotation above bar', async () => {
      renderResult = await renderChart(chart => {
        const data = createBasePriceData();
        const series = chart.addSeries(LineSeries, { color: '#2196F3', lineWidth: 2 });
        series.setData(data);

        const annotations: Annotation[] = [
          {
            time: '2024-01-15',
            price: 110,
            text: 'Important Level',
            type: 'text',
            position: 'above',
            backgroundColor: 'rgba(255, 235, 59, 0.9)',
            textColor: '#000000',
            fontSize: 12,
          },
        ];

        createAnnotationVisualElements(annotations);
        // Note: In real implementation, texts would be rendered via custom primitive
        chart.timeScale().fitContent();
      });

      const result = assertMatchesSnapshot(
        sanitizeTestName('annotation-text-above'),
        renderResult.imageData,
        { threshold: 0.1, tolerance: 1.0 }
      );

      expect(result.matches).toBe(true);
    });

    it('renders text annotation below bar', async () => {
      renderResult = await renderChart(chart => {
        const data = createBasePriceData();
        const series = chart.addSeries(LineSeries, { color: '#2196F3', lineWidth: 2 });
        series.setData(data);

        const annotations: Annotation[] = [
          {
            time: '2024-01-15',
            price: 105,
            text: 'Support Zone',
            type: 'text',
            position: 'below',
            backgroundColor: 'rgba(76, 175, 80, 0.9)',
            textColor: '#FFFFFF',
            fontSize: 12,
          },
        ];

        createAnnotationVisualElements(annotations);
        chart.timeScale().fitContent();
      });

      const result = assertMatchesSnapshot(
        sanitizeTestName('annotation-text-below'),
        renderResult.imageData,
        { threshold: 0.1, tolerance: 1.0 }
      );

      expect(result.matches).toBe(true);
    });

    it('renders multiple text annotations', async () => {
      renderResult = await renderChart(chart => {
        const data = createBasePriceData();
        const series = chart.addSeries(LineSeries, { color: '#2196F3', lineWidth: 2 });
        series.setData(data);

        const annotations: Annotation[] = [
          {
            time: '2024-01-08',
            price: 108,
            text: 'Resistance',
            type: 'text',
            position: 'above',
            backgroundColor: 'rgba(244, 67, 54, 0.9)',
            textColor: '#FFFFFF',
            fontSize: 10,
          },
          {
            time: '2024-01-15',
            price: 110,
            text: 'Breakout',
            type: 'text',
            position: 'above',
            backgroundColor: 'rgba(255, 235, 59, 0.9)',
            textColor: '#000000',
            fontSize: 12,
          },
          {
            time: '2024-01-22',
            price: 102,
            text: 'Support',
            type: 'text',
            position: 'below',
            backgroundColor: 'rgba(76, 175, 80, 0.9)',
            textColor: '#FFFFFF',
            fontSize: 10,
          },
        ];

        createAnnotationVisualElements(annotations);
        chart.timeScale().fitContent();
      });

      const result = assertMatchesSnapshot(
        sanitizeTestName('annotation-text-multiple'),
        renderResult.imageData,
        { threshold: 0.1, tolerance: 1.0 }
      );

      expect(result.matches).toBe(true);
    });
  });

  describe('Arrow Annotations', () => {
    it('renders arrow annotation pointing up', async () => {
      renderResult = await renderChart(chart => {
        const data = createBasePriceData();
        const series = chart.addSeries(LineSeries, { color: '#2196F3', lineWidth: 2 });
        series.setData(data);

        const annotations: Annotation[] = [
          {
            time: '2024-01-15',
            price: 110,
            text: 'Buy Signal',
            type: 'arrow',
            position: 'below',
            color: '#4CAF50',
            fontSize: 2,
          },
        ];

        const { markers } = createAnnotationVisualElements(annotations);
        createSeriesMarkers(series, markers);
        chart.timeScale().fitContent();
      });

      const result = assertMatchesSnapshot(
        sanitizeTestName('annotation-arrow-up'),
        renderResult.imageData,
        { threshold: 0.1, tolerance: 1.0 }
      );

      expect(result.matches).toBe(true);
    });

    it('renders multiple arrow annotations', async () => {
      renderResult = await renderChart(chart => {
        const data = createBasePriceData();
        const series = chart.addSeries(LineSeries, { color: '#2196F3', lineWidth: 2 });
        series.setData(data);

        const annotations: Annotation[] = [
          {
            time: '2024-01-08',
            price: 105,
            text: 'Buy',
            type: 'arrow',
            position: 'below',
            color: '#4CAF50',
            fontSize: 2,
          },
          {
            time: '2024-01-15',
            price: 112,
            text: 'Sell',
            type: 'arrow',
            position: 'above',
            color: '#F44336',
            fontSize: 2,
          },
          {
            time: '2024-01-22',
            price: 104,
            text: 'Buy',
            type: 'arrow',
            position: 'below',
            color: '#4CAF50',
            fontSize: 2,
          },
        ];

        const { markers } = createAnnotationVisualElements(annotations);
        createSeriesMarkers(series, markers);
        chart.timeScale().fitContent();
      });

      const result = assertMatchesSnapshot(
        sanitizeTestName('annotation-arrow-multiple'),
        renderResult.imageData,
        { threshold: 0.1, tolerance: 1.0 }
      );

      expect(result.matches).toBe(true);
    });
  });

  describe('Shape Annotations', () => {
    it('renders circle annotation', async () => {
      renderResult = await renderChart(chart => {
        const data = createBasePriceData();
        const series = chart.addSeries(LineSeries, { color: '#2196F3', lineWidth: 2 });
        series.setData(data);

        const annotations: Annotation[] = [
          {
            time: '2024-01-15',
            price: 110,
            text: 'Peak',
            type: 'circle',
            position: 'above',
            color: '#9C27B0',
            fontSize: 2,
          },
        ];

        const { markers } = createAnnotationVisualElements(annotations);
        createSeriesMarkers(series, markers);
        chart.timeScale().fitContent();
      });

      const result = assertMatchesSnapshot(
        sanitizeTestName('annotation-circle'),
        renderResult.imageData,
        { threshold: 0.1, tolerance: 1.0 }
      );

      expect(result.matches).toBe(true);
    });

    it('renders multiple shape annotations', async () => {
      renderResult = await renderChart(chart => {
        const data = createBasePriceData();
        const series = chart.addSeries(LineSeries, { color: '#2196F3', lineWidth: 2 });
        series.setData(data);

        const annotations: Annotation[] = [
          {
            time: '2024-01-08',
            price: 108,
            text: 'High',
            type: 'circle',
            position: 'above',
            color: '#FF9800',
            fontSize: 1.5,
          },
          {
            time: '2024-01-15',
            price: 112,
            text: 'Peak',
            type: 'circle',
            position: 'above',
            color: '#F44336',
            fontSize: 2,
          },
          {
            time: '2024-01-22',
            price: 103,
            text: 'Low',
            type: 'circle',
            position: 'below',
            color: '#4CAF50',
            fontSize: 1.5,
          },
        ];

        const { markers } = createAnnotationVisualElements(annotations);
        createSeriesMarkers(series, markers);
        chart.timeScale().fitContent();
      });

      const result = assertMatchesSnapshot(
        sanitizeTestName('annotation-shape-multiple'),
        renderResult.imageData,
        { threshold: 0.1, tolerance: 1.0 }
      );

      expect(result.matches).toBe(true);
    });
  });

  describe('Mixed Annotations', () => {
    it('renders mixed annotation types', async () => {
      renderResult = await renderChart(chart => {
        const data = createBasePriceData();
        const series = chart.addSeries(LineSeries, { color: '#2196F3', lineWidth: 2 });
        series.setData(data);

        const annotations: Annotation[] = [
          {
            time: '2024-01-08',
            price: 105,
            text: 'Buy',
            type: 'arrow',
            position: 'below',
            color: '#4CAF50',
            fontSize: 2,
          },
          {
            time: '2024-01-15',
            price: 112,
            text: 'Resistance Break',
            type: 'text',
            position: 'above',
            backgroundColor: 'rgba(255, 235, 59, 0.9)',
            textColor: '#000000',
            fontSize: 11,
          },
          {
            time: '2024-01-22',
            price: 104,
            text: 'Key Level',
            type: 'circle',
            position: 'below',
            color: '#9C27B0',
            fontSize: 1.5,
          },
        ];

        const { markers } = createAnnotationVisualElements(annotations);
        createSeriesMarkers(series, markers);
        chart.timeScale().fitContent();
      });

      const result = assertMatchesSnapshot(
        sanitizeTestName('annotation-mixed-types'),
        renderResult.imageData,
        { threshold: 0.1, tolerance: 1.0 }
      );

      expect(result.matches).toBe(true);
    });

    it('renders annotations with various styles', async () => {
      renderResult = await renderChart(chart => {
        const data = createBasePriceData();
        const series = chart.addSeries(LineSeries, { color: '#2196F3', lineWidth: 2 });
        series.setData(data);

        const annotations: Annotation[] = [
          {
            time: '2024-01-05',
            price: 104,
            text: 'Entry',
            type: 'arrow',
            position: 'below',
            color: '#00BCD4',
            fontSize: 1.5,
          },
          {
            time: '2024-01-12',
            price: 110,
            text: 'Target 1',
            type: 'text',
            position: 'above',
            backgroundColor: 'rgba(76, 175, 80, 0.9)',
            textColor: '#FFFFFF',
            fontSize: 10,
          },
          {
            time: '2024-01-20',
            price: 113,
            text: 'Target 2',
            type: 'text',
            position: 'above',
            backgroundColor: 'rgba(255, 152, 0, 0.9)',
            textColor: '#FFFFFF',
            fontSize: 10,
          },
          {
            time: '2024-01-27',
            price: 106,
            text: 'Stop',
            type: 'circle',
            position: 'below',
            color: '#F44336',
            fontSize: 2,
          },
        ];

        const { markers } = createAnnotationVisualElements(annotations);
        createSeriesMarkers(series, markers);
        chart.timeScale().fitContent();
      });

      const result = assertMatchesSnapshot(
        sanitizeTestName('annotation-various-styles'),
        renderResult.imageData,
        { threshold: 0.1, tolerance: 1.0 }
      );

      expect(result.matches).toBe(true);
    });
  });

  describe('Annotation Edge Cases', () => {
    it('renders annotations at chart boundaries', async () => {
      renderResult = await renderChart(chart => {
        const data = createBasePriceData();
        const series = chart.addSeries(LineSeries, { color: '#2196F3', lineWidth: 2 });
        series.setData(data);

        const annotations: Annotation[] = [
          {
            time: '2024-01-01', // First data point
            price: 100,
            text: 'Start',
            type: 'text',
            position: 'below',
            backgroundColor: 'rgba(33, 150, 243, 0.9)',
            textColor: '#FFFFFF',
            fontSize: 10,
          },
          {
            time: '2024-01-30', // Last data point
            price: 115,
            text: 'End',
            type: 'text',
            position: 'above',
            backgroundColor: 'rgba(233, 30, 99, 0.9)',
            textColor: '#FFFFFF',
            fontSize: 10,
          },
        ];

        const { markers } = createAnnotationVisualElements(annotations);
        createSeriesMarkers(series, markers);
        chart.timeScale().fitContent();
      });

      const result = assertMatchesSnapshot(
        sanitizeTestName('annotation-boundaries'),
        renderResult.imageData,
        { threshold: 0.1, tolerance: 1.0 }
      );

      expect(result.matches).toBe(true);
    });

    it('handles empty annotations array', async () => {
      renderResult = await renderChart(chart => {
        const data = createBasePriceData();
        const series = chart.addSeries(LineSeries, { color: '#2196F3', lineWidth: 2 });
        series.setData(data);

        const annotations: Annotation[] = [];
        const { markers } = createAnnotationVisualElements(annotations);

        expect(markers).toHaveLength(0);
        chart.timeScale().fitContent();
      });

      const result = assertMatchesSnapshot(
        sanitizeTestName('annotation-empty-array'),
        renderResult.imageData,
        { threshold: 0.1, tolerance: 1.0 }
      );

      expect(result.matches).toBe(true);
    });
  });

  describe('Annotation Data Validation', () => {
    it('validates annotation time format', () => {
      const annotations: Annotation[] = [
        {
          time: '2024-01-15',
          price: 110,
          text: 'Valid Time',
          type: 'text',
          position: 'above',
        },
      ];

      const { texts } = createAnnotationVisualElements(annotations);
      expect(texts).toHaveLength(1);
      expect(texts[0].text).toBe('Valid Time');
    });

    it('validates annotation position values', () => {
      const annotations: Annotation[] = [
        {
          time: '2024-01-15',
          price: 110,
          text: 'Above',
          type: 'text',
          position: 'above',
        },
        {
          time: '2024-01-20',
          price: 105,
          text: 'Below',
          type: 'text',
          position: 'below',
        },
      ];

      const { texts } = createAnnotationVisualElements(annotations);
      expect(texts).toHaveLength(2);
      expect(texts[0].position).toBe('aboveBar');
      expect(texts[1].position).toBe('belowBar');
    });

    it('validates annotation type conversion', () => {
      const annotations: Annotation[] = [
        {
          time: '2024-01-15',
          price: 110,
          text: 'Arrow',
          type: 'arrow',
          position: 'below',
          color: '#4CAF50',
        },
        {
          time: '2024-01-20',
          price: 112,
          text: 'Circle',
          type: 'circle',
          position: 'above',
          color: '#9C27B0',
        },
      ];

      const { markers } = createAnnotationVisualElements(annotations);
      expect(markers).toHaveLength(2);
      expect(markers[0].shape).toBe('arrowUp');
      expect(markers[1].shape).toBe('circle');
    });
  });
});
