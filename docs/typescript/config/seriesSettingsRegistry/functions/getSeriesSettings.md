[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [config/seriesSettingsRegistry](../README.md) / getSeriesSettings

# Function: getSeriesSettings()

> **getSeriesSettings**(`seriesType`, `primitive?`): [`SeriesSettings`](../interfaces/SeriesSettings.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/config/seriesSettingsRegistry.ts:33](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/config/seriesSettingsRegistry.ts#L33)

Get settings for a series type by deriving them from the series descriptor

## Parameters

### seriesType

The series type string (case-insensitive)

`string` | `undefined`

### primitive?

`any`

Optional primitive instance to check for static getSettings()

## Returns

[`SeriesSettings`](../interfaces/SeriesSettings.md)

Settings object mapping property names to types
