/**
 * @fileoverview Button panel component for pane controls.
 *
 * This component provides the gear and collapse buttons for chart panes,
 * combining series configuration and pane management functionality in a
 * unified interface positioned in the top-right corner of each pane.
 *
 * Uses the extensible button architecture allowing custom buttons to be
 * added via the customButtons prop.
 */

import React, { useMemo, useEffect } from 'react';
import { ButtonColors, ButtonDimensions, ButtonEffects } from '../primitives/PrimitiveDefaults';
import { SeriesSettingsButton } from './buttons/types/SeriesSettingsButton';
import { CollapseButton } from './buttons/types/CollapseButton';
import { createButtonRegistry } from './buttons/base/ButtonRegistry';

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
  /** Whether to show the series settings button. Defaults to true. */
  showSeriesSettingsButton?: boolean;
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
  /** Custom buttons to add to the panel (in addition to gear and collapse) */
  customButtons?: import('./buttons/base/BaseButton').BaseButton[];
}

/**
 * Button panel component for pane controls.
 *
 * Renders a panel with gear (series configuration) and collapse buttons
 * positioned in the top-right corner of a chart pane. The gear button
 * opens the series configuration dialog, while the collapse button
 * can be conditionally hidden.
 *
 * Uses the extensible button architecture (BaseButton, SettingsButton, CollapseButton)
 * allowing additional custom buttons to be added via the customButtons prop.
 *
 * @param props - Button panel configuration and event handlers
 * @returns The rendered button panel component
 *
 * @example Basic usage
 * ```tsx
 * <ButtonPanelComponent
 *   paneId={0}
 *   isCollapsed={false}
 *   onGearClick={() => openSettings()}
 *   onCollapseClick={() => toggleCollapse()}
 *   showCollapseButton={true}
 *   config={{
 *     buttonSize: 16,
 *     buttonColor: '#787B86',
 *     showTooltip: true
 *   }}
 * />
 * ```
 *
 * @example With custom buttons
 * ```tsx
 * const deleteButton = new DeleteButton({
 *   id: 'delete',
 *   tooltip: 'Delete series',
 *   onDeleteClick: () => removeSeries(),
 * });
 *
 * <ButtonPanelComponent
 *   paneId={0}
 *   isCollapsed={false}
 *   onGearClick={() => openSettings()}
 *   onCollapseClick={() => toggleCollapse()}
 *   customButtons={[deleteButton]}
 * />
 * ```
 */
export const ButtonPanelComponent: React.FC<ButtonPanelComponentProps> = ({
  paneId,
  isCollapsed,
  onCollapseClick,
  onGearClick,
  showCollapseButton = true,
  showSeriesSettingsButton = true,
  config = {},
  customButtons = [],
}) => {
  // Create button registry for managing buttons
  const registry = useMemo(() => createButtonRegistry(), []);

  // Build button styling config from props (with PrimitiveDefaults fallbacks)
  const buttonStyling = useMemo(
    () => ({
      size: config.buttonSize ?? ButtonDimensions.PANE_ACTION_WIDTH,
      color: config.buttonColor ?? ButtonColors.DEFAULT_COLOR,
      background: config.buttonBackground ?? ButtonColors.DEFAULT_BACKGROUND,
      borderRadius: config.buttonBorderRadius ?? 3,
      hoverColor: config.buttonHoverColor ?? ButtonColors.HOVER_COLOR,
      hoverBackground: config.buttonHoverBackground ?? ButtonColors.HOVER_BACKGROUND,
      border: ButtonEffects.DEFAULT_BORDER,
      hoverBoxShadow: ButtonEffects.HOVER_BOX_SHADOW,
    }),
    [config]
  );

  // Initialize buttons when dependencies change
  useEffect(() => {
    // Clear existing buttons
    registry.clear();

    // Add series settings button if enabled
    if (showSeriesSettingsButton) {
      const settingsButton = new SeriesSettingsButton({
        id: `series-settings-button-pane-${paneId}`,
        tooltip: 'Series Settings',
        onSeriesSettingsClick: onGearClick,
        styling: buttonStyling,
      });
      registry.register(settingsButton, 10); // Priority 10 (appears first)
    }

    // Add collapse button if enabled
    if (showCollapseButton) {
      const collapseButton = new CollapseButton({
        id: `collapse-button-pane-${paneId}`,
        tooltip: isCollapsed ? 'Expand pane' : 'Collapse pane',
        isCollapsed: isCollapsed,
        onCollapseClick: onCollapseClick,
        styling: buttonStyling,
      });
      registry.register(collapseButton, 20); // Priority 20 (appears after gear)
    }

    // Add custom buttons (lower priority, appear after built-in buttons)
    customButtons.forEach((button, index) => {
      registry.register(button, 100 + index);
    });
  }, [
    paneId,
    isCollapsed,
    onCollapseClick,
    onGearClick,
    showCollapseButton,
    showSeriesSettingsButton,
    buttonStyling,
    customButtons,
    registry,
  ]);

  // Update collapse button state when isCollapsed changes
  useEffect(() => {
    const collapseButton = registry.getButton(`collapse-button-pane-${paneId}`);
    if (collapseButton && collapseButton instanceof CollapseButton) {
      collapseButton.setCollapsedState(isCollapsed);
    }
  }, [isCollapsed, paneId, registry]);

  // Get all visible buttons from registry
  const buttons = registry.getVisibleButtons();

  const panelStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    zIndex: 1000,
  };

  return (
    <div className='button-panel' style={panelStyle}>
      {buttons.map(button => (
        <React.Fragment key={button.getId()}>{button.render()}</React.Fragment>
      ))}
    </div>
  );
};
