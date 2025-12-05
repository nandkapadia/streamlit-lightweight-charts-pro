[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [hooks/useSeriesUpdate](../README.md) / UseSeriesUpdateReturn

# Interface: UseSeriesUpdateReturn

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useSeriesUpdate.ts:75](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useSeriesUpdate.ts#L75)

## Methods

### applySeriesConfig()

> **applySeriesConfig**(`paneId`, `seriesId`, `configPatch`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useSeriesUpdate.ts:83](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useSeriesUpdate.ts#L83)

Apply configuration changes to a specific series

#### Parameters

##### paneId

`string`

The pane identifier

##### seriesId

`string`

The series identifier

##### configPatch

[`SeriesConfigPatch`](SeriesConfigPatch.md)

Partial configuration to apply

#### Returns

`void`

***

### mapDialogConfigToAPI()

> **mapDialogConfigToAPI**(`configPatch`): `Record`\<`string`, `any`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useSeriesUpdate.ts:92](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useSeriesUpdate.ts#L92)

Map dialog config format to LightweightCharts API format
Handles naming differences between our config format and the library API

#### Parameters

##### configPatch

[`SeriesConfigPatch`](SeriesConfigPatch.md)

Configuration patch in dialog format

#### Returns

`Record`\<`string`, `any`\>

Configuration in API format
