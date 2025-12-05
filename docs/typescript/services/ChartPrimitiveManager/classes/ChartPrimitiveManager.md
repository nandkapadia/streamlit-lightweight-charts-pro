[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [services/ChartPrimitiveManager](../README.md) / ChartPrimitiveManager

# Class: ChartPrimitiveManager

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/ChartPrimitiveManager.ts:79](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/ChartPrimitiveManager.ts#L79)

ChartPrimitiveManager - Centralized primitive lifecycle manager

Manages all chart primitives with unified API, coordinated positioning,
and proper cleanup. Replaces old widget-based approach with pure
primitive architecture.

## Export

ChartPrimitiveManager

## Methods

### getInstance()

> `static` **getInstance**(`chart`, `chartId`): `ChartPrimitiveManager`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/ChartPrimitiveManager.ts:99](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/ChartPrimitiveManager.ts#L99)

Get or create primitive manager for a chart

#### Parameters

##### chart

`IChartApi`

##### chartId

`string`

#### Returns

`ChartPrimitiveManager`

***

### cleanup()

> `static` **cleanup**(`chartId`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/ChartPrimitiveManager.ts:113](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/ChartPrimitiveManager.ts#L113)

Clean up primitive manager for a chart

#### Parameters

##### chartId

`string`

#### Returns

`void`

***

### addRangeSwitcher()

> **addRangeSwitcher**(`config`): `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/ChartPrimitiveManager.ts:134](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/ChartPrimitiveManager.ts#L134)

Add range switcher primitive

#### Parameters

##### config

[`RangeSwitcherConfig`](../../../types/interfaces/RangeSwitcherConfig.md)

#### Returns

`object`

##### destroy()

> **destroy**: () => `void`

###### Returns

`void`

***

### addLegend()

> **addLegend**(`config`, `isPanePrimitive`, `paneId`, `seriesReference?`): `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/ChartPrimitiveManager.ts:162](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/ChartPrimitiveManager.ts#L162)

Add legend primitive

#### Parameters

##### config

[`LegendConfig`](../../../types/interfaces/LegendConfig.md)

##### isPanePrimitive

`boolean` = `false`

##### paneId

`number` = `0`

##### seriesReference?

[`ExtendedSeriesApi`](../../../types/ChartInterfaces/interfaces/ExtendedSeriesApi.md)\<keyof `SeriesOptionsMap`\>

#### Returns

`object`

##### destroy()

> **destroy**: () => `void`

###### Returns

`void`

##### primitiveId

> **primitiveId**: `string`

***

### addButtonPanel()

> **addButtonPanel**(`paneId`, `config`): `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/ChartPrimitiveManager.ts:212](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/ChartPrimitiveManager.ts#L212)

Add button panel (gear + collapse buttons) primitive

#### Parameters

##### paneId

`number`

##### config

[`ButtonPanelConfig`](../../../types/interfaces/ButtonPanelConfig.md) = `{}`

#### Returns

`object`

##### destroy()

> **destroy**: () => `void`

###### Returns

`void`

##### plugin

> **plugin**: [`ButtonPanelPrimitive`](../../../primitives/ButtonPanelPrimitive/classes/ButtonPanelPrimitive.md)

***

### updateLegendValues()

> **updateLegendValues**(`_crosshairData`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/ChartPrimitiveManager.ts:276](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/ChartPrimitiveManager.ts#L276)

Update legend values with crosshair data

#### Parameters

##### \_crosshairData

[`CrosshairEventData`](../../../types/ChartInterfaces/interfaces/CrosshairEventData.md)

#### Returns

`void`

***

### getPrimitive()

> **getPrimitive**(`primitiveId`): [`ButtonPanelPrimitive`](../../../primitives/ButtonPanelPrimitive/classes/ButtonPanelPrimitive.md) \| `LegendPrimitive` \| `RangeSwitcherPrimitive` \| `undefined`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/ChartPrimitiveManager.ts:304](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/ChartPrimitiveManager.ts#L304)

Get primitive by ID

#### Parameters

##### primitiveId

`string`

#### Returns

[`ButtonPanelPrimitive`](../../../primitives/ButtonPanelPrimitive/classes/ButtonPanelPrimitive.md) \| `LegendPrimitive` \| `RangeSwitcherPrimitive` \| `undefined`

***

### getAllPrimitives()

> **getAllPrimitives**(): `Map`\<`string`, [`ButtonPanelPrimitive`](../../../primitives/ButtonPanelPrimitive/classes/ButtonPanelPrimitive.md) \| `LegendPrimitive` \| `RangeSwitcherPrimitive`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/ChartPrimitiveManager.ts:313](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/ChartPrimitiveManager.ts#L313)

Get all primitives

#### Returns

`Map`\<`string`, [`ButtonPanelPrimitive`](../../../primitives/ButtonPanelPrimitive/classes/ButtonPanelPrimitive.md) \| `LegendPrimitive` \| `RangeSwitcherPrimitive`\>

***

### destroy()

> **destroy**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/ChartPrimitiveManager.ts:323](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/ChartPrimitiveManager.ts#L323)

Destroy all primitives for this chart

#### Returns

`void`

***

### getEventManager()

> **getEventManager**(): `PrimitiveEventManager`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/ChartPrimitiveManager.ts:344](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/ChartPrimitiveManager.ts#L344)

Get event manager instance (for advanced usage)

#### Returns

`PrimitiveEventManager`

***

### getChartId()

> **getChartId**(): `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/ChartPrimitiveManager.ts:351](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/ChartPrimitiveManager.ts#L351)

Get chart ID

#### Returns

`string`
