# Series Configuration Dialog

This document describes the TradingView-style series configuration dialog system that allows users to modify series properties through an intuitive UI.

## Overview

The series configuration dialog provides:
- **Gear button** for opening series settings
- **Collapse button** for pane management
- **Tabbed interface** with Inputs, Style, and Visibility panels
- **TradingView-like UI** with color pickers, sliders, and controls
- **Persistent settings** that survive chart redraws
- **Series-specific options** for different series types

## Components

### PaneButtonPanelPlugin

The main plugin that manages both collapse and gear buttons for each pane.

```typescript
import { createPaneButtonPanelPlugin } from './plugins/chart/paneButtonPanelPlugin'

const plugin = createPaneButtonPanelPlugin(paneId, {
  enabled: true,
  buttonSize: 16,
  onSeriesConfigChange: (paneId, seriesId, config) => {
    // Handle series configuration changes
  }
})

chart.attachPrimitive(plugin, paneId)
```

### SeriesConfigDialog

The main dialog component with tabbed interface:

```typescript
<SeriesConfigDialog
  isOpen={true}
  onClose={() => setDialogOpen(false)}
  seriesConfig={currentConfig}
  seriesType="line"
  seriesId="main-series"
  onConfigChange={(config) => applyConfig(config)}
/>
```

### ButtonPanelComponent

The button panel that houses both gear and collapse buttons:

```typescript
<ButtonPanelComponent
  paneId={0}
  isCollapsed={false}
  onCollapseClick={() => toggleCollapse()}
  onGearClick={() => openDialog()}
  config={buttonConfig}
/>
```

## Configuration Options

### PaneCollapseConfig

Extended configuration that supports both collapse and series config functionality:

```typescript
interface PaneCollapseConfig {
  enabled?: boolean
  buttonSize?: number
  buttonColor?: string
  buttonHoverColor?: string
  buttonBackground?: string
  buttonHoverBackground?: string
  showTooltip?: boolean
  onPaneCollapse?: (paneId: number, isCollapsed: boolean) => void
  onPaneExpand?: (paneId: number, isCollapsed: boolean) => void
  onSeriesConfigChange?: (paneId: number, seriesId: string, config: SeriesConfiguration) => void
}
```

### SeriesConfiguration

Comprehensive series configuration interface:

```typescript
interface SeriesConfiguration {
  // Common properties
  color?: string
  opacity?: number
  lineWidth?: number
  lineStyle?: 'solid' | 'dashed' | 'dotted'
  lastPriceVisible?: boolean
  priceLineVisible?: boolean
  labelsOnPriceScale?: boolean
  valuesInStatusLine?: boolean
  precision?: boolean
  precisionValue?: string

  // Series-specific properties
  // Supertrend
  period?: number
  multiplier?: number
  upTrend?: SeriesStyleConfig
  downTrend?: SeriesStyleConfig

  // Bollinger Bands
  length?: number
  stdDev?: number
  upperLine?: SeriesStyleConfig
  lowerLine?: SeriesStyleConfig
  fill?: SeriesStyleConfig

  // Moving Averages
  source?: 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'ohlc4'
  offset?: number
}
```

## Supported Series Types

- **line** - Line series with color, thickness, and line style options
- **area** - Area series with fill and line options
- **candlestick** - Candlestick series with up/down colors
- **bar** - Bar series with color options
- **histogram** - Histogram series with color options
- **supertrend** - Supertrend indicator with period, multiplier, and trend colors
- **bollinger_bands** - Bollinger Bands with length, deviation, and line colors
- **sma** - Simple Moving Average with length and source
- **ema** - Exponential Moving Average with length and source

## Dialog Tabs

### Inputs Tab
Series-specific input parameters:
- **Supertrend**: Period, Multiplier
- **Bollinger Bands**: Length, Standard Deviation
- **Moving Averages**: Length, Source, Offset

### Style Tab
Visual styling options:
- **Color Picker**: TradingView-style color palette with custom color support
- **Opacity Slider**: 0-100% transparency control
- **Line Thickness**: 1-5px thickness options with visual previews
- **Line Style**: Solid, dashed, dotted with visual previews
- **Series-specific styles**: Up/down trend colors, upper/lower line colors, fills

### Visibility Tab
Display options:
- **Price Line**: Last price line visibility
- **Labels**: Price scale labels, status line values
- **Precision**: Automatic or manual precision control

## Usage Examples

### Basic Single Pane

```typescript
import { createPaneButtonPanelPlugin } from './plugins/chart/paneButtonPanelPlugin'

// Create chart
const chart = createChart(container, chartOptions)
const lineSeries = chart.addLineSeries({ color: '#2196F3' })

// Add button panel
const plugin = createPaneButtonPanelPlugin(0, {
  onSeriesConfigChange: (paneId, seriesId, config) => {
    // Apply configuration to series
    if (config.color) {
      lineSeries.applyOptions({ color: config.color })
    }
    if (config.lineWidth) {
      lineSeries.applyOptions({ lineWidth: config.lineWidth })
    }
  }
})

chart.attachPrimitive(plugin, 0)
```

### Multi-Pane Setup

```typescript
// Main price pane
const mainPlugin = createPaneButtonPanelPlugin(0, {
  onSeriesConfigChange: (paneId, seriesId, config) => {
    // Apply to main series
  }
})

// Volume pane
const volumePlugin = createPaneButtonPanelPlugin(1, {
  onSeriesConfigChange: (paneId, seriesId, config) => {
    // Apply to volume series
  }
})

chart.attachPrimitive(mainPlugin, 0)
chart.attachPrimitive(volumePlugin, 1)
```

### Series Type Detection

```typescript
// The plugin automatically detects series types, but you can override:
const plugin = createPaneButtonPanelPlugin(0, {
  onSeriesConfigChange: (paneId, seriesId, config) => {
    const seriesType = determineSeriesType(seriesId)

    switch (seriesType) {
      case 'supertrend':
        applySuperTrendConfig(config)
        break
      case 'bollinger_bands':
        applyBollingerBandsConfig(config)
        break
      default:
        applyBasicConfig(config)
    }
  }
})
```

## Persistence

Series configurations are automatically saved to localStorage and restored when the chart is recreated:

```typescript
// Configurations are stored with keys like:
// 'series-config-pane-0-main-series'
// 'series-config-pane-1-volume-series'

// Access saved configurations:
const plugin = createPaneButtonPanelPlugin(0)
const savedConfig = plugin.getSeriesConfig('pane-0-main-series')

// Programmatically set configurations:
plugin.setSeriesConfig('pane-0-main-series', {
  color: '#FF0000',
  lineWidth: 3
})
```

## Styling

The dialog uses CSS classes that can be customized:

```css
/* Main dialog */
.series-config-dialog {
  width: 480px;
  max-height: 80vh;
}

/* Tabs */
.series-config-tabs .tab.active {
  border-bottom-color: #333;
}

/* Color picker */
.color-palette-dropdown {
  min-width: 240px;
}

/* Button panel */
.button-panel {
  display: flex;
  gap: 4px;
}
```

## Integration Notes

1. **Import Required Styles**: Make sure to import the CSS files:
   ```typescript
   import './styles/seriesConfigDialog.css'
   import './styles/paneCollapse.css'
   ```

2. **Handle Series Mapping**: Map seriesId to actual series objects in your application

3. **Validate Configurations**: Validate configuration changes before applying them

4. **Error Handling**: Wrap configuration applications in try-catch blocks

5. **Performance**: Debounce rapid configuration changes if needed

## Architecture Notes

This implementation follows the **Hybrid Primitive-Component Architecture**:
- **Primitives** handle chart integration and positioning
- **React Components** provide rich UI interactions
- **Services** manage configuration persistence
- **Type Safety** ensures correct configuration handling

The system is designed to be:
- **Modular**: Each component can be used independently
- **Extensible**: Easy to add new series types and options
- **Maintainable**: Clear separation of concerns
- **Performant**: Minimal re-renders and efficient updates
