[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [series/UnifiedPropertyMapper](../README.md) / apiOptionsToDialogConfig

# Function: apiOptionsToDialogConfig()

> **apiOptionsToDialogConfig**(`seriesType`, `apiOptions`): `any`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedPropertyMapper.ts:42](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedPropertyMapper.ts#L42)

Convert LightweightCharts API options (flat) to Dialog config (nested)

## Parameters

### seriesType

`string`

The series type (e.g., 'Line', 'Band', 'line', 'band')

### apiOptions

`any`

Flat options from series.options()

## Returns

`any`

Nested config for dialog
