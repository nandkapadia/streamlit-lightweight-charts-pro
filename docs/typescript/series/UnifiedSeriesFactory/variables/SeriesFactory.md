[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [series/UnifiedSeriesFactory](../README.md) / SeriesFactory

# Variable: SeriesFactory

> `const` **SeriesFactory**: `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedSeriesFactory.ts:716](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedSeriesFactory.ts#L716)

Legacy compatibility layer for existing code
This allows gradual migration from old factory to new factory

## Type Declaration

### createSeries()

> **createSeries**: (`chart`, `seriesType`, `data`, `userOptions`, `paneId`) => `ISeriesApi`\<`any`\>

Create a series using the unified descriptor system

#### Parameters

##### chart

`any`

LightweightCharts chart instance

##### seriesType

`string`

Type of series to create (e.g., 'Line', 'Band')

##### data

`any`[]

Series data

##### userOptions

`Partial`\<`SeriesOptionsCommon`\> = `{}`

User-provided options (merged with defaults)

##### paneId

`number` = `0`

#### Returns

`ISeriesApi`\<`any`\>

Created series instance

#### Throws

If series creation fails

### createSeriesWithConfig()

> **createSeriesWithConfig**: (`chart`, `config`) => [`ExtendedSeriesApi`](../interfaces/ExtendedSeriesApi.md) \| `null`

Create series with full configuration (data, markers, price lines, etc.)
This is the enhanced API that handles all auxiliary functionality

#### Parameters

##### chart

`IChartApi`

LightweightCharts chart instance

##### config

[`ExtendedSeriesConfig`](../interfaces/ExtendedSeriesConfig.md)

Extended series configuration

#### Returns

[`ExtendedSeriesApi`](../interfaces/ExtendedSeriesApi.md) \| `null`

Created series instance with metadata

#### Throws

If series creation fails

### getSeriesDescriptor()

> **getSeriesDescriptor**: (`seriesType`) => [`UnifiedSeriesDescriptor`](../../core/UnifiedSeriesDescriptor/interfaces/UnifiedSeriesDescriptor.md)\<`unknown`\> \| `undefined`

Get series descriptor by type

#### Parameters

##### seriesType

`string`

#### Returns

[`UnifiedSeriesDescriptor`](../../core/UnifiedSeriesDescriptor/interfaces/UnifiedSeriesDescriptor.md)\<`unknown`\> \| `undefined`

### getDefaultOptions()

> **getDefaultOptions**: (`seriesType`) => `Partial`\<`SeriesOptionsCommon`\>

Get default options for a series type

#### Parameters

##### seriesType

`string`

Type of series

#### Returns

`Partial`\<`SeriesOptionsCommon`\>

Default options object

#### Throws

If series type is unknown

### isCustomSeries()

> **isCustomSeries**: (`seriesType`) => `boolean`

Check if a series type is custom

#### Parameters

##### seriesType

`string`

#### Returns

`boolean`

### getAvailableSeriesTypes()

> **getAvailableSeriesTypes**: () => `string`[]

Get all available series types

#### Returns

`string`[]

### updateSeriesData()

> **updateSeriesData**: (`series`, `data`) => `void`

Update series data

#### Parameters

##### series

`ISeriesApi`\<keyof `SeriesOptionsMap`\>

Series instance

##### data

[`SeriesDataPoint`](../../../types/seriesFactory/interfaces/SeriesDataPoint.md)[]

New data to set

#### Returns

`void`

### updateSeriesMarkers()

> **updateSeriesMarkers**: (`series`, `markers`, `data?`) => `void`

Update series markers

#### Parameters

##### series

`ISeriesApi`\<`any`\>

Series instance

##### markers

`SeriesMarker`\<`any`\>[]

New markers to set

##### data?

[`SeriesDataPoint`](../../../types/seriesFactory/interfaces/SeriesDataPoint.md)[]

Optional data for timestamp snapping

#### Returns

`void`

### updateSeriesOptions()

> **updateSeriesOptions**: (`series`, `options`) => `void`

Update series options

#### Parameters

##### series

`ISeriesApi`\<`any`\>

Series instance

##### options

`Partial`\<`SeriesOptionsCommon`\>

New options to apply

#### Returns

`void`
