[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../../../modules.md) / [components/buttons/types/DeleteButton](../README.md) / DeleteButton

# Class: DeleteButton

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/DeleteButton.tsx:45](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/DeleteButton.tsx#L45)

Delete button for removing series

Features:
- TradingView-style delete icon
- Optional confirmation before delete
- Supports custom icons
- Debounced click handling

## Example

```typescript
const deleteButton = new DeleteButton({
  id: 'delete-button',
  tooltip: 'Delete series',
  onDeleteClick: () => removeSeries(),
  requireConfirmation: true,
});
```

## Extends

- [`BaseButton`](../../../base/BaseButton/classes/BaseButton.md)

## Constructors

### Constructor

> **new DeleteButton**(`config`): `DeleteButton`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/DeleteButton.tsx:48](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/DeleteButton.tsx#L48)

#### Parameters

##### config

[`DeleteButtonConfig`](../interfaces/DeleteButtonConfig.md)

#### Returns

`DeleteButton`

#### Overrides

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`constructor`](../../../base/BaseButton/classes/BaseButton.md#constructor)

## Properties

### config

> `protected` **config**: [`BaseButtonConfig`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:125](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L125)

#### Inherited from

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`config`](../../../base/BaseButton/classes/BaseButton.md#config)

***

### styling

> `protected` **styling**: `Required`\<[`ButtonStyling`](../../../base/ButtonConfig/interfaces/ButtonStyling.md)\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:126](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L126)

#### Inherited from

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`styling`](../../../base/BaseButton/classes/BaseButton.md#styling)

## Methods

### isVisible()

> **isVisible**(): `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:164](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L164)

Check if button should be visible

#### Returns

`boolean`

#### Inherited from

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`isVisible`](../../../base/BaseButton/classes/BaseButton.md#isvisible)

***

### isEnabled()

> **isEnabled**(): `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:171](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L171)

Check if button should be enabled

#### Returns

`boolean`

#### Inherited from

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`isEnabled`](../../../base/BaseButton/classes/BaseButton.md#isenabled)

***

### getId()

> **getId**(): `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:178](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L178)

Get button ID

#### Returns

`string`

#### Inherited from

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`getId`](../../../base/BaseButton/classes/BaseButton.md#getid)

***

### getDebounceDelay()

> **getDebounceDelay**(): `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:185](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L185)

Get debounce delay

#### Returns

`number`

#### Inherited from

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`getDebounceDelay`](../../../base/BaseButton/classes/BaseButton.md#getdebouncedelay)

***

### updateConfig()

> **updateConfig**(`updates`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:192](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L192)

Update button configuration

#### Parameters

##### updates

`Partial`\<[`BaseButtonConfig`](../../../base/ButtonConfig/interfaces/BaseButtonConfig.md)\>

#### Returns

`void`

#### Inherited from

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`updateConfig`](../../../base/BaseButton/classes/BaseButton.md#updateconfig)

***

### getButtonStyle()

> **getButtonStyle**(`state`): `CSSProperties`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:206](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L206)

Get button styles based on current state

#### Parameters

##### state

[`ButtonState`](../../../base/ButtonConfig/interfaces/ButtonState.md)

#### Returns

`CSSProperties`

#### Inherited from

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`getButtonStyle`](../../../base/BaseButton/classes/BaseButton.md#getbuttonstyle)

***

### render()

> **render**(): `ReactElement`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/BaseButton.tsx:235](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/BaseButton.tsx#L235)

Render the button using the functional wrapper component

Returns a React element that wraps this button instance
in the BaseButtonRenderer functional component.

#### Returns

`ReactElement`

#### Inherited from

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`render`](../../../base/BaseButton/classes/BaseButton.md#render)

***

### getIcon()

> **getIcon**(`_state`): `ReactNode`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/DeleteButton.tsx:60](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/DeleteButton.tsx#L60)

Get the delete icon SVG

#### Parameters

##### \_state

[`ButtonState`](../../../base/ButtonConfig/interfaces/ButtonState.md)

#### Returns

`ReactNode`

#### Overrides

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`getIcon`](../../../base/BaseButton/classes/BaseButton.md#geticon)

***

### handleClick()

> **handleClick**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/DeleteButton.tsx:80](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/DeleteButton.tsx#L80)

Handle delete button click

#### Returns

`void`

#### Overrides

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`handleClick`](../../../base/BaseButton/classes/BaseButton.md#handleclick)

***

### getTooltip()

> **getTooltip**(`_state`): `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/DeleteButton.tsx:97](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/DeleteButton.tsx#L97)

Get tooltip text

#### Parameters

##### \_state

[`ButtonState`](../../../base/ButtonConfig/interfaces/ButtonState.md)

#### Returns

`string`

#### Overrides

[`BaseButton`](../../../base/BaseButton/classes/BaseButton.md).[`getTooltip`](../../../base/BaseButton/classes/BaseButton.md#gettooltip)

***

### updateDeleteConfig()

> **updateDeleteConfig**(`updates`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/types/DeleteButton.tsx:104](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/types/DeleteButton.tsx#L104)

Update delete-specific configuration

#### Parameters

##### updates

`Partial`\<[`DeleteButtonConfig`](../interfaces/DeleteButtonConfig.md)\>

#### Returns

`void`
