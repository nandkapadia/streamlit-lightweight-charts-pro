/**
 * @fileoverview Abstract Base Dialog Class
 *
 * Provides common dialog functionality including:
 * - Portal rendering to document.body
 * - Backdrop click handling
 * - Keyboard navigation (Escape, Enter)
 * - Focus management
 * - Animation support
 *
 * All dialog components should extend this class.
 *
 * @example
 * ```typescript
 * class MyDialog extends BaseDialog {
 *   protected createDialogContent(): HTMLDivElement {
 *     const content = document.createElement('div');
 *     content.textContent = 'My dialog content';
 *     return content;
 *   }
 *
 *   protected getDialogWidth(): string {
 *     return 'sm'; // or 'md', 'lg', or pixel value
 *   }
 * }
 *
 * const dialog = new MyDialog();
 * dialog.open();
 * ```
 */

import { EventManager } from './EventManager';
import { StyleManager } from '../styles/StyleManager';

/**
 * Dialog configuration options
 */
export interface BaseDialogConfig {
  /** Enable backdrop click to close */
  closeOnBackdropClick?: boolean;
  /** Enable Escape key to close */
  closeOnEscape?: boolean;
  /** Custom z-index for the overlay */
  zIndex?: number;
  /** Theme ('light' or 'dark') */
  theme?: 'light' | 'dark';
}

/**
 * Dialog size type
 */
export type DialogSize = 'sm' | 'md' | 'lg' | string;

/**
 * Abstract base class for all dialog components
 */
export abstract class BaseDialog {
  /** The dialog container element */
  protected _element: HTMLDivElement | null = null;

  /** The overlay element */
  protected _overlayElement: HTMLDivElement | null = null;

  /** Whether the dialog is currently open */
  protected _isOpen: boolean = false;

  /** Event manager for cleanup */
  protected _eventManager: EventManager;

  /** Previous focused element for restoration */
  protected _previousFocus: HTMLElement | null = null;

  /** Callback when dialog closes */
  protected _onCloseCallback?: () => void;

  /** Callback when dialog saves */
  protected _onSaveCallback?: () => void;

  /** Dialog configuration */
  protected _config: Required<BaseDialogConfig>;

  /** CSS class prefix helper */
  protected _cls = StyleManager.cls;

  /**
   * Create a new dialog instance
   *
   * @param config - Dialog configuration
   */
  constructor(config: BaseDialogConfig = {}) {
    this._config = {
      closeOnBackdropClick: config.closeOnBackdropClick ?? true,
      closeOnEscape: config.closeOnEscape ?? true,
      zIndex: config.zIndex ?? 10000,
      theme: config.theme ?? 'light',
    };

    this._eventManager = new EventManager();

    // Ensure styles are injected
    StyleManager.inject(this._config.theme);
  }

  // ============================================================================
  // Abstract Methods - Must be implemented by subclasses
  // ============================================================================

  /**
   * Create the dialog content
   *
   * Subclasses must implement this to provide their specific content.
   *
   * @returns The dialog content element
   */
  protected abstract createDialogContent(): HTMLDivElement;

  /**
   * Get the dialog width
   *
   * @returns 'sm', 'md', 'lg', or a specific CSS width value
   */
  protected abstract getDialogWidth(): DialogSize;

  // ============================================================================
  // Optional Override Methods
  // ============================================================================

  /**
   * Called when the dialog opens
   *
   * Override to perform setup when dialog becomes visible.
   */
  protected onOpen(): void {
    // Override in subclass if needed
  }

  /**
   * Called when the dialog closes
   *
   * Override to perform cleanup when dialog is hidden.
   */
  protected onClose(): void {
    // Override in subclass if needed
  }

  /**
   * Handle the save action
   *
   * Override to implement save behavior.
   */
  protected onSave(): void {
    // Override in subclass if needed
    if (this._onSaveCallback) {
      this._onSaveCallback();
    }
    this.close();
  }

  /**
   * Handle the cancel action
   *
   * Override to implement cancel behavior.
   */
  protected onCancel(): void {
    // Override in subclass if needed
    this.close();
  }

  /**
   * Get the dialog title
   *
   * Override to provide a custom title.
   */
  protected getDialogTitle(): string {
    return 'Dialog';
  }

  /**
   * Whether to show the footer
   */
  protected showFooter(): boolean {
    return true;
  }

  /**
   * Get custom footer content
   *
   * Override to provide custom footer buttons.
   */
  protected createFooterContent(): HTMLDivElement | null {
    return null;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Open the dialog
   */
  public open(): void {
    if (this._isOpen) {
      return;
    }

    // Save current focus
    this._savePreviousFocus();

    // Create and attach elements
    this._createElements();
    this._attachToDOM();

    // Set focus to dialog
    if (this._element) {
      this._element.focus();
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    this._isOpen = true;
    this.onOpen();
  }

  /**
   * Close the dialog
   */
  public close(): void {
    if (!this._isOpen) {
      return;
    }

    this.onClose();

    // Remove from DOM
    this._removeFromDOM();

    // Restore body scroll
    document.body.style.overflow = '';

    // Restore focus
    this._restorePreviousFocus();

    this._isOpen = false;

    // Call close callback
    if (this._onCloseCallback) {
      this._onCloseCallback();
    }
  }

  /**
   * Check if dialog is open
   */
  public get isOpen(): boolean {
    return this._isOpen;
  }

  /**
   * Set the close callback
   */
  public setOnClose(callback: () => void): void {
    this._onCloseCallback = callback;
  }

  /**
   * Set the save callback
   */
  public setOnSave(callback: () => void): void {
    this._onSaveCallback = callback;
  }

  /**
   * Destroy the dialog and clean up resources
   */
  public destroy(): void {
    this.close();
    this._eventManager.destroy();
    this._element = null;
    this._overlayElement = null;
  }

  // ============================================================================
  // Protected Helper Methods
  // ============================================================================

  /**
   * Get the dialog element
   */
  protected get element(): HTMLDivElement | null {
    return this._element;
  }

  /**
   * Update the dialog content
   *
   * Call this when state changes require re-rendering.
   */
  protected updateContent(): void {
    if (!this._element) return;

    const contentContainer = this._element.querySelector(`.${this._cls('dialog-content')}`);
    if (contentContainer) {
      // Clear existing content
      contentContainer.innerHTML = '';
      // Add new content
      const newContent = this.createDialogContent();
      while (newContent.firstChild) {
        contentContainer.appendChild(newContent.firstChild);
      }
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Create the dialog elements
   */
  private _createElements(): void {
    // Create overlay
    this._overlayElement = document.createElement('div');
    this._overlayElement.className = this._cls('dialog-overlay');
    this._overlayElement.style.zIndex = String(this._config.zIndex);

    // Create dialog
    this._element = document.createElement('div');
    this._element.className = this._cls('dialog');
    this._element.tabIndex = -1;
    this._element.setAttribute('role', 'dialog');
    this._element.setAttribute('aria-modal', 'true');

    // Apply width
    const width = this.getDialogWidth();
    if (width === 'sm' || width === 'md' || width === 'lg') {
      this._element.classList.add(this._cls(`dialog-${width}`));
    } else {
      this._element.style.width = width;
    }

    // Create header
    const header = this._createHeader();
    this._element.appendChild(header);

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = this._cls('dialog-content');
    const content = this.createDialogContent();
    while (content.firstChild) {
      contentContainer.appendChild(content.firstChild);
    }
    this._element.appendChild(contentContainer);

    // Create footer
    if (this.showFooter()) {
      const footer = this._createFooter();
      this._element.appendChild(footer);
    }

    // Add dialog to overlay
    this._overlayElement.appendChild(this._element);

    // Attach event listeners
    this._attachEventListeners();
  }

  /**
   * Create the dialog header
   */
  private _createHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.className = this._cls('dialog-header');

    const title = document.createElement('h3');
    title.className = this._cls('dialog-title');
    title.textContent = this.getDialogTitle();
    header.appendChild(title);

    // Close button (X)
    const closeBtn = document.createElement('button');
    closeBtn.className = this._cls('dialog-close');
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Close');
    this._eventManager.addEventListener(closeBtn, 'click', () => this.close());
    header.appendChild(closeBtn);

    return header;
  }

  /**
   * Create the dialog footer
   */
  private _createFooter(): HTMLDivElement {
    const customFooter = this.createFooterContent();
    if (customFooter) {
      return customFooter;
    }

    const footer = document.createElement('div');
    footer.className = this._cls('dialog-footer');

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = `${this._cls('btn')} ${this._cls('btn-secondary')}`;
    cancelBtn.textContent = 'Cancel';
    this._eventManager.addEventListener(cancelBtn, 'click', () => this.onCancel());
    footer.appendChild(cancelBtn);

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = `${this._cls('btn')} ${this._cls('btn-primary')}`;
    saveBtn.textContent = 'Save';
    this._eventManager.addEventListener(saveBtn, 'click', () => this.onSave());
    footer.appendChild(saveBtn);

    return footer;
  }

  /**
   * Attach event listeners
   */
  private _attachEventListeners(): void {
    if (!this._overlayElement || !this._element) return;

    // Backdrop click
    if (this._config.closeOnBackdropClick) {
      this._eventManager.addEventListener(
        this._overlayElement,
        'click',
        (e: Event) => this._handleBackdropClick(e as MouseEvent)
      );
    }

    // Prevent click propagation on dialog
    this._eventManager.addEventListener(
      this._element,
      'click',
      (e: Event) => e.stopPropagation()
    );

    // Keyboard handling
    this._eventManager.addEventListener(
      this._element,
      'keydown',
      (e: Event) => this._handleKeydown(e as KeyboardEvent)
    );
  }

  /**
   * Handle backdrop click
   */
  private _handleBackdropClick(e: MouseEvent): void {
    if (e.target === this._overlayElement) {
      this.onCancel();
    }
  }

  /**
   * Handle keyboard events
   */
  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._config.closeOnEscape) {
      e.preventDefault();
      this.onCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.onSave();
    }
  }

  /**
   * Attach dialog to DOM
   */
  private _attachToDOM(): void {
    if (this._overlayElement) {
      document.body.appendChild(this._overlayElement);
    }
  }

  /**
   * Remove dialog from DOM
   */
  private _removeFromDOM(): void {
    if (this._overlayElement && this._overlayElement.parentNode) {
      this._overlayElement.remove();
    }
    // Clear event listeners for this dialog instance
    this._eventManager.clear();
  }

  /**
   * Save previous focus element
   */
  private _savePreviousFocus(): void {
    this._previousFocus = document.activeElement as HTMLElement;
  }

  /**
   * Restore focus to previous element
   */
  private _restorePreviousFocus(): void {
    if (this._previousFocus && typeof this._previousFocus.focus === 'function') {
      try {
        this._previousFocus.focus();
      } catch {
        // Ignore focus errors
      }
    }
    this._previousFocus = null;
  }
}
