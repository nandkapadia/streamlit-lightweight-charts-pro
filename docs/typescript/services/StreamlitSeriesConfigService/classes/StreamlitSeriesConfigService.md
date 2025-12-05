[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [services/StreamlitSeriesConfigService](../README.md) / StreamlitSeriesConfigService

# Class: StreamlitSeriesConfigService

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:44](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L44)

## Ts-expect-error

- Decorator doesn't support private constructors

## Properties

### getInstance()

> `static` **getInstance**: () => `StreamlitSeriesConfigService`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:45](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L45)

#### Returns

`StreamlitSeriesConfigService`

## Methods

### initializeFromBackend()

> `static` **initializeFromBackend**(`backendData?`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:59](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L59)

Initialize the service with backend data (called from main component)

#### Parameters

##### backendData?

`any`

#### Returns

`void`

***

### initialize()

> **initialize**(`initialState?`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:69](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L69)

Initialize the service with current configuration state from backend

#### Parameters

##### initialState?

[`SeriesConfigState`](../interfaces/SeriesConfigState.md)

#### Returns

`void`

***

### recordConfigChange()

> **recordConfigChange**(`paneId`, `seriesId`, `seriesType`, `config`, `chartId?`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:78](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L78)

Record a series configuration change and queue it for backend sync

#### Parameters

##### paneId

`number`

##### seriesId

`string`

##### seriesType

[`SeriesType`](../../../types/SeriesTypes/type-aliases/SeriesType.md)

##### config

[`SeriesConfiguration`](../../../types/SeriesTypes/interfaces/SeriesConfiguration.md)

##### chartId?

`string`

#### Returns

`void`

***

### getSeriesConfig()

> **getSeriesConfig**(`paneId`, `seriesId`, `chartId?`): [`SeriesConfiguration`](../../../types/SeriesTypes/interfaces/SeriesConfiguration.md) \| `null`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:107](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L107)

Get current configuration for a specific series

#### Parameters

##### paneId

`number`

##### seriesId

`string`

##### chartId?

`string`

#### Returns

[`SeriesConfiguration`](../../../types/SeriesTypes/interfaces/SeriesConfiguration.md) \| `null`

***

### getChartConfig()

> **getChartConfig**(`chartId?`): \{\[`paneId`: `number`\]: `object`; \} \| `null`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:119](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L119)

Get all configurations for a specific chart

#### Parameters

##### chartId?

`string`

#### Returns

\{\[`paneId`: `number`\]: `object`; \} \| `null`

***

### getCompleteState()

> **getCompleteState**(): [`SeriesConfigState`](../interfaces/SeriesConfigState.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:127](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L127)

Get the complete configuration state

#### Returns

[`SeriesConfigState`](../interfaces/SeriesConfigState.md)

***

### clearPendingChanges()

> **clearPendingChanges**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:134](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L134)

Clear all pending changes (useful for cleanup)

#### Returns

`void`

***

### forceSyncToBackend()

> **forceSyncToBackend**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:145](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L145)

Force immediate sync with backend (bypasses debounce)

#### Returns

`void`

***

### restoreFromBackend()

> **restoreFromBackend**(`backendState`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:236](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L236)

Handle configuration restoration from backend (on component reload)

#### Parameters

##### backendState

`any`

#### Returns

`void`

***

### createConfigChangeCallback()

> **createConfigChangeCallback**(`chartId?`): (`paneId`, `seriesId`, `config`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:273](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L273)

Create a callback function for use with ButtonPanelPlugin

#### Parameters

##### chartId?

`string`

#### Returns

> (`paneId`, `seriesId`, `config`): `void`

##### Parameters

###### paneId

`number`

###### seriesId

`string`

###### config

[`SeriesConfiguration`](../../../types/SeriesTypes/interfaces/SeriesConfiguration.md)

##### Returns

`void`

***

### getStats()

> **getStats**(): `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:323](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L323)

Get statistics about the service state (for debugging)

#### Returns

`object`

##### totalConfigs

> **totalConfigs**: `number`

##### pendingChanges

> **pendingChanges**: `number`

##### charts

> **charts**: `number`

##### lastSyncTime

> **lastSyncTime**: `number` \| `null`

***

### reset()

> **reset**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/services/StreamlitSeriesConfigService.ts:350](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/services/StreamlitSeriesConfigService.ts#L350)

Reset the service (useful for cleanup or testing)

#### Returns

`void`
