[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../../../modules.md) / [components/buttons/base/ButtonRegistry](../README.md) / ButtonRegistry

# Class: ButtonRegistry

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonRegistry.ts:21](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonRegistry.ts#L21)

Button registry singleton

Manages all button instances for a button panel, allowing:
- Registration of new button types
- Retrieval of buttons by ID
- Ordered button lists based on priority
- Dynamic button addition/removal

## Constructors

### Constructor

> **new ButtonRegistry**(): `ButtonRegistry`

#### Returns

`ButtonRegistry`

## Methods

### register()

> **register**(`button`, `priority`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonRegistry.ts:31](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonRegistry.ts#L31)

Register a button in the registry

#### Parameters

##### button

[`BaseButton`](../../BaseButton/classes/BaseButton.md)

Button instance to register

##### priority

`number` = `100`

Optional priority for ordering (lower = earlier in panel)

#### Returns

`void`

***

### unregister()

> **unregister**(`id`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonRegistry.ts:56](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonRegistry.ts#L56)

Unregister a button from the registry

#### Parameters

##### id

`string`

#### Returns

`void`

***

### getButton()

> **getButton**(`id`): [`BaseButton`](../../BaseButton/classes/BaseButton.md) \| `undefined`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonRegistry.ts:69](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonRegistry.ts#L69)

Get a button by ID

#### Parameters

##### id

`string`

#### Returns

[`BaseButton`](../../BaseButton/classes/BaseButton.md) \| `undefined`

***

### getAllButtons()

> **getAllButtons**(): [`BaseButton`](../../BaseButton/classes/BaseButton.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonRegistry.ts:76](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonRegistry.ts#L76)

Get all registered buttons in order

#### Returns

[`BaseButton`](../../BaseButton/classes/BaseButton.md)[]

***

### getVisibleButtons()

> **getVisibleButtons**(): [`BaseButton`](../../BaseButton/classes/BaseButton.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonRegistry.ts:85](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonRegistry.ts#L85)

Get all visible buttons in order

#### Returns

[`BaseButton`](../../BaseButton/classes/BaseButton.md)[]

***

### clear()

> **clear**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonRegistry.ts:92](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonRegistry.ts#L92)

Clear all buttons from registry

#### Returns

`void`

***

### getButtonCount()

> **getButtonCount**(): `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonRegistry.ts:100](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonRegistry.ts#L100)

Get count of registered buttons

#### Returns

`number`

***

### hasButton()

> **hasButton**(`id`): `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonRegistry.ts:107](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonRegistry.ts#L107)

Check if a button is registered

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### setButtonOrder()

> **setButtonOrder**(`order`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonRegistry.ts:114](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonRegistry.ts#L114)

Update button order manually

#### Parameters

##### order

`string`[]

#### Returns

`void`

***

### getButtonOrder()

> **getButtonOrder**(): `string`[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/buttons/base/ButtonRegistry.ts:128](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/buttons/base/ButtonRegistry.ts#L128)

Get button order

#### Returns

`string`[]
