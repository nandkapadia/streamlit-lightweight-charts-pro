[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../modules.md) / [types](../README.md) / ChartConfig

# Interface: ChartConfig

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:374](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L374)

Enhanced Chart Configuration

## Properties

### chart

> **chart**: `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:375](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L375)

#### layout?

> `optional` **layout**: `object`

##### layout.backgroundColor?

> `optional` **backgroundColor**: `string`

##### layout.textColor?

> `optional` **textColor**: `string`

##### layout.fontSize?

> `optional` **fontSize**: `number`

##### layout.fontFamily?

> `optional` **fontFamily**: `string`

##### layout.paneHeights?

> `optional` **paneHeights**: `Record`\<`string`, [`PaneHeightOptions`](PaneHeightOptions.md)\>

#### grid?

> `optional` **grid**: `object`

##### grid.vertLines?

> `optional` **vertLines**: `object`

##### grid.vertLines.color?

> `optional` **color**: `string`

##### grid.vertLines.style?

> `optional` **style**: `number`

##### grid.vertLines.visible?

> `optional` **visible**: `boolean`

##### grid.horzLines?

> `optional` **horzLines**: `object`

##### grid.horzLines.color?

> `optional` **color**: `string`

##### grid.horzLines.style?

> `optional` **style**: `number`

##### grid.horzLines.visible?

> `optional` **visible**: `boolean`

#### crosshair?

> `optional` **crosshair**: `object`

##### crosshair.mode?

> `optional` **mode**: `number`

##### crosshair.vertLine?

> `optional` **vertLine**: `object`

##### crosshair.vertLine.color?

> `optional` **color**: `string`

##### crosshair.vertLine.width?

> `optional` **width**: `number`

##### crosshair.vertLine.style?

> `optional` **style**: `number`

##### crosshair.vertLine.visible?

> `optional` **visible**: `boolean`

##### crosshair.horzLine?

> `optional` **horzLine**: `object`

##### crosshair.horzLine.color?

> `optional` **color**: `string`

##### crosshair.horzLine.width?

> `optional` **width**: `number`

##### crosshair.horzLine.style?

> `optional` **style**: `number`

##### crosshair.horzLine.visible?

> `optional` **visible**: `boolean`

#### timeScale?

> `optional` **timeScale**: `object`

##### timeScale.rightOffset?

> `optional` **rightOffset**: `number`

##### timeScale.barSpacing?

> `optional` **barSpacing**: `number`

##### timeScale.minBarSpacing?

> `optional` **minBarSpacing**: `number`

##### timeScale.fixLeftEdge?

> `optional` **fixLeftEdge**: `boolean`

##### timeScale.fixRightEdge?

> `optional` **fixRightEdge**: `boolean`

##### timeScale.fitContentOnLoad?

> `optional` **fitContentOnLoad**: `boolean`

##### timeScale.handleDoubleClick?

> `optional` **handleDoubleClick**: `boolean`

#### rightPriceScale?

> `optional` **rightPriceScale**: [`PriceScaleConfig`](../ChartInterfaces/interfaces/PriceScaleConfig.md)

#### leftPriceScale?

> `optional` **leftPriceScale**: [`PriceScaleConfig`](../ChartInterfaces/interfaces/PriceScaleConfig.md)

#### overlayPriceScales?

> `optional` **overlayPriceScales**: `Record`\<`string`, [`PriceScaleConfig`](../ChartInterfaces/interfaces/PriceScaleConfig.md)\>

#### localization?

> `optional` **localization**: `object`

##### localization.locale?

> `optional` **locale**: `string`

##### localization.priceFormatter()?

> `optional` **priceFormatter**: (`_price`) => `string`

###### Parameters

###### \_price

`number`

###### Returns

`string`

##### localization.timeFormatter()?

> `optional` **timeFormatter**: (`_time`) => `string`

###### Parameters

###### \_time

`Time`

###### Returns

`string`

#### handleScroll?

> `optional` **handleScroll**: `object`

##### handleScroll.mouseWheel?

> `optional` **mouseWheel**: `boolean`

##### handleScroll.pressedMouseMove?

> `optional` **pressedMouseMove**: `boolean`

##### handleScroll.horzTouchDrag?

> `optional` **horzTouchDrag**: `boolean`

##### handleScroll.vertTouchDrag?

> `optional` **vertTouchDrag**: `boolean`

#### handleScale?

> `optional` **handleScale**: `object`

##### handleScale.axisPressedMouseMove?

> `optional` **axisPressedMouseMove**: `object`

##### handleScale.axisPressedMouseMove.time?

> `optional` **time**: `boolean`

##### handleScale.axisPressedMouseMove.price?

> `optional` **price**: `boolean`

##### handleScale.axisDoubleClickReset?

> `optional` **axisDoubleClickReset**: `object`

##### handleScale.axisDoubleClickReset.time?

> `optional` **time**: `boolean`

##### handleScale.axisDoubleClickReset.price?

> `optional` **price**: `boolean`

##### handleScale.mouseWheel?

> `optional` **mouseWheel**: `boolean`

##### handleScale.pinch?

> `optional` **pinch**: `boolean`

#### kineticScroll?

> `optional` **kineticScroll**: `object`

##### kineticScroll.mouse?

> `optional` **mouse**: `boolean`

##### kineticScroll.touch?

> `optional` **touch**: `boolean`

#### trackingMode?

> `optional` **trackingMode**: `object`

##### trackingMode.exitMode?

> `optional` **exitMode**: `number`

#### width?

> `optional` **width**: `number`

Chart dimensions

#### height?

> `optional` **height**: `number`

#### fitContentOnLoad?

> `optional` **fitContentOnLoad**: `boolean`

Chart behavior

#### handleDoubleClick?

> `optional` **handleDoubleClick**: `boolean`

#### autoWidth?

> `optional` **autoWidth**: `boolean`

#### autoHeight?

> `optional` **autoHeight**: `boolean`

#### minWidth?

> `optional` **minWidth**: `number`

#### minHeight?

> `optional` **minHeight**: `number`

#### maxWidth?

> `optional` **maxWidth**: `number`

#### maxHeight?

> `optional` **maxHeight**: `number`

#### rangeSwitcher?

> `optional` **rangeSwitcher**: [`RangeSwitcherConfig`](RangeSwitcherConfig.md)

***

### series

> **series**: [`SeriesConfig`](SeriesConfig.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:448](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L448)

***

### priceLines?

> `optional` **priceLines**: `object`[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:449](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L449)

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

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:457](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L457)

***

### annotations?

> `optional` **annotations**: [`Annotation`](Annotation.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:458](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L458)

***

### annotationLayers?

> `optional` **annotationLayers**: [`AnnotationLayer`](AnnotationLayer.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:459](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L459)

***

### chartId?

> `optional` **chartId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:460](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L460)

***

### chartGroupId?

> `optional` **chartGroupId**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:461](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L461)

***

### containerId?

> `optional` **containerId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:462](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L462)

***

### chartOptions?

> `optional` **chartOptions**: `Record`\<`string`, `unknown`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:463](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L463)

***

### rangeSwitcher?

> `optional` **rangeSwitcher**: [`RangeSwitcherConfig`](RangeSwitcherConfig.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:464](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L464)

***

### tooltip?

> `optional` **tooltip**: [`TooltipConfig`](TooltipConfig.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:465](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L465)

***

### tooltipConfigs?

> `optional` **tooltipConfigs**: `Record`\<`string`, [`TooltipConfig`](TooltipConfig.md)\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:466](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L466)

***

### tradeVisualizationOptions?

> `optional` **tradeVisualizationOptions**: [`TradeVisualizationOptions`](TradeVisualizationOptions.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:467](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L467)

***

### paneCollapse?

> `optional` **paneCollapse**: [`ButtonPanelConfig`](ButtonPanelConfig.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:468](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L468)

***

### autoSize?

> `optional` **autoSize**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:469](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L469)

***

### autoWidth?

> `optional` **autoWidth**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:470](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L470)

***

### autoHeight?

> `optional` **autoHeight**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:471](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L471)

***

### minWidth?

> `optional` **minWidth**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:472](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L472)

***

### minHeight?

> `optional` **minHeight**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:473](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L473)

***

### maxWidth?

> `optional` **maxWidth**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:474](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L474)

***

### maxHeight?

> `optional` **maxHeight**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:475](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L475)

***

### position?

> `optional` **position**: [`ChartPosition`](ChartPosition.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:476](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L476)
