/**
 * @fileoverview Unit tests for the useChartWebSocket composable.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';

// Mock WebSocket before importing the composable
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  // Test helpers
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  simulateMessage(data: unknown): void {
    this.onmessage?.(new MessageEvent('message', {
      data: JSON.stringify(data),
    }));
  }

  simulateError(): void {
    this.onerror?.(new Event('error'));
  }

  simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

// Store instances for test access
let mockWebSocketInstance: MockWebSocket | null = null;

vi.stubGlobal('WebSocket', class extends MockWebSocket {
  constructor(url: string) {
    super(url);
    mockWebSocketInstance = this;
  }
});

// Mock Vue's onUnmounted to avoid warnings in tests
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    onUnmounted: vi.fn(),
  };
});

// Import after mocking
import { useChartWebSocket } from '../../../src/composables/useChartWebSocket';

describe('useChartWebSocket', () => {
  beforeEach(() => {
    mockWebSocketInstance = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('connection', () => {
    it('should start in disconnected state', () => {
      const { state, isConnected } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {}
      );

      expect(state.value).toBe('disconnected');
      expect(isConnected.value).toBe(false);
    });

    it('should transition to connecting state on connect', () => {
      const { state, connect } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {}
      );

      connect();

      expect(state.value).toBe('connecting');
    });

    it('should transition to connected state after receiving connected message', () => {
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

      connect();
      mockWebSocketInstance?.simulateOpen();
      mockWebSocketInstance?.simulateMessage({ type: 'connected', chartId: 'test-chart' });

      expect(state.value).toBe('connected');
      expect(isConnected.value).toBe(true);
      expect(onConnected).toHaveBeenCalledWith('test-chart');
    });

    it('should disconnect from WebSocket server', () => {
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
      mockWebSocketInstance?.simulateOpen();
      mockWebSocketInstance?.simulateMessage({ type: 'connected', chartId: 'test-chart' });

      disconnect();

      expect(state.value).toBe('disconnected');
      expect(isConnected.value).toBe(false);
    });
  });

  describe('messaging', () => {
    it('should send ping messages', () => {
      const { connect, send } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {}
      );

      connect();
      mockWebSocketInstance?.simulateOpen();
      mockWebSocketInstance?.simulateMessage({ type: 'connected', chartId: 'test-chart' });

      const sendSpy = vi.spyOn(mockWebSocketInstance!, 'send');
      send({ type: 'ping' });

      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify({ type: 'ping' }));
    });

    it('should return true when send succeeds', () => {
      const { connect, send } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {}
      );

      connect();
      mockWebSocketInstance?.simulateOpen();
      mockWebSocketInstance?.simulateMessage({ type: 'connected', chartId: 'test-chart' });

      const result = send({ type: 'ping' });
      expect(result).toBe(true);
    });

    it('should request initial data', () => {
      const { connect, requestInitialData } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {}
      );

      connect();
      mockWebSocketInstance?.simulateOpen();
      mockWebSocketInstance?.simulateMessage({ type: 'connected', chartId: 'test-chart' });

      const sendSpy = vi.spyOn(mockWebSocketInstance!, 'send');
      requestInitialData(0, 'price');

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'get_initial_data',
          paneId: 0,
          seriesId: 'price',
        })
      );
    });

    it('should request history data', () => {
      const { connect, requestHistory } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {}
      );

      connect();
      mockWebSocketInstance?.simulateOpen();
      mockWebSocketInstance?.simulateMessage({ type: 'connected', chartId: 'test-chart' });

      const sendSpy = vi.spyOn(mockWebSocketInstance!, 'send');
      requestHistory(0, 'price', 1234567890, 500);

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'request_history',
          paneId: 0,
          seriesId: 'price',
          beforeTime: 1234567890,
          count: 500,
        })
      );
    });
  });

  describe('reconnection', () => {
    it('should reset reconnect attempts on successful connection', () => {
      const { connect, reconnectAttempts } = useChartWebSocket(
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
      mockWebSocketInstance?.simulateOpen();
      mockWebSocketInstance?.simulateMessage({ type: 'connected', chartId: 'test-chart' });

      expect(reconnectAttempts.value).toBe(0);
    });

    it('should not reconnect if manually disconnected', () => {
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
      mockWebSocketInstance?.simulateOpen();
      mockWebSocketInstance?.simulateMessage({ type: 'connected', chartId: 'test-chart' });

      disconnect();

      expect(reconnectAttempts.value).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should transition to error state on WebSocket error', () => {
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
      mockWebSocketInstance?.simulateError();

      expect(state.value).toBe('error');
      expect(error.value).toBe('WebSocket connection error');
      expect(onError).toHaveBeenCalled();
    });

    it('should return false when sending without connection', () => {
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
    it('should call onHistoryResponse when history is received', () => {
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
      mockWebSocketInstance?.simulateOpen();
      mockWebSocketInstance?.simulateMessage({ type: 'connected', chartId: 'test-chart' });

      const historyResponse = {
        type: 'history_response',
        chartId: 'test-chart',
        paneId: 0,
        seriesId: 'price',
        data: [{ time: 1234567890, value: 100 }],
        chunkInfo: { startIndex: 0, endIndex: 1, count: 1 },
        hasMoreBefore: false,
        hasMoreAfter: false,
        totalCount: 1,
      };

      mockWebSocketInstance?.simulateMessage(historyResponse);

      expect(onHistoryResponse).toHaveBeenCalledWith(historyResponse);
    });

    it('should call onDataUpdate when data is updated', () => {
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
      mockWebSocketInstance?.simulateOpen();
      mockWebSocketInstance?.simulateMessage({ type: 'connected', chartId: 'test-chart' });

      const updateMessage = {
        type: 'data_update',
        chartId: 'test-chart',
        paneId: 0,
        seriesId: 'price',
        count: 100,
      };

      mockWebSocketInstance?.simulateMessage(updateMessage);

      expect(onDataUpdate).toHaveBeenCalledWith(updateMessage);
    });

    it('should call onInitialData when initial data is received', () => {
      const onInitialData = vi.fn();

      const { connect } = useChartWebSocket(
        {
          url: 'ws://localhost:8000/ws',
          chartId: 'test-chart',
        },
        {
          onInitialData,
        }
      );

      connect();
      mockWebSocketInstance?.simulateOpen();
      mockWebSocketInstance?.simulateMessage({ type: 'connected', chartId: 'test-chart' });

      const initialDataResponse = {
        type: 'initial_data_response',
        chartId: 'test-chart',
        panes: {},
        options: {},
      };

      mockWebSocketInstance?.simulateMessage(initialDataResponse);

      expect(onInitialData).toHaveBeenCalledWith(initialDataResponse);
    });
  });
});
