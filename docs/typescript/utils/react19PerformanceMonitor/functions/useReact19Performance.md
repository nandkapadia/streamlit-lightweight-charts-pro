[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [utils/react19PerformanceMonitor](../README.md) / useReact19Performance

# Function: useReact19Performance()

> **useReact19Performance**(`componentName`): `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/utils/react19PerformanceMonitor.ts:289](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/utils/react19PerformanceMonitor.ts#L289)

## Parameters

### componentName

`string`

## Returns

`object`

### startTransition()

> **startTransition**: (`type`) => `string`

#### Parameters

##### type

`"resize"` | `"chart"` | `"series"` | `"sync"`

#### Returns

`string`

### endTransition()

> **endTransition**: (`transitionId`) => `void`

#### Parameters

##### transitionId

`string`

#### Returns

`void`

### trackFlushSync()

> **trackFlushSync**: (`reason`) => `void`

#### Parameters

##### reason

`string`

#### Returns

`void`

### startSuspenseLoad()

> **startSuspenseLoad**: () => `void`

#### Returns

`void`

### endSuspenseLoad()

> **endSuspenseLoad**: () => `void`

#### Returns

`void`

### getReport()

> **getReport**: () => `object`

#### Returns

`object`

##### metrics

> **metrics**: `React19Metrics`

##### recommendations

> **recommendations**: `string`[]

##### score

> **score**: `number`

### getCurrentInsights()

> **getCurrentInsights**: () => `object`

#### Returns

`object`

##### activeTransitions

> **activeTransitions**: `number`

##### avgTransitionTime

> **avgTransitionTime**: `number`

##### pendingSuspenseLoads

> **pendingSuspenseLoads**: `number`
