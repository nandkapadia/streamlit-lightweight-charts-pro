[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../modules.md) / [types](../README.md) / ButtonPanelConfig

# Interface: ButtonPanelConfig

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:232](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L232)

Button Panel Configuration

## Properties

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:233](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L233)

***

### buttonSize?

> `optional` **buttonSize**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:234](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L234)

***

### buttonColor?

> `optional` **buttonColor**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:235](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L235)

***

### buttonHoverColor?

> `optional` **buttonHoverColor**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:236](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L236)

***

### buttonBackground?

> `optional` **buttonBackground**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:237](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L237)

***

### buttonHoverBackground?

> `optional` **buttonHoverBackground**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:238](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L238)

***

### buttonBorderRadius?

> `optional` **buttonBorderRadius**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:239](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L239)

***

### corner?

> `optional` **corner**: `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:240](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L240)

***

### zIndex?

> `optional` **zIndex**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:241](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L241)

***

### showTooltip?

> `optional` **showTooltip**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:242](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L242)

***

### tooltipText?

> `optional` **tooltipText**: `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:243](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L243)

#### collapse?

> `optional` **collapse**: `string`

#### expand?

> `optional` **expand**: `string`

***

### showCollapseButton?

> `optional` **showCollapseButton**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:247](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L247)

***

### showSeriesSettingsButton?

> `optional` **showSeriesSettingsButton**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:248](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L248)

***

### legendConfig?

> `optional` **legendConfig**: [`LegendData`](../ChartInterfaces/interfaces/LegendData.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:249](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L249)

***

### onPaneCollapse()?

> `optional` **onPaneCollapse**: (`_paneId`, `_isCollapsed`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:250](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L250)

#### Parameters

##### \_paneId

`number`

##### \_isCollapsed

`boolean`

#### Returns

`void`

***

### onPaneExpand()?

> `optional` **onPaneExpand**: (`_paneId`, `_isCollapsed`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:251](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L251)

#### Parameters

##### \_paneId

`number`

##### \_isCollapsed

`boolean`

#### Returns

`void`

***

### onSeriesConfigChange()?

> `optional` **onSeriesConfigChange**: (`_paneId`, `_seriesId`, `_config`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types.ts:252](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types.ts#L252)

#### Parameters

##### \_paneId

`number`

##### \_seriesId

`string`

##### \_config

`Record`\<`string`, `unknown`\>

#### Returns

`void`
