/**
 * @fileoverview Comprehensive tests for annotation system
 *
 * Tests cover:
 * - createAnnotationVisualElements - converting annotations to visual elements
 * - filterAnnotationsByTimeRange - time-based filtering
 * - filterAnnotationsByPriceRange - price-based filtering
 * - createAnnotationLayer - layer creation
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAnnotationVisualElements,
  filterAnnotationsByTimeRange,
  filterAnnotationsByPriceRange,
  createAnnotationLayer,
} from '../../services/annotationSystem';
import { Annotation } from '../../types';

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
}));

describe('Annotation System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAnnotationVisualElements', () => {
    describe('Arrow annotations', () => {
      it('should create marker for arrow annotation', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Buy Signal',
            type: 'arrow',
            position: 'above',
            color: '#00FF00',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.markers).toHaveLength(1);
        expect(result.markers[0].position).toBe('aboveBar');
        expect(result.markers[0].color).toBe('#00FF00');
        expect(result.markers[0].shape).toBe('arrowUp');
        expect(result.markers[0].text).toBe('Buy Signal');
        expect(result.shapes).toHaveLength(0);
        expect(result.texts).toHaveLength(0);
      });

      it('should create marker below bar for below position', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Sell Signal',
            type: 'arrow',
            position: 'below',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.markers[0].position).toBe('belowBar');
      });

      it('should use default color for arrow without color', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Signal',
            type: 'arrow',
            position: 'above',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.markers[0].color).toBe('#2196F3');
      });

      it('should use fontSize as marker size', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Signal',
            type: 'arrow',
            position: 'above',
            fontSize: 2,
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.markers[0].size).toBe(2);
      });

      it('should default fontSize to 1 when not specified', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Signal',
            type: 'arrow',
            position: 'above',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.markers[0].size).toBe(1);
      });
    });

    describe('Shape and Circle annotations', () => {
      it('should create circle marker for shape annotation', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Important Point',
            type: 'shape',
            position: 'above',
            color: '#FF0000',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.markers).toHaveLength(1);
        expect(result.markers[0].shape).toBe('circle');
        expect(result.markers[0].color).toBe('#FF0000');
      });

      it('should create circle marker for circle annotation', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Point',
            type: 'circle',
            position: 'above',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.markers).toHaveLength(1);
        expect(result.markers[0].shape).toBe('circle');
      });
    });

    describe('Rectangle annotations', () => {
      it('should create shape for rectangle annotation', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Support Zone',
            type: 'rectangle',
            position: 'above',
            color: '#0000FF',
            backgroundColor: '#0000FF33',
            borderWidth: 2,
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.shapes).toHaveLength(1);
        expect(result.shapes[0].type).toBe('rectangle');
        expect(result.shapes[0].color).toBe('#0000FF');
        expect(result.shapes[0].fillColor).toBe('#0000FF33');
        expect(result.shapes[0].borderWidth).toBe(2);
        expect(result.shapes[0].text).toBe('Support Zone');
        expect(result.markers).toHaveLength(0);
        expect(result.texts).toHaveLength(0);
      });

      it('should use default values for rectangle without optional fields', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: '',
            type: 'rectangle',
            position: 'above',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.shapes[0].color).toBe('#2196F3');
        expect(result.shapes[0].fillColor).toBe('#2196F3');
        expect(result.shapes[0].borderWidth).toBe(1);
        expect(result.shapes[0].text).toBe('');
      });
    });

    describe('Line annotations', () => {
      it('should create shape for line annotation', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Trend Line',
            type: 'line',
            position: 'above',
            color: '#FFFF00',
            borderWidth: 3,
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.shapes).toHaveLength(1);
        expect(result.shapes[0].type).toBe('line');
        expect(result.shapes[0].color).toBe('#FFFF00');
        expect(result.shapes[0].borderWidth).toBe(3);
      });
    });

    describe('Text annotations', () => {
      it('should create text annotation', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Important Note',
            type: 'text',
            position: 'above',
            textColor: '#000000',
            backgroundColor: '#FFFFFF',
            fontSize: 14,
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.texts).toHaveLength(1);
        expect(result.texts[0].text).toBe('Important Note');
        expect(result.texts[0].color).toBe('#000000');
        expect(result.texts[0].backgroundColor).toBe('#FFFFFF');
        expect(result.texts[0].fontSize).toBe(14);
        expect(result.texts[0].fontFamily).toBe('Arial');
        expect(result.texts[0].position).toBe('aboveBar');
        expect(result.markers).toHaveLength(0);
        expect(result.shapes).toHaveLength(0);
      });

      it('should use default values for text without optional fields', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Note',
            type: 'text',
            position: 'below',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.texts[0].color).toBe('#131722');
        expect(result.texts[0].backgroundColor).toBe('rgba(255, 255, 255, 0.9)');
        expect(result.texts[0].fontSize).toBe(12);
        expect(result.texts[0].position).toBe('belowBar');
      });

      it('should parse time correctly for text annotation', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T12:30:00Z',
            price: 100,
            text: 'Test',
            type: 'text',
            position: 'above',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.texts[0].time).toBeDefined();
        expect(typeof result.texts[0].time).toBe('number');
      });
    });

    describe('Multiple annotations', () => {
      it('should handle multiple annotations of different types', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Arrow',
            type: 'arrow',
            position: 'above',
          },
          {
            time: '2024-01-02T00:00:00Z',
            price: 110,
            text: 'Rectangle',
            type: 'rectangle',
            position: 'above',
          },
          {
            time: '2024-01-03T00:00:00Z',
            price: 105,
            text: 'Text',
            type: 'text',
            position: 'above',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.markers).toHaveLength(1);
        expect(result.shapes).toHaveLength(1);
        expect(result.texts).toHaveLength(1);
      });

      it('should process all annotations in the array', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Signal 1',
            type: 'arrow',
            position: 'above',
          },
          {
            time: '2024-01-02T00:00:00Z',
            price: 105,
            text: 'Signal 2',
            type: 'arrow',
            position: 'below',
          },
          {
            time: '2024-01-03T00:00:00Z',
            price: 110,
            text: 'Signal 3',
            type: 'circle',
            position: 'above',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.markers).toHaveLength(3);
        expect(result.markers[0].text).toBe('Signal 1');
        expect(result.markers[1].text).toBe('Signal 2');
        expect(result.markers[2].text).toBe('Signal 3');
      });
    });

    describe('Error handling', () => {
      it('should return empty arrays for null input', () => {
        const result = createAnnotationVisualElements(null as any);

        expect(result.markers).toEqual([]);
        expect(result.shapes).toEqual([]);
        expect(result.texts).toEqual([]);
      });

      it('should return empty arrays for undefined input', () => {
        const result = createAnnotationVisualElements(undefined as any);

        expect(result.markers).toEqual([]);
        expect(result.shapes).toEqual([]);
        expect(result.texts).toEqual([]);
      });

      it('should return empty arrays for non-array input', () => {
        const result = createAnnotationVisualElements('not an array' as any);

        expect(result.markers).toEqual([]);
        expect(result.shapes).toEqual([]);
        expect(result.texts).toEqual([]);
      });

      it('should return empty arrays for non-object input', () => {
        const result = createAnnotationVisualElements(123 as any);

        expect(result.markers).toEqual([]);
        expect(result.shapes).toEqual([]);
        expect(result.texts).toEqual([]);
      });

      it('should skip null annotations in array', () => {
        const annotations: any[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Valid',
            type: 'arrow',
            position: 'above',
          },
          null,
          {
            time: '2024-01-02T00:00:00Z',
            price: 105,
            text: 'Also Valid',
            type: 'arrow',
            position: 'above',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.markers).toHaveLength(2);
      });

      it('should skip undefined annotations in array', () => {
        const annotations: any[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Valid',
            type: 'arrow',
            position: 'above',
          },
          undefined,
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.markers).toHaveLength(1);
      });

      it('should skip invalid annotation objects', () => {
        const annotations: any[] = [
          {
            time: '2024-01-01T00:00:00Z',
            price: 100,
            text: 'Valid',
            type: 'arrow',
            position: 'above',
          },
          'invalid',
          123,
          {},
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.markers).toHaveLength(1);
      });

      it('should handle annotations with missing required fields gracefully', () => {
        const annotations: any[] = [
          {
            time: '2024-01-01T00:00:00Z',
            // missing price, text, type
            position: 'above',
          },
        ];

        // Should not throw
        expect(() => createAnnotationVisualElements(annotations)).not.toThrow();
      });
    });

    describe('Time parsing', () => {
      it('should parse ISO 8601 date strings', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-15T14:30:00Z',
            price: 100,
            text: 'Test',
            type: 'text',
            position: 'above',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.texts[0].time).toBeDefined();
        expect(typeof result.texts[0].time).toBe('number');
      });

      it('should parse different date formats', () => {
        const annotations: Annotation[] = [
          {
            time: '2024-01-01',
            price: 100,
            text: 'Test',
            type: 'text',
            position: 'above',
          },
        ];

        const result = createAnnotationVisualElements(annotations);

        expect(result.texts[0].time).toBeDefined();
      });
    });
  });

  describe('filterAnnotationsByTimeRange', () => {
    const annotations: Annotation[] = [
      {
        time: '2024-01-01T00:00:00Z',
        price: 100,
        text: 'First',
        type: 'arrow',
        position: 'above',
      },
      {
        time: '2024-01-05T00:00:00Z',
        price: 105,
        text: 'Middle',
        type: 'arrow',
        position: 'above',
      },
      {
        time: '2024-01-10T00:00:00Z',
        price: 110,
        text: 'Last',
        type: 'arrow',
        position: 'above',
      },
    ];

    it('should filter annotations within time range', () => {
      const result = filterAnnotationsByTimeRange(
        annotations,
        '2024-01-02T00:00:00Z',
        '2024-01-09T00:00:00Z'
      );

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Middle');
    });

    it('should include annotations at range boundaries', () => {
      const result = filterAnnotationsByTimeRange(
        annotations,
        '2024-01-01T00:00:00Z',
        '2024-01-10T00:00:00Z'
      );

      expect(result).toHaveLength(3);
    });

    it('should return empty array when no annotations in range', () => {
      const result = filterAnnotationsByTimeRange(
        annotations,
        '2024-02-01T00:00:00Z',
        '2024-02-10T00:00:00Z'
      );

      expect(result).toHaveLength(0);
    });

    it('should handle single-point time range', () => {
      const result = filterAnnotationsByTimeRange(
        annotations,
        '2024-01-05T00:00:00Z',
        '2024-01-05T00:00:00Z'
      );

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Middle');
    });

    it('should return all annotations for very wide range', () => {
      const result = filterAnnotationsByTimeRange(
        annotations,
        '2000-01-01T00:00:00Z',
        '2030-01-01T00:00:00Z'
      );

      expect(result).toHaveLength(3);
    });
  });

  describe('filterAnnotationsByPriceRange', () => {
    const annotations: Annotation[] = [
      {
        time: '2024-01-01T00:00:00Z',
        price: 50,
        text: 'Low',
        type: 'arrow',
        position: 'above',
      },
      {
        time: '2024-01-02T00:00:00Z',
        price: 100,
        text: 'Medium',
        type: 'arrow',
        position: 'above',
      },
      {
        time: '2024-01-03T00:00:00Z',
        price: 150,
        text: 'High',
        type: 'arrow',
        position: 'above',
      },
    ];

    it('should filter annotations within price range', () => {
      const result = filterAnnotationsByPriceRange(annotations, 75, 125);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Medium');
    });

    it('should include annotations at price boundaries', () => {
      const result = filterAnnotationsByPriceRange(annotations, 50, 150);

      expect(result).toHaveLength(3);
    });

    it('should return empty array when no annotations in range', () => {
      const result = filterAnnotationsByPriceRange(annotations, 200, 300);

      expect(result).toHaveLength(0);
    });

    it('should handle single-point price range', () => {
      const result = filterAnnotationsByPriceRange(annotations, 100, 100);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Medium');
    });

    it('should handle negative prices', () => {
      const annotationsWithNegative: Annotation[] = [
        {
          time: '2024-01-01T00:00:00Z',
          price: -50,
          text: 'Negative',
          type: 'arrow',
          position: 'above',
        },
        {
          time: '2024-01-02T00:00:00Z',
          price: 0,
          text: 'Zero',
          type: 'arrow',
          position: 'above',
        },
        {
          time: '2024-01-03T00:00:00Z',
          price: 50,
          text: 'Positive',
          type: 'arrow',
          position: 'above',
        },
      ];

      const result = filterAnnotationsByPriceRange(annotationsWithNegative, -100, 0);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Negative');
      expect(result[1].text).toBe('Zero');
    });

    it('should return all annotations for very wide price range', () => {
      const result = filterAnnotationsByPriceRange(annotations, 0, 1000);

      expect(result).toHaveLength(3);
    });
  });

  describe('createAnnotationLayer', () => {
    it('should create layer with name and annotations', () => {
      const annotations: Annotation[] = [
        {
          time: '2024-01-01T00:00:00Z',
          price: 100,
          text: 'Test',
          type: 'arrow',
          position: 'above',
        },
      ];

      const layer = createAnnotationLayer('Support Levels', annotations);

      expect(layer.name).toBe('Support Levels');
      expect(layer.annotations).toEqual(annotations);
      expect(layer.visible).toBe(true);
      expect(layer.opacity).toBe(1.0);
    });

    it('should create layer with default empty annotations', () => {
      const layer = createAnnotationLayer('Empty Layer');

      expect(layer.name).toBe('Empty Layer');
      expect(layer.annotations).toEqual([]);
      expect(layer.visible).toBe(true);
      expect(layer.opacity).toBe(1.0);
    });

    it('should create layer with multiple annotations', () => {
      const annotations: Annotation[] = [
        {
          time: '2024-01-01T00:00:00Z',
          price: 100,
          text: 'First',
          type: 'arrow',
          position: 'above',
        },
        {
          time: '2024-01-02T00:00:00Z',
          price: 105,
          text: 'Second',
          type: 'text',
          position: 'above',
        },
      ];

      const layer = createAnnotationLayer('Multi-Annotation Layer', annotations);

      expect(layer.annotations).toHaveLength(2);
    });

    it('should always set visible to true', () => {
      const layer = createAnnotationLayer('Test Layer');

      expect(layer.visible).toBe(true);
    });

    it('should always set opacity to 1.0', () => {
      const layer = createAnnotationLayer('Test Layer');

      expect(layer.opacity).toBe(1.0);
    });
  });

  describe('Integration Tests', () => {
    it('should create layer and filter annotations by time', () => {
      const annotations: Annotation[] = [
        {
          time: '2024-01-01T00:00:00Z',
          price: 100,
          text: 'Early',
          type: 'arrow',
          position: 'above',
        },
        {
          time: '2024-01-05T00:00:00Z',
          price: 105,
          text: 'Middle',
          type: 'arrow',
          position: 'above',
        },
        {
          time: '2024-01-10T00:00:00Z',
          price: 110,
          text: 'Late',
          type: 'arrow',
          position: 'above',
        },
      ];

      const layer = createAnnotationLayer('Test Layer', annotations);
      const filtered = filterAnnotationsByTimeRange(
        layer.annotations,
        '2024-01-03T00:00:00Z',
        '2024-01-08T00:00:00Z'
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].text).toBe('Middle');
    });

    it('should create layer and filter annotations by price', () => {
      const annotations: Annotation[] = [
        {
          time: '2024-01-01T00:00:00Z',
          price: 50,
          text: 'Low',
          type: 'arrow',
          position: 'above',
        },
        {
          time: '2024-01-02T00:00:00Z',
          price: 100,
          text: 'Medium',
          type: 'arrow',
          position: 'above',
        },
        {
          time: '2024-01-03T00:00:00Z',
          price: 150,
          text: 'High',
          type: 'arrow',
          position: 'above',
        },
      ];

      const layer = createAnnotationLayer('Price Layer', annotations);
      const filtered = filterAnnotationsByPriceRange(layer.annotations, 75, 125);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].text).toBe('Medium');
    });

    it('should create visual elements from filtered annotations', () => {
      const annotations: Annotation[] = [
        {
          time: '2024-01-01T00:00:00Z',
          price: 100,
          text: 'Signal 1',
          type: 'arrow',
          position: 'above',
        },
        {
          time: '2024-01-05T00:00:00Z',
          price: 105,
          text: 'Signal 2',
          type: 'text',
          position: 'above',
        },
      ];

      const filtered = filterAnnotationsByTimeRange(
        annotations,
        '2024-01-04T00:00:00Z',
        '2024-01-06T00:00:00Z'
      );

      const visual = createAnnotationVisualElements(filtered);

      expect(visual.markers).toHaveLength(0);
      expect(visual.texts).toHaveLength(1);
      expect(visual.texts[0].text).toBe('Signal 2');
    });
  });
});
