[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../../modules.md) / [series/core/UnifiedSeriesDescriptor](../README.md) / dialogConfigToApiOptions

# Function: dialogConfigToApiOptions()

> **dialogConfigToApiOptions**\<`T`\>(`descriptor`, `dialogConfig`): `Partial`\<`T`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:343](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L343)

Helper to convert dialog config to API options using descriptor

This function processes ALL properties including:
- Standard series properties (visible, title, zIndex, etc.) from STANDARD_SERIES_PROPERTIES
- Series-specific properties defined in each descriptor
- Hidden properties (marked with hidden: true) are still passed through

This ensures consistency between:
1. JSON path (Python → createSeriesWithConfig → series creation)
2. Dialog path (UI changes → dialogConfigToApiOptions → series.applyOptions)

## Type Parameters

### T

`T` = `unknown`

## Parameters

### descriptor

[`UnifiedSeriesDescriptor`](../interfaces/UnifiedSeriesDescriptor.md)\<`T`\>

### dialogConfig

`Record`\<`string`, `unknown`\>

## Returns

`Partial`\<`T`\>
