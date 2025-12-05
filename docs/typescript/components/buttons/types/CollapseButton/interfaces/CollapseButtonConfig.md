[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../../../modules.md) / [components/buttons/types/CollapseButton](../README.md) / CollapseButtonConfig

# Interface: CollapseButtonConfig

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/CollapseButton.tsx:15](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/CollapseButton.tsx#L15)

Configuration for CollapseButton

## Extends

- [`BaseButtonConfig`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md)

## Properties

### id

> **id**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:14](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L14)

Unique identifier for the button

#### Inherited from

[`BaseButtonConfig`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md).[`id`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md#id)

***

### tooltip

> **tooltip**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:17](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L17)

Tooltip text to display on hover

#### Inherited from

[`BaseButtonConfig`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md).[`tooltip`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md#tooltip)

***

### visible?

> `optional` **visible**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:20](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L20)

Whether the button is visible

#### Inherited from

[`BaseButtonConfig`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md).[`visible`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md#visible)

***

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:23](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L23)

Whether the button is enabled (clickable)

#### Inherited from

[`BaseButtonConfig`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md).[`enabled`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md#enabled)

***

### styling?

> `optional` **styling**: [`ButtonStyling`](../../../base/ButtonConfig/interfaces/ButtonStyling.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:26](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L26)

Visual configuration

#### Inherited from

[`BaseButtonConfig`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md).[`styling`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md#styling)

***

### debounceDelay?

> `optional` **debounceDelay**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:29](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L29)

Debounce delay for click events in milliseconds

#### Inherited from

[`BaseButtonConfig`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md).[`debounceDelay`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md#debouncedelay)

***

### onCollapseClick()

> **onCollapseClick**: () => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/CollapseButton.tsx:17](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/CollapseButton.tsx#L17)

Callback when collapse button is clicked

#### Returns

`void`

***

### isCollapsed

> **isCollapsed**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/CollapseButton.tsx:20](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/CollapseButton.tsx#L20)

Current collapsed state

***

### customExpandIcon?

> `optional` **customExpandIcon**: `ReactNode`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/CollapseButton.tsx:23](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/CollapseButton.tsx#L23)

Custom expand icon (optional override)

***

### customCollapseIcon?

> `optional` **customCollapseIcon**: `ReactNode`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/CollapseButton.tsx:26](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/CollapseButton.tsx#L26)

Custom collapse icon (optional override)

***

### expandTooltip?

> `optional` **expandTooltip**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/CollapseButton.tsx:29](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/CollapseButton.tsx#L29)

Tooltip text for expand state

***

### collapseTooltip?

> `optional` **collapseTooltip**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/CollapseButton.tsx:32](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/CollapseButton.tsx#L32)

Tooltip text for collapse state
