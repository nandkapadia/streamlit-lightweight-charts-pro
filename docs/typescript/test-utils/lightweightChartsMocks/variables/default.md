[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [test-utils/lightweightChartsMocks](../README.md) / default

# Variable: default

> `const` **default**: `object`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/test-utils/lightweightChartsMocks.ts:354](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/test-utils/lightweightChartsMocks.ts#L354)

Default export for vi.mock()

## Type Declaration

### createChart

> **createChart**: `Mock`\<`Procedure`\>

Mock createChart function

### createChartEx

> **createChartEx**: `Mock`\<`Procedure`\>

Mock createChartEx function

### isBusinessDay

> **isBusinessDay**: `Mock`\<`Procedure`\>

Mock utility functions

### isUTCTimestamp

> **isUTCTimestamp**: `Mock`\<`Procedure`\>

### ColorType

> **ColorType**: `object`

Enums and constants

#### ColorType.Solid

> **Solid**: `string` = `'solid'`

#### ColorType.VerticalGradient

> **VerticalGradient**: `string` = `'gradient'`

### CrosshairMode

> **CrosshairMode**: `object`

#### CrosshairMode.Normal

> **Normal**: `number` = `0`

#### CrosshairMode.Hidden

> **Hidden**: `number` = `1`

### LineStyle

> **LineStyle**: `object`

#### LineStyle.Solid

> **Solid**: `number` = `0`

#### LineStyle.Dotted

> **Dotted**: `number` = `1`

#### LineStyle.Dashed

> **Dashed**: `number` = `2`

#### LineStyle.LargeDashed

> **LargeDashed**: `number` = `3`

#### LineStyle.SparseDotted

> **SparseDotted**: `number` = `4`

### LineType

> **LineType**: `object`

#### LineType.Simple

> **Simple**: `number` = `0`

#### LineType.WithSteps

> **WithSteps**: `number` = `1`

#### LineType.Curved

> **Curved**: `number` = `2`

### PriceScaleMode

> **PriceScaleMode**: `object`

#### PriceScaleMode.Normal

> **Normal**: `number` = `0`

#### PriceScaleMode.Logarithmic

> **Logarithmic**: `number` = `1`

#### PriceScaleMode.Percentage

> **Percentage**: `number` = `2`

#### PriceScaleMode.IndexedTo100

> **IndexedTo100**: `number` = `3`

### TickMarkType

> **TickMarkType**: `object`

#### TickMarkType.Year

> **Year**: `number` = `0`

#### TickMarkType.Month

> **Month**: `number` = `1`

#### TickMarkType.DayOfMonth

> **DayOfMonth**: `number` = `2`

#### TickMarkType.Time

> **Time**: `number` = `3`

#### TickMarkType.TimeWithSeconds

> **TimeWithSeconds**: `number` = `4`

### TrackingModeExitMode

> **TrackingModeExitMode**: `object`

#### TrackingModeExitMode.OnTouchEnd

> **OnTouchEnd**: `number` = `0`

#### TrackingModeExitMode.OnMouseLeave

> **OnMouseLeave**: `number` = `1`

### LastPriceAnimationMode

> **LastPriceAnimationMode**: `object`

#### LastPriceAnimationMode.Disabled

> **Disabled**: `number` = `0`

#### LastPriceAnimationMode.Continuous

> **Continuous**: `number` = `1`

#### LastPriceAnimationMode.OnDataUpdate

> **OnDataUpdate**: `number` = `2`

### PriceLineSource

> **PriceLineSource**: `object`

#### PriceLineSource.LastBar

> **LastBar**: `number` = `0`

#### PriceLineSource.LastVisible

> **LastVisible**: `number` = `1`

### MismatchDirection

> **MismatchDirection**: `object`

#### MismatchDirection.NearestLeft

> **NearestLeft**: `number` = `0`

#### MismatchDirection.NearestRight

> **NearestRight**: `number` = `1`

### AreaSeries

> **AreaSeries**: `string`

Series types

### BarSeries

> **BarSeries**: `string`

### BaselineSeries

> **BaselineSeries**: `string`

### CandlestickSeries

> **CandlestickSeries**: `string`

### HistogramSeries

> **HistogramSeries**: `string`

### LineSeries

> **LineSeries**: `string`

### customSeriesDefaultOptions

> **customSeriesDefaultOptions**: `object`

Custom series and defaults

#### customSeriesDefaultOptions.color

> **color**: `string` = `'#2196f3'`

### version

> **version**: `string`

### defaultHorzScaleBehavior

> **defaultHorzScaleBehavior**: `object`

#### defaultHorzScaleBehavior.options

> **options**: `Mock`\<`Procedure`\>

#### defaultHorzScaleBehavior.setOptions

> **setOptions**: `Mock`\<`Procedure`\>

### resetMocks()

> **resetMocks**: () => `void`

Reset function for tests

#### Returns

`void`
