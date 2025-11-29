/**
 * @fileoverview Dialog Components Exports
 *
 * Framework-agnostic dialog components for lightweight-charts-pro.
 *
 * This module provides pure TypeScript implementations of:
 * - ColorPickerDialog - TradingView-style color picker
 * - LineEditorDialog - Line configuration editor
 * - SeriesSettingsDialog - Main series settings dialog
 *
 * Also exports supporting infrastructure:
 * - Base dialog classes and utilities
 * - State management
 * - Event management
 * - Style management
 *
 * @example
 * ```typescript
 * import {
 *   ColorPickerDialog,
 *   LineEditorDialog,
 *   SeriesSettingsDialog,
 *   StyleManager,
 * } from 'lightweight-charts-pro-core/dialogs';
 *
 * // Inject styles once at app startup
 * StyleManager.inject();
 *
 * // Create and use dialogs
 * const colorPicker = new ColorPickerDialog({
 *   color: '#ff0000',
 *   opacity: 100,
 *   onSave: (color, opacity) => console.log(color, opacity),
 * });
 *
 * colorPicker.open();
 * ```
 */

// =============================================================================
// Base Infrastructure
// =============================================================================

export {
  // State management
  DialogState,
  createDialogState,
  // Event management
  EventManager,
  createEventManager,
  addOneTimeListener,
  // Base dialog
  BaseDialog,
  // Optimistic state
  OptimisticStateManager,
  createOptimisticStateManager,
} from './base';

export type {
  StateSubscriber,
  Unsubscribe,
  BaseDialogConfig,
  DialogSize,
  OptimisticSubscriber,
  CommitCallback,
} from './base';

// =============================================================================
// Style Management
// =============================================================================

export {
  StyleManager,
  LIGHT_THEME,
  DARK_THEME,
  CSS_PREFIX,
} from './styles';

export type { DialogTheme } from './styles';

// =============================================================================
// Dialog Components
// =============================================================================

// Color Picker
export { ColorPickerDialog, COLOR_PALETTE } from './ColorPickerDialog';
export type { ColorPickerDialogConfig } from './ColorPickerDialog';

// Line Editor
export {
  LineEditorDialog,
  THICKNESS_OPTIONS,
  STYLE_OPTIONS,
} from './LineEditorDialog';
export type { LineConfig, LineEditorDialogConfig } from './LineEditorDialog';

// Series Settings Renderer
export {
  SeriesSettingsRenderer,
  LINE_STYLE_OPTIONS,
  LINE_STYLE_LABELS,
  propertyToLabel,
} from './SeriesSettingsRenderer';
export type {
  SettingType,
  SeriesSettings,
  SeriesConfig,
  LineConfigValue,
  SeriesSettingsRendererCallbacks,
  SeriesSettingsRendererConfig,
} from './SeriesSettingsRenderer';

// Tab Manager
export { TabManager } from './TabManager';
export type { Tab, TabManagerConfig } from './TabManager';

// Form State Manager
export { FormStateManager } from './FormStateManager';
export type {
  SeriesFormConfig,
  SeriesConfigMap,
  FormStateManagerConfig,
  FormStateChangeEvent,
  FormStateSubscriber,
} from './FormStateManager';

// Series Settings Dialog
export { SeriesSettingsDialog } from './SeriesSettingsDialog';
export type { SeriesInfo, SeriesSettingsDialogConfig } from './SeriesSettingsDialog';
