/**
 * @fileoverview Test setup for Vue 3 Lightweight Charts tests.
 */

import { vi } from 'vitest';

// Mock lightweight-charts
vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addSeries: vi.fn(() => ({
      setData: vi.fn(),
      update: vi.fn(),
      applyOptions: vi.fn(),
    })),
    removeSeries: vi.fn(),
    remove: vi.fn(),
    resize: vi.fn(),
    applyOptions: vi.fn(),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
      subscribeVisibleLogicalRangeChange: vi.fn(),
      unsubscribeVisibleLogicalRangeChange: vi.fn(),
    })),
    subscribeCrosshairMove: vi.fn(),
    subscribeClick: vi.fn(),
  })),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock WebSocket
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
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Parse and handle the message
    const message = JSON.parse(data);
    if (message.type === 'ping') {
      setTimeout(() => {
        this.onmessage?.(new MessageEvent('message', {
          data: JSON.stringify({ type: 'pong' }),
        }));
      }, 0);
    }
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  // Helper to simulate receiving a message
  simulateMessage(data: unknown): void {
    this.onmessage?.(new MessageEvent('message', {
      data: JSON.stringify(data),
    }));
  }

  // Helper to simulate an error
  simulateError(): void {
    this.onerror?.(new Event('error'));
  }
}

(global as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocket;

// Helper to flush promises
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Helper to create a mock fetch
export function createMockFetch(responses: Map<string, unknown>): typeof fetch {
  return vi.fn(async (url: string | URL | Request, _init?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.toString();

    // Find matching response
    for (const [pattern, response] of responses.entries()) {
      if (urlString.includes(pattern)) {
        return {
          ok: true,
          status: 200,
          json: async () => response,
        } as Response;
      }
    }

    // Default 404
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Not found' }),
    } as Response;
  });
}
