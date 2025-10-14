/**
 * @fileoverview Series Settings API Hook for Streamlit Backend Communication
 *
 * This hook provides the API interface for communicating with the Streamlit
 * Python backend to persist series settings across reruns. It handles:
 * - Getting current pane/series state from backend
 * - Posting setting updates to backend
 * - Error handling and retry logic
 * - State synchronization with backend memory
 */

import { useCallback } from 'react';
import { Streamlit } from 'streamlit-component-lib';
import type { SeriesConfig } from '../forms/SeriesSettingsDialog';
import { logger } from '../utils/logger';
import { isStreamlitComponentReady } from './useStreamlit';

// Get Streamlit object from imported module
const getStreamlit = () => {
  return Streamlit;
};

/**
 * API response types
 */
export interface PaneState {
  paneId: string;
  series: Record<string, SeriesConfig>;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Settings patch for backend updates
 */
export interface SettingsPatch {
  paneId: string;
  seriesId: string;
  config: Partial<SeriesConfig>;
}

/**
 * Hook for Series Settings API communication
 */
export function useSeriesSettingsAPI() {
  /**
   * Get current state for a pane from the backend
   */
  const getPaneState = useCallback(async (paneId: string): Promise<PaneState | null> => {
    try {
      // Send request to Streamlit backend
      const response = await new Promise<APIResponse<PaneState>>(resolve => {
        const messageId = `get_pane_state_${Date.now()}`;

        // Set up response listener
        const handleResponse = (event: CustomEvent) => {
          if (event.detail.messageId === messageId) {
            document.removeEventListener('streamlit:apiResponse', handleResponse as EventListener);
            resolve(event.detail.response);
          }
        };

        document.addEventListener('streamlit:apiResponse', handleResponse as EventListener);

        // Check if Streamlit component is ready before sending request
        if (!isStreamlitComponentReady()) {
          logger.warn(
            'Streamlit component not ready, skipping getPaneState request',
            'useSeriesSettingsAPI'
          );
          document.removeEventListener('streamlit:apiResponse', handleResponse as EventListener);
          resolve({ success: false, error: 'Streamlit not ready' });
          return;
        }

        // Send request
        const streamlit = getStreamlit();
        streamlit.setComponentValue({
          type: 'get_pane_state',
          messageId,
          paneId,
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          document.removeEventListener('streamlit:apiResponse', handleResponse as EventListener);
          resolve({ success: false, error: 'Request timeout' });
        }, 5000);
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        return null;
      }
    } catch (error) {
      logger.error('Failed to get series settings from backend', 'useSeriesSettingsAPI', error);
      return null;
    }
  }, []);

  /**
   * Update series settings in the backend
   */
  const updateSeriesSettings = useCallback(
    async (paneId: string, seriesId: string, config: Partial<SeriesConfig>): Promise<boolean> => {
      try {
        // Send patch to Streamlit backend
        const response = await new Promise<APIResponse>(resolve => {
          const messageId = `update_series_settings_${Date.now()}`;

          // Set up response listener
          const handleResponse = (event: CustomEvent) => {
            if (event.detail.messageId === messageId) {
              document.removeEventListener(
                'streamlit:apiResponse',
                handleResponse as EventListener
              );
              resolve(event.detail.response);
            }
          };

          document.addEventListener('streamlit:apiResponse', handleResponse as EventListener);

          // Check if Streamlit component is ready before sending update
          if (!isStreamlitComponentReady()) {
            resolve({ success: false, error: 'Streamlit not ready' });
            return;
          }

          // Send patch
          const streamlit = getStreamlit();
          streamlit.setComponentValue({
            type: 'update_series_settings',
            messageId,
            paneId,
            seriesId,
            config,
          });

          // Timeout after 5 seconds
          setTimeout(() => {
            document.removeEventListener('streamlit:apiResponse', handleResponse as EventListener);
            resolve({ success: false, error: 'Request timeout' });
          }, 5000);
        });

        if (response.success) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        logger.error('Failed to update series settings in backend', 'useSeriesSettingsAPI', error);
        return false;
      }
    },
    []
  );

  /**
   * Batch update multiple series settings
   */
  const updateMultipleSettings = useCallback(async (patches: SettingsPatch[]): Promise<boolean> => {
    try {
      // Send batch patch to Streamlit backend
      const response = await new Promise<APIResponse>(resolve => {
        const messageId = `update_multiple_settings_${Date.now()}`;

        // Set up response listener
        const handleResponse = (event: CustomEvent) => {
          if (event.detail.messageId === messageId) {
            document.removeEventListener('streamlit:apiResponse', handleResponse as EventListener);
            resolve(event.detail.response);
          }
        };

        document.addEventListener('streamlit:apiResponse', handleResponse as EventListener);

        // Check if Streamlit component is ready before sending batch update
        if (!isStreamlitComponentReady()) {
          resolve({ success: false, error: 'Streamlit not ready' });
          return;
        }

        // Send batch
        const streamlit = getStreamlit();
        streamlit.setComponentValue({
          type: 'update_multiple_settings',
          messageId,
          patches,
        });

        // Timeout after 10 seconds for batch operations
        setTimeout(() => {
          document.removeEventListener('streamlit:apiResponse', handleResponse as EventListener);
          resolve({ success: false, error: 'Request timeout' });
        }, 10000);
      });

      if (response.success) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      logger.error('Failed to update series settings in backend', 'useSeriesSettingsAPI', error);
      return false;
    }
  }, []);

  /**
   * Reset series to defaults
   */
  const resetSeriesToDefaults = useCallback(
    async (paneId: string, seriesId: string): Promise<SeriesConfig | null> => {
      try {
        // Send reset request to Streamlit backend
        const response = await new Promise<APIResponse<SeriesConfig>>(resolve => {
          const messageId = `reset_series_defaults_${Date.now()}`;

          // Set up response listener
          const handleResponse = (event: CustomEvent) => {
            if (event.detail.messageId === messageId) {
              document.removeEventListener(
                'streamlit:apiResponse',
                handleResponse as EventListener
              );
              resolve(event.detail.response);
            }
          };

          document.addEventListener('streamlit:apiResponse', handleResponse as EventListener);

          // Check if Streamlit component is ready before sending reset request
          if (!isStreamlitComponentReady()) {
            resolve({ success: false, error: 'Streamlit not ready' });
            return;
          }

          // Send reset request
          const streamlit = getStreamlit();
          streamlit.setComponentValue({
            type: 'reset_series_defaults',
            messageId,
            paneId,
            seriesId,
          });

          // Timeout after 5 seconds
          setTimeout(() => {
            document.removeEventListener('streamlit:apiResponse', handleResponse as EventListener);
            resolve({ success: false, error: 'Request timeout' });
          }, 5000);
        });

        if (response.success && response.data) {
          return response.data;
        } else {
          return null;
        }
      } catch (error) {
        logger.error('Failed to get series settings from backend', 'useSeriesSettingsAPI', error);
        return null;
      }
    },
    []
  );

  /**
   * Register settings change callback with backend
   */
  const registerSettingsChangeCallback = useCallback((callback: () => void) => {
    const handleSettingsChange = () => {
      callback();
    };

    // Listen for settings change events from backend
    document.addEventListener('streamlit:settingsChanged', handleSettingsChange);

    // Return cleanup function
    return () => {
      document.removeEventListener('streamlit:settingsChanged', handleSettingsChange);
    };
  }, []);

  return {
    getPaneState,
    updateSeriesSettings,
    updateMultipleSettings,
    resetSeriesToDefaults,
    registerSettingsChangeCallback,
  };
}
