[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [primitives/ButtonPanelPrimitive](../README.md) / ButtonPanelPrimitive

# Class: ButtonPanelPrimitive

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:77](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L77)

Button Panel Primitive - TradingView-style pane controls

Provides collapse/expand functionality and series configuration dialogs
using React-based buttons integrated with the chart's rendering pipeline.

## Extends

- `BasePanePrimitive`\<[`ButtonPanelPrimitiveConfig`](../interfaces/ButtonPanelPrimitiveConfig.md)\>

## Constructors

### Constructor

> **new ButtonPanelPrimitive**(`id`, `config`): `ButtonPanelPrimitive`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:86](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L86)

#### Parameters

##### id

`string`

##### config

[`ButtonPanelPrimitiveConfig`](../interfaces/ButtonPanelPrimitiveConfig.md)

#### Returns

`ButtonPanelPrimitive`

#### Overrides

`BasePanePrimitive<ButtonPanelPrimitiveConfig>.constructor`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:56](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L56)

#### Inherited from

`BasePanePrimitive.id`

***

### corner

> `readonly` **corner**: `Corner`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:57](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L57)

#### Inherited from

`BasePanePrimitive.corner`

***

### priority

> `readonly` **priority**: `number`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:58](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L58)

#### Inherited from

`BasePanePrimitive.priority`

***

### visible

> **visible**: `boolean`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:59](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L59)

#### Inherited from

`BasePanePrimitive.visible`

***

### config

> `protected` **config**: [`ButtonPanelPrimitiveConfig`](../interfaces/ButtonPanelPrimitiveConfig.md)

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:60](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L60)

#### Inherited from

`BasePanePrimitive.config`

***

### chart

> `protected` **chart**: `IChartApi` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:61](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L61)

#### Inherited from

`BasePanePrimitive.chart`

***

### series

> `protected` **series**: `ISeriesApi`\<`any`, `Time`, `any`, `any`, `any`\> \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:62](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L62)

#### Inherited from

`BasePanePrimitive.series`

***

### requestUpdate

> `protected` **requestUpdate**: () => `void` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:63](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L63)

#### Inherited from

`BasePanePrimitive.requestUpdate`

***

### layoutManager

> `protected` **layoutManager**: `CornerLayoutManager` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:64](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L64)

#### Inherited from

`BasePanePrimitive.layoutManager`

***

### eventManager

> `protected` **eventManager**: `PrimitiveEventManager` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:67](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L67)

#### Inherited from

`BasePanePrimitive.eventManager`

***

### currentPosition

> `protected` **currentPosition**: `Position` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:76](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L76)

#### Inherited from

`BasePanePrimitive.currentPosition`

***

### containerElement

> `protected` **containerElement**: `HTMLElement` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:77](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L77)

#### Inherited from

`BasePanePrimitive.containerElement`

***

### mounted

> `protected` **mounted**: `boolean`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:78](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L78)

#### Inherited from

`BasePanePrimitive.mounted`

***

### eventSubscriptions

> `protected` **eventSubscriptions**: `EventSubscription`[]

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:79](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L79)

#### Inherited from

`BasePanePrimitive.eventSubscriptions`

***

### templateData

> `protected` **templateData**: `TemplateData`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:80](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L80)

#### Inherited from

`BasePanePrimitive.templateData`

***

### templateContext

> `protected` **templateContext**: `TemplateContext`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:81](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L81)

#### Inherited from

`BasePanePrimitive.templateContext`

***

### lastTemplateResult

> `protected` **lastTemplateResult**: `TemplateResult` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:82](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L82)

#### Inherited from

`BasePanePrimitive.lastTemplateResult`

## Accessors

### coordinateService

#### Get Signature

> **get** `protected` **coordinateService**(): `ChartCoordinateService`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:71](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L71)

Lazy getter for coordinate service - avoids module loading order issues

##### Returns

`ChartCoordinateService`

#### Inherited from

`BasePanePrimitive.coordinateService`

***

### templateEngine

#### Get Signature

> **get** `protected` **templateEngine**(): `TemplateEngine`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:75](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L75)

Lazy getter for template engine - avoids module loading order issues

##### Returns

`TemplateEngine`

#### Inherited from

`BasePanePrimitive.templateEngine`

## Methods

### attached()

> **attached**(`params`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:87](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L87)

Called when primitive is attached to a pane

#### Parameters

##### params

###### chart

`IChartApi`

###### series

`ISeriesApi`\<`any`\>

###### requestUpdate

() => `void`

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.attached`

***

### detached()

> **detached**(): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:95](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L95)

Called when primitive is detached from a pane

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.detached`

***

### paneViews()

> **paneViews**(): `any`[]

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:103](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L103)

IPanePrimitive interface - integrates with chart's rendering pipeline

The draw() method is called automatically by the chart on every render cycle,
allowing smooth position updates without manual DOM manipulation.

#### Returns

`any`[]

#### Inherited from

`BasePanePrimitive.paneViews`

***

### updateAllViews()

> **updateAllViews**(): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:111](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L111)

Main primitive update method - handles rendering

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.updateAllViews`

***

### updatePosition()

> **updatePosition**(`position`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:120](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L120)

Called by layout manager to update position
Now properly integrates with lightweight-charts coordinate updates

#### Parameters

##### position

`Position`

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.updatePosition`

***

### getChartId()

> `protected` **getChartId**(): `string`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:133](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L133)

Get the chart ID for this primitive

#### Returns

`string`

#### Inherited from

`BasePanePrimitive.getChartId`

***

### setTemplateData()

> **setTemplateData**(`data`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:154](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L154)

Set template data for processing

#### Parameters

##### data

`TemplateData`

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.setTemplateData`

***

### updateTemplateContext()

> **updateTemplateContext**(`context`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:158](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L158)

Update template context for processing

#### Parameters

##### context

`Partial`\<`TemplateContext`\>

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.updateTemplateContext`

***

### processTemplate()

> `protected` **processTemplate**(): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:162](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L162)

Process template with current data using TemplateEngine

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.processTemplate`

***

### getProcessedContent()

> `protected` **getProcessedContent**(): `string`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:166](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L166)

Get processed template content

#### Returns

`string`

#### Inherited from

`BasePanePrimitive.getProcessedContent`

***

### getTemplateResult()

> **getTemplateResult**(): `TemplateResult` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:170](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L170)

Get template processing result for debugging

#### Returns

`TemplateResult` \| `null`

#### Inherited from

`BasePanePrimitive.getTemplateResult`

***

### handleCrosshairMove()

> `protected` **handleCrosshairMove**(`event`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:186](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L186)

Handle crosshair move events

#### Parameters

##### event

###### time

`any`

###### point

\{ `x`: `number`; `y`: `number`; \} \| `null`

###### seriesData

`Map`\<`any`, `any`\>

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.handleCrosshairMove`

***

### handleChartResize()

> `protected` **handleChartResize**(`event`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:197](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L197)

Handle chart resize events

#### Parameters

##### event

###### width

`number`

###### height

`number`

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.handleChartResize`

***

### getEventManager()

> **getEventManager**(): `PrimitiveEventManager` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:204](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L204)

Get event manager instance

#### Returns

`PrimitiveEventManager` \| `null`

#### Inherited from

`BasePanePrimitive.getEventManager`

***

### setVisible()

> **setVisible**(`visible`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:208](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L208)

Set primitive visibility

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.setVisible`

***

### toggle()

> **toggle**(): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:212](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L212)

Toggle primitive visibility

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.toggle`

***

### updateConfig()

> **updateConfig**(`newConfig`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:216](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L216)

Update primitive configuration

#### Parameters

##### newConfig

`Partial`\<`TConfig`\>

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.updateConfig`

***

### getConfig()

> **getConfig**(): [`ButtonPanelPrimitiveConfig`](../interfaces/ButtonPanelPrimitiveConfig.md)

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:220](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L220)

Get current configuration

#### Returns

[`ButtonPanelPrimitiveConfig`](../interfaces/ButtonPanelPrimitiveConfig.md)

#### Inherited from

`BasePanePrimitive.getConfig`

***

### onUpdate()

> `protected` **onUpdate**(): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:248](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L248)

Called during each update cycle

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.onUpdate`

***

### onPositionUpdate()

> `protected` **onPositionUpdate**(`_position`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:252](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L252)

Called when position is updated by layout manager

#### Parameters

##### \_position

`Position`

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.onPositionUpdate`

***

### onContainerCreated()

> `protected` **onContainerCreated**(`_container`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:256](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L256)

Called when container element is created

#### Parameters

##### \_container

`HTMLElement`

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.onContainerCreated`

***

### onVisibilityChanged()

> `protected` **onVisibilityChanged**(`_visible`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:260](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L260)

Called when visibility changes

#### Parameters

##### \_visible

`boolean`

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.onVisibilityChanged`

***

### onConfigUpdate()

> `protected` **onConfigUpdate**(`_newConfig`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:264](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L264)

Called when configuration is updated

#### Parameters

##### \_newConfig

`Partial`\<`TConfig`\>

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.onConfigUpdate`

***

### onCrosshairMove()

> `protected` **onCrosshairMove**(`_event`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:268](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L268)

Called when crosshair moves over the chart

#### Parameters

##### \_event

###### time

`any`

###### point

\{ `x`: `number`; `y`: `number`; \} \| `null`

###### seriesData

`Map`\<`any`, `any`\>

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.onCrosshairMove`

***

### onChartResize()

> `protected` **onChartResize**(`_event`): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:279](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L279)

Called when chart is resized

#### Parameters

##### \_event

###### width

`number`

###### height

`number`

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.onChartResize`

***

### setupCustomEventSubscriptions()

> `protected` **setupCustomEventSubscriptions**(): `void`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:286](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L286)

Setup custom event subscriptions - override in subclasses

#### Returns

`void`

#### Inherited from

`BasePanePrimitive.setupCustomEventSubscriptions`

***

### getPosition()

> **getPosition**(): `Position` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:290](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L290)

Get current position

#### Returns

`Position` \| `null`

#### Inherited from

`BasePanePrimitive.getPosition`

***

### getContainer()

> **getContainer**(): `HTMLElement` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:294](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L294)

Get container element

#### Returns

`HTMLElement` \| `null`

#### Inherited from

`BasePanePrimitive.getContainer`

***

### isMounted()

> **isMounted**(): `boolean`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:298](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L298)

Check if primitive is mounted

#### Returns

`boolean`

#### Inherited from

`BasePanePrimitive.isMounted`

***

### getChart()

> **getChart**(): `IChartApi` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:302](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L302)

Get chart API reference

#### Returns

`IChartApi` \| `null`

#### Inherited from

`BasePanePrimitive.getChart`

***

### getSeries()

> **getSeries**(): `ISeriesApi`\<`any`, `Time`, `any`, `any`, `any`\> \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/BasePanePrimitive.d.ts:306](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/BasePanePrimitive.d.ts#L306)

Get series API reference

#### Returns

`ISeriesApi`\<`any`, `Time`, `any`, `any`, `any`\> \| `null`

#### Inherited from

`BasePanePrimitive.getSeries`

***

### renderContent()

> `protected` **renderContent**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:141](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L141)

===== BasePanePrimitive Abstract Methods =====

#### Returns

`void`

#### Overrides

`BasePanePrimitive.renderContent`

***

### getContainerClassName()

> `protected` **getContainerClassName**(): `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:165](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L165)

Get CSS class name for the container

#### Returns

`string`

#### Overrides

`BasePanePrimitive.getContainerClassName`

***

### getTemplate()

> `protected` **getTemplate**(): `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:169](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L169)

Get the template string for this primitive

#### Returns

`string`

#### Overrides

`BasePanePrimitive.getTemplate`

***

### onAttached()

> `protected` **onAttached**(`_params`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:285](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L285)

===== Lifecycle Hooks =====

#### Parameters

##### \_params

###### chart

`IChartApi`

###### series

`ISeriesApi`\<`any`\>

###### requestUpdate

() => `void`

#### Returns

`void`

#### Overrides

`BasePanePrimitive.onAttached`

***

### getPaneId()

> `protected` **getPaneId**(): `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:297](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L297)

Override pane ID for pane-specific button panels

#### Returns

`number`

#### Overrides

`BasePanePrimitive.getPaneId`

***

### onDetached()

> `protected` **onDetached**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:301](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L301)

Called when primitive is detached from chart

#### Returns

`void`

#### Overrides

`BasePanePrimitive.onDetached`

***

### getDimensions()

> **getDimensions**(): `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:361](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L361)

Override getDimensions to return fixed button panel dimensions

#### Returns

`object`

##### width

> **width**: `number`

##### height

> **height**: `number`

#### Overrides

`BasePanePrimitive.getDimensions`

***

### getSeriesConfig()

> **getSeriesConfig**(`seriesId`): [`SeriesConfiguration`](../../../types/SeriesTypes/interfaces/SeriesConfiguration.md) \| `null`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:377](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L377)

===== Public API =====

#### Parameters

##### seriesId

`string`

#### Returns

[`SeriesConfiguration`](../../../types/SeriesTypes/interfaces/SeriesConfiguration.md) \| `null`

***

### setSeriesConfig()

> **setSeriesConfig**(`seriesId`, `config`): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:381](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L381)

#### Parameters

##### seriesId

`string`

##### config

[`SeriesConfiguration`](../../../types/SeriesTypes/interfaces/SeriesConfiguration.md)

#### Returns

`void`

***

### syncToBackend()

> **syncToBackend**(): `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/primitives/ButtonPanelPrimitive.ts:385](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/primitives/ButtonPanelPrimitive.ts#L385)

#### Returns

`void`
