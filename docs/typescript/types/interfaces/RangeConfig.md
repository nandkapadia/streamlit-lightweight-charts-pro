[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../modules.md) / [types](../README.md) / RangeConfig

# Interface: RangeConfig

Defined in: [lightweight-charts-pro-frontend/dist/primitives/RangeSwitcherPrimitive.d.ts:26](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/RangeSwitcherPrimitive.d.ts#L26)

Range configuration for time switching
Supports both enum values and custom seconds for flexibility

## Properties

### text

> **text**: `string`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/RangeSwitcherPrimitive.d.ts:30](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/RangeSwitcherPrimitive.d.ts#L30)

Display text for the range

***

### range

> **range**: `number` \| [`TimeRange`](../enumerations/TimeRange.md) \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/RangeSwitcherPrimitive.d.ts:36](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/RangeSwitcherPrimitive.d.ts#L36)

Time range - can be enum value or custom seconds
Use TimeRange enum for predefined ranges, or number for custom seconds
Use null or TimeRange.ALL for "All" range

***

### ~~seconds?~~

> `optional` **seconds**: `number` \| `null`

Defined in: [lightweight-charts-pro-frontend/dist/primitives/RangeSwitcherPrimitive.d.ts:40](https://github.com/nandkapadia/lightweight-charts-pro-frontend/blob/ba8523c1bdf9ea96b367a5268828a0df38756218/dist/primitives/RangeSwitcherPrimitive.d.ts#L40)

#### Deprecated

Use 'range' instead. This is kept for backwards compatibility.
