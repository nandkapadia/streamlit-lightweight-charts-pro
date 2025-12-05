[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [forms/ColorPickerDialog](../README.md) / ColorPickerDialogProps

# Interface: ColorPickerDialogProps

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/ColorPickerDialog.tsx:18](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/ColorPickerDialog.tsx#L18)

Props for ColorPickerDialog

## Properties

### isOpen

> **isOpen**: `boolean`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/ColorPickerDialog.tsx:20](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/ColorPickerDialog.tsx#L20)

Whether dialog is open

***

### color

> **color**: `string`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/ColorPickerDialog.tsx:22](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/ColorPickerDialog.tsx#L22)

Current color (hex format)

***

### opacity

> **opacity**: `number`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/ColorPickerDialog.tsx:24](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/ColorPickerDialog.tsx#L24)

Current opacity (0-100)

***

### onSave()

> **onSave**: (`color`, `opacity`) => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/ColorPickerDialog.tsx:26](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/ColorPickerDialog.tsx#L26)

Save callback

#### Parameters

##### color

`string`

##### opacity

`number`

#### Returns

`void`

***

### onCancel()

> **onCancel**: () => `void`

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/forms/ColorPickerDialog.tsx:28](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/forms/ColorPickerDialog.tsx#L28)

Cancel callback

#### Returns

`void`
