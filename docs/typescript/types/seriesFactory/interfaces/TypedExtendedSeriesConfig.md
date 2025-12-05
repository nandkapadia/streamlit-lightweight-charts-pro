[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [types/seriesFactory](../README.md) / TypedExtendedSeriesConfig

# Interface: TypedExtendedSeriesConfig

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:89](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L89)

Extended series configuration with proper typing

## Properties

### type

> **type**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:91](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L91)

Series type (e.g., 'Line', 'Area', 'Band')

***

### data?

> `optional` **data**: [`SeriesDataPoint`](SeriesDataPoint.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:94](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L94)

Series data points

***

### options?

> `optional` **options**: [`NestedSeriesOptions`](NestedSeriesOptions.md) \| [`FlattenedSeriesOptions`](FlattenedSeriesOptions.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:97](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L97)

Series options

***

### paneId?

> `optional` **paneId**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:100](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L100)

Pane ID for multi-pane charts

***

### priceScale?

> `optional` **priceScale**: [`PriceScaleConfig`](PriceScaleConfig.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:103](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L103)

Price scale configuration

***

### priceLines?

> `optional` **priceLines**: [`PriceLineConfig`](PriceLineConfig.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:106](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L106)

Price lines to add

***

### markers?

> `optional` **markers**: `SeriesMarker`\<`Time`\>[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:109](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L109)

Markers to add

***

### legend?

> `optional` **legend**: [`LegendConfig`](LegendConfig.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:112](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L112)

Legend configuration

***

### seriesId?

> `optional` **seriesId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:115](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L115)

Series ID for identification

***

### chartId?

> `optional` **chartId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:118](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L118)

Chart ID for global identification

***

### trades?

> `optional` **trades**: `TradeConfig`[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:121](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L121)

Trade configurations for visualization

***

### tradeVisualizationOptions?

> `optional` **tradeVisualizationOptions**: `any`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/seriesFactory.d.ts:124](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/seriesFactory.d.ts#L124)

Trade visualization options
