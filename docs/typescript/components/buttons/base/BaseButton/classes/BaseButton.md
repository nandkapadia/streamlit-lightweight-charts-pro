[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../../../modules.md) / [components/buttons/base/BaseButton](../README.md) / BaseButton

# Abstract Class: BaseButton

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:124](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L124)

Abstract base class for all buttons

Provides:
- Configuration management
- Styling computation
- Visibility and enabled state
- Icon and tooltip abstractions

Subclasses must implement:
- getIcon(): Return the button icon/content
- handleClick(): Handle button click action

## Extended by

- [`CollapseButton`](../../../types/CollapseButton/classes/CollapseButton.md)
- [`DeleteButton`](../../../types/DeleteButton/classes/DeleteButton.md)
- [`SeriesSettingsButton`](../../../types/SeriesSettingsButton/classes/SeriesSettingsButton.md)

## Constructors

### Constructor

> **new BaseButton**(`config`): `BaseButton`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:128](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L128)

#### Parameters

##### config

[`BaseButtonConfig`](../../ButtonConfig/interfaces/BaseButtonConfig.md)

#### Returns

`BaseButton`

## Properties

### config

> `protected` **config**: [`BaseButtonConfig`](../../ButtonConfig/interfaces/BaseButtonConfig.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:125](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L125)

***

### styling

> `protected` **styling**: `Required`\<[`ButtonStyling`](../../ButtonConfig/interfaces/ButtonStyling.md)\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:126](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L126)

## Methods

### getIcon()

> `abstract` **getIcon**(`state`): `ReactNode`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:146](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L146)

Get the icon/content to display in the button

#### Parameters

##### state

[`ButtonState`](../../ButtonConfig/interfaces/ButtonState.md)

#### Returns

`ReactNode`

***

### handleClick()

> `abstract` **handleClick**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:152](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L152)

Handle button click event

#### Returns

`void`

***

### getTooltip()

> **getTooltip**(`_state`): `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:157](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L157)

Get tooltip text (can be overridden for dynamic tooltips)

#### Parameters

##### \_state

[`ButtonState`](../../ButtonConfig/interfaces/ButtonState.md)

#### Returns

`string`

***

### isVisible()

> **isVisible**(): `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:164](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L164)

Check if button should be visible

#### Returns

`boolean`

***

### isEnabled()

> **isEnabled**(): `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:171](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L171)

Check if button should be enabled

#### Returns

`boolean`

***

### getId()

> **getId**(): `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:178](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L178)

Get button ID

#### Returns

`string`

***

### getDebounceDelay()

> **getDebounceDelay**(): `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:185](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L185)

Get debounce delay

#### Returns

`number`

***

### updateConfig()

> **updateConfig**(`updates`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:192](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L192)

Update button configuration

#### Parameters

##### updates

`Partial`\<[`BaseButtonConfig`](../../ButtonConfig/interfaces/BaseButtonConfig.md)\>

#### Returns

`void`

***

### getButtonStyle()

> **getButtonStyle**(`state`): `CSSProperties`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:206](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L206)

Get button styles based on current state

#### Parameters

##### state

[`ButtonState`](../../ButtonConfig/interfaces/ButtonState.md)

#### Returns

`CSSProperties`

***

### render()

> **render**(): `ReactElement`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:235](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L235)

Render the button using the functional wrapper component

Returns a React element that wraps this button instance
in the BaseButtonRenderer functional component.

#### Returns

`ReactElement`
