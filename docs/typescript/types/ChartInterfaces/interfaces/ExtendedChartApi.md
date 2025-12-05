[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [types/ChartInterfaces](../README.md) / ExtendedChartApi

# Interface: ExtendedChartApi

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:70](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L70)

Extended chart API with commonly used properties

## Extends

- `IChartApi`

## Properties

### \_storageListenerAdded?

> `optional` **\_storageListenerAdded**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:71](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L71)

***

### \_timeRangeStorageListenerAdded?

> `optional` **\_timeRangeStorageListenerAdded**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:72](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L72)

***

### \_storageHandler()?

> `optional` **\_storageHandler**: (`e`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:73](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L73)

#### Parameters

##### e

`StorageEvent`

#### Returns

`void`

***

### \_timeRangeStorageHandler()?

> `optional` **\_timeRangeStorageHandler**: (`e`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:74](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L74)

#### Parameters

##### e

`StorageEvent`

#### Returns

`void`

***

### \_isExternalSync?

> `optional` **\_isExternalSync**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:75](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L75)

***

### \_isExternalTimeRangeSync?

> `optional` **\_isExternalTimeRangeSync**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:76](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L76)

***

### \_externalSyncTimeout?

> `optional` **\_externalSyncTimeout**: `Timeout`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:77](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L77)

***

### \_externalTimeRangeSyncTimeout?

> `optional` **\_externalTimeRangeSyncTimeout**: `Timeout`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:78](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L78)

***

### \_pendingTradeRectangles?

> `optional` **\_pendingTradeRectangles**: ([`PendingTradeRectangle`](PendingTradeRectangle.md) \| [`PendingRectangleBatch`](PendingRectangleBatch.md))[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:79](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L79)

***

### \_userHasInteracted?

> `optional` **\_userHasInteracted**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:80](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L80)

***

### \_model?

> `optional` **\_model**: `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:81](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L81)

#### timeScale?

> `optional` **timeScale**: `object`

##### timeScale.barSpacing()?

> `optional` **barSpacing**: () => `number`

###### Returns

`number`

***

### chartElement()

> **chartElement**: () => `HTMLDivElement`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:86](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L86)

Returns the generated div element containing the chart. This can be used for adding your own additional event listeners, or for measuring the
elements dimensions and position within the document.

#### Returns

`HTMLDivElement`

generated div element containing the chart.

#### Overrides

`IChartApi.chartElement`
