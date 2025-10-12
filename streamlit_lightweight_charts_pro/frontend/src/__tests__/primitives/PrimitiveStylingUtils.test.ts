/**
 * Tests for PrimitiveStylingUtils
 * @vitest-environment jsdom
 *
 * Utilities for applying consistent styles across primitive components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PrimitiveStylingUtils,
  BaseStyleConfig,
  TypographyConfig,
  LayoutConfig,
  BorderConfig,
  ShadowConfig,
} from '../../primitives/PrimitiveStylingUtils';

describe('PrimitiveStylingUtils - applyBaseStyles', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  it('should apply color and background', () => {
    const styles: BaseStyleConfig = {
      backgroundColor: '#FF0000',
      color: '#FFFFFF',
    };

    PrimitiveStylingUtils.applyBaseStyles(element, styles);

    expect(element.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(element.style.color).toBe('rgb(255, 255, 255)');
  });

  it('should apply typography styles', () => {
    const styles: BaseStyleConfig = {
      fontSize: 14,
      fontFamily: 'Arial',
      fontWeight: 'bold',
    };

    PrimitiveStylingUtils.applyBaseStyles(element, styles);

    expect(element.style.fontSize).toBe('14px');
    expect(element.style.fontFamily).toBe('Arial');
    expect(element.style.fontWeight).toBe('bold');
  });

  it('should apply padding and margin with number', () => {
    const styles: BaseStyleConfig = {
      padding: 10,
      margin: 5,
    };

    PrimitiveStylingUtils.applyBaseStyles(element, styles);

    expect(element.style.padding).toBe('10px');
    expect(element.style.margin).toBe('5px');
  });

  it('should apply padding and margin with string', () => {
    const styles: BaseStyleConfig = {
      padding: '10px 20px',
      margin: '5px 15px',
    };

    PrimitiveStylingUtils.applyBaseStyles(element, styles);

    expect(element.style.padding).toBe('10px 20px');
    expect(element.style.margin).toBe('5px 15px');
  });

  it('should apply border and border radius', () => {
    const styles: BaseStyleConfig = {
      border: '1px solid black',
      borderRadius: 5,
    };

    PrimitiveStylingUtils.applyBaseStyles(element, styles);

    expect(element.style.border).toBe('1px solid black');
    expect(element.style.borderRadius).toBe('5px');
  });

  it('should apply interaction styles', () => {
    const styles: BaseStyleConfig = {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      zIndex: 100,
    };

    PrimitiveStylingUtils.applyBaseStyles(element, styles);

    expect(element.style.cursor).toBe('pointer');
    expect(element.style.transition).toBe('all 0.2s ease');
    expect(element.style.zIndex).toBe('100');
  });

  it('should apply opacity', () => {
    const styles: BaseStyleConfig = {
      opacity: 0.8,
    };

    PrimitiveStylingUtils.applyBaseStyles(element, styles);

    expect(element.style.opacity).toBe('0.8');
  });

  it('should merge with defaults', () => {
    const defaults: BaseStyleConfig = {
      backgroundColor: '#000000',
      color: '#FFFFFF',
      fontSize: 12,
    };

    const styles: BaseStyleConfig = {
      color: '#FF0000', // Override default
    };

    PrimitiveStylingUtils.applyBaseStyles(element, styles, defaults);

    expect(element.style.backgroundColor).toBe('rgb(0, 0, 0)'); // From defaults
    expect(element.style.color).toBe('rgb(255, 0, 0)'); // Overridden
    expect(element.style.fontSize).toBe('12px'); // From defaults
  });
});

describe('PrimitiveStylingUtils - applyTypography', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  it('should apply basic typography', () => {
    const typography: TypographyConfig = {
      fontSize: 16,
      fontFamily: 'Helvetica',
      fontWeight: 600,
      textAlign: 'center',
    };

    PrimitiveStylingUtils.applyTypography(element, typography);

    expect(element.style.fontSize).toBe('16px');
    expect(element.style.fontFamily).toBe('Helvetica');
    expect(element.style.fontWeight).toBe('600');
    expect(element.style.textAlign).toBe('center');
  });

  it('should apply line height as number', () => {
    const typography: TypographyConfig = {
      lineHeight: 1.5,
    };

    PrimitiveStylingUtils.applyTypography(element, typography);

    expect(element.style.lineHeight).toBe('1.5');
  });

  it('should apply letter spacing with units', () => {
    const typography: TypographyConfig = {
      letterSpacing: 2,
    };

    PrimitiveStylingUtils.applyTypography(element, typography);

    expect(element.style.letterSpacing).toBe('2px');
  });

  it('should merge with defaults', () => {
    const defaults: TypographyConfig = {
      fontSize: 12,
      fontFamily: 'Arial',
    };

    const typography: TypographyConfig = {
      fontSize: 16, // Override
    };

    PrimitiveStylingUtils.applyTypography(element, typography, defaults);

    expect(element.style.fontSize).toBe('16px'); // Overridden
    expect(element.style.fontFamily).toBe('Arial'); // From defaults
  });
});

describe('PrimitiveStylingUtils - applyLayout', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  it('should apply dimensions as numbers', () => {
    const layout: LayoutConfig = {
      width: 100,
      height: 50,
    };

    PrimitiveStylingUtils.applyLayout(element, layout);

    expect(element.style.width).toBe('100px');
    expect(element.style.height).toBe('50px');
  });

  it('should apply dimensions as strings', () => {
    const layout: LayoutConfig = {
      width: '100%',
      height: '50vh',
    };

    PrimitiveStylingUtils.applyLayout(element, layout);

    expect(element.style.width).toBe('100%');
    expect(element.style.height).toBe('50vh');
  });

  it('should apply display and position', () => {
    const layout: LayoutConfig = {
      display: 'flex',
      position: 'absolute',
    };

    PrimitiveStylingUtils.applyLayout(element, layout);

    expect(element.style.display).toBe('flex');
    expect(element.style.position).toBe('absolute');
  });

  it('should apply position values as numbers', () => {
    const layout: LayoutConfig = {
      top: 10,
      right: 20,
      bottom: 30,
      left: 40,
    };

    PrimitiveStylingUtils.applyLayout(element, layout);

    expect(element.style.top).toBe('10px');
    expect(element.style.right).toBe('20px');
    expect(element.style.bottom).toBe('30px');
    expect(element.style.left).toBe('40px');
  });

  it('should apply position values as strings', () => {
    const layout: LayoutConfig = {
      top: '10%',
      left: '50%',
    };

    PrimitiveStylingUtils.applyLayout(element, layout);

    expect(element.style.top).toBe('10%');
    expect(element.style.left).toBe('50%');
  });

  it('should merge with defaults', () => {
    const defaults: LayoutConfig = {
      display: 'block',
      width: 100,
    };

    const layout: LayoutConfig = {
      width: 200, // Override
      height: 50,
    };

    PrimitiveStylingUtils.applyLayout(element, layout, defaults);

    expect(element.style.display).toBe('block'); // From defaults
    expect(element.style.width).toBe('200px'); // Overridden
    expect(element.style.height).toBe('50px'); // New
  });
});

describe('PrimitiveStylingUtils - applyBorder', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  it('should apply border shorthand', () => {
    const border: BorderConfig = {
      border: '2px solid red',
    };

    PrimitiveStylingUtils.applyBorder(element, border);

    expect(element.style.border).toBe('2px solid red');
  });

  it('should apply border components', () => {
    const border: BorderConfig = {
      borderWidth: 2,
      borderColor: 'blue',
      borderStyle: 'dashed',
      borderRadius: 10,
    };

    PrimitiveStylingUtils.applyBorder(element, border);

    expect(element.style.borderWidth).toBe('2px');
    expect(element.style.borderColor).toBe('blue');
    expect(element.style.borderStyle).toBe('dashed');
    expect(element.style.borderRadius).toBe('10px');
  });

  it('should merge with defaults', () => {
    const defaults: BorderConfig = {
      borderWidth: 1,
      borderColor: 'black',
    };

    const border: BorderConfig = {
      borderColor: 'red', // Override
    };

    PrimitiveStylingUtils.applyBorder(element, border, defaults);

    expect(element.style.borderWidth).toBe('1px'); // From defaults
    expect(element.style.borderColor).toBe('red'); // Overridden
  });
});

describe('PrimitiveStylingUtils - applyShadow', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  it('should apply box shadow', () => {
    const shadow: ShadowConfig = {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    };

    PrimitiveStylingUtils.applyShadow(element, shadow);

    // Browser normalizes shadow format, so just check it contains the values
    expect(element.style.boxShadow).toContain('rgba(0, 0, 0, 0.1)');
    expect(element.style.boxShadow).toContain('2px');
    expect(element.style.boxShadow).toContain('4px');
  });

  it('should apply text shadow', () => {
    const shadow: ShadowConfig = {
      textShadow: '1px 1px 2px black',
    };

    PrimitiveStylingUtils.applyShadow(element, shadow);

    // Browser normalizes shadow format, so just check it contains the values
    expect(element.style.textShadow).toContain('black');
    expect(element.style.textShadow).toContain('1px');
    expect(element.style.textShadow).toContain('2px');
  });
});

describe('PrimitiveStylingUtils - applyInteractionState', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  it('should apply default state', () => {
    const baseStyles: BaseStyleConfig = {
      backgroundColor: '#FFFFFF',
      cursor: 'default',
    };

    PrimitiveStylingUtils.applyInteractionState(element, baseStyles, {}, 'default');

    expect(element.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(element.style.cursor).toBe('default');
    expect(element.style.userSelect).toBe('none');
  });

  it('should apply hover state', () => {
    const baseStyles: BaseStyleConfig = {
      backgroundColor: '#FFFFFF',
    };

    const hoverStyles: BaseStyleConfig = {
      backgroundColor: '#EEEEEE',
      cursor: 'pointer',
    };

    PrimitiveStylingUtils.applyInteractionState(element, baseStyles, hoverStyles, 'hover');

    expect(element.style.backgroundColor).toBe('rgb(238, 238, 238)');
    expect(element.style.cursor).toBe('pointer');
  });

  it('should apply active state', () => {
    const baseStyles: BaseStyleConfig = {
      backgroundColor: '#FFFFFF',
    };

    const activeStyles: BaseStyleConfig = {
      backgroundColor: '#DDDDDD',
    };

    PrimitiveStylingUtils.applyInteractionState(element, baseStyles, activeStyles, 'active');

    expect(element.style.backgroundColor).toBe('rgb(221, 221, 221)');
  });

  it('should apply disabled state', () => {
    const baseStyles: BaseStyleConfig = {
      backgroundColor: '#FFFFFF',
    };

    const disabledStyles: BaseStyleConfig = {
      opacity: 0.5,
    };

    PrimitiveStylingUtils.applyInteractionState(element, baseStyles, disabledStyles, 'disabled');

    expect(element.style.opacity).toBe('0.5');
    expect(element.style.cursor).toBe('not-allowed');
  });

  it('should set common interaction properties', () => {
    PrimitiveStylingUtils.applyInteractionState(element, {}, {}, 'default');

    expect(element.style.userSelect).toBe('none');
    expect(element.style.outline).toBe('none');
    expect(element.style.pointerEvents).toBe('auto');
  });
});

describe('PrimitiveStylingUtils - normalizeColor', () => {
  it('should return color for valid hex', () => {
    const result = PrimitiveStylingUtils.normalizeColor('#FF0000', '#000000');
    expect(result).toBe('#FF0000');
  });

  it('should return color for valid rgb', () => {
    const result = PrimitiveStylingUtils.normalizeColor('rgb(255, 0, 0)', '#000000');
    expect(result).toBe('rgb(255, 0, 0)');
  });

  it('should return color for named colors', () => {
    const result = PrimitiveStylingUtils.normalizeColor('red', '#000000');
    expect(result).toBe('red');
  });

  it('should return fallback for invalid color', () => {
    const result = PrimitiveStylingUtils.normalizeColor('invalid123', '#000000');
    expect(result).toBe('#000000');
  });

  it('should return fallback for undefined', () => {
    const result = PrimitiveStylingUtils.normalizeColor(undefined, '#000000');
    expect(result).toBe('#000000');
  });
});

describe('PrimitiveStylingUtils - normalizeNumericValue', () => {
  it('should convert number to px', () => {
    const result = PrimitiveStylingUtils.normalizeNumericValue(10, 'px', 0);
    expect(result).toBe('10px');
  });

  it('should keep string as is', () => {
    const result = PrimitiveStylingUtils.normalizeNumericValue('100%', 'px', 0);
    expect(result).toBe('100%');
  });

  it('should use fallback for undefined', () => {
    const result = PrimitiveStylingUtils.normalizeNumericValue(undefined, 'px', 5);
    expect(result).toBe('5px');
  });

  it('should use custom unit', () => {
    const result = PrimitiveStylingUtils.normalizeNumericValue(1.5, 'em', 1);
    expect(result).toBe('1.5em');
  });
});

describe('PrimitiveStylingUtils - createFlexContainer', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  it('should create flex container with defaults', () => {
    PrimitiveStylingUtils.createFlexContainer(element);

    expect(element.style.display).toBe('flex');
    expect(element.style.flexDirection).toBe('row');
    expect(element.style.alignItems).toBe('center');
    expect(element.style.justifyContent).toBe('center');
  });

  it('should create flex container with column direction', () => {
    PrimitiveStylingUtils.createFlexContainer(element, 'column', 'flex-start', 'space-between');

    expect(element.style.flexDirection).toBe('column');
    expect(element.style.alignItems).toBe('flex-start');
    expect(element.style.justifyContent).toBe('space-between');
  });

  it('should apply gap when provided', () => {
    PrimitiveStylingUtils.createFlexContainer(element, 'row', 'center', 'center', 10);

    expect(element.style.gap).toBe('10px');
  });
});

describe('PrimitiveStylingUtils - applyTransition', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  it('should apply default transition', () => {
    PrimitiveStylingUtils.applyTransition(element);

    expect(element.style.transition).toBe('all 0.2s ease');
  });

  it('should apply custom transition', () => {
    PrimitiveStylingUtils.applyTransition(element, ['opacity', 'transform'], '0.3s', 'ease-in-out');

    expect(element.style.transition).toBe('opacity 0.3s ease-in-out, transform 0.3s ease-in-out');
  });
});

describe('PrimitiveStylingUtils - resetStyles', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');

    // Apply some styles first
    element.style.backgroundColor = 'red';
    element.style.color = 'white';
    element.style.fontSize = '16px';
    element.style.width = '100px';
    element.style.padding = '10px';
  });

  it('should reset all styles including layout', () => {
    PrimitiveStylingUtils.resetStyles(element, false);

    expect(element.style.backgroundColor).toBe('');
    expect(element.style.color).toBe('');
    expect(element.style.fontSize).toBe('');
    expect(element.style.width).toBe('');
    expect(element.style.padding).toBe('');
  });

  it('should reset styles but preserve layout', () => {
    PrimitiveStylingUtils.resetStyles(element, true);

    expect(element.style.backgroundColor).toBe('');
    expect(element.style.color).toBe('');
    expect(element.style.fontSize).toBe('');
    // Layout properties should remain
    expect(element.style.width).toBe('100px');
    expect(element.style.padding).toBe('10px');
  });
});
