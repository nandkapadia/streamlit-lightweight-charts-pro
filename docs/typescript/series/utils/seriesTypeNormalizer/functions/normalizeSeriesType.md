[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../../modules.md) / [series/utils/seriesTypeNormalizer](../README.md) / normalizeSeriesType

# Function: normalizeSeriesType()

> **normalizeSeriesType**(`seriesType`): `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/utils/seriesTypeNormalizer.ts:19](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/utils/seriesTypeNormalizer.ts#L19)

Normalize series type string to match descriptor registry keys

## Parameters

### seriesType

`string`

Raw series type (case-insensitive, may have underscores)

## Returns

`string`

Normalized type matching registry keys

## Example

```ts
normalizeSeriesType('line') → 'Line'
normalizeSeriesType('gradient_ribbon') → 'GradientRibbon'
normalizeSeriesType('candlestick') → 'Candlestick'
```
