[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../../modules.md) / [plugins/overlay/rectanglePlugin](../README.md) / RectangleOverlayPlugin

# Class: RectangleOverlayPlugin

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/plugins/overlay/rectanglePlugin.ts:70](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/plugins/overlay/rectanglePlugin.ts#L70)

## Constructors

### Constructor

> **new RectangleOverlayPlugin**(): `RectangleOverlayPlugin`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/plugins/overlay/rectanglePlugin.ts:82](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/plugins/overlay/rectanglePlugin.ts#L82)

#### Returns

`RectangleOverlayPlugin`

## Methods

### setChart()

> **setChart**(`chart`, `_series?`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/plugins/overlay/rectanglePlugin.ts:86](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/plugins/overlay/rectanglePlugin.ts#L86)

#### Parameters

##### chart

`IChartApi`

##### \_series?

`any`

#### Returns

`void`

***

### addToChart()

> **addToChart**(`chart`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/plugins/overlay/rectanglePlugin.ts:92](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/plugins/overlay/rectanglePlugin.ts#L92)

Public method for testing compatibility

#### Parameters

##### chart

`IChartApi`

#### Returns

`void`

***

### remove()

> **remove**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/plugins/overlay/rectanglePlugin.ts:96](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/plugins/overlay/rectanglePlugin.ts#L96)

#### Returns

`void`

***

### setRectangles()

> **setRectangles**(`rectangles`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/plugins/overlay/rectanglePlugin.ts:106](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/plugins/overlay/rectanglePlugin.ts#L106)

#### Parameters

##### rectangles

[`RectangleConfig`](../interfaces/RectangleConfig.md)[]

#### Returns

`void`

***

### addRectangle()

> **addRectangle**(`rect`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/plugins/overlay/rectanglePlugin.ts:519](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/plugins/overlay/rectanglePlugin.ts#L519)

#### Parameters

##### rect

[`RectangleConfig`](../interfaces/RectangleConfig.md)

#### Returns

`void`

***

### removeRectangle()

> **removeRectangle**(`id`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/plugins/overlay/rectanglePlugin.ts:525](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/plugins/overlay/rectanglePlugin.ts#L525)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### updateRectangle()

> **updateRectangle**(`id`, `updates`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/plugins/overlay/rectanglePlugin.ts:534](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/plugins/overlay/rectanglePlugin.ts#L534)

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`RectangleConfig`](../interfaces/RectangleConfig.md)\>

#### Returns

`void`

***

### clearRectangles()

> **clearRectangles**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/plugins/overlay/rectanglePlugin.ts:543](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/plugins/overlay/rectanglePlugin.ts#L543)

#### Returns

`void`

***

### getRectangles()

> **getRectangles**(): [`RectangleConfig`](../interfaces/RectangleConfig.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/plugins/overlay/rectanglePlugin.ts:549](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/plugins/overlay/rectanglePlugin.ts#L549)

#### Returns

[`RectangleConfig`](../interfaces/RectangleConfig.md)[]

***

### dispose()

> **dispose**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/plugins/overlay/rectanglePlugin.ts:553](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/plugins/overlay/rectanglePlugin.ts#L553)

#### Returns

`void`
