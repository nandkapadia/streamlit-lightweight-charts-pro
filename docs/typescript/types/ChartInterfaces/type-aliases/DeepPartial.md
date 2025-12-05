[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [types/ChartInterfaces](../README.md) / DeepPartial

# Type Alias: DeepPartial\<T\>

> **DeepPartial**\<`T`\> = `{ [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] }`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/types/ChartInterfaces.ts:684](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/types/ChartInterfaces.ts#L684)

Make all properties optional recursively

## Type Parameters

### T

`T`
