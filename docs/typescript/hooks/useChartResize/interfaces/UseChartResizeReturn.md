[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [hooks/useChartResize](../README.md) / UseChartResizeReturn

# Interface: UseChartResizeReturn

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useChartResize.ts:50](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useChartResize.ts#L50)

## Methods

### getContainerDimensions()

> **getContainerDimensions**(`container`): `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useChartResize.ts:54](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useChartResize.ts#L54)

Get container dimensions

#### Parameters

##### container

`HTMLElement`

#### Returns

`object`

##### width

> **width**: `number`

##### height

> **height**: `number`

***

### setupAutoSizing()

> **setupAutoSizing**(`chart`, `container`, `chartConfig`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useChartResize.ts:60](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useChartResize.ts#L60)

Setup auto-sizing for a chart
Creates a ResizeObserver that watches the container and resizes the chart accordingly

#### Parameters

##### chart

`IChartApi`

##### container

`HTMLElement`

##### chartConfig

[`ChartConfig`](../../../types/interfaces/ChartConfig.md)

#### Returns

`void`

***

### resizeChart()

> **resizeChart**(`chart`, `width`, `height`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useChartResize.ts:65](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useChartResize.ts#L65)

Manually resize a chart

#### Parameters

##### chart

`IChartApi`

##### width

`number`

##### height

`number`

#### Returns

`void`

***

### cleanup()

> **cleanup**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useChartResize.ts:71](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useChartResize.ts#L71)

Cleanup all resize observers
Should be called on component unmount

#### Returns

`void`
