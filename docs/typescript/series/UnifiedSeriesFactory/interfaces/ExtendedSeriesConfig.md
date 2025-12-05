[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [series/UnifiedSeriesFactory](../README.md) / ExtendedSeriesConfig

# Interface: ExtendedSeriesConfig

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:397](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L397)

Extended series configuration for full-featured series creation
This interface matches the old SeriesConfig for backward compatibility
Uses any for maximum flexibility with existing code

## Indexable

\[`key`: `string`\]: `unknown`

Allow additional properties from SeriesConfig

## Properties

### type

> **type**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:399](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L399)

Series type (e.g., 'Line', 'Area', 'Band')

***

### data?

> `optional` **data**: `unknown`[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:401](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L401)

Series data (flexible type for all series data formats)

***

### options?

> `optional` **options**: `Record`\<`string`, `unknown`\> \| `SeriesOptionsCommon`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:403](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L403)

Series options (flexible to accept any options structure)

***

### paneId?

> `optional` **paneId**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:405](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L405)

Pane ID for multi-pane charts

***

### priceScale?

> `optional` **priceScale**: `Record`\<`string`, `unknown`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:407](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L407)

Price scale configuration

***

### priceScaleId?

> `optional` **priceScaleId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:409](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L409)

Price scale ID for series attachment

***

### priceLines?

> `optional` **priceLines**: `Record`\<`string`, `unknown`\>[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:411](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L411)

Price lines to add

***

### markers?

> `optional` **markers**: `SeriesMarker`\<`Time`\>[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:413](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L413)

Markers to add

***

### legend?

> `optional` **legend**: `Record`\<`string`, `unknown`\> \| `null`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:415](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L415)

Legend configuration

***

### seriesId?

> `optional` **seriesId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:417](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L417)

Series ID for identification

***

### chartId?

> `optional` **chartId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:419](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L419)

Chart ID for global identification

***

### title?

> `optional` **title**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:421](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L421)

Series title (technical name for chart axis/legend)

***

### displayName?

> `optional` **displayName**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:423](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L423)

Display name (user-friendly name for UI elements like dialog tabs)

***

### visible?

> `optional` **visible**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:425](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L425)

Series visibility

***

### zIndex?

> `optional` **zIndex**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:427](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L427)

Z-index for rendering order

***

### lastValueVisible?

> `optional` **lastValueVisible**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:429](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L429)

Show last value on price scale

***

### priceLineVisible?

> `optional` **priceLineVisible**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:431](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L431)

Show price line

***

### priceLineSource?

> `optional` **priceLineSource**: `number` \| `"lastBar"` \| `"lastVisible"`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:433](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L433)

Price line source (0 = lastBar, 1 = lastVisible, or string 'lastBar'/'lastVisible')

***

### priceLineWidth?

> `optional` **priceLineWidth**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:435](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L435)

Price line width

***

### priceLineColor?

> `optional` **priceLineColor**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:437](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L437)

Price line color

***

### priceLineStyle?

> `optional` **priceLineStyle**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:439](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L439)

Price line style

***

### trades?

> `optional` **trades**: [`TradeConfig`](../../../types/interfaces/TradeConfig.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:441](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L441)

Trade configurations for visualization

***

### tradeVisualizationOptions?

> `optional` **tradeVisualizationOptions**: [`TradeVisualizationOptions`](../../../types/interfaces/TradeVisualizationOptions.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:443](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L443)

Trade visualization options
