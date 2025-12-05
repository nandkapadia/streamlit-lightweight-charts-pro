[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [hooks/useSeriesSettingsAPI](../README.md) / useSeriesSettingsAPI

# Function: useSeriesSettingsAPI()

> **useSeriesSettingsAPI**(): `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useSeriesSettingsAPI.ts:49](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useSeriesSettingsAPI.ts#L49)

Hook for Series Settings API communication

## Returns

### getPaneState()

> **getPaneState**: (`paneId`) => `Promise`\<[`PaneState`](../interfaces/PaneState.md) \| `null`\>

Get current state for a pane from the backend

#### Parameters

##### paneId

`string`

#### Returns

`Promise`\<[`PaneState`](../interfaces/PaneState.md) \| `null`\>

### updateSeriesSettings()

> **updateSeriesSettings**: (`paneId`, `seriesId`, `config`) => `Promise`\<`boolean`\>

Update series settings in the backend

#### Parameters

##### paneId

`string`

##### seriesId

`string`

##### config

`Partial`\<[`SeriesConfig`](../../../forms/SeriesSettingsDialog/interfaces/SeriesConfig.md)\>

#### Returns

`Promise`\<`boolean`\>

### updateMultipleSettings()

> **updateMultipleSettings**: (`patches`) => `Promise`\<`boolean`\>

Batch update multiple series settings

#### Parameters

##### patches

[`SettingsPatch`](../interfaces/SettingsPatch.md)[]

#### Returns

`Promise`\<`boolean`\>

### resetSeriesToDefaults()

> **resetSeriesToDefaults**: (`paneId`, `seriesId`) => `Promise`\<[`SeriesConfig`](../../../forms/SeriesSettingsDialog/interfaces/SeriesConfig.md) \| `null`\>

Reset series to defaults

#### Parameters

##### paneId

`string`

##### seriesId

`string`

#### Returns

`Promise`\<[`SeriesConfig`](../../../forms/SeriesSettingsDialog/interfaces/SeriesConfig.md) \| `null`\>

### registerSettingsChangeCallback()

> **registerSettingsChangeCallback**: (`callback`) => () => `void`

Register settings change callback with backend

#### Parameters

##### callback

() => `void`

#### Returns

> (): `void`

##### Returns

`void`
