[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../../modules.md) / [series/core/UnifiedSeriesDescriptor](../README.md) / PropertyDescriptors

# Variable: PropertyDescriptors

> `const` **PropertyDescriptors**: `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:116](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L116)

Helper to create property descriptors for common patterns

## Type Declaration

### line()

> **line**(`label`, `defaultColor`, `defaultWidth`, `defaultStyle`, `apiMapping`): [`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)

Create a line property descriptor with proper API mapping

#### Parameters

##### label

`string`

##### defaultColor

`string`

##### defaultWidth

`LineWidth`

##### defaultStyle

`LineStyle`

##### apiMapping

###### colorKey

`string`

###### widthKey

`string`

###### styleKey

`string`

#### Returns

[`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)

### color()

> **color**(`label`, `defaultValue`, `group?`): [`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)

Create a color property descriptor

#### Parameters

##### label

`string`

##### defaultValue

`string`

##### group?

`string`

#### Returns

[`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)

### boolean()

> **boolean**(`label`, `defaultValue`, `group?`): [`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)

Create a boolean property descriptor

#### Parameters

##### label

`string`

##### defaultValue

`boolean`

##### group?

`string`

#### Returns

[`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)

### number()

> **number**(`label`, `defaultValue`, `group?`, `hidden?`): [`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)

Create a number property descriptor

#### Parameters

##### label

`string`

##### defaultValue

`number`

##### group?

`string`

##### hidden?

`boolean`

#### Returns

[`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)

### lineStyle()

> **lineStyle**(`label`, `defaultValue`, `group?`): [`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)

Create a lineStyle property descriptor

#### Parameters

##### label

`string`

##### defaultValue

`LineStyle`

##### group?

`string`

#### Returns

[`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)

### lineWidth()

> **lineWidth**(`label`, `defaultValue`, `group?`): [`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)

Create a lineWidth property descriptor

#### Parameters

##### label

`string`

##### defaultValue

`LineWidth`

##### group?

`string`

#### Returns

[`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)
