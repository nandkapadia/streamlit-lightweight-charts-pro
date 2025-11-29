/**
 * @fileoverview Tab Manager for Dialogs (Pure TypeScript)
 *
 * Manages a tabbed interface with:
 * - Scrollable tab list with arrow buttons
 * - Active tab highlighting
 * - Tab click handling
 *
 * @example
 * ```typescript
 * const tabManager = new TabManager({
 *   tabs: [
 *     { id: 'series-1', title: 'OHLC' },
 *     { id: 'series-2', title: 'Volume' },
 *   ],
 *   activeTabId: 'series-1',
 *   onTabChange: (id) => console.log('Tab changed:', id),
 * });
 *
 * container.appendChild(tabManager.getElement());
 * ```
 */

import { EventManager } from './base/EventManager';
import { DialogState } from './base/DialogState';
import { StyleManager } from './styles/StyleManager';

/**
 * Tab definition
 */
export interface Tab {
  /** Unique tab identifier */
  id: string;
  /** Tab display title */
  title: string;
}

/**
 * Tab manager configuration
 */
export interface TabManagerConfig {
  /** List of tabs */
  tabs: Tab[];
  /** Initially active tab ID */
  activeTabId?: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
}

/**
 * Tab manager internal state
 */
interface TabManagerState {
  activeTabId: string;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

/**
 * Tab Manager - Pure TypeScript Implementation
 *
 * Manages a scrollable tab interface with active state tracking.
 */
export class TabManager {
  private _element: HTMLDivElement;
  private _tabsListElement: HTMLDivElement | null = null;
  private _leftScrollBtn: HTMLButtonElement | null = null;
  private _rightScrollBtn: HTMLButtonElement | null = null;
  private _eventManager: EventManager;
  private _state: DialogState<TabManagerState>;
  private _tabs: Tab[];
  private _onTabChange?: (tabId: string) => void;
  private _cls = StyleManager.cls;

  /**
   * Create a new TabManager
   *
   * @param config - Tab manager configuration
   */
  constructor(config: TabManagerConfig) {
    this._tabs = config.tabs;
    this._onTabChange = config.onTabChange;
    this._eventManager = new EventManager();

    const initialActiveId = config.activeTabId || (config.tabs.length > 0 ? config.tabs[0].id : '');

    this._state = new DialogState<TabManagerState>({
      activeTabId: initialActiveId,
      canScrollLeft: false,
      canScrollRight: false,
    });

    // Ensure styles are injected
    StyleManager.inject();

    this._element = this._createTabContainer();

    // Subscribe to state changes
    this._state.subscribe(() => this._updateUI());

    // Check scroll state after render
    requestAnimationFrame(() => this._updateScrollState());
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get the tab container element
   */
  public getElement(): HTMLDivElement {
    return this._element;
  }

  /**
   * Get the currently active tab ID
   */
  public getActiveTabId(): string {
    return this._state.getProperty('activeTabId');
  }

  /**
   * Set the active tab
   *
   * @param tabId - Tab ID to activate
   */
  public setActiveTab(tabId: string): void {
    if (this._tabs.some((t) => t.id === tabId)) {
      this._state.set({ activeTabId: tabId });
      if (this._onTabChange) {
        this._onTabChange(tabId);
      }
    }
  }

  /**
   * Update the tabs list
   *
   * @param tabs - New tabs list
   */
  public setTabs(tabs: Tab[]): void {
    this._tabs = tabs;
    this._rebuildTabs();
  }

  /**
   * Destroy the tab manager and clean up
   */
  public destroy(): void {
    this._eventManager.destroy();
    this._state.clearSubscribers();
    this._element.remove();
  }

  // ============================================================================
  // Private: Create Elements
  // ============================================================================

  /**
   * Create the tab container
   */
  private _createTabContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = this._cls('tabs-container');

    // Left scroll button
    this._leftScrollBtn = this._createScrollButton('left');
    container.appendChild(this._leftScrollBtn);

    // Tabs list
    this._tabsListElement = document.createElement('div');
    this._tabsListElement.className = this._cls('tabs-list');

    this._tabs.forEach((tab) => {
      const tabEl = this._createTab(tab);
      this._tabsListElement!.appendChild(tabEl);
    });

    container.appendChild(this._tabsListElement);

    // Right scroll button
    this._rightScrollBtn = this._createScrollButton('right');
    container.appendChild(this._rightScrollBtn);

    // Listen for scroll to update button states
    this._eventManager.addEventListener(this._tabsListElement, 'scroll', () => {
      this._updateScrollState();
    });

    return container;
  }

  /**
   * Create a scroll button
   */
  private _createScrollButton(direction: 'left' | 'right'): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = this._cls('tabs-scroll-btn');
    button.disabled = true;
    button.setAttribute('aria-label', `Scroll ${direction}`);

    // Arrow SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('fill', 'none');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');

    if (direction === 'left') {
      path.setAttribute('d', 'M10 12L6 8L10 4');
    } else {
      path.setAttribute('d', 'M6 4L10 8L6 12');
    }

    svg.appendChild(path);
    button.appendChild(svg);

    this._eventManager.addEventListener(button, 'click', () => {
      this._scroll(direction);
    });

    return button;
  }

  /**
   * Create a tab element
   */
  private _createTab(tab: Tab): HTMLButtonElement {
    const tabEl = document.createElement('button');
    tabEl.className = this._cls('tab');
    tabEl.textContent = tab.title;
    tabEl.dataset.tabId = tab.id;

    if (tab.id === this._state.getProperty('activeTabId')) {
      tabEl.classList.add('active');
    }

    this._eventManager.addEventListener(tabEl, 'click', () => {
      this._handleTabClick(tab.id);
    });

    return tabEl;
  }

  /**
   * Rebuild all tabs
   */
  private _rebuildTabs(): void {
    if (!this._tabsListElement) return;

    // Clear existing tabs
    this._tabsListElement.innerHTML = '';

    // Recreate tabs
    this._tabs.forEach((tab) => {
      const tabEl = this._createTab(tab);
      this._tabsListElement!.appendChild(tabEl);
    });

    // Ensure active tab is valid
    const activeId = this._state.getProperty('activeTabId');
    if (!this._tabs.some((t) => t.id === activeId) && this._tabs.length > 0) {
      this._state.set({ activeTabId: this._tabs[0].id });
    }

    // Update scroll state
    this._updateScrollState();
  }

  // ============================================================================
  // Private: Event Handlers
  // ============================================================================

  /**
   * Handle tab click
   */
  private _handleTabClick(tabId: string): void {
    if (tabId !== this._state.getProperty('activeTabId')) {
      this._state.set({ activeTabId: tabId });
      if (this._onTabChange) {
        this._onTabChange(tabId);
      }
    }
  }

  /**
   * Scroll the tabs list
   */
  private _scroll(direction: 'left' | 'right'): void {
    if (!this._tabsListElement) return;

    const scrollAmount = 100;
    const currentScroll = this._tabsListElement.scrollLeft;

    if (direction === 'left') {
      this._tabsListElement.scrollLeft = currentScroll - scrollAmount;
    } else {
      this._tabsListElement.scrollLeft = currentScroll + scrollAmount;
    }
  }

  // ============================================================================
  // Private: UI Updates
  // ============================================================================

  /**
   * Update UI based on state
   */
  private _updateUI(): void {
    if (!this._tabsListElement) return;

    const activeTabId = this._state.getProperty('activeTabId');

    // Update tab active states
    const tabs = this._tabsListElement.querySelectorAll(`.${this._cls('tab')}`);
    tabs.forEach((tab) => {
      const tabEl = tab as HTMLButtonElement;
      const isActive = tabEl.dataset.tabId === activeTabId;
      tabEl.classList.toggle('active', isActive);
    });

    // Update scroll buttons
    this._updateScrollButtons();
  }

  /**
   * Update scroll state based on scroll position
   */
  private _updateScrollState(): void {
    if (!this._tabsListElement) return;

    const { scrollLeft, scrollWidth, clientWidth } = this._tabsListElement;

    this._state.set({
      canScrollLeft: scrollLeft > 0,
      canScrollRight: scrollLeft < scrollWidth - clientWidth - 1,
    });
  }

  /**
   * Update scroll button disabled states
   */
  private _updateScrollButtons(): void {
    const state = this._state.get();

    if (this._leftScrollBtn) {
      this._leftScrollBtn.disabled = !state.canScrollLeft;
    }

    if (this._rightScrollBtn) {
      this._rightScrollBtn.disabled = !state.canScrollRight;
    }
  }
}
