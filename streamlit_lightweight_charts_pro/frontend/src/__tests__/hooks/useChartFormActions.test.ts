/**
 * Tests for React 19 useActionState hook implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { startTransition } from 'react';
import { useChartFormActions } from '../../hooks/useChartFormActions';

// Mock React 19 performance monitor
vi.mock('../../utils/react19PerformanceMonitor', () => ({
  react19Monitor: {
    startTransition: vi.fn(() => 'mock-transition-id'),
    endTransition: vi.fn(),
  },
}));

describe('useChartFormActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct state', () => {
    const { result } = renderHook(() =>
      useChartFormActions()
    );

    expect(result.current.config).toBeDefined();
    expect(result.current.import).toBeDefined();
    expect(result.current.export).toBeDefined();

    expect(result.current.config.state).toBeDefined();
    expect(result.current.config.submitAction).toBeInstanceOf(Function);
    expect(result.current.import.submitAction).toBeInstanceOf(Function);
    expect(result.current.export.submitAction).toBeInstanceOf(Function);
  });

  it('should handle configuration form submission', async () => {
    const { result } = renderHook(() =>
      useChartFormActions()
    );

    const formData = new FormData();
    formData.append('title', 'Test Chart');
    formData.append('width', '800');
    formData.append('height', '400');

    await act(async () => {
      startTransition(() => {
        result.current.config.submitAction(formData);
      });
    });

    // Wait for async processing to complete
    await waitFor(() => {
      expect(result.current.config.state.data).toBeDefined();
    }, { timeout: 2000 });

    expect(result.current.config.state.data).toEqual(
      expect.objectContaining({
        title: 'Test Chart',
        width: 800,
        height: 400,
      })
    );
  });

  it('should handle form validation errors', async () => {
    const { result } = renderHook(() =>
      useChartFormActions()
    );

    const formData = new FormData();
    formData.append('title', 'a'.repeat(150)); // Invalid: too long
    formData.append('width', '50'); // Invalid: too small
    formData.append('height', 'invalid'); // Invalid: not number

    await act(async () => {
      startTransition(() => {
        result.current.config.submitAction(formData);
      });
    });

    await waitFor(() => {
      expect(result.current.config.state.error).toBeDefined();
    }, { timeout: 2000 });

    expect(result.current.config.hasError).toBe(true);
    expect(result.current.config.hasValidationErrors).toBe(true);
  });

  it('should handle data import form submission', async () => {
    const { result } = renderHook(() =>
      useChartFormActions()
    );

    // Create a mock file
    const mockFile = new File(['test data'], 'test.csv', { type: 'text/csv' });
    const formData = new FormData();
    formData.append('dataFile', mockFile);
    formData.append('dataType', 'csv');

    await act(async () => {
      startTransition(() => {
        result.current.import.submitAction(formData);
      });
    });

    await waitFor(() => {
      expect(result.current.import.isCompleted).toBe(true);
    }, { timeout: 2000 });

    expect(result.current.import.progress.completed).toBe(true);
    expect(result.current.import.progress.recordCount).toBeGreaterThan(0);
  });

  it('should handle chart export form submission', async () => {
    const { result } = renderHook(() =>
      useChartFormActions()
    );

    const formData = new FormData();
    formData.append('format', 'png');
    formData.append('quality', 'high');
    formData.append('includeData', 'true');
    formData.append('chartId', 'test-chart');

    await act(async () => {
      startTransition(() => {
        result.current.export.submitAction(formData);
      });
    });

    await waitFor(() => {
      expect(result.current.export.isReady).toBe(true);
    }, { timeout: 2000 });

    expect(result.current.export.exportStatus.ready).toBe(true);
    expect(result.current.export.exportStatus.format).toBe('png');
  });

  it('should provide form field helpers', () => {
    const { result } = renderHook(() =>
      useChartFormActions()
    );

    expect(result.current.config.getFieldError).toBeInstanceOf(Function);
    expect(result.current.config.hasFieldError).toBeInstanceOf(Function);
    expect(result.current.config.isFieldValid).toBeInstanceOf(Function);

    // Test initial state - no validation errors
    expect(result.current.config.getFieldError('title')).toBeUndefined();
    expect(result.current.config.hasFieldError('title')).toBe(false);
    expect(result.current.config.isFieldValid('title')).toBe(true);
  });

  it('should handle download file functionality', async () => {
    const { result } = renderHook(() =>
      useChartFormActions()
    );

    const formData = new FormData();
    formData.append('format', 'png');
    formData.append('chartId', 'test-chart');

    await act(async () => {
      startTransition(() => {
        result.current.export.submitAction(formData);
      });
    });

    await waitFor(() => {
      expect(result.current.export.isReady).toBe(true);
    }, { timeout: 2000 });

    // Mock window.open
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    expect(result.current.export.downloadFile).toBeInstanceOf(Function);

    act(() => {
      result.current.export.downloadFile();
    });

    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('should show pending states appropriately', () => {
    const { result } = renderHook(() =>
      useChartFormActions()
    );

    // Initial state should not show pending
    expect(result.current.config.isSubmitting).toBe(false);
    expect(result.current.import.isPending).toBe(false);
    expect(result.current.export.isPending).toBe(false);
  });

  it('should handle empty form submissions gracefully', async () => {
    const { result } = renderHook(() =>
      useChartFormActions()
    );

    const formData = new FormData();

    await act(async () => {
      startTransition(() => {
        result.current.config.submitAction(formData);
      });
    });

    await waitFor(() => {
      expect(result.current.config.state.data).toBeDefined();
    }, { timeout: 2000 });

    expect(result.current.config.state.data).toEqual(
      expect.objectContaining({
        title: '',
        backgroundColor: '#ffffff',
      })
    );
  });
});
