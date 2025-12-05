[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../../modules.md) / [series/core/UnifiedSeriesDescriptor](../README.md) / UnifiedSeriesDescriptor

# Interface: UnifiedSeriesDescriptor\<T\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:82](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L82)

Unified Series Descriptor - Single source of truth for a series type
T represents the full series options (style + common options)

## Type Parameters

### T

`T` = `unknown`

## Properties

### type

> **type**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:84](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L84)

Series type identifier (e.g., 'Line', 'Area', 'Band')

***

### displayName

> **displayName**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:87](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L87)

Display name for UI

***

### properties

> **properties**: `Record`\<`string`, [`PropertyDescriptor`](PropertyDescriptor.md)\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:90](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L90)

Property descriptors mapped by property name

***

### defaultOptions

> **defaultOptions**: `Partial`\<`T`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:93](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L93)

Default options using LightweightCharts types

***

### create

> **create**: [`SeriesCreator`](../type-aliases/SeriesCreator.md)\<`T`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:96](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L96)

Series creator function

***

### isCustom

> **isCustom**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:99](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L99)

Whether this is a custom series (not built into LightweightCharts)

***

### category?

> `optional` **category**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:102](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L102)

Category for organizing series (e.g., 'Basic', 'Custom', 'Indicators')

***

### description?

> `optional` **description**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:105](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L105)

Optional series description
