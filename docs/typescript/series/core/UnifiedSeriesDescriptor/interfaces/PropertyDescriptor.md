[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../../modules.md) / [series/core/UnifiedSeriesDescriptor](../README.md) / PropertyDescriptor

# Interface: PropertyDescriptor

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:35](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L35)

Property descriptor defining how a property behaves

## Properties

### type

> **type**: [`PropertyType`](../type-aliases/PropertyType.md)

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:37](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L37)

Property type for UI rendering

***

### label

> **label**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:40](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L40)

Display label in dialog

***

### default

> **default**: `unknown`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:43](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L43)

Default value

***

### apiMapping?

> `optional` **apiMapping**: `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:46](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L46)

API property names when flattened (for 'line' type)

#### colorKey?

> `optional` **colorKey**: `string`

Color property name in API (e.g., 'color', 'lineColor', 'upperLineColor')

#### widthKey?

> `optional` **widthKey**: `string`

Width property name in API (e.g., 'lineWidth', 'upperLineWidth')

#### styleKey?

> `optional` **styleKey**: `string`

Style property name in API (e.g., 'lineStyle', 'upperLineStyle')

***

### validate()?

> `optional` **validate**: (`value`) => `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:56](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L56)

Optional validation function

#### Parameters

##### value

`unknown`

#### Returns

`boolean`

***

### description?

> `optional` **description**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:59](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L59)

Optional property description for tooltips

***

### group?

> `optional` **group**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:62](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L62)

Group name for organizing properties in UI

***

### hidden?

> `optional` **hidden**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:65](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L65)

Hide this property from the dialog UI (but still include in API)
