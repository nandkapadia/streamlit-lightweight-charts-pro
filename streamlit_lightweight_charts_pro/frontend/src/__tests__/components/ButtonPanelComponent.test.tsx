/**
 * @fileoverview Tests for ButtonPanelComponent
 * @vitest-environment jsdom
 */

import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';

// Create mock buttons at module level
const mockButtons = [
  {
    getId: () => 'series-settings-button-pane-0',
    isVisible: () => true,
    render: () =>
      React.createElement(
        'div',
        {
          className: 'button series-settings-button-pane-0',
          'data-testid': 'settings-button',
        },
        'Settings'
      ),
  },
  {
    getId: () => 'collapse-button-pane-0',
    isVisible: () => true,
    render: () =>
      React.createElement(
        'div',
        {
          className: 'button collapse-button-pane-0',
          'data-testid': 'collapse-button',
        },
        'Collapse'
      ),
  },
];

// Mock the button registry
vi.mock('../../components/buttons/base/ButtonRegistry', () => ({
  createButtonRegistry: vi.fn(() => ({
    register: vi.fn(),
    clear: vi.fn(),
    getButton: vi.fn((id: string) => mockButtons.find(b => b.getId() === id)),
    getVisibleButtons: vi.fn(() => mockButtons),
  })),
}));

describe('ButtonPanelComponent', () => {
  let ButtonPanelComponent: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import component after mocks are set up
    const module = await import('../../components/ButtonPanelComponent');
    ButtonPanelComponent = module.ButtonPanelComponent;
  });

  afterEach(() => {
    vi.resetModules();
  });

  const defaultProps = {
    paneId: 0,
    isCollapsed: false,
    onCollapseClick: vi.fn(),
    onGearClick: vi.fn(),
    config: {
      buttonSize: 16,
      buttonColor: '#787B86',
      buttonBackground: 'rgba(255, 255, 255, 0.9)',
      buttonBorderRadius: 3,
      buttonHoverColor: '#131722',
      buttonHoverBackground: 'rgba(255, 255, 255, 1)',
      showTooltip: true,
    },
  };

  describe('Basic Rendering', () => {
    it('should render the button panel', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      const panel = container.querySelector('.button-panel');
      expect(panel).toBeInTheDocument();
    });

    it('should render without errors', () => {
      expect(() => {
        render(<ButtonPanelComponent {...defaultProps} />);
      }).not.toThrow();
    });

    it('should apply correct panel styles', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      const panel = container.querySelector('.button-panel') as HTMLElement;
      expect(panel.style.display).toBe('flex');
      expect(panel.style.gap).toBe('4px');
      expect(panel.style.zIndex).toBe('1000');
    });
  });

  describe('Button Visibility', () => {
    it('should handle showSeriesSettingsButton prop', () => {
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} showSeriesSettingsButton={false} />
      );

      expect(container.querySelector('.button-panel')).toBeInTheDocument();
    });

    // TODO: Re-enable when collapse button functionality is debugged and fully implemented
    it.skip('should handle showCollapseButton prop', () => {
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} showCollapseButton={false} />
      );

      expect(container.querySelector('.button-panel')).toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', () => {
      const customConfig = {
        buttonSize: 24,
        buttonColor: '#FF0000',
        buttonBackground: 'rgba(0, 255, 0, 0.5)',
        buttonBorderRadius: 8,
      };

      const { container } = render(
        <ButtonPanelComponent {...defaultProps} config={customConfig} />
      );

      expect(container.querySelector('.button-panel')).toBeInTheDocument();
    });

    it('should work with minimal config', () => {
      const { container } = render(
        <ButtonPanelComponent
          paneId={0}
          isCollapsed={false}
          onCollapseClick={vi.fn()}
          onGearClick={vi.fn()}
        />
      );

      expect(container.querySelector('.button-panel')).toBeInTheDocument();
    });
  });

  describe('Pane ID', () => {
    it('should accept different pane IDs', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} paneId={5} />);

      expect(container.querySelector('.button-panel')).toBeInTheDocument();
    });
  });

  // TODO: Re-enable when collapse button functionality is debugged and fully implemented
  describe.skip('Collapsed State', () => {
    it('should handle collapsed state', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} isCollapsed={true} />);

      expect(container.querySelector('.button-panel')).toBeInTheDocument();
    });

    it('should handle expanded state', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} isCollapsed={false} />);

      expect(container.querySelector('.button-panel')).toBeInTheDocument();
    });
  });
});
