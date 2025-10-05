/**
 * Custom Streamlit integration hooks
 *
 * Provides lightweight hooks for Streamlit component integration with
 * precise control over component lifecycle to prevent race conditions.
 */

import { useState, useEffect } from 'react';
import { Streamlit, RenderData } from 'streamlit-component-lib';

/**
 * Hook for accessing Streamlit render data with proper initialization timing.
 *
 * This hook calls setComponentReady() with a small delay to ensure Streamlit's
 * ComponentRegistry has had time to create the ComponentInstance.
 *
 * @returns RenderData | undefined - The current render data from Streamlit
 */
export function useStreamlitRenderData(): RenderData | undefined {
  const [renderData, setRenderData] = useState<RenderData | undefined>();

  useEffect(() => {
    const onRenderEvent = (event: Event) => {
      const renderEvent = event as CustomEvent<RenderData>;
      setRenderData(renderEvent.detail);
    };

    // Set up event listener for render events
    Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRenderEvent);

    // Call setComponentReady with a small delay to allow ComponentInstance registration
    // This prevents "Received component message for unregistered ComponentInstance" warnings
    const readyTimer = setTimeout(() => {
      Streamlit.setComponentReady();
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(readyTimer);
      Streamlit.events.removeEventListener(Streamlit.RENDER_EVENT, onRenderEvent);
    };
  }, []);

  return renderData;
}

/**
 * Hook for automatic frame height reporting.
 *
 * Calls Streamlit.setFrameHeight() on every render to keep the iframe
 * height in sync with the component's content.
 */
export function useStreamlitFrameHeight(): void {
  useEffect(() => {
    // Only call setFrameHeight after component is ready to prevent warnings
    const timer = setTimeout(() => {
      Streamlit.setFrameHeight();
    }, 150); // Slightly longer delay to ensure component is registered

    return () => clearTimeout(timer);
  });
}
