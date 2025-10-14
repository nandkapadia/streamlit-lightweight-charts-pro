/**
 * @fileoverview Button registry for managing button instances
 *
 * Provides centralized registration and retrieval of buttons,
 * enabling plugin-based button architecture where third-party
 * buttons can be registered dynamically.
 */

import { BaseButton } from './BaseButton';
import { logger } from '../../../utils/logger';

/**
 * Button registry singleton
 *
 * Manages all button instances for a button panel, allowing:
 * - Registration of new button types
 * - Retrieval of buttons by ID
 * - Ordered button lists based on priority
 * - Dynamic button addition/removal
 */
export class ButtonRegistry {
  private buttons: Map<string, BaseButton> = new Map();
  private buttonOrder: string[] = [];

  /**
   * Register a button in the registry
   *
   * @param button - Button instance to register
   * @param priority - Optional priority for ordering (lower = earlier in panel)
   */
  public register(button: BaseButton, priority: number = 100): void {
    const id = button.getId();

    if (this.buttons.has(id)) {
      logger.warn(`Button with ID '${id}' already registered, replacing`, 'ButtonRegistry');
    }

    this.buttons.set(id, button);

    // Insert button in order based on priority
    const insertIndex = this.buttonOrder.findIndex(existingId => {
      const existingButton = this.buttons.get(existingId);
      return (existingButton && priority < (existingButton as any).priority) || 100;
    });

    if (insertIndex === -1) {
      this.buttonOrder.push(id);
    } else {
      this.buttonOrder.splice(insertIndex, 0, id);
    }
  }

  /**
   * Unregister a button from the registry
   */
  public unregister(id: string): void {
    if (!this.buttons.has(id)) {
      logger.warn(`Button with ID '${id}' not found in registry`, 'ButtonRegistry');
      return;
    }

    this.buttons.delete(id);
    this.buttonOrder = this.buttonOrder.filter(buttonId => buttonId !== id);
  }

  /**
   * Get a button by ID
   */
  public getButton(id: string): BaseButton | undefined {
    return this.buttons.get(id);
  }

  /**
   * Get all registered buttons in order
   */
  public getAllButtons(): BaseButton[] {
    return this.buttonOrder
      .map(id => this.buttons.get(id))
      .filter((button): button is BaseButton => button !== undefined);
  }

  /**
   * Get all visible buttons in order
   */
  public getVisibleButtons(): BaseButton[] {
    return this.getAllButtons().filter(button => button.isVisible());
  }

  /**
   * Clear all buttons from registry
   */
  public clear(): void {
    this.buttons.clear();
    this.buttonOrder = [];
  }

  /**
   * Get count of registered buttons
   */
  public getButtonCount(): number {
    return this.buttons.size;
  }

  /**
   * Check if a button is registered
   */
  public hasButton(id: string): boolean {
    return this.buttons.has(id);
  }

  /**
   * Update button order manually
   */
  public setButtonOrder(order: string[]): void {
    // Validate that all IDs exist
    const invalidIds = order.filter(id => !this.buttons.has(id));
    if (invalidIds.length > 0) {
      logger.warn(`Invalid button IDs in order: ${invalidIds.join(', ')}`, 'ButtonRegistry');
      return;
    }

    this.buttonOrder = order;
  }

  /**
   * Get button order
   */
  public getButtonOrder(): string[] {
    return [...this.buttonOrder];
  }
}

/**
 * Create a new button registry instance
 */
export function createButtonRegistry(): ButtonRegistry {
  return new ButtonRegistry();
}
