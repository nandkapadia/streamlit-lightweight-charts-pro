/**
 * @fileoverview useSeriesSettingsAPI Hook Test Suite
 *
 * Tests for the useSeriesSettingsAPI hook with Streamlit integration.
 *
 * @vitest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useSeriesSettingsAPI } from '../../hooks/useSeriesSettingsAPI';

// Mock Streamlit
vi.mock('streamlit-component-lib', () => ({
  Streamlit: {
    setComponentValue: vi.fn(),
  },
}));

// Mock useStreamlit hooks
vi.mock('../../hooks/useStreamlit', () => ({
  isStreamlitComponentReady: vi.fn(() => true),
}));

// Import the mocked module to access the spy
import { Streamlit } from 'streamlit-component-lib';
import { isStreamlitComponentReady } from '../../hooks/useStreamlit';

const mockSetComponentValue = vi.mocked(Streamlit.setComponentValue);
const mockIsReady = vi.mocked(isStreamlitComponentReady);

describe('useSeriesSettingsAPI', () => {
  let mockEventListener: any;

  beforeEach(() => {
    // Clear mocks BEFORE setting up
    mockEventListener = vi.fn();

    // Clear mocks
    mockIsReady.mockClear();
    mockSetComponentValue.mockClear();

    // Ensure Streamlit is ready
    mockIsReady.mockReturnValue(true);

    // Mock document.addEventListener and removeEventListener
    vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
      mockEventListener(event, handler);
    });
    vi.spyOn(document, 'removeEventListener').mockImplementation(vi.fn());

    // Mock setTimeout
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getPaneState', () => {
    it('should request pane state and handle successful response', async () => {
      const { result } = renderHook(() => useSeriesSettingsAPI());

      // Mock successful response
      const mockResponse = {
        success: true,
        data: {
          paneId: '0',
          series: {
            series1: { config: { visible: true }, series_type: 'line' },
          },
        },
      };

      let responseHandler: ((event: CustomEvent) => void) | undefined;

      // Capture the event listener
      mockEventListener.mockImplementation(
        (event: string, handler: (event: CustomEvent) => void) => {
          if (event === 'streamlit:apiResponse') {
            responseHandler = handler;
          }
        }
      );

      // Start the API call
      const paneStatePromise = result.current.getPaneState('0');

      // Verify the API call was made
      expect(mockSetComponentValue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'get_pane_state',
          paneId: '0',
          messageId: expect.stringMatching(/get_pane_state_\d+/),
        })
      );

      // Simulate the response
      const messageId = mockSetComponentValue.mock.calls[0][0].messageId;

      act(() => {
        if (responseHandler) {
          responseHandler(
            new CustomEvent('streamlit:apiResponse', {
              detail: {
                messageId,
                response: mockResponse,
              },
            })
          );
        }
      });

      const result_data = await paneStatePromise;
      expect(result_data).toEqual(mockResponse.data);
    });

    it('should handle timeout when no response received', async () => {
      const { result } = renderHook(() => useSeriesSettingsAPI());

      const paneStatePromise = result.current.getPaneState('0');

      // Fast-forward past timeout
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      const result_data = await paneStatePromise;
      expect(result_data).toBeNull();
    });

    it('should handle failed response', async () => {
      const { result } = renderHook(() => useSeriesSettingsAPI());

      const mockResponse = {
        success: false,
        error: 'Test error',
      };

      let responseHandler: ((event: CustomEvent) => void) | undefined;

      mockEventListener.mockImplementation(
        (event: string, handler: (event: CustomEvent) => void) => {
          if (event === 'streamlit:apiResponse') {
            responseHandler = handler;
          }
        }
      );

      const paneStatePromise = result.current.getPaneState('0');

      const messageId = mockSetComponentValue.mock.calls[0][0].messageId;

      act(() => {
        if (responseHandler) {
          responseHandler(
            new CustomEvent('streamlit:apiResponse', {
              detail: {
                messageId,
                response: mockResponse,
              },
            })
          );
        }
      });

      const result_data = await paneStatePromise;
      expect(result_data).toBeNull();
    });
  });

  describe('updateSeriesSettings', () => {
    it('should update series settings and return success', async () => {
      const { result } = renderHook(() => useSeriesSettingsAPI());

      const config = { visible: false, color: '#FF0000' };
      const mockResponse = { success: true };

      let responseHandler: ((event: CustomEvent) => void) | undefined;

      mockEventListener.mockImplementation(
        (event: string, handler: (event: CustomEvent) => void) => {
          if (event === 'streamlit:apiResponse') {
            responseHandler = handler;
          }
        }
      );

      const updatePromise = result.current.updateSeriesSettings('0', 'series1', config);

      expect(mockSetComponentValue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'update_series_settings',
          paneId: '0',
          seriesId: 'series1',
          config,
          messageId: expect.stringMatching(/update_series_settings_\d+/),
        })
      );

      const messageId = mockSetComponentValue.mock.calls[0][0].messageId;

      act(() => {
        if (responseHandler) {
          responseHandler(
            new CustomEvent('streamlit:apiResponse', {
              detail: {
                messageId,
                response: mockResponse,
              },
            })
          );
        }
      });

      const success = await updatePromise;
      expect(success).toBe(true);
    });

    it('should handle update failure', async () => {
      const { result } = renderHook(() => useSeriesSettingsAPI());

      const config = { visible: false };
      const mockResponse = { success: false, error: 'Update failed' };

      let responseHandler: ((event: CustomEvent) => void) | undefined;

      mockEventListener.mockImplementation(
        (event: string, handler: (event: CustomEvent) => void) => {
          if (event === 'streamlit:apiResponse') {
            responseHandler = handler;
          }
        }
      );

      const updatePromise = result.current.updateSeriesSettings('0', 'series1', config);

      const messageId = mockSetComponentValue.mock.calls[0][0].messageId;

      act(() => {
        if (responseHandler) {
          responseHandler(
            new CustomEvent('streamlit:apiResponse', {
              detail: {
                messageId,
                response: mockResponse,
              },
            })
          );
        }
      });

      const success = await updatePromise;
      expect(success).toBe(false);
    });
  });

  describe('updateMultipleSettings', () => {
    it('should update multiple settings successfully', async () => {
      const { result } = renderHook(() => useSeriesSettingsAPI());

      const patches = [
        { paneId: '0', seriesId: 'series1', config: { visible: false } },
        { paneId: '0', seriesId: 'series2', config: { color: '#FF0000' } },
      ];
      const mockResponse = { success: true };

      let responseHandler: ((event: CustomEvent) => void) | undefined;

      mockEventListener.mockImplementation(
        (event: string, handler: (event: CustomEvent) => void) => {
          if (event === 'streamlit:apiResponse') {
            responseHandler = handler;
          }
        }
      );

      const updatePromise = result.current.updateMultipleSettings(patches);

      expect(mockSetComponentValue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'update_multiple_settings',
          patches,
          messageId: expect.stringMatching(/update_multiple_settings_\d+/),
        })
      );

      const messageId = mockSetComponentValue.mock.calls[0][0].messageId;

      act(() => {
        if (responseHandler) {
          responseHandler(
            new CustomEvent('streamlit:apiResponse', {
              detail: {
                messageId,
                response: mockResponse,
              },
            })
          );
        }
      });

      const success = await updatePromise;
      expect(success).toBe(true);
    });
  });

  describe('resetSeriesToDefaults', () => {
    it('should reset series to defaults successfully', async () => {
      const { result } = renderHook(() => useSeriesSettingsAPI());

      const mockDefaults = { visible: true, color: '#2196F3' };
      const mockResponse = { success: true, data: mockDefaults };

      let responseHandler: ((event: CustomEvent) => void) | undefined;

      mockEventListener.mockImplementation(
        (event: string, handler: (event: CustomEvent) => void) => {
          if (event === 'streamlit:apiResponse') {
            responseHandler = handler;
          }
        }
      );

      const resetPromise = result.current.resetSeriesToDefaults('0', 'series1');

      expect(mockSetComponentValue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'reset_series_defaults',
          paneId: '0',
          seriesId: 'series1',
          messageId: expect.stringMatching(/reset_series_defaults_\d+/),
        })
      );

      const messageId = mockSetComponentValue.mock.calls[0][0].messageId;

      act(() => {
        if (responseHandler) {
          responseHandler(
            new CustomEvent('streamlit:apiResponse', {
              detail: {
                messageId,
                response: mockResponse,
              },
            })
          );
        }
      });

      const defaults = await resetPromise;
      expect(defaults).toEqual(mockDefaults);
    });

    it('should handle reset failure', async () => {
      const { result } = renderHook(() => useSeriesSettingsAPI());

      const mockResponse = { success: false, error: 'Reset failed' };

      let responseHandler: ((event: CustomEvent) => void) | undefined;

      mockEventListener.mockImplementation(
        (event: string, handler: (event: CustomEvent) => void) => {
          if (event === 'streamlit:apiResponse') {
            responseHandler = handler;
          }
        }
      );

      const resetPromise = result.current.resetSeriesToDefaults('0', 'series1');

      const messageId = mockSetComponentValue.mock.calls[0][0].messageId;

      act(() => {
        if (responseHandler) {
          responseHandler(
            new CustomEvent('streamlit:apiResponse', {
              detail: {
                messageId,
                response: mockResponse,
              },
            })
          );
        }
      });

      const defaults = await resetPromise;
      expect(defaults).toBeNull();
    });
  });

  describe('registerSettingsChangeCallback', () => {
    it('should register and trigger settings change callback', () => {
      const { result } = renderHook(() => useSeriesSettingsAPI());
      const callback = vi.fn();

      const cleanup = result.current.registerSettingsChangeCallback(callback);

      expect(document.addEventListener).toHaveBeenCalledWith(
        'streamlit:settingsChanged',
        expect.any(Function)
      );

      // Simulate settings change event
      const settingsChangeHandler = (document.addEventListener as any).mock.calls.find(
        (call: any) => call[0] === 'streamlit:settingsChanged'
      )[1];

      act(() => {
        settingsChangeHandler();
      });

      expect(callback).toHaveBeenCalled();

      // Test cleanup
      cleanup();
      expect(document.removeEventListener).toHaveBeenCalledWith(
        'streamlit:settingsChanged',
        expect.any(Function)
      );
    });
  });

  describe('error handling', () => {
    it('should handle exceptions gracefully in getPaneState', async () => {
      const { result } = renderHook(() => useSeriesSettingsAPI());

      // Mock Streamlit to throw an error
      mockSetComponentValue.mockImplementation(() => {
        throw new Error('Test error');
      });

      const paneState = await result.current.getPaneState('0');
      expect(paneState).toBeNull();
    });

    it('should handle exceptions gracefully in updateSeriesSettings', async () => {
      const { result } = renderHook(() => useSeriesSettingsAPI());

      // Mock Streamlit to throw an error
      mockSetComponentValue.mockImplementation(() => {
        throw new Error('Test error');
      });

      const success = await result.current.updateSeriesSettings('0', 'series1', {});
      expect(success).toBe(false);
    });
  });
});
