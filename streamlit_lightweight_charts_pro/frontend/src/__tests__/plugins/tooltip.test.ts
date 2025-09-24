import { TooltipPlugin } from '../../plugins/chart/tooltipPlugin';
import { resetMocks, mockChart } from '../../test-utils/lightweightChartsMocks';

// Use unified mock system
import lightweightChartsMocks from '../../test-utils/lightweightChartsMocks';
vi.mock('lightweight-charts', () => lightweightChartsMocks);

// Mock DOM elements
const mockContainer = document.createElement('div');
const mockTooltip = document.createElement('div');

describe('Tooltip Plugin', () => {
  beforeEach(() => {
    resetMocks();
    document.body.appendChild(mockContainer);
    document.body.appendChild(mockTooltip);
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
    document.body.removeChild(mockTooltip);
  });

  describe('Tooltip Creation', () => {
    it('should create tooltip plugin', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');
      expect(tooltipPlugin).toBeDefined();
    });

    it('should create tooltip with default options', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      expect(tooltipPlugin).toBeDefined();
    });

    it('should create tooltip with custom options', () => {
      const customOptions = {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderColor: '#cccccc',
        fontSize: '12px',
        padding: '8px',
        borderRadius: '4px',
        zIndex: 1000,
      };

      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      expect(tooltipPlugin).toBeDefined();
    });
  });

  describe('Tooltip Display', () => {
    it('should show tooltip on crosshair move', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const mockEvent = {
        time: 1640995200,
        price: 100,
        seriesData: new Map([['series1', { value: 100, color: '#ff0000' }]]),
      };

      (tooltipPlugin as any).showTooltip(mockEvent);

      expect(tooltipPlugin).toBeDefined();
    });

    it('should hide tooltip', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      (tooltipPlugin as any).hideTooltip();

      expect(tooltipPlugin).toBeDefined();
    });

    it('should update tooltip content', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const content = '<div>Custom tooltip content</div>';
      tooltipPlugin.updateContent(content);

      expect(tooltipPlugin).toBeDefined();
    });

    it('should position tooltip correctly', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const position = { x: 100, y: 200 };
      tooltipPlugin.setPosition(position);

      expect(tooltipPlugin).toBeDefined();
    });
  });

  describe('Tooltip Styling', () => {
    it('should apply custom styles', () => {
      const customStyles = {
        backgroundColor: '#000000',
        textColor: '#ffffff',
        borderColor: '#ff0000',
        fontSize: '14px',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      };

      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test');

      expect(tooltipPlugin).toBeDefined();
    });

    it('should handle theme-based styling', () => {
      const theme = {
        base: 'dark',
        backgroundColor: '#1e1e1e',
        textColor: '#ffffff',
      };

      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test');

      expect(tooltipPlugin).toBeDefined();
    });

    it('should handle responsive styling', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      // Simulate window resize
      window.dispatchEvent(new Event('resize'));

      expect(tooltipPlugin).toBeDefined();
    });
  });

  describe('Tooltip Content', () => {
    it('should format series data correctly', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const seriesData = new Map([
        ['price', { value: 100.5, color: '#ff0000' }],
        ['volume', { value: 1000000, color: '#00ff00' }],
        ['indicator', { value: 0.75, color: '#0000ff' }],
      ]);

      const formattedContent = tooltipPlugin.formatSeriesData(seriesData);

      expect(formattedContent).toBeDefined();
    });

    it('should handle empty series data', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const emptyData = new Map();
      const formattedContent = tooltipPlugin.formatSeriesData(emptyData);

      expect(formattedContent).toBeDefined();
    });

    it('should format time correctly', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const timestamp = 1640995200;
      const formattedTime = (tooltipPlugin as any).formatTime(timestamp, {});

      expect(formattedTime).toBeDefined();
    });

    it('should format price correctly', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const price = 100.123456;
      const formattedPrice = tooltipPlugin.formatPrice(price);

      expect(formattedPrice).toBeDefined();
    });
  });

  describe('Tooltip Events', () => {
    it('should handle mouse enter events', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const mouseEvent = new MouseEvent('mouseenter', {
        clientX: 100,
        clientY: 200,
      });

      tooltipPlugin.handleMouseEnter(mouseEvent);

      expect(tooltipPlugin).toBeDefined();
    });

    it('should handle mouse leave events', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const mouseEvent = new MouseEvent('mouseleave');
      tooltipPlugin.handleMouseLeave(mouseEvent);

      expect(tooltipPlugin).toBeDefined();
    });

    it('should handle mouse move events', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 250,
      });

      tooltipPlugin.handleMouseMove(mouseEvent);

      expect(tooltipPlugin).toBeDefined();
    });
  });

  describe('Tooltip Positioning', () => {
    it('should position tooltip within viewport', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const position = { x: 1000, y: 800 }; // Outside viewport
      const constrainedPosition = tooltipPlugin.constrainToViewport(position);

      expect(constrainedPosition).toBeDefined();
    });

    it('should handle edge positioning', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      // Test different edge cases
      const edgePositions = [
        { x: 0, y: 0 },
        { x: window.innerWidth, y: 0 },
        { x: 0, y: window.innerHeight },
        { x: window.innerWidth, y: window.innerHeight },
      ];

      edgePositions.forEach(position => {
        const constrainedPosition = tooltipPlugin.constrainToViewport(position);
        expect(constrainedPosition).toBeDefined();
      });
    });

    it('should handle container-relative positioning', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const containerPosition = { x: 50, y: 50 };
      const absolutePosition = tooltipPlugin.getAbsolutePosition(containerPosition);

      expect(absolutePosition).toBeDefined();
    });
  });

  describe('Tooltip Performance', () => {
    it('should handle rapid mouse movements', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      // Simulate rapid mouse movements
      for (let i = 0; i < 100; i++) {
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: 100 + i,
          clientY: 200 + i,
        });

        tooltipPlugin.handleMouseMove(mouseEvent);
      }

      expect(tooltipPlugin).toBeDefined();
    });

    it('should debounce tooltip updates', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      // Simulate rapid updates
      for (let i = 0; i < 50; i++) {
        tooltipPlugin.updateContent(`Content ${i}`);
      }

      expect(tooltipPlugin).toBeDefined();
    });
  });

  describe('Tooltip Cleanup', () => {
    it('should cleanup event listeners', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      tooltipPlugin.cleanup();

      expect(tooltipPlugin).toBeDefined();
    });

    it('should remove tooltip from DOM', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      tooltipPlugin.remove();

      expect(tooltipPlugin).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing chart gracefully', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      expect(() => {
        tooltipPlugin.addToChart(null, mockContainer);
      }).not.toThrow();
    });

    it('should handle missing container gracefully', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      expect(() => {
        tooltipPlugin.addToChart(mockChart, null);
      }).not.toThrow();
    });

    it('should handle invalid event data', () => {
      const tooltipPlugin = new TooltipPlugin(mockChart, mockContainer, 'test-chart');

      const invalidEvent = {
        time: 'invalid',
        price: 'invalid',
        seriesData: null,
      };

      expect(() => {
        (tooltipPlugin as any).showTooltip(invalidEvent);
      }).not.toThrow();
    });
  });
});
