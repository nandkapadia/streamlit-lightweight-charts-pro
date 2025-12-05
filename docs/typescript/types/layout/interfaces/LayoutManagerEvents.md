[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [types/layout](../README.md) / LayoutManagerEvents

# Interface: LayoutManagerEvents

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/layout.ts:95](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/layout.ts#L95)

## Properties

### onLayoutChanged()

> **onLayoutChanged**: (`_corner`, `_widgets`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/layout.ts:96](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/layout.ts#L96)

#### Parameters

##### \_corner

[`Corner`](../type-aliases/Corner.md)

##### \_widgets

[`IPositionableWidget`](IPositionableWidget.md)[]

#### Returns

`void`

***

### onOverflow()

> **onOverflow**: (`_corner`, `_overflowingWidgets`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/layout.ts:97](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/layout.ts#L97)

#### Parameters

##### \_corner

[`Corner`](../type-aliases/Corner.md)

##### \_overflowingWidgets

[`IPositionableWidget`](IPositionableWidget.md)[]

#### Returns

`void`
