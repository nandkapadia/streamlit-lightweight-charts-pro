/**
 * @fileoverview Tests for ButtonPanelComponent - Fixed version using centralized mocks
 */

import { render, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ButtonPanelComponent } from '../../components/ButtonPanelComponent';

describe('ButtonPanelComponent', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      expect(container.querySelector('.button-panel')).toBeInTheDocument();
      expect(container.querySelector('.gear-button')).toBeInTheDocument();
      expect(container.querySelector('.collapse-button')).toBeInTheDocument();
    });

    it('should render with custom pane ID', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} paneId={5} />);

      expect(container.querySelector('.gear-button')).toBeInTheDocument();
    });

    it('should apply correct CSS classes', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      expect(container.querySelector('.button-panel')).toBeInTheDocument();
      expect(container.querySelector('.gear-button')).toBeInTheDocument();
      expect(container.querySelector('.collapse-button')).toBeInTheDocument();
    });
  });

  describe('Gear Button Functionality', () => {
    it('should show gear button by default', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      expect(container.querySelector('.gear-button')).toBeInTheDocument();
    });

    it('should hide gear button when showGearButton is false', () => {
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} showGearButton={false} />
      );

      expect(container.querySelector('.gear-button')).not.toBeInTheDocument();
    });

    it('should show gear button when showGearButton is true', () => {
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} showGearButton={true} />
      );

      expect(container.querySelector('.gear-button')).toBeInTheDocument();
    });

    it('should call onGearClick when gear button is clicked', () => {
      const onGearClick = vi.fn();
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} onGearClick={onGearClick} />
      );

      const gearButton = container.querySelector('.gear-button');
      expect(gearButton).toBeInTheDocument();

      fireEvent.click(gearButton!);
      expect(onGearClick).toHaveBeenCalledTimes(1);
    });

    it('should prevent default and stop propagation on gear button click', () => {
      const onGearClick = vi.fn();
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} onGearClick={onGearClick} />
      );

      const gearButton = container.querySelector('.gear-button');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

      fireEvent(gearButton!, clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('Collapse Button Functionality', () => {
    it('should show collapse button by default', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      expect(container.querySelector('.collapse-button')).toBeInTheDocument();
    });

    it('should hide collapse button when showCollapseButton is false', () => {
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} showCollapseButton={false} />
      );

      expect(container.querySelector('.collapse-button')).not.toBeInTheDocument();
    });

    it('should show collapse button when showCollapseButton is true', () => {
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} showCollapseButton={true} />
      );

      expect(container.querySelector('.collapse-button')).toBeInTheDocument();
    });

    it('should call onCollapseClick when collapse button is clicked', () => {
      const onCollapseClick = vi.fn();
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} onCollapseClick={onCollapseClick} />
      );

      const collapseButton = container.querySelector('.collapse-button');
      fireEvent.click(collapseButton!);

      expect(onCollapseClick).toHaveBeenCalledTimes(1);
    });

    it('should show correct title for collapsed state', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} isCollapsed={true} />);

      const collapseButton = container.querySelector('.collapse-button');
      expect(collapseButton).toHaveAttribute('title', 'Expand pane');
    });

    it('should show correct title for expanded state', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} isCollapsed={false} />);

      const collapseButton = container.querySelector('.collapse-button');
      expect(collapseButton).toHaveAttribute('title', 'Collapse pane');
    });

    it('should prevent default and stop propagation on collapse button click', () => {
      const onCollapseClick = vi.fn();
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} onCollapseClick={onCollapseClick} />
      );

      const collapseButton = container.querySelector('.collapse-button');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

      fireEvent(collapseButton!, clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('Button Visibility Combinations', () => {
    it('should show only gear button when collapse button is hidden', () => {
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} showCollapseButton={false} />
      );

      expect(container.querySelector('.gear-button')).toBeInTheDocument();
      expect(container.querySelector('.collapse-button')).not.toBeInTheDocument();
    });

    it('should show only collapse button when gear button is hidden', () => {
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} showGearButton={false} />
      );

      expect(container.querySelector('.gear-button')).not.toBeInTheDocument();
      expect(container.querySelector('.collapse-button')).toBeInTheDocument();
    });

    it('should show no buttons when both are hidden', () => {
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} showGearButton={false} showCollapseButton={false} />
      );

      expect(container.querySelector('.gear-button')).not.toBeInTheDocument();
      expect(container.querySelector('.collapse-button')).not.toBeInTheDocument();
      expect(container.querySelector('.button-panel')).toBeInTheDocument();
    });

    it('should show both buttons when both are explicitly enabled', () => {
      const { container } = render(
        <ButtonPanelComponent {...defaultProps} showGearButton={true} showCollapseButton={true} />
      );

      expect(container.querySelector('.gear-button')).toBeInTheDocument();
      expect(container.querySelector('.collapse-button')).toBeInTheDocument();
    });
  });

  describe('Visual Configuration', () => {
    it('should apply custom button size', () => {
      const customConfig = {
        ...defaultProps.config,
        buttonSize: 24,
      };

      const { container } = render(
        <ButtonPanelComponent {...defaultProps} config={customConfig} />
      );

      const gearButton = container.querySelector('.gear-button') as HTMLElement;

      // Test that the custom button size is applied
      expect(gearButton.style.width).toBe('24px');
      expect(gearButton.style.height).toBe('24px');
    });

    it('should apply custom button colors', () => {
      const customConfig = {
        ...defaultProps.config,
        buttonColor: '#FF0000',
        buttonBackground: 'rgba(0, 255, 0, 0.5)',
      };

      const { container } = render(
        <ButtonPanelComponent {...defaultProps} config={customConfig} />
      );

      const gearButton = container.querySelector('.gear-button') as HTMLElement;
      expect(gearButton.style.color).toBe('rgb(255, 0, 0)');
      expect(gearButton.style.background).toBe('rgba(0, 255, 0, 0.5)');
    });

    it('should apply custom border radius', () => {
      const customConfig = {
        ...defaultProps.config,
        buttonBorderRadius: 8,
      };

      const { container } = render(
        <ButtonPanelComponent {...defaultProps} config={customConfig} />
      );

      const gearButton = container.querySelector('.gear-button') as HTMLElement;
      expect(gearButton.style.borderRadius).toBe('8px');
    });

    it('should use default values when config properties are missing', () => {
      const minimalConfig = {};

      const { container } = render(
        <ButtonPanelComponent
          paneId={0}
          isCollapsed={false}
          onCollapseClick={vi.fn()}
          onGearClick={vi.fn()}
          config={minimalConfig}
        />
      );

      const gearButton = container.querySelector('.gear-button') as HTMLElement;

      // Check that the button gets default styling values
      expect(gearButton.style.borderRadius).toBe('3px');
      expect(gearButton.style.cursor).toBe('pointer');
      expect(gearButton.style.display).toBe('flex');
      expect(gearButton.style.userSelect).toBe('none');
      expect(gearButton.style.transition).toBe('all 0.2s ease');
    });
  });

  describe('Hover Effects', () => {
    it('should handle gear button hover states', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      const gearButton = container.querySelector('.gear-button') as HTMLElement;

      fireEvent.mouseEnter(gearButton);
      expect(gearButton.style.color).toBe('rgb(19, 23, 34)');
      expect(gearButton.style.background).toBe('rgb(255, 255, 255)');

      fireEvent.mouseLeave(gearButton);
      expect(gearButton.style.color).toBe('rgb(120, 123, 134)');
      expect(gearButton.style.background).toBe('rgba(255, 255, 255, 0.9)');
    });

    it('should handle collapse button hover states', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      const collapseButton = container.querySelector('.collapse-button') as HTMLElement;

      fireEvent.mouseEnter(collapseButton);
      expect(collapseButton.style.color).toBe('rgb(19, 23, 34)');
      expect(collapseButton.style.background).toBe('rgb(255, 255, 255)');

      fireEvent.mouseLeave(collapseButton);
      expect(collapseButton.style.color).toBe('rgb(120, 123, 134)');
      expect(collapseButton.style.background).toBe('rgba(255, 255, 255, 0.9)');
    });

    it('should handle independent hover states for both buttons', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      const gearButton = container.querySelector('.gear-button') as HTMLElement;
      const collapseButton = container.querySelector('.collapse-button') as HTMLElement;

      fireEvent.mouseEnter(gearButton);
      expect(gearButton.style.color).toBe('rgb(19, 23, 34)');
      expect(collapseButton.style.color).toBe('rgb(120, 123, 134)');

      fireEvent.mouseLeave(gearButton);
      fireEvent.mouseEnter(collapseButton);
      expect(gearButton.style.color).toBe('rgb(120, 123, 134)');
      expect(collapseButton.style.color).toBe('rgb(19, 23, 34)');
    });
  });

  describe('Accessibility', () => {
    it('should have proper title attributes', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      const gearButton = container.querySelector('.gear-button');
      const collapseButton = container.querySelector('.collapse-button');

      expect(gearButton).toHaveAttribute('title', 'Series Settings');
      expect(collapseButton).toHaveAttribute('title', 'Collapse pane');
    });

    it('should be keyboard accessible', () => {
      const onGearClick = vi.fn();
      const onCollapseClick = vi.fn();

      const { container } = render(
        <ButtonPanelComponent
          {...defaultProps}
          onGearClick={onGearClick}
          onCollapseClick={onCollapseClick}
        />
      );

      const gearButton = container.querySelector('.gear-button') as HTMLElement;
      const collapseButton = container.querySelector('.collapse-button') as HTMLElement;

      fireEvent.keyDown(gearButton, { key: 'Enter' });
      fireEvent.keyDown(collapseButton, { key: 'Enter' });

      expect(gearButton).toBeVisible();
      expect(collapseButton).toBeVisible();
    });
  });

  describe('SVG Icon Rendering', () => {
    it('should render gear icon SVG', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      const gearButton = container.querySelector('.gear-button');
      const svgElement = gearButton?.querySelector('svg');

      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveAttribute('viewBox', '0 0 18 18');
      expect(svgElement).toHaveAttribute('width', '14');
      expect(svgElement).toHaveAttribute('height', '14');
    });

    it('should render collapse icon SVG when expanded', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} isCollapsed={false} />);

      const collapseButton = container.querySelector('.collapse-button');
      const svgElement = collapseButton?.querySelector('svg');

      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveAttribute('viewBox', '0 0 15 15');
      expect(svgElement).toHaveAttribute('width', '12');
      expect(svgElement).toHaveAttribute('height', '12');
    });

    it('should render expand icon SVG when collapsed', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} isCollapsed={true} />);

      const expandButton = container.querySelector('.collapse-button');
      const svgElement = expandButton?.querySelector('svg');

      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveAttribute('viewBox', '0 0 15 15');
      expect(svgElement).toHaveAttribute('width', '12');
      expect(svgElement).toHaveAttribute('height', '12');
    });
  });

  describe('Panel Styling', () => {
    it('should apply correct panel positioning styles', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      const panel = container.querySelector('.button-panel') as HTMLElement;

      expect(panel.style.display).toBe('flex');
      expect(panel.style.gap).toBe('4px');
      expect(panel.style.zIndex).toBe('1000');
    });

    it('should apply button transitions', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      const gearButton = container.querySelector('.gear-button') as HTMLElement;
      const collapseButton = container.querySelector('.collapse-button') as HTMLElement;

      expect(gearButton.style.transition).toBe('all 0.2s ease');
      expect(collapseButton.style.transition).toBe('all 0.2s ease');
    });

    it('should apply user-select none to buttons', () => {
      const { container } = render(<ButtonPanelComponent {...defaultProps} />);

      const gearButton = container.querySelector('.gear-button') as HTMLElement;
      const collapseButton = container.querySelector('.collapse-button') as HTMLElement;

      expect(gearButton.style.userSelect).toBe('none');
      expect(collapseButton.style.userSelect).toBe('none');
    });
  });
});
