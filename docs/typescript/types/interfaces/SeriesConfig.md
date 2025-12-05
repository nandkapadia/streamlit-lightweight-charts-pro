[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../modules.md) / [types](../README.md) / SeriesConfig

# Interface: SeriesConfig

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:287](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L287)

Enhanced Series Configuration

## Properties

### type

> **type**: `"Bar"` \| `"Candlestick"` \| `"Area"` \| `"Baseline"` \| `"Line"` \| `"Histogram"` \| `"Band"` \| `"signal"` \| `"trend_fill"` \| `"ribbon"`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:288](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L288)

***

### data

> **data**: [`SeriesDataPoint`](../ChartInterfaces/type-aliases/SeriesDataPoint.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:299](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L299)

***

### options?

> `optional` **options**: [`SeriesOptionsConfig`](../ChartInterfaces/interfaces/SeriesOptionsConfig.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:300](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L300)

***

### name?

> `optional` **name**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:301](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L301)

***

### title?

> `optional` **title**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:302](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L302)

***

### priceScale?

> `optional` **priceScale**: [`PriceScaleConfig`](../ChartInterfaces/interfaces/PriceScaleConfig.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:303](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L303)

***

### priceScaleId?

> `optional` **priceScaleId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:304](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L304)

***

### lastValueVisible?

> `optional` **lastValueVisible**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:305](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L305)

***

### lastPriceAnimation?

> `optional` **lastPriceAnimation**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:306](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L306)

***

### markers?

> `optional` **markers**: `SeriesMarker`\<`Time`\>[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:307](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L307)

***

### priceLines?

> `optional` **priceLines**: `object`[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:308](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L308)

#### price

> **price**: `number`

#### color?

> `optional` **color**: `string`

#### lineWidth?

> `optional` **lineWidth**: `number`

#### lineStyle?

> `optional` **lineStyle**: `number`

#### axisLabelVisible?

> `optional` **axisLabelVisible**: `boolean`

#### title?

> `optional` **title**: `string`

***

### trades?

> `optional` **trades**: [`TradeConfig`](TradeConfig.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:316](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L316)

***

### tradeVisualizationOptions?

> `optional` **tradeVisualizationOptions**: [`TradeVisualizationOptions`](TradeVisualizationOptions.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:317](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L317)

***

### annotations?

> `optional` **annotations**: [`Annotation`](Annotation.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:318](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L318)

***

### shapes?

> `optional` **shapes**: `object`[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:319](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L319)

#### type

> **type**: `string`

#### points

> **points**: `object`[]

#### color?

> `optional` **color**: `string`

#### fillColor?

> `optional` **fillColor**: `string`

***

### tooltip?

> `optional` **tooltip**: [`TooltipConfig`](TooltipConfig.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:325](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L325)

***

### legend?

> `optional` **legend**: [`LegendData`](../ChartInterfaces/interfaces/LegendData.md) \| `null`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:326](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L326)

***

### paneId?

> `optional` **paneId**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:327](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L327)

***

### signalData?

> `optional` **signalData**: [`SignalData`](SignalData.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:329](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L329)

Signal series support

***

### lineOptions?

> `optional` **lineOptions**: [`LineOptions`](LineOptions.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:332](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L332)

Line options support

***

### lineStyle?

> `optional` **lineStyle**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:334](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L334)

Line series specific options (for backward compatibility)

***

### line\_style?

> `optional` **line\_style**: `Record`\<`string`, `unknown`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:335](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L335)

***

### lineType?

> `optional` **lineType**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:336](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L336)

***

### lineVisible?

> `optional` **lineVisible**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:337](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L337)

***

### pointMarkersVisible?

> `optional` **pointMarkersVisible**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:338](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L338)

***

### pointMarkersRadius?

> `optional` **pointMarkersRadius**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:339](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L339)

***

### crosshairMarkerVisible?

> `optional` **crosshairMarkerVisible**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:340](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L340)

***

### crosshairMarkerRadius?

> `optional` **crosshairMarkerRadius**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:341](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L341)

***

### crosshairMarkerBorderColor?

> `optional` **crosshairMarkerBorderColor**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:342](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L342)

***

### crosshairMarkerBackgroundColor?

> `optional` **crosshairMarkerBackgroundColor**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:343](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L343)

***

### crosshairMarkerBorderWidth?

> `optional` **crosshairMarkerBorderWidth**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:344](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L344)

***

### relativeGradient?

> `optional` **relativeGradient**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:346](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L346)

Area series specific options

***

### invertFilledArea?

> `optional` **invertFilledArea**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:347](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L347)

***

### priceLineVisible?

> `optional` **priceLineVisible**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:349](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L349)

Price line properties

***

### priceLineSource?

> `optional` **priceLineSource**: `"lastBar"` \| `"lastVisible"`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:350](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L350)

***

### priceLineWidth?

> `optional` **priceLineWidth**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:351](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L351)

***

### priceLineColor?

> `optional` **priceLineColor**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:352](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L352)

***

### priceLineStyle?

> `optional` **priceLineStyle**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:353](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L353)
