/**
 * @fileoverview Button panel component for pane controls.
 *
 * This component provides the gear and collapse buttons for chart panes,
 * combining series configuration and pane management functionality in a
 * unified interface positioned in the top-right corner of each pane.
 */

import React, { useState } from 'react';
import { ButtonColors, ButtonDimensions, ButtonEffects } from '../primitives/PrimitiveDefaults';

/**
 * Props for the ButtonPanelComponent.
 */
interface ButtonPanelComponentProps {
  /** The pane ID this button panel belongs to */
  paneId: number;
  /** Whether the pane is currently collapsed */
  isCollapsed: boolean;
  /** Callback fired when collapse button is clicked */
  onCollapseClick: () => void;
  /** Callback fired when gear (settings) button is clicked */
  onGearClick: () => void;
  /** Whether to show the collapse button. Defaults to true. */
  showCollapseButton?: boolean;
  /** Whether to show the gear (settings) button. Defaults to true. */
  showGearButton?: boolean;
  /** Visual configuration for the buttons - uses PrimitiveDefaults when not specified */
  config?: {
    /** Button size in pixels - defaults to ButtonDimensions.PANE_ACTION_WIDTH */
    buttonSize?: number;
    /** Default button color - defaults to ButtonColors.DEFAULT_COLOR */
    buttonColor?: string;
    /** Button background color - defaults to ButtonColors.DEFAULT_BACKGROUND */
    buttonBackground?: string;
    /** Button border radius - defaults to 3px */
    buttonBorderRadius?: number;
    /** Button color on hover - defaults to ButtonColors.HOVER_COLOR */
    buttonHoverColor?: string;
    /** Button background color on hover - defaults to ButtonColors.HOVER_BACKGROUND */
    buttonHoverBackground?: string;
    /** Whether to show tooltips */
    showTooltip?: boolean;
  };
}

/**
 * Button panel component for pane controls.
 *
 * Renders a panel with gear (series configuration) and collapse buttons
 * positioned in the top-right corner of a chart pane. The gear button
 * always shows and opens the series configuration dialog, while the
 * collapse button can be conditionally hidden.
 *
 * @param props - Button panel configuration and event handlers
 * @returns The rendered button panel component
 *
 * @example
 * ```tsx
 * <ButtonPanelComponent
 *   paneId={0}
 *   isCollapsed={false}
 *   showCollapseButton={true}
 *   config={{
 *     buttonSize: 16,
 *     buttonColor: '#787B86',
 *     showTooltip: true
 *   }}
 * />
 * ```
 */
export const ButtonPanelComponent: React.FC<ButtonPanelComponentProps> = ({
  paneId: _paneId,
  isCollapsed,
  onCollapseClick,
  onGearClick,
  showCollapseButton = true, // Default to true for backward compatibility
  showGearButton = true, // Default to true for backward compatibility
  config = {}, // Default to empty object
}) => {
  const [hoveredButton, setHoveredButton] = useState<'collapse' | 'gear' | null>(null);

  // Use PrimitiveDefaults with fallbacks to config overrides
  const buttonSize = config.buttonSize ?? ButtonDimensions.PANE_ACTION_WIDTH;
  const buttonColor = config.buttonColor ?? ButtonColors.DEFAULT_COLOR;
  const buttonBackground = config.buttonBackground ?? ButtonColors.DEFAULT_BACKGROUND;
  const buttonBorderRadius = config.buttonBorderRadius ?? 3;
  const buttonHoverColor = config.buttonHoverColor ?? ButtonColors.HOVER_COLOR;
  const buttonHoverBackground = config.buttonHoverBackground ?? ButtonColors.HOVER_BACKGROUND;

  const panelStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    zIndex: 1000,
  };

  const getButtonStyle = (buttonType: 'collapse' | 'gear'): React.CSSProperties => {
    const isHovered = hoveredButton === buttonType;
    return {
      width: `${buttonSize}px`,
      height: `${buttonSize}px`,
      background: isHovered ? buttonHoverBackground : buttonBackground,
      border: ButtonEffects.DEFAULT_BORDER,
      borderRadius: `${buttonBorderRadius}px`,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isHovered ? buttonHoverColor : buttonColor,
      transition: ButtonEffects.DEFAULT_TRANSITION,
      userSelect: 'none',
      boxShadow: isHovered ? ButtonEffects.HOVER_BOX_SHADOW : 'none',
    };
  };

  return (
    <div className='button-panel' style={panelStyle}>
      {/* Gear Button - Only show when enabled */}
      {showGearButton && (
        <div
          className='gear-button'
          style={getButtonStyle('gear')}
          onMouseEnter={() => setHoveredButton('gear')}
          onMouseLeave={() => setHoveredButton(null)}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onGearClick();
          }}
          title='Series Settings'
        >
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18' width='14' height='14'>
            <path
              fill='currentColor'
              fillRule='evenodd'
              d='m3.1 9 2.28-5h7.24l2.28 5-2.28 5H5.38L3.1 9Zm1.63-6h8.54L16 9l-2.73 6H4.73L2 9l2.73-6Zm5.77 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm1 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z'
            ></path>
          </svg>
        </div>
      )}

      {/* Collapse Button - Only show when multiple panes exist */}
      {showCollapseButton && (
        <div
          className='collapse-button'
          style={getButtonStyle('collapse')}
          onMouseEnter={() => setHoveredButton('collapse')}
          onMouseLeave={() => setHoveredButton(null)}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onCollapseClick();
          }}
          title={isCollapsed ? 'Expand pane' : 'Collapse pane'}
        >
          {isCollapsed ? (
            // Expand icon (reversed double chevron)
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 15 15'
              width='12'
              height='12'
              fill='none'
            >
              <path stroke='currentColor' d='M4 13l3.5-3 3.5 3' className='bracket-down'></path>
              <path stroke='currentColor' d='M11 2 7.5 5 4 2' className='bracket-up'></path>
            </svg>
          ) : (
            // Collapse icon (double chevron)
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 15 15'
              width='12'
              height='12'
              fill='none'
            >
              <path stroke='currentColor' d='M11 2 7.5 5 4 2' className='bracket-up'></path>
              <path stroke='currentColor' d='M4 13l3.5-3 3.5 3' className='bracket-down'></path>
            </svg>
          )}
        </div>
      )}
    </div>
  );
};
