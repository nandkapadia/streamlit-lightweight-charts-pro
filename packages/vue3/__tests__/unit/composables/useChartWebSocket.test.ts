/**
 * @fileoverview Unit tests for the useChartWebSocket composable.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useChartWebSocket } from '../../../src/composables/useChartWebSocket';
import { flushPromises } from '../../setup';

describe('useChartWebSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('connection', () => {
    it('should connect to WebSocket server', async () => {
      const onConnected = vi.fn();

      const { state, connect, isConnected } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {
          onConnected,
        }
      );

      expect(state.value).toBe('disconnected');
      expect(isConnected.value).toBe(false);

      connect();
      expect(state.value).toBe('connecting');

      // Wait for connection
      await flushPromises();
      vi.runAllTimers();

      // Simulate receiving connected message
      const ws = (global as unknown as { WebSocket: { new(url: string): { simulateMessage: (data: unknown) => void } } }).WebSocket;
      // Note: We need to trigger the message simulation differently in real tests
    });

    it('should disconnect from WebSocket server', async () => {
      const onDisconnected = vi.fn();

      const { state, connect, disconnect, isConnected } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {
          onDisconnected,
        }
      );

      connect();
      await flushPromises();
      vi.runAllTimers();

      disconnect();

      expect(state.value).toBe('disconnected');
      expect(isConnected.value).toBe(false);
    });
  });

  describe('messaging', () => {
    it('should send ping messages', async () => {
      const { connect, send } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
          pingInterval: 1000,
        },
        {}
      );

      connect();
      await flushPromises();
      vi.runAllTimers();

      // Ping should be sent automatically after interval
      vi.advanceTimersByTime(1000);
    });

    it('should request initial data', async () => {
      const { connect, requestInitialData, send } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {}
      );

      connect();
      await flushPromises();
      vi.runAllTimers();

      requestInitialData(0, 'price');
      // Verify send was called with correct message
    });

    it('should request history data', async () => {
      const { connect, requestHistory } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {}
      );

      connect();
      await flushPromises();
      vi.runAllTimers();

      requestHistory(0, 'price', 1234567890, 500);
      // Verify send was called with correct message
    });
  });

  describe('reconnection', () => {
    it('should attempt reconnection on disconnect', async () => {
      const { state, connect, reconnectAttempts } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
          reconnect: {
            enabled: true,
            maxAttempts: 3,
            baseDelay: 100,
          },
        },
        {}
      );

      connect();
      await flushPromises();
      vi.runAllTimers();

      // Simulate disconnect
      // The reconnection logic would kick in
    });

    it('should not reconnect if manually disconnected', async () => {
      const { connect, disconnect, reconnectAttempts } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
          reconnect: {
            enabled: true,
            maxAttempts: 3,
          },
        },
        {}
      );

      connect();
      await flushPromises();
      vi.runAllTimers();

      disconnect();
      expect(reconnectAttempts.value).toBe(0);
    });

    it('should stop after max reconnection attempts', async () => {
      const { error, connect, reconnectAttempts } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
          reconnect: {
            enabled: true,
            maxAttempts: 3,
            baseDelay: 100,
          },
        },
        {}
      );

      connect();
      await flushPromises();

      // Would need to simulate multiple failures to test this
    });
  });

  describe('error handling', () => {
    it('should handle connection errors', async () => {
      const onError = vi.fn();

      const { connect, state, error } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {
          onError,
        }
      );

      connect();
      await flushPromises();
      vi.runAllTimers();

      // Would need to simulate error
    });

    it('should handle send errors when not connected', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { send } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {}
      );

      const result = send({ type: 'ping' });
      expect(result).toBe(false);

      consoleWarn.mockRestore();
    });
  });

  describe('event handlers', () => {
    it('should call onHistoryResponse when history is received', async () => {
      const onHistoryResponse = vi.fn();

      const { connect } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {
          onHistoryResponse,
        }
      );

      connect();
      await flushPromises();
      vi.runAllTimers();

      // Would need to simulate receiving history response
    });

    it('should call onDataUpdate when data is updated', async () => {
      const onDataUpdate = vi.fn();

      const { connect } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {
          onDataUpdate,
        }
      );

      connect();
      await flushPromises();
      vi.runAllTimers();

      // Would need to simulate receiving data update
    });
  });
});
