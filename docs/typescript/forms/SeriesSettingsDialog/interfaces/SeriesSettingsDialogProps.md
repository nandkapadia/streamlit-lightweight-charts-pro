[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [forms/SeriesSettingsDialog](../README.md) / SeriesSettingsDialogProps

# Interface: SeriesSettingsDialogProps

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/SeriesSettingsDialog.tsx:96](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/SeriesSettingsDialog.tsx#L96)

Props for SeriesSettingsDialog

## Properties

### isOpen

> **isOpen**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/SeriesSettingsDialog.tsx:98](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/SeriesSettingsDialog.tsx#L98)

Whether dialog is open

***

### onClose()

> **onClose**: () => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/SeriesSettingsDialog.tsx:100](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/SeriesSettingsDialog.tsx#L100)

Close dialog callback

#### Returns

`void`

***

### paneId

> **paneId**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/SeriesSettingsDialog.tsx:102](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/SeriesSettingsDialog.tsx#L102)

Pane ID containing the series

***

### seriesList

> **seriesList**: [`SeriesInfo`](SeriesInfo.md)[]

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/SeriesSettingsDialog.tsx:104](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/SeriesSettingsDialog.tsx#L104)

List of series in this pane

***

### seriesConfigs

> **seriesConfigs**: `Record`\<`string`, [`SeriesConfig`](SeriesConfig.md)\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/SeriesSettingsDialog.tsx:106](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/SeriesSettingsDialog.tsx#L106)

Current series configurations

***

### onConfigChange()

> **onConfigChange**: (`seriesId`, `config`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/SeriesSettingsDialog.tsx:108](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/SeriesSettingsDialog.tsx#L108)

Configuration change callback

#### Parameters

##### seriesId

`string`

##### config

`Partial`\<[`SeriesConfig`](SeriesConfig.md)\>

#### Returns

`void`

***

### onSettingsChanged()?

> `optional` **onSettingsChanged**: (`callback`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/SeriesSettingsDialog.tsx:110](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/SeriesSettingsDialog.tsx#L110)

Settings change event callback

#### Parameters

##### callback

() => `void`

#### Returns

`void`
