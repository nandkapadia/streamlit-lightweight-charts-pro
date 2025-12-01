/**
 * @fileoverview TypeScript types for WebSocket communication.
 *
 * These types match the WebSocket message formats defined in
 * lightweight_charts_backend/websocket/handlers.py
 */

import type { ChunkInfo, DataPoint } from './api';

/**
 * WebSocket connection states.
 */
export type WebSocketState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Base message type with common fields.
 */
export interface BaseMessage {
  /** Message type identifier */
  type: string;
  /** Chart identifier */
  chartId?: string;
}

/**
 * Connection acknowledgment message from server.
 */
export interface ConnectedMessage extends BaseMessage {
  type: 'connected';
  chartId: string;
}

/**
 * Ping message for connection health.
 */
export interface PingMessage extends BaseMessage {
  type: 'ping';
}

/**
 * Pong response to ping.
 */
export interface PongMessage extends BaseMessage {
  type: 'pong';
}

/**
 * Request to get initial chart data.
 */
export interface GetInitialDataMessage extends BaseMessage {
  type: 'get_initial_data';
  /** Optional pane filter */
  paneId?: number;
  /** Optional series filter */
  seriesId?: string;
}

/**
 * Response with initial chart data.
 */
export interface InitialDataResponseMessage extends BaseMessage {
  type: 'initial_data_response';
  chartId: string;
  /** Panes data or single series data */
  panes?: Record<string, Record<string, {
    seriesType: string;
    data: DataPoint[];
    options: Record<string, unknown>;
  }>>;
  /** Chart options */
  options?: Record<string, unknown>;
  /** Error message if request failed */
  error?: string;
}

/**
 * Request for historical data.
 */
export interface RequestHistoryMessage extends BaseMessage {
  type: 'request_history';
  /** Pane index */
  paneId: number;
  /** Series identifier */
  seriesId: string;
  /** Get data before this timestamp */
  beforeTime: number;
  /** Number of data points to request */
  count?: number;
}

/**
 * Response with historical data.
 */
export interface HistoryResponseMessage extends BaseMessage {
  type: 'history_response';
  chartId: string;
  /** Pane index */
  paneId: number;
  /** Series identifier */
  seriesId: string;
  /** Historical data points */
  data: DataPoint[];
  /** Chunk metadata */
  chunkInfo: ChunkInfo;
  /** Whether there's more data before */
  hasMoreBefore: boolean;
  /** Whether there's more data after */
  hasMoreAfter: boolean;
  /** Total available data points */
  totalCount: number;
  /** Error message if request failed */
  error?: string;
}

/**
 * Real-time data update notification.
 */
export interface DataUpdateMessage extends BaseMessage {
  type: 'data_update';
  chartId: string;
  /** Pane that was updated */
  paneId: number;
  /** Series that was updated */
  seriesId: string;
  /** Number of data points */
  count: number;
}

/**
 * Union of all incoming WebSocket message types.
 */
export type IncomingMessage =
  | ConnectedMessage
  | PongMessage
  | InitialDataResponseMessage
  | HistoryResponseMessage
  | DataUpdateMessage;

/**
 * Union of all outgoing WebSocket message types.
 */
export type OutgoingMessage =
  | PingMessage
  | GetInitialDataMessage
  | RequestHistoryMessage;

/**
 * WebSocket event handlers.
 */
export interface WebSocketEventHandlers {
  /** Called when connection is established */
  onConnected?: (chartId: string) => void;
  /** Called when connection is closed */
  onDisconnected?: () => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when initial data is received */
  onInitialData?: (data: InitialDataResponseMessage) => void;
  /** Called when history data is received */
  onHistoryResponse?: (data: HistoryResponseMessage) => void;
  /** Called when data is updated */
  onDataUpdate?: (data: DataUpdateMessage) => void;
}

/**
 * Configuration for WebSocket connection.
 */
export interface WebSocketConfig {
  /** WebSocket server URL */
  url: string;
  /** Chart identifier */
  chartId: string;
  /** Reconnection options */
  reconnect?: {
    /** Whether to automatically reconnect */
    enabled: boolean;
    /** Maximum number of reconnection attempts */
    maxAttempts?: number;
    /** Base delay between attempts (ms) */
    baseDelay?: number;
    /** Maximum delay between attempts (ms) */
    maxDelay?: number;
  };
  /** Ping interval for connection health (ms) */
  pingInterval?: number;
}
