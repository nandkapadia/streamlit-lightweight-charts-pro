[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [types/ChartInterfaces](../README.md) / MouseEventParams

# Interface: MouseEventParams

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:494](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L494)

Mouse event parameter for crosshair move events

## Properties

### time?

> `optional` **time**: `Time`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:495](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L495)

***

### point?

> `optional` **point**: [`CoordinatePoint`](CoordinatePoint.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:496](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L496)

***

### seriesData

> **seriesData**: `Map`\<[`ExtendedSeriesApi`](ExtendedSeriesApi.md)\<keyof `SeriesOptionsMap`\>, [`SeriesDataPoint`](../type-aliases/SeriesDataPoint.md) \| `null`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:497](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L497)

***

### hoveredSeries?

> `optional` **hoveredSeries**: [`ExtendedSeriesApi`](ExtendedSeriesApi.md)\<keyof `SeriesOptionsMap`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:498](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L498)

***

### hoveredMarkerId?

> `optional` **hoveredMarkerId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:499](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L499)

***

### sourceEvent?

> `optional` **sourceEvent**: `MouseEvent` \| `TouchEvent`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:500](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L500)
