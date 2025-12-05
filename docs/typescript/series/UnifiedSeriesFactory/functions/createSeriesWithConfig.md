[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [series/UnifiedSeriesFactory](../README.md) / createSeriesWithConfig

# Function: createSeriesWithConfig()

> **createSeriesWithConfig**(`chart`, `config`): [`ExtendedSeriesApi`](../interfaces/ExtendedSeriesApi.md) \| `null`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:470](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L470)

Create series with full configuration (data, markers, price lines, etc.)
This is the enhanced API that handles all auxiliary functionality

## Parameters

### chart

`IChartApi`

LightweightCharts chart instance

### config

[`ExtendedSeriesConfig`](../interfaces/ExtendedSeriesConfig.md)

Extended series configuration

## Returns

[`ExtendedSeriesApi`](../interfaces/ExtendedSeriesApi.md) \| `null`

Created series instance with metadata

## Throws

If series creation fails
