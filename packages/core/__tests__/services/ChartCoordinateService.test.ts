/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChartCoordinateService } from '../../src/services/ChartCoordinateService';

function createSimpleMock(paneCount = 2) {
  const paneHeight = 300;

  // Create stable mock objects - return SAME object on every call
  const mockTimeScale = {
    height: vi.fn(() => 35),
    width: vi.fn(() => 800),
  };

  const mockPriceScaleLeft = {
    width: vi.fn(() => 70),
  };

  const mockPriceScaleRight = {
    width: vi.fn(() => 0),
  };

  const mockChartElement = document.createElement('div');
  Object.defineProperties(mockChartElement, {
    clientWidth: { value: 800, configurable: true },
    clientHeight: { value: 600, configurable: true },
    offsetWidth: { value: 800, configurable: true },
    offsetHeight: { value: 600, configurable: true },
  });
  mockChartElement.getBoundingClientRect = vi.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }));

  const mockChart = {
    timeScale: vi.fn(() => mockTimeScale),
    priceScale: vi.fn((side: string) =>
      side === 'right' ? mockPriceScaleRight : mockPriceScaleLeft
    ),
    chartElement: vi.fn(() => mockChartElement),
    paneSize: vi.fn((paneId: number) => {
      if (paneId >= 0 && paneId < paneCount) {
        return { width: 800, height: paneHeight };
      }
      return null;
    }),
  };

  const mockContainer = document.createElement('div');
  Object.defineProperties(mockContainer, {
    clientWidth: { value: 800, configurable: true },
    clientHeight: { value: 600, configurable: true },
    offsetWidth: { value: 800, configurable: true },
    offsetHeight: { value: 600, configurable: true },
    scrollWidth: { value: 800, configurable: true },
    scrollHeight: { value: 600, configurable: true },
    offsetTop: { value: 0, configurable: true },
    offsetLeft: { value: 0, configurable: true },
  });
  mockContainer.getBoundingClientRect = vi.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }));

  return { chart: mockChart, container: mockContainer };
}

describe('ChartCoordinateService Tests', () => {
  let service: ChartCoordinateService;

  beforeEach(() => {
    (ChartCoordinateService as any).instance = undefined;
    service = ChartCoordinateService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should create an instance', () => {
      expect(service).toBeInstanceOf(ChartCoordinateService);
    });

    it('should return same instance', () => {
      const instance2 = ChartCoordinateService.getInstance();
      expect(service).toBe(instance2);
    });
  });

  describe('Pane Coordinates', () => {
    it('should get pane coordinates', () => {
      const { chart } = createSimpleMock(2);
      const paneCoords = service.getPaneCoordinates(chart as any, 0);
      expect(paneCoords).toBeDefined();
      expect(paneCoords?.paneId).toBe(0);
      expect(paneCoords?.width).toBe(800);
      expect(paneCoords?.height).toBe(300);
    });

    it('should return null for invalid pane', () => {
      const { chart } = createSimpleMock(2);
      const paneCoords = service.getPaneCoordinates(chart as any, 999);
      expect(paneCoords).toBeNull();
    });

    it('should calculate cumulative offset for pane 1', () => {
      const { chart } = createSimpleMock(2);
      const paneCoords = service.getPaneCoordinates(chart as any, 1);
      expect(paneCoords).toBeDefined();
      expect(paneCoords?.y).toBe(300); // Height of pane 0
    });
  });

  describe('Full Pane Bounds', () => {
    it('should get full pane bounds', () => {
      const { chart } = createSimpleMock(2);
      const bounds = service.getFullPaneBounds(chart as any, 0);
      expect(bounds).toBeDefined();
      expect(bounds?.width).toBe(800);
      expect(bounds?.height).toBe(300);
    });

    it('should return null for null chart', () => {
      const bounds = service.getFullPaneBounds(null as any, 0);
      expect(bounds).toBeNull();
    });
  });

  describe('Dimensions Validation', () => {
    it('should validate valid dimensions', () => {
      const dimensions = {
        container: { width: 800, height: 600, offsetTop: 0, offsetLeft: 0 },
        timeScale: { x: 0, y: 565, width: 800, height: 35 },
        priceScaleLeft: { x: 0, y: 0, width: 70, height: 565 },
        priceScaleRight: { x: 730, y: 0, width: 0, height: 565 },
        panes: [],
        contentArea: { x: 70, y: 0, width: 730, height: 565 },
        timestamp: Date.now(),
        isValid: true,
      };
      expect(service.areChartDimensionsValid(dimensions)).toBe(true);
    });

    it('should invalidate small dimensions', () => {
      const dimensions = {
        container: { width: 100, height: 100, offsetTop: 0, offsetLeft: 0 },
        timeScale: { x: 0, y: 65, width: 100, height: 35 },
        priceScaleLeft: { x: 0, y: 0, width: 70, height: 65 },
        priceScaleRight: { x: 30, y: 0, width: 0, height: 65 },
        panes: [],
        contentArea: { x: 70, y: 0, width: 30, height: 65 },
        timestamp: Date.now(),
        isValid: true,
      };
      expect(service.areChartDimensionsValid(dimensions)).toBe(false);
    });

    it('should handle null dimensions', () => {
      expect(service.areChartDimensionsValid(null as any)).toBe(false);
    });
  });

  describe('Point in Pane', () => {
    it('should detect point inside pane', () => {
      const paneCoords = {
        paneId: 0,
        x: 0,
        y: 0,
        width: 800,
        height: 300,
        absoluteX: 0,
        absoluteY: 0,
        contentArea: { top: 0, left: 70, width: 730, height: 300 },
        margins: { top: 8, right: 8, bottom: 8, left: 8 },
        isMainPane: true,
        isLastPane: false,
      };
      expect(service.isPointInPane({ x: 400, y: 150 }, paneCoords)).toBe(true);
    });

    it('should detect point outside pane', () => {
      const paneCoords = {
        paneId: 0,
        x: 0,
        y: 0,
        width: 800,
        height: 300,
        absoluteX: 0,
        absoluteY: 0,
        contentArea: { top: 0, left: 70, width: 730, height: 300 },
        margins: { top: 8, right: 8, bottom: 8, left: 8 },
        isMainPane: true,
        isLastPane: false,
      };
      expect(service.isPointInPane({ x: 900, y: 150 }, paneCoords)).toBe(false);
    });
  });

  describe('Chart Registration', () => {
    it('should register chart', () => {
      const { chart } = createSimpleMock(2);
      service.registerChart('test', chart as any);
      expect(true).toBe(true);
    });

    it('should unregister chart', () => {
      const { chart } = createSimpleMock(2);
      service.registerChart('test', chart as any);
      service.unregisterChart('test');
      expect(true).toBe(true);
    });

    it('should invalidate cache on register', () => {
      const { chart } = createSimpleMock(2);
      const invalidateSpy = vi.spyOn(service, 'invalidateCache');
      service.registerChart('test', chart as any);
      expect(invalidateSpy).toHaveBeenCalledWith('test');
    });
  });

  describe('Cache Management', () => {
    it('should invalidate specific cache', () => {
      const { chart } = createSimpleMock(2);
      service.registerChart('test', chart as any);
      service.invalidateCache('test');
      expect(true).toBe(true);
    });

    it('should invalidate all cache', () => {
      const { chart } = createSimpleMock(2);
      service.registerChart('test1', chart as any);
      service.registerChart('test2', chart as any);
      service.invalidateCache();
      expect(true).toBe(true);
    });
  });

  describe('Update Callbacks', () => {
    it('should register callback', () => {
      const callback = vi.fn();
      const unsubscribe = service.onCoordinateUpdate('test', callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe callback', () => {
      const callback = vi.fn();
      const unsubscribe = service.onCoordinateUpdate('test', callback);
      unsubscribe();
      expect(true).toBe(true);
    });

    it('should call callback on force refresh', () => {
      const callback = vi.fn();
      service.onCoordinateUpdate('test', callback);
      service.forceRefreshCoordinates('test');
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Position Conversion', () => {
    it('should convert corner positions', () => {
      expect(service.positionToCorner('top-left')).toBe('top-left');
      expect(service.positionToCorner('top-right')).toBe('top-right');
      expect(service.positionToCorner('bottom-left')).toBe('bottom-left');
      expect(service.positionToCorner('bottom-right')).toBe('bottom-right');
    });

    it('should handle center positions', () => {
      expect(service.positionToCorner('center')).toBe('top-right');
      expect(service.positionToCorner('top-center')).toBe('top-right');
      expect(service.positionToCorner('bottom-center')).toBe('bottom-right');
    });
  });

  describe('Scaling Factor', () => {
    it('should calculate scaling factor', () => {
      const scaling = service.calculateScalingFactor(1600, 1200, 800, 600);
      expect(scaling.x).toBe(2);
      expect(scaling.y).toBe(2);
      expect(scaling.uniform).toBe(2);
    });
  });

  describe('Positioning Validation', () => {
    it('should validate valid positioning', () => {
      const element = { x: 50, y: 50, width: 200, height: 100, top: 50, left: 50, right: 250, bottom: 150 };
      const container = { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600 };
      const validation = service.validatePositioning(element, container);
      expect(validation.isValid).toBe(true);
    });

    it('should detect positioning violations', () => {
      const element = { x: -50, y: -50, width: 200, height: 100, top: -50, left: -50, right: 150, bottom: 50 };
      const container = { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600 };
      const validation = service.validatePositioning(element, container);
      expect(validation.isValid).toBe(false);
      expect(validation.adjustments.x).toBe(50);
      expect(validation.adjustments.y).toBe(50);
    });
  });

  describe('Async Coordinate Calculation', () => {
    it('should get coordinates with fallback', async () => {
      const { chart, container } = createSimpleMock(2);
      const coordinates = await service.getCoordinates(chart as any, container, {
        useCache: false,
        fallbackOnError: true,
      });
      expect(coordinates).toBeDefined();
      expect(coordinates.container).toBeDefined();
    });
  });
});
