[**Streamlit Lightweight Charts Pro - Frontend API v0.3.0**](../../../README.md)

***

[Streamlit Lightweight Charts Pro - Frontend API](../../../modules.md) / [components/ButtonPanelComponent](../README.md) / ButtonPanelComponent

# Variable: ButtonPanelComponent

> `const` **ButtonPanelComponent**: `React.FC`\<`ButtonPanelComponentProps`\>

Defined in: [streamlit-lightweight-charts-pro/streamlit\_lightweight\_charts\_pro/frontend/src/components/ButtonPanelComponent.tsx:102](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/c6b373832ceaa92d00f67cbc4960ae43c5d25619/streamlit_lightweight_charts_pro/frontend/src/components/ButtonPanelComponent.tsx#L102)

Button panel component for pane controls.

Renders a panel with gear (series configuration) and collapse buttons
positioned in the top-right corner of a chart pane. The gear button
opens the series configuration dialog, while the collapse button
can be conditionally hidden.

Uses the extensible button architecture (BaseButton, SettingsButton, CollapseButton)
allowing additional custom buttons to be added via the customButtons prop.

## Param

Button panel configuration and event handlers

## Returns

The rendered button panel component

## Examples

```tsx
<ButtonPanelComponent
  paneId={0}
  isCollapsed={false}
  onGearClick={() => openSettings()}
  onCollapseClick={() => toggleCollapse()}
  showCollapseButton={true}
  config={{
    buttonSize: 16,
    buttonColor: '#787B86',
    showTooltip: true
  }}
/>
```

```tsx
const deleteButton = new DeleteButton({
  id: 'delete',
  tooltip: 'Delete series',
  onDeleteClick: () => removeSeries(),
});

<ButtonPanelComponent
  paneId={0}
  isCollapsed={false}
  onGearClick={() => openSettings()}
  onCollapseClick={() => toggleCollapse()}
  customButtons={[deleteButton]}
/>
```
