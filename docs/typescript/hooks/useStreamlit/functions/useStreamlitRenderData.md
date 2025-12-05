[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [hooks/useStreamlit](../README.md) / useStreamlitRenderData

# Function: useStreamlitRenderData()

> **useStreamlitRenderData**(): `RenderData` \| `undefined`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/hooks/useStreamlit.ts:33](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/hooks/useStreamlit.ts#L33)

Hook for accessing Streamlit render data with proper initialization timing.

Waits for RENDER_EVENT before setting component ready flag to ensure
Streamlit's ComponentRegistry has registered the component.

## Returns

`RenderData` \| `undefined`

RenderData | undefined - The current render data from Streamlit
