[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [primitives/ButtonPanelPrimitive](../README.md) / ButtonPanelPrimitiveConfig

# Interface: ButtonPanelPrimitiveConfig

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:38](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L38)

Configuration interface for ButtonPanelPrimitive

## Extends

- `BasePrimitiveConfig`

## Properties

### corner?

> `optional` **corner**: `Corner`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:15](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L15)

Position in chart corner

#### Inherited from

`BasePrimitiveConfig.corner`

***

### priority?

> `optional` **priority**: `number`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:19](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L19)

Priority for stacking order (lower = higher priority)

#### Inherited from

`BasePrimitiveConfig.priority`

***

### visible?

> `optional` **visible**: `boolean`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:23](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L23)

Whether the primitive is visible

#### Inherited from

`BasePrimitiveConfig.visible`

***

### style?

> `optional` **style**: `object`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:27](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L27)

Styling configuration

#### backgroundColor?

> `optional` **backgroundColor**: `string`

#### color?

> `optional` **color**: `string`

#### fontSize?

> `optional` **fontSize**: `number`

#### fontFamily?

> `optional` **fontFamily**: `string`

#### borderRadius?

> `optional` **borderRadius**: `number`

#### padding?

> `optional` **padding**: `number`

#### margin?

> `optional` **margin**: `number`

#### zIndex?

> `optional` **zIndex**: `number`

#### Inherited from

`BasePrimitiveConfig.style`

***

### isPanePrimitive?

> `optional` **isPanePrimitive**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:40](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L40)

Whether this is a pane-specific primitive (vs chart-level)

***

### paneId

> **paneId**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:42](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L42)

Pane ID this button panel belongs to

***

### chartId?

> `optional` **chartId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:44](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L44)

Chart ID for backend synchronization

***

### buttonSize?

> `optional` **buttonSize**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:46](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L46)

Button configuration options

***

### buttonColor?

> `optional` **buttonColor**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:47](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L47)

***

### buttonHoverColor?

> `optional` **buttonHoverColor**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:48](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L48)

***

### buttonBackground?

> `optional` **buttonBackground**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:49](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L49)

***

### buttonHoverBackground?

> `optional` **buttonHoverBackground**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:50](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L50)

***

### buttonBorderRadius?

> `optional` **buttonBorderRadius**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:51](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L51)

***

### showTooltip?

> `optional` **showTooltip**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:52](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L52)

***

### tooltipText?

> `optional` **tooltipText**: `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:53](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L53)

#### collapse?

> `optional` **collapse**: `string`

#### expand?

> `optional` **expand**: `string`

***

### showCollapseButton?

> `optional` **showCollapseButton**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:57](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L57)

***

### showSeriesSettingsButton?

> `optional` **showSeriesSettingsButton**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:58](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L58)

***

### onPaneCollapse()?

> `optional` **onPaneCollapse**: (`paneId`, `isCollapsed`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:60](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L60)

Callback fired when pane is collapsed

#### Parameters

##### paneId

`number`

##### isCollapsed

`boolean`

#### Returns

`void`

***

### onPaneExpand()?

> `optional` **onPaneExpand**: (`paneId`, `isCollapsed`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:62](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L62)

Callback fired when pane is expanded

#### Parameters

##### paneId

`number`

##### isCollapsed

`boolean`

#### Returns

`void`

***

### onSeriesConfigChange()?

> `optional` **onSeriesConfigChange**: (`paneId`, `seriesId`, `config`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:64](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L64)

Callback fired when series config changes

#### Parameters

##### paneId

`number`

##### seriesId

`string`

##### config

`Record`\<`string`, `unknown`\>

#### Returns

`void`
