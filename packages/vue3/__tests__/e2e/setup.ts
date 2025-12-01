/**
 * @fileoverview E2E test setup for Vue 3 Lightweight Charts.
 *
 * This setup creates a more realistic testing environment with
 * actual DOM rendering and mocked backend services.
 */

import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// Configure Vue Test Utils for E2E testing
config.global.stubs = {};

// More realistic WebSocket mock with message queue
export class MockWebSocketServer {
  private connections: Map<string, MockWebSocketClient[]> = new Map();
  private messageQueue: Map<string, unknown[]> = new Map();

  addConnection(chartId: string, client: MockWebSocketClient): void {
    if (!this.connections.has(chartId)) {
      this.connections.set(chartId, []);
    }
    this.connections.get(chartId)!.push(client);

    // Send connected message
    setTimeout(() => {
      client.receiveMessage({ type: 'connected', chartId });
    }, 10);
  }

  removeConnection(chartId: string, client: MockWebSocketClient): void {
    const connections = this.connections.get(chartId);
    if (connections) {
      const index = connections.indexOf(client);
      if (index >= 0) {
        connections.splice(index, 1);
      }
    }
  }

  broadcast(chartId: string, message: unknown): void {
    const connections = this.connections.get(chartId);
    connections?.forEach((client) => {
      client.receiveMessage(message);
    });
  }

  handleMessage(chartId: string, message: unknown, client: MockWebSocketClient): void {
    const msg = message as { type: string; paneId?: number; seriesId?: string; beforeTime?: number; count?: number };

    switch (msg.type) {
      case 'ping':
        client.receiveMessage({ type: 'pong' });
        break;

      case 'get_initial_data':
        // Simulate initial data response
        client.receiveMessage({
          type: 'initial_data_response',
          chartId,
          panes: {},
          options: {},
        });
        break;

      case 'request_history':
        // Simulate history response
        client.receiveMessage({
          type: 'history_response',
          chartId,
          paneId: msg.paneId,
          seriesId: msg.seriesId,
          data: [],
          chunkInfo: {
            startIndex: 0,
            endIndex: 0,
            startTime: 0,
            endTime: 0,
            count: 0,
          },
          hasMoreBefore: false,
          hasMoreAfter: false,
          totalCount: 0,
        });
        break;
    }
  }
}

export class MockWebSocketClient {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocketClient.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  private server: MockWebSocketServer;
  private chartId: string;

  constructor(url: string, server: MockWebSocketServer) {
    this.url = url;
    this.server = server;

    // Extract chartId from URL
    const match = url.match(/\/charts\/([^/]+)$/);
    this.chartId = match?.[1] || 'unknown';

    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocketClient.OPEN;
      this.onopen?.(new Event('open'));
      server.addConnection(this.chartId, this);
    }, 10);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocketClient.OPEN) {
      throw new Error('WebSocket is not open');
    }
    const message = JSON.parse(data);
    this.server.handleMessage(this.chartId, message, this);
  }

  close(): void {
    this.readyState = MockWebSocketClient.CLOSED;
    this.server.removeConnection(this.chartId, this);
    this.onclose?.(new CloseEvent('close'));
  }

  receiveMessage(data: unknown): void {
    this.onmessage?.(new MessageEvent('message', {
      data: JSON.stringify(data),
    }));
  }
}

// Global mock server instance
export const mockWsServer = new MockWebSocketServer();

// Override global WebSocket
(global as unknown as { WebSocket: new (url: string) => MockWebSocketClient }).WebSocket =
  class extends MockWebSocketClient {
    constructor(url: string) {
      super(url, mockWsServer);
    }
  };

// Mock fetch for E2E tests
export function createE2EMockFetch(initialData?: Record<string, unknown>) {
  const chartData = new Map<string, unknown>(Object.entries(initialData || {}));

  return vi.fn(async (url: string, init?: RequestInit) => {
    const urlObj = new URL(url, 'http://localhost:8000');
    const path = urlObj.pathname;

    if (path === '/health') {
      return {
        ok: true,
        json: async () => ({ status: 'healthy', version: '0.1.0' }),
      } as Response;
    }

    // Handle chart endpoints
    const chartMatch = path.match(/^\/api\/charts\/([^/]+)/);
    if (chartMatch) {
      const chartId = chartMatch[1];

      if (init?.method === 'POST') {
        const body = init.body ? JSON.parse(init.body as string) : {};
        chartData.set(chartId, { chartId, ...body });
        return {
          ok: true,
          json: async () => ({ chartId, options: body }),
        } as Response;
      }

      if (chartData.has(chartId)) {
        return {
          ok: true,
          json: async () => chartData.get(chartId),
        } as Response;
      }
    }

    return {
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    } as Response;
  });
}

// Wait for component to settle
export async function waitForComponent(ms: number = 100): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
