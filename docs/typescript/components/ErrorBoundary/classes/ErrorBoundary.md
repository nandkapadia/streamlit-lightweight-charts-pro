[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [components/ErrorBoundary](../README.md) / ErrorBoundary

# Class: ErrorBoundary

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/ErrorBoundary.tsx:53](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/ErrorBoundary.tsx#L53)

## Extends

- `Component`\<`Props`, `State`\>

## Constructors

### Constructor

> **new ErrorBoundary**(`props`): `ErrorBoundary`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/ErrorBoundary.tsx:56](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/ErrorBoundary.tsx#L56)

#### Parameters

##### props

`Props`

#### Returns

`ErrorBoundary`

#### Overrides

`Component<Props, State>.constructor`

## Methods

### getDerivedStateFromError()

> `static` **getDerivedStateFromError**(`error`): `Partial`\<`State`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/ErrorBoundary.tsx:64](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/ErrorBoundary.tsx#L64)

#### Parameters

##### error

`Error`

#### Returns

`Partial`\<`State`\>

***

### componentDidUpdate()

> **componentDidUpdate**(`prevProps`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/ErrorBoundary.tsx:72](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/ErrorBoundary.tsx#L72)

Called immediately after updating occurs. Not called for the initial render.

The snapshot is only present if getSnapshotBeforeUpdate is present and returns non-null.

#### Parameters

##### prevProps

`Props`

#### Returns

`void`

#### Overrides

`Component.componentDidUpdate`

***

### componentWillUnmount()

> **componentWillUnmount**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/ErrorBoundary.tsx:89](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/ErrorBoundary.tsx#L89)

Called immediately before a component is destroyed. Perform any necessary cleanup in this method, such as
cancelled network requests, or cleaning up any DOM elements created in `componentDidMount`.

#### Returns

`void`

#### Overrides

`Component.componentWillUnmount`

***

### componentDidCatch()

> **componentDidCatch**(`_error`, `_errorInfo`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/ErrorBoundary.tsx:95](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/ErrorBoundary.tsx#L95)

Catches exceptions generated in descendant components. Unhandled exceptions will cause
the entire component tree to unmount.

#### Parameters

##### \_error

`Error`

##### \_errorInfo

`ErrorInfo`

#### Returns

`void`

#### Overrides

`Component.componentDidCatch`

***

### resetErrorBoundary()

> **resetErrorBoundary**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/ErrorBoundary.tsx:106](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/ErrorBoundary.tsx#L106)

#### Returns

`void`

***

### handleRetry()

> **handleRetry**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/ErrorBoundary.tsx:118](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/ErrorBoundary.tsx#L118)

#### Returns

`void`

***

### render()

> **render**(): `string` \| `number` \| `bigint` \| `boolean` \| `Iterable`\<`ReactNode`, `any`, `any`\> \| `Promise`\<`AwaitedReactNode`\> \| `Element` \| `null` \| `undefined`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/ErrorBoundary.tsx:122](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/ErrorBoundary.tsx#L122)

#### Returns

`string` \| `number` \| `bigint` \| `boolean` \| `Iterable`\<`ReactNode`, `any`, `any`\> \| `Promise`\<`AwaitedReactNode`\> \| `Element` \| `null` \| `undefined`

#### Overrides

`Component.render`
