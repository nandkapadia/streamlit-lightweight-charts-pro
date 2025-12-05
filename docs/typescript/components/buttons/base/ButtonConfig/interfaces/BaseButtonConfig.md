[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../../../modules.md) / [components/buttons/base/ButtonConfig](../README.md) / BaseButtonConfig

# Interface: BaseButtonConfig

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:12](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L12)

Base configuration for all buttons

## Extended by

- [`CollapseButtonConfig`](../../../types/CollapseButton/interfaces/CollapseButtonConfig.md)
- [`DeleteButtonConfig`](../../../types/DeleteButton/interfaces/DeleteButtonConfig.md)
- [`SeriesSettingsButtonConfig`](../../../types/SeriesSettingsButton/interfaces/SeriesSettingsButtonConfig.md)

## Properties

### id

> **id**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:14](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L14)

Unique identifier for the button

***

### tooltip

> **tooltip**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:17](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L17)

Tooltip text to display on hover

***

### visible?

> `optional` **visible**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:20](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L20)

Whether the button is visible

***

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:23](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L23)

Whether the button is enabled (clickable)

***

### styling?

> `optional` **styling**: [`ButtonStyling`](ButtonStyling.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:26](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L26)

Visual configuration

***

### debounceDelay?

> `optional` **debounceDelay**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonConfig.ts:29](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonConfig.ts#L29)

Debounce delay for click events in milliseconds
