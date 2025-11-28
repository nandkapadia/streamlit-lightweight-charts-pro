/**
 * Custom Streamlit integration hooks
 *
 * Provides lightweight hooks for Streamlit component integration with
 * precise control over component lifecycle to prevent race conditions.
 */

import { useState, useEffect } from 'react';
import { Streamlit, RenderData } from 'streamlit-component-lib';

/**
 * Global flag to track if Streamlit component is ready
 * This prevents "Received component message for unregistered ComponentInstance" errors
 */
let isComponentReady = false;

/**
 * Check if the Streamlit component is ready to receive messages
 * @returns true if setComponentReady() has been called
 */
export function isStreamlitComponentReady(): boolean {
  return isComponentReady;
}

/**
 * Hook for accessing Streamlit render data with proper initialization timing.
 *
 * Waits for RENDER_EVENT before setting component ready flag to ensure
 * Streamlit's ComponentRegistry has registered the component.
 *
 * @returns RenderData | undefined - The current render data from Streamlit
 */
export function useStreamlitRenderData(): RenderData | undefined {
  const [renderData, setRenderData] = useState<RenderData | undefined>();

  useEffect(() => {
    const onRenderEvent = (event: Event) => {
      const renderEvent = event as CustomEvent<RenderData>;
      setRenderData(renderEvent.detail);

      // Set component as ready after first render event
      if (!isComponentReady) {
        isComponentReady = true;
      }
    };

    Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRenderEvent);

    // Delay setComponentReady() to allow parent's ComponentInstance to register listener
    // This prevents race condition with ComponentRegistry
    const callSetComponentReady = () => {
      setTimeout(() => {
        Streamlit.setComponentReady();
      }, 100);
    };

    if (document.readyState === 'complete') {
      callSetComponentReady();
    } else {
      window.addEventListener('load', callSetComponentReady);
    }

    return () => {
      window.removeEventListener('load', callSetComponentReady);
      // CRITICAL FIX: Don't reset isComponentReady to false on cleanup
      // This flag should remain true once set to prevent race conditions with:
      // 1. Chart reinitialization when changing symbols/data
      // 2. Primitive creation (legends, rectangles) that happens asynchronously
      // 3. setFrameHeight() calls from layout changes
      // Only Streamlit itself should reset this when the component is truly destroyed
      // isComponentReady = false; // REMOVED
      Streamlit.events.removeEventListener(Streamlit.RENDER_EVENT, onRenderEvent);
    };
  }, []);

  return renderData;
}

/**
 * Safely call Streamlit.setFrameHeight() with error handling.
 * Prevents "unregistered ComponentInstance" errors by validating
 * component state before calling.
 *
 * @param height Optional specific height to set (if omitted, uses auto-height)
 * @returns true if successful, false if failed
 */
export function safeSetFrameHeight(height?: number): boolean {
  // Check if component is ready
  if (!isComponentReady) {
    return false;
  }

  // Check if Streamlit object exists and has setFrameHeight method
  if (typeof Streamlit === 'undefined' || typeof Streamlit.setFrameHeight !== 'function') {
    return false;
  }

  try {
    if (height !== undefined) {
      Streamlit.setFrameHeight(height);
    } else {
      Streamlit.setFrameHeight();
    }
    return true;
  } catch (error) {
    // Silently catch errors - component instance may have been unregistered
    // This is normal during Streamlit re-renders and symbol changes
    return false;
  }
}

/**
 * Hook for automatic frame height reporting.
 *
 * Updates iframe height on every render. Only calls setFrameHeight()
 * after component is ready to prevent ComponentRegistry errors.
 * Uses safe wrapper to handle unregistered component instances gracefully.
 */
export function useStreamlitFrameHeight(): void {
  useEffect(() => {
    if (isComponentReady) {
      safeSetFrameHeight();
    }
  });
}
