/**
 * @fileoverview Main entry point for the Streamlit LightweightCharts component.
 *
 * This module serves as the bridge between Streamlit and the React-based chart
 * component. It handles Streamlit's component lifecycle, data communication,
 * and rendering setup.
 *
 * Key responsibilities:
 * - Initialize React root and render the chart component
 * - Handle Streamlit component communication
 * - Manage component lifecycle and cleanup
 * - Provide responsive height reporting
 * - Handle resize observer management
 */

// Standard Imports
import React, { useEffect, useRef, useCallback, useState } from 'react';

// Utility Imports
import { logger } from './utils/logger';

// Third Party Imports
import { createRoot } from 'react-dom/client';
import { Streamlit } from 'streamlit-component-lib';

// Local Imports
import LightweightCharts from './LightweightCharts';
import { ComponentConfig } from './types';
import { ResizeObserverManager } from './utils/resizeObserverManager';
import {
  useStreamlitRenderData,
  useStreamlitFrameHeight,
  isStreamlitComponentReady,
} from './hooks/useStreamlit';

/**
 * Main App component that renders the LightweightCharts component.
 *
 * This component is wrapped in StreamlitProvider to access Streamlit's
 * rendering data and handles the chart component lifecycle.
 *
 * @returns JSX.Element - The rendered app with chart component
 */
const App: React.FC = () => {
  // Get Streamlit render data (props passed from Python)
  const renderData = useStreamlitRenderData();

  // Auto-report frame height on every render
  useStreamlitFrameHeight();

  // Handle config changes from Streamlit
  useEffect(() => {
    if (renderData?.args) {
      // Check if this is a config_change event
      if (renderData.args && typeof renderData.args === 'object' && 'type' in renderData.args) {
        const eventData = renderData.args as any;
        if (eventData.type === 'config_change') {
          // Set the config change state to pass to LightweightCharts component
          setConfigChange({
            paneId: eventData.paneId,
            seriesId: eventData.seriesId,
            configPatch: eventData.configPatch,
            timestamp: eventData.timestamp,
          });
        }
      }
    }
  }, [renderData]);

  // DOM container reference for the chart
  const containerRef = useRef<HTMLDivElement>(null);

  // Component state tracking
  const isReadyRef = useRef(false);
  const isMountedRef = useRef(false);

  // Config change tracking
  const [configChange, setConfigChange] = useState<any>(null);

  // Resize observer manager for responsive behavior
  const resizeObserverManager = useRef<ResizeObserverManager>(new ResizeObserverManager());

  // Height reporting state management
  const heightReportTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastReportTime = useRef(0);
  const isReportingHeight = useRef(false); // Prevent recursive height reporting
  const lastReportedHeight = useRef(0); // Track last reported height to prevent unnecessary reports
  const pendingHeightReport = useRef<number | null>(null); // Track pending height to prevent loops

  /**
   * Callback function called when charts are ready for interaction.
   *
   * This function is triggered by the LightweightCharts component when all
   * chart instances have been initialized and are ready for user interaction.
   *
   * Note: setComponentReady() is now called by useStreamlitRenderData hook
   * after receiving the first render event, preventing race conditions.
   */
  const handleChartsReady = () => {
    isReadyRef.current = true;
    // Charts are ready - trigger initial height report
    reportHeightWithFallback().catch(error => {});
  };

  // Enhanced height reporting with multiple detection methods and loop prevention
  const reportHeightWithFallback = useCallback(async () => {
    if (
      !containerRef.current ||
      !isReadyRef.current ||
      !isMountedRef.current ||
      isReportingHeight.current
    ) {
      return;
    }

    // Set reporting flag to prevent recursive calls
    isReportingHeight.current = true;

    try {
      // Method 1: Try container dimensions first
      let containerHeight = 0;
      const config = renderData?.args?.config as ComponentConfig;
      const chartHeight = renderData?.args?.height || config?.charts?.[0]?.chart?.height || 400;

      try {
        containerHeight = containerRef.current.scrollHeight;
      } catch (error) {
        logger.error('Failed to set Streamlit component ready', 'StreamlitComponent', error);
      }

      // Method 2: Try computed styles
      if (!containerHeight && typeof window !== 'undefined') {
        try {
          const computedStyle = window.getComputedStyle(containerRef.current);
          containerHeight = parseInt(computedStyle.height) || 0;
        } catch (error) {
          logger.error('Failed to get computed style height', 'StreamlitComponent', error);
        }
      }

      // Method 3: Try offset dimensions
      if (!containerHeight) {
        try {
          containerHeight = containerRef.current.offsetHeight;
        } catch (error) {
          logger.error('Failed to get offset height', 'StreamlitComponent', error);
        }
      }

      // Method 4: Try client dimensions
      if (!containerHeight) {
        try {
          containerHeight = containerRef.current.clientHeight;
        } catch (error) {
          logger.error('Failed to get client height', 'StreamlitComponent', error);
        }
      }

      // Calculate total height with improved logic to prevent loops
      const totalHeight = Math.max(containerHeight, chartHeight);

      // Use the calculated height directly without adding arbitrary padding
      const finalHeight = totalHeight;

      // Check if this height is different from what we last reported
      const heightDifference = Math.abs(finalHeight - lastReportedHeight.current);

      // Only report if height has changed significantly (more than 5px to account for small variations)
      if (heightDifference > 5 && pendingHeightReport.current !== finalHeight) {
        // No padding needed - use the actual calculated height

        // Store the height we're about to report to prevent loops
        pendingHeightReport.current = finalHeight;
        lastReportedHeight.current = finalHeight;

        // Report height to Streamlit only if component is ready and mounted
        if (
          isMountedRef.current &&
          isStreamlitComponentReady() &&
          typeof Streamlit !== 'undefined' &&
          Streamlit.setFrameHeight
        ) {
          try {
            Streamlit.setFrameHeight(finalHeight);
          } catch (error) {
            logger.error('Failed to set Streamlit frame height', 'StreamlitComponent', error);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to report height to Streamlit', 'StreamlitComponent', error);
    } finally {
      // Clear reporting flag after a short delay
      setTimeout(() => {
        isReportingHeight.current = false;
        if (pendingHeightReport.current !== null) {
          pendingHeightReport.current = null;
        }
      }, 200);
    }
  }, [renderData?.args?.height, renderData?.args?.config]);

  // Debounced height reporting with improved loop prevention
  const debouncedReportHeight = useCallback(() => {
    // Don't schedule height reporting if component is not mounted or already reporting
    if (!isMountedRef.current || isReportingHeight.current) {
      return;
    }

    const now = Date.now();
    if (now - lastReportTime.current < 1000) {
      // Increased to 1000ms to reduce frequency
      // Throttle to max once every 1000ms to prevent rapid-fire updates
      return;
    }

    if (heightReportTimeout.current) {
      clearTimeout(heightReportTimeout.current);
    }

    heightReportTimeout.current = setTimeout(() => {
      // Check again if component is still mounted before reporting
      if (isMountedRef.current && !isReportingHeight.current) {
        lastReportTime.current = Date.now();
        reportHeightWithFallback().catch(error => {});
      }
    }, 1000); // Increased to 1000ms to reduce frequency
  }, [reportHeightWithFallback]);

  // Enhanced height reporting with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return undefined;

    // Report height immediately
    reportHeightWithFallback().catch(error => {});

    // Set up ResizeObserver for height changes
    resizeObserverManager.current.addObserver(
      'streamlit-container',
      containerRef.current,
      entry => {
        // Don't process resize events if component is not mounted or if we're currently reporting height
        if (!isMountedRef.current || isReportingHeight.current) {
          return;
        }

        // Handle both single entry and array of entries
        const entries = Array.isArray(entry) ? entry : [entry];

        entries.forEach(singleEntry => {
          if (singleEntry.target === containerRef.current) {
            const { width, height } = singleEntry.contentRect;

            // Check if dimensions are valid and have actually changed significantly
            if (width > 0 && height > 0) {
              const currentHeight = lastReportedHeight.current;
              const heightDiff = Math.abs(height - currentHeight);

              // Only report if height has changed significantly (more than 20px difference)
              // and we're not already in a reporting cycle
              if (
                heightDiff > 20 &&
                !isReportingHeight.current &&
                pendingHeightReport.current !== height
              ) {
                debouncedReportHeight();
              }
            }
          }
        });
      },
      { throttleMs: 500, debounceMs: 300 } // Much higher throttling to prevent infinite loops
    );

    return () => {
      if (heightReportTimeout.current) {
        clearTimeout(heightReportTimeout.current);
      }
    };
  }, [reportHeightWithFallback, debouncedReportHeight]);

  // Enhanced height reporting with window resize
  useEffect(() => {
    // Only add resize listener in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const handleWindowResize = () => {
      debouncedReportHeight();
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [debouncedReportHeight]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    // Capture the current ref value to avoid stale closure issues
    const currentResizeObserverManager = resizeObserverManager.current;

    return () => {
      isMountedRef.current = false;
      isReadyRef.current = false;

      // Reset height reporting state to prevent lingering issues
      isReportingHeight.current = false;
      lastReportedHeight.current = 0;
      pendingHeightReport.current = null;
      lastReportTime.current = 0;

      // Cleanup resize observers using captured reference
      if (currentResizeObserverManager) {
        currentResizeObserverManager.cleanup();
      }

      // Clear timeout
      if (heightReportTimeout.current) {
        clearTimeout(heightReportTimeout.current);
        heightReportTimeout.current = null;
      }
    };
  }, []);

  // Report height when height prop changes (with more conservative approach)
  useEffect(() => {
    if (isReadyRef.current && isMountedRef.current && !isReportingHeight.current) {
      // Only report if height has actually changed significantly
      const newHeight = renderData?.args?.height || 400;
      if (Math.abs(newHeight - lastReportedHeight.current) > 20) {
        debouncedReportHeight();
      }
    }
  }, [renderData?.args?.height, debouncedReportHeight]);

  // Report height when config changes (with more conservative approach)
  useEffect(() => {
    if (isReadyRef.current && isMountedRef.current && !isReportingHeight.current) {
      // Longer delay to ensure charts have rendered and prevent immediate loops
      setTimeout(() => {
        if (!isReportingHeight.current) {
          debouncedReportHeight();
        }
      }, 1500); // Much longer delay to prevent conflicts
    }
  }, [renderData, debouncedReportHeight]);

  if (!renderData) {
    return <div>Loading...</div>;
  }

  const config = renderData.args?.config as ComponentConfig;

  // Extract height and width from JSON config instead of separate parameters
  const height = (renderData.args?.height as number) || config?.charts?.[0]?.chart?.height || 400;
  const width = (renderData.args?.width as number) || config?.charts?.[0]?.chart?.width || null;

  return (
    <div ref={containerRef} style={{ width: '100%', minHeight: height }}>
      <LightweightCharts
        config={config}
        height={height}
        width={width}
        onChartsReady={handleChartsReady}
        configChange={configChange}
      />
    </div>
  );
};

// Export App component for testing
export default App;

// Render the app with proper DOM ready check
function renderApp() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    logger.error('Root element not found', 'StreamlitComponent');
  }
}

// Ensure DOM is ready before rendering
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
