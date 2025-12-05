[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../../modules.md) / [series/core/UnifiedSeriesDescriptor](../README.md) / STANDARD\_SERIES\_PROPERTIES

# Variable: STANDARD\_SERIES\_PROPERTIES

> `const` **STANDARD\_SERIES\_PROPERTIES**: `Record`\<`string`, [`PropertyDescriptor`](../interfaces/PropertyDescriptor.md)\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts:219](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/series/core/UnifiedSeriesDescriptor.ts#L219)

Standard series properties that should be included in all series descriptors.
These correspond to SeriesOptionsCommon from lightweight-charts and are sent
in the options object from Python backend (properties without top_level=True).

Including these in descriptors ensures:
1. Properties are passed through when updating via dialog
2. They have proper defaults
3. Documentation is consistent

Properties marked with hidden: true are not shown in the UI but are still
processed during property mapping to ensure consistency between JSON and Dialog paths.
