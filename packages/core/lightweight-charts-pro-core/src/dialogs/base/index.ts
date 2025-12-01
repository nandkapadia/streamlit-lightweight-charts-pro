/**
 * @fileoverview Base dialog infrastructure exports
 *
 * Provides foundational classes and utilities for building dialogs.
 */

// State management
export { DialogState, createDialogState } from './DialogState';
export type { StateSubscriber, Unsubscribe } from './DialogState';

// Event management
export { EventManager, createEventManager, addOneTimeListener } from './EventManager';

// Base dialog class
export { BaseDialog } from './BaseDialog';
export type { BaseDialogConfig, DialogSize } from './BaseDialog';

// Optimistic state management
export {
  OptimisticStateManager,
  createOptimisticStateManager,
} from './OptimisticStateManager';
export type { OptimisticSubscriber, CommitCallback } from './OptimisticStateManager';
