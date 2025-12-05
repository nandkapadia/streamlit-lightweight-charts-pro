[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [series/UnifiedPropertyMapper](../README.md) / dialogConfigToApiOptions

# Function: dialogConfigToApiOptions()

> **dialogConfigToApiOptions**(`seriesType`, `dialogConfig`): `any`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedPropertyMapper.ts:64](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedPropertyMapper.ts#L64)

Convert Dialog config (nested) to LightweightCharts API options (flat)

## Parameters

### seriesType

`string`

The series type (e.g., 'Line', 'Band', 'line', 'band')

### dialogConfig

`any`

Nested config from dialog

## Returns

`any`

Flat options for series.applyOptions()
