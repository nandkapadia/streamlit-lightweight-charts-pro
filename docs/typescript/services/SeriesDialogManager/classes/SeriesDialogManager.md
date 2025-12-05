[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [services/SeriesDialogManager](../README.md) / SeriesDialogManager

# Class: SeriesDialogManager

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:115](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L115)

Manager for series configuration dialog

Manages the lifecycle of series settings dialogs using React Portals.
This class bridges the gap between imperative chart management and
declarative React rendering.

Architecture:
- Keyed singleton pattern (one instance per chart)
- React portal for dialog rendering
- Streamlit integration for configuration persistence
- Per-pane dialog state management

Responsibilities:
- Create and manage dialog portal containers
- Open/close dialogs with current series settings
- Apply configuration changes to chart APIs
- Coordinate with backend for persistence
- Clean up React roots and DOM elements

## Export

SeriesDialogManager

## Example

```typescript
const manager = SeriesDialogManager.getInstance(
  chartApi,
  streamlitService,
  'chart-1'
);

// Initialize pane
manager.initializePane(0);

// Open dialog with current series settings
manager.open(0);

// Close dialog
manager.close(0);

// Cleanup on unmount
SeriesDialogManager.destroyInstance('chart-1');
```

## Extends

- `KeyedSingletonManager`\<`SeriesDialogManager`\>

## Methods

### getOrCreateInstance()

> `protected` `static` **getOrCreateInstance**\<`T`\>(`className`, `key`, `factory`): `T`

Defined in: [lightweight-charts-pro-frontend/dist/utils/KeyedSingletonManager.d.ts:60](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/utils/KeyedSingletonManager.d.ts#L60)

Get or create a singleton instance for a given key

#### Type Parameters

##### T

`T`

#### Parameters

##### className

`string`

Class name for instance mapping

##### key

`string`

Unique identifier for the instance

##### factory

() => `T`

Factory function to create new instance if needed

#### Returns

`T`

The singleton instance

#### Inherited from

`KeyedSingletonManager.getOrCreateInstance`

***

### destroyInstanceByKey()

> `protected` `static` **destroyInstanceByKey**(`className`, `key`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/utils/KeyedSingletonManager.d.ts:67](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/utils/KeyedSingletonManager.d.ts#L67)

Destroy a singleton instance for a given key

#### Parameters

##### className

`string`

Class name for instance mapping

##### key

`string`

Unique identifier for the instance

#### Returns

`void`

#### Inherited from

`KeyedSingletonManager.destroyInstanceByKey`

***

### hasInstanceWithKey()

> `protected` `static` **hasInstanceWithKey**(`className`, `key`): `boolean`

Defined in: [lightweight-charts-pro-frontend/dist/utils/KeyedSingletonManager.d.ts:75](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/utils/KeyedSingletonManager.d.ts#L75)

Check if an instance exists for a given key

#### Parameters

##### className

`string`

Class name for instance mapping

##### key

`string`

Unique identifier to check

#### Returns

`boolean`

True if instance exists

#### Inherited from

`KeyedSingletonManager.hasInstanceWithKey`

***

### getInstanceKeys()

> `protected` `static` **getInstanceKeys**(`className`): `string`[]

Defined in: [lightweight-charts-pro-frontend/dist/utils/KeyedSingletonManager.d.ts:82](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/utils/KeyedSingletonManager.d.ts#L82)

Get all instance keys for this class

#### Parameters

##### className

`string`

Class name for instance mapping

#### Returns

`string`[]

Array of instance keys

#### Inherited from

`KeyedSingletonManager.getInstanceKeys`

***

### clearAllInstances()

> `protected` `static` **clearAllInstances**(`className`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/utils/KeyedSingletonManager.d.ts:88](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/utils/KeyedSingletonManager.d.ts#L88)

Clear all instances for this class

#### Parameters

##### className

`string`

Class name for instance mapping

#### Returns

`void`

#### Inherited from

`KeyedSingletonManager.clearAllInstances`

***

### getInstance()

> `static` **getInstance**(`chartApi`, `streamlitService`, `chartId?`, `config?`): `SeriesDialogManager`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:150](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L150)

Get or create singleton instance for a chart

#### Parameters

##### chartApi

`IChartApi`

##### streamlitService

[`StreamlitSeriesConfigService`](../../StreamlitSeriesConfigService/classes/StreamlitSeriesConfigService.md)

##### chartId?

`string`

##### config?

[`SeriesDialogConfig`](../interfaces/SeriesDialogConfig.md) = `{}`

#### Returns

`SeriesDialogManager`

***

### destroyInstance()

> `static` **destroyInstance**(`chartId?`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:166](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L166)

Destroy singleton instance for a chart

#### Parameters

##### chartId?

`string`

#### Returns

`void`

***

### initializePane()

> **initializePane**(`paneId`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:174](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L174)

Initialize dialog state for a pane

#### Parameters

##### paneId

`number`

#### Returns

`void`

***

### getState()

> **getState**(`paneId`): [`DialogState`](../interfaces/DialogState.md) \| `undefined`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:243](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L243)

Get dialog state for a pane

#### Parameters

##### paneId

`number`

#### Returns

[`DialogState`](../interfaces/DialogState.md) \| `undefined`

***

### open()

> **open**(`paneId`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:289](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L289)

Open series configuration dialog

Creates a React portal container if needed and renders the dialog.
The container is created via DOM manipulation, but React controls
all rendering within it (standard portal pattern).

#### Parameters

##### paneId

`number`

#### Returns

`void`

***

### close()

> **close**(`paneId`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:391](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L391)

Close series configuration dialog

#### Parameters

##### paneId

`number`

#### Returns

`void`

***

### getSeriesConfig()

> **getSeriesConfig**(`paneId`, `seriesId`): [`SeriesConfiguration`](../../../types/SeriesTypes/interfaces/SeriesConfiguration.md) \| `null`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:790](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L790)

Get series configuration

#### Parameters

##### paneId

`number`

##### seriesId

`string`

#### Returns

[`SeriesConfiguration`](../../../types/SeriesTypes/interfaces/SeriesConfiguration.md) \| `null`

***

### setSeriesConfig()

> **setSeriesConfig**(`paneId`, `seriesId`, `config`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:800](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L800)

Set series configuration

#### Parameters

##### paneId

`number`

##### seriesId

`string`

##### config

[`SeriesConfiguration`](../../../types/SeriesTypes/interfaces/SeriesConfiguration.md)

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/SeriesDialogManager.ts:807](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/SeriesDialogManager.ts#L807)

Cleanup resources

#### Returns

`void`

#### Overrides

`KeyedSingletonManager.destroy`
