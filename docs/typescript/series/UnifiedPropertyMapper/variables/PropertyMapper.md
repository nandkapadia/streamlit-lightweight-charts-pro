[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [series/UnifiedPropertyMapper](../README.md) / PropertyMapper

# Variable: PropertyMapper

> `const` **PropertyMapper**: `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/UnifiedPropertyMapper.ts:84](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/UnifiedPropertyMapper.ts#L84)

Legacy compatibility export

## Type Declaration

### apiOptionsToDialogConfig()

> **apiOptionsToDialogConfig**: (`seriesType`, `apiOptions`) => `any`

Convert LightweightCharts API options (flat) to Dialog config (nested)

#### Parameters

##### seriesType

`string`

The series type (e.g., 'Line', 'Band', 'line', 'band')

##### apiOptions

`any`

Flat options from series.options()

#### Returns

`any`

Nested config for dialog

### dialogConfigToApiOptions()

> **dialogConfigToApiOptions**: (`seriesType`, `dialogConfig`) => `any`

Convert Dialog config (nested) to LightweightCharts API options (flat)

#### Parameters

##### seriesType

`string`

The series type (e.g., 'Line', 'Band', 'line', 'band')

##### dialogConfig

`any`

Nested config from dialog

#### Returns

`any`

Flat options for series.applyOptions()

### LINE\_STYLE\_TO\_STRING

> **LINE\_STYLE\_TO\_STRING**: `Record`\<`number`, `string`\>

Line style conversion maps (backward compatibility)

### STRING\_TO\_LINE\_STYLE

> **STRING\_TO\_LINE\_STYLE**: `Record`\<`string`, `number`\>
