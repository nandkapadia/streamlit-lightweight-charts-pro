[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [hooks/useSeriesUpdate](../README.md) / UseSeriesUpdateOptions

# Interface: UseSeriesUpdateOptions

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useSeriesUpdate.ts:52](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useSeriesUpdate.ts#L52)

## Properties

### configChange?

> `optional` **configChange**: \{ `paneId`: `string`; `seriesId`: `string`; `configPatch`: [`SeriesConfigPatch`](SeriesConfigPatch.md); `timestamp`: `number`; \} \| `null`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useSeriesUpdate.ts:57](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useSeriesUpdate.ts#L57)

Configuration change object from parent component
Typically comes from a settings dialog or UI control

***

### chartRefs

> **chartRefs**: `MutableRefObject`\<\{\[`key`: `string`\]: `IChartApi`; \}\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useSeriesUpdate.ts:67](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useSeriesUpdate.ts#L67)

Reference to chart instances

***

### seriesRefs

> **seriesRefs**: `MutableRefObject`\<\{\[`key`: `string`\]: `ISeriesApi`\<`any`, `Time`, `any`, `any`, `any`\>[]; \}\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useSeriesUpdate.ts:72](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useSeriesUpdate.ts#L72)

Reference to series instances per chart
