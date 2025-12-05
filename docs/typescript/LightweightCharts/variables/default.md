[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../modules.md) / [LightweightCharts](../README.md) / default

# Variable: default

> `const` **default**: `React.FC`\<`LightweightChartsProps`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/LightweightCharts.tsx:277](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/LightweightCharts.tsx#L277)

LightweightCharts React Component

Main chart rendering component with React 19 optimizations.
Manages chart lifecycle, series configuration, and user interactions.

Performance Features:
- React.memo for preventing unnecessary re-renders
- useTransition for non-blocking UI updates
- useDeferredValue for smooth config updates
- Optimized resize handling with debouncing
- Lazy primitive attachment for performance

Memory Management:
- Comprehensive cleanup on unmount
- ResizeObserver disconnect
- Chart instance removal
- Service cleanup (coordinates, primitives, layout)

## Param

Component configuration and callbacks

## Returns

Rendered chart components with error boundaries
