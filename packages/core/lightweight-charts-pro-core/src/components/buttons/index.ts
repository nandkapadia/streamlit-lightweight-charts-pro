/**
 * @fileoverview Button system exports
 *
 * Provides a clean public API for the extensible button architecture.
 * Pure TypeScript implementation - no React dependencies.
 */

// Base classes and interfaces
export { BaseButton } from './base/BaseButton';
export type {
  BaseButtonConfig,
  ButtonState,
  ButtonStyling,
} from './base/ButtonConfig';
export { DEFAULT_BUTTON_STYLING } from './base/ButtonConfig';
export { ButtonRegistry } from './base/ButtonRegistry';

// Concrete button implementations
export { SeriesSettingsButton } from './types/SeriesSettingsButton';
export { CollapseButton } from './types/CollapseButton';
