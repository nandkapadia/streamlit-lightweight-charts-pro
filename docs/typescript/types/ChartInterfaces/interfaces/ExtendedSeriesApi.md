[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [types/ChartInterfaces](../README.md) / ExtendedSeriesApi

# Interface: ExtendedSeriesApi\<TData\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:92](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L92)

Extended series API with commonly used properties

## Extends

- `ISeriesApi`\<`TData`\>

## Type Parameters

### TData

`TData` *extends* keyof `SeriesOptionsMap` = keyof `SeriesOptionsMap`

## Properties

### paneId?

> `optional` **paneId**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:94](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L94)

***

### legendConfig?

> `optional` **legendConfig**: [`LegendData`](LegendData.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:95](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L95)

***

### seriesId?

> `optional` **seriesId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:96](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L96)

***

### assignedPaneId?

> `optional` **assignedPaneId**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:97](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L97)

***

### addShape()?

> `optional` **addShape**: (`_shape`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:98](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L98)

#### Parameters

##### \_shape

[`ShapeData`](ShapeData.md)

#### Returns

`void`

***

### setShapes()?

> `optional` **setShapes**: (`_shapes`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:99](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L99)

#### Parameters

##### \_shapes

[`ShapeData`](ShapeData.md)[]

#### Returns

`void`
