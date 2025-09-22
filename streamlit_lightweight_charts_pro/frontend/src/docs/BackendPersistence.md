# Backend Persistence for Series Configuration

This document explains how series configuration changes are persisted to the Streamlit backend to ensure configurations survive chart redraws and across sessions.

## Overview

The series configuration system provides two levels of persistence:

1. **Local Storage** - Immediate persistence for the current session
2. **Streamlit Backend** - Cross-session persistence via Python backend

## How It Works

### Frontend (TypeScript)

The `StreamlitSeriesConfigService` manages the communication:

```typescript
import { StreamlitSeriesConfigService } from './services/StreamlitSeriesConfigService'

// Service automatically initialized as singleton
const service = StreamlitSeriesConfigService.getInstance()

// Record configuration changes
service.recordConfigChange(paneId, seriesId, seriesType, config, chartId)

// Configurations are debounced and sent to backend via Streamlit.setComponentValue()
```

### Backend Integration

When series configurations change, the frontend sends this payload to Streamlit:

```javascript
{
  type: 'series_config_changes',
  changes: [
    {
      paneId: 0,
      seriesId: 'main-line-series',
      seriesType: 'line',
      config: {
        color: '#FF0000',
        lineWidth: 3,
        opacity: 0.8
      },
      timestamp: 1643723400000,
      chartId: 'main-chart'
    }
  ],
  completeState: {
    'main-chart': {
      0: {
        'main-line-series': {
          config: { color: '#FF0000', lineWidth: 3, opacity: 0.8 },
          seriesType: 'line',
          lastModified: 1643723400000
        }
      }
    }
  },
  timestamp: 1643723400000
}
```

### Python Backend Handler

In your Streamlit Python code, handle the configuration changes:

```python
import streamlit as st
from streamlit_lightweight_charts_pro import st_lightweight_charts

# Store configurations in session state
if 'series_configs' not in st.session_state:
    st.session_state.series_configs = {}

def handle_series_config_change(config_data):
    """Handle series configuration changes from frontend"""
    if config_data and config_data.get('type') == 'series_config_changes':
        # Update session state with new configurations
        st.session_state.series_configs = config_data.get('completeState', {})

        # Optionally persist to database, file, etc.
        # save_to_database(st.session_state.series_configs)

        print(f"Updated series configurations: {len(config_data.get('changes', []))} changes")

# Create chart with backend persistence
chart_config = {
    'charts': [
        {
            'chartId': 'main-chart',
            'chart': { 'height': 400 },
            'series': [
                {
                    'type': 'Line',
                    'data': data,
                    'name': 'Main Series'
                }
            ]
        }
    ],
    'syncConfig': { 'enabled': False },
    # Pass existing configurations back to frontend
    'seriesConfigBackendData': {
        'completeState': st.session_state.series_configs
    }
}

# Render chart and capture changes
result = st_lightweight_charts(
    config=chart_config,
    key='chart_with_persistence'
)

# Handle any configuration changes
if result:
    handle_series_config_change(result)
```

## Complete Example

Here's a complete Streamlit app with series configuration persistence:

```python
import streamlit as st
import pandas as pd
from streamlit_lightweight_charts_pro import st_lightweight_charts

st.set_page_config(page_title="Chart with Series Config Persistence", layout="wide")

# Initialize session state for series configurations
if 'series_configs' not in st.session_state:
    st.session_state.series_configs = {}

def save_configs_to_file():
    """Save configurations to a file for true persistence"""
    import json
    try:
        with open('series_configs.json', 'w') as f:
            json.dump(st.session_state.series_configs, f)
    except Exception as e:
        st.error(f"Failed to save configs: {e}")

def load_configs_from_file():
    """Load configurations from file"""
    import json
    try:
        with open('series_configs.json', 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

# Load existing configurations on startup
if not st.session_state.series_configs:
    st.session_state.series_configs = load_configs_from_file()

# Sample data
data = [
    {'time': '2023-01-01', 'value': 100},
    {'time': '2023-01-02', 'value': 102},
    {'time': '2023-01-03', 'value': 101},
    {'time': '2023-01-04', 'value': 105},
    {'time': '2023-01-05', 'value': 108},
]

st.title("📊 Chart with Series Configuration Persistence")
st.markdown("Configure the series using the gear button. Settings persist across redraws!")

# Chart configuration
chart_config = {
    'charts': [
        {
            'chartId': 'persistent-chart',
            'chart': {
                'height': 400,
                'layout': {
                    'background': {'color': '#ffffff'},
                    'textColor': '#333'
                }
            },
            'series': [
                {
                    'type': 'Line',
                    'data': data,
                    'name': 'Main Line Series',
                    'options': {
                        'color': '#2196F3',
                        'lineWidth': 2
                    }
                }
            ],
            # Enable pane collapse functionality with series config
            'paneCollapse': {
                'enabled': True,
                'showTooltip': True
            }
        }
    ],
    'syncConfig': {'enabled': False},
    # Pass backend data for persistence
    'seriesConfigBackendData': {
        'completeState': st.session_state.series_configs
    }
}

# Render chart
col1, col2 = st.columns([3, 1])

with col1:
    result = st_lightweight_charts(
        config=chart_config,
        key='persistent_chart'
    )

with col2:
    st.subheader("Configuration Status")

    if st.session_state.series_configs:
        st.success(f"✅ {len(st.session_state.series_configs)} chart(s) configured")

        # Show current configurations
        with st.expander("Current Configurations"):
            st.json(st.session_state.series_configs)
    else:
        st.info("ℹ️ No configurations saved yet")

    # Save/Load buttons
    st.subheader("Persistence Controls")

    if st.button("💾 Save to File"):
        save_configs_to_file()
        st.success("Configurations saved!")

    if st.button("📁 Load from File"):
        st.session_state.series_configs = load_configs_from_file()
        st.rerun()

    if st.button("🗑️ Clear All"):
        st.session_state.series_configs = {}
        st.rerun()

# Handle configuration changes from frontend
if result and isinstance(result, dict):
    if result.get('type') == 'series_config_changes':
        # Update session state
        st.session_state.series_configs = result.get('completeState', {})

        # Auto-save to file
        save_configs_to_file()

        # Show success message
        changes_count = len(result.get('changes', []))
        st.success(f"✅ Updated {changes_count} series configuration(s)")

        # Rerun to update the display
        st.rerun()

# Instructions
st.markdown("""
### 🎯 How to Use

1. **Configure Series**: Click the gear ⚙ button on the chart to open series settings
2. **Modify Settings**: Change colors, line thickness, opacity, visibility options
3. **Persistent Storage**: Settings are automatically saved and restored across:
   - Chart redraws (when you interact with other Streamlit widgets)
   - Page refreshes (via session state)
   - App restarts (via file persistence)

### 📋 Available Configuration Options

- **Style Tab**: Color, opacity, line thickness, line style (solid/dashed/dotted)
- **Visibility Tab**: Price lines, labels, precision settings
- **Inputs Tab**: Series-specific parameters (varies by series type)

### 🔧 Technical Details

The persistence system uses:
- **Frontend**: TypeScript service with debounced backend sync
- **Backend**: Streamlit session state + optional file persistence
- **Storage**: Local storage (immediate) + backend (cross-session)
""")
```

## Configuration Data Structure

The backend receives configuration data in this format:

```typescript
interface SeriesConfigState {
  [chartId: string]: {
    [paneId: number]: {
      [seriesId: string]: {
        config: SeriesConfiguration
        seriesType: SeriesType
        lastModified: number
      }
    }
  }
}
```

## Best Practices

### 1. Handle Configuration Changes

```python
def handle_config_change(result):
    if not result or result.get('type') != 'series_config_changes':
        return

    # Update session state
    st.session_state.series_configs.update(
        result.get('completeState', {})
    )

    # Persist to database/file
    persist_configurations(st.session_state.series_configs)
```

### 2. Initialize with Existing Data

```python
# Always pass existing configurations back to frontend
chart_config['seriesConfigBackendData'] = {
    'completeState': st.session_state.get('series_configs', {})
}
```

### 3. Debounce Updates

The frontend automatically debounces changes (300ms), but you can also debounce on the backend:

```python
import time

last_update_time = 0

def debounced_save(configs):
    global last_update_time
    current_time = time.time()

    if current_time - last_update_time > 1.0:  # 1 second debounce
        save_to_database(configs)
        last_update_time = current_time
```

### 4. Error Handling

```python
def safe_handle_config_change(result):
    try:
        if result and result.get('type') == 'series_config_changes':
            st.session_state.series_configs = result.get('completeState', {})
    except Exception as e:
        st.error(f"Failed to process configuration change: {e}")
        # Log error but don't crash the app
```

## Troubleshooting

### Common Issues

1. **Configurations Not Persisting**
   - Ensure `seriesConfigBackendData` is passed in chart config
   - Check that the result handler is processing `series_config_changes` type

2. **Performance Issues**
   - Use debouncing on both frontend and backend
   - Consider storing only essential configuration data

3. **State Management**
   - Always use session state for configurations
   - Implement proper error handling for corrupted data

### Debug Information

You can access debug information:

```javascript
// In browser console
const service = window.streamlitSeriesConfigService;
console.log(service.getStats());
console.log(service.getCompleteState());
```

This backend persistence system ensures that your users' series configuration preferences are maintained across all chart interactions and app sessions!

<system-reminder>
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.


Here are the existing contents of your todo list:

[1. [completed] Implement backend callback integration for persistence
2. [completed] Add Streamlit communication layer for series config changes
3. [in_progress] Update chart integration to handle backend persistence
4. [pending] Test persistence across chart redraws]
</system-reminder>