[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [series/UnifiedSeriesFactory](../README.md) / createSeries

# Function: createSeries()

> **createSeries**(`chart`, `seriesType`, `data`, `userOptions`, `paneId`): `ISeriesApi`\<`any`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:271](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L271)

Create a series using the unified descriptor system

## Parameters

### chart

`any`

LightweightCharts chart instance

### seriesType

`string`

Type of series to create (e.g., 'Line', 'Band')

### data

`any`[]

Series data

### userOptions

`Partial`\<`SeriesOptionsCommon`\> = `{}`

User-provided options (merged with defaults)

### paneId

`number` = `0`

## Returns

`ISeriesApi`\<`any`\>

Created series instance

## Throws

If series creation fails
