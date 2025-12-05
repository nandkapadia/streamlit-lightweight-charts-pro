[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [types/layout](../README.md) / Corner

# Type Alias: Corner

> **Corner** = `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/layout.ts:32](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/layout.ts#L32)

## Fileoverview

Layout and Positioning Types

Type definitions for the chart widget management system.
Provides interfaces for positioning, dimensions, and layout management.

This module provides:
- Corner positioning types
- Dimension interfaces
- Widget positioning interfaces
- Layout configuration types

Features:
- Flexible corner-based positioning
- Axis-aware dimension tracking
- Widget stacking and priority
- Layout event handling

## Example

```typescript
import { Corner, Position, IPositionableWidget } from './layout';

const corner: Corner = 'top-right';
const position: Position = {
  top: 10,
  right: 10,
  zIndex: 100
};
```
