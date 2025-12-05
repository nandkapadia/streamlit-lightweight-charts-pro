[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [services/SeriesDialogManager](../README.md) / SeriesDialogConfig

# Interface: SeriesDialogConfig

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:61](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L61)

Configuration for series dialog manager

## Properties

### chartId?

> `optional` **chartId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:62](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L62)

***

### onSeriesConfigChange()?

> `optional` **onSeriesConfigChange**: (`paneId`, `seriesId`, `config`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:63](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L63)

#### Parameters

##### paneId

`number`

##### seriesId

`string`

##### config

`Record`\<`string`, `unknown`\>

#### Returns

`void`
