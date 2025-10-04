# 🎯 Ribbon Series Test Harness

A comprehensive test harness for the ribbon series implementation with 100 data points and various configurations.

## 📋 Overview

This test harness validates the ribbon series functionality across multiple scenarios:

- ✅ **Basic ribbon series** with default styling
- ✅ **Custom styling options** (colors, line styles, fill)
- ✅ **Primitive rendering mode** vs direct rendering
- ✅ **Multiple ribbon series** on the same chart
- ✅ **Edge cases and data validation**

## 🚀 Quick Start

### Option 1: Direct Streamlit Command
```bash
streamlit run temp_ribbon_test.py --server.port 8502
```

### Option 2: Using the Helper Script
```bash
python run_ribbon_test.py
```

### Option 3: Manual Import
```python
import temp_ribbon_test
temp_ribbon_test.main()
```

## 🧪 Test Cases

### Test 1: Basic Ribbon Series
- **Data**: 100 points with base price 50.0
- **Volatility**: 1.5% daily volatility
- **Band Width**: 5% of price
- **Styling**: Default green/red colors
- **Purpose**: Validate basic functionality

### Test 2: Custom Styling Options
- **Data**: 100 points with base price 75.0
- **Upper Line**: Red (#FF6B6B), width 3, solid
- **Lower Line**: Teal (#4ECDC4), width 3, dashed
- **Fill**: Light red with 20% opacity
- **Purpose**: Test custom styling capabilities

### Test 3: Primitive Rendering Mode
- **Data**: 100 points with base price 25.0
- **Upper Line**: Purple (#9B59B6), width 2
- **Lower Line**: Orange (#E67E22), width 2
- **Fill**: Light purple with 15% opacity
- **Purpose**: Test primitive rendering vs direct rendering

### Test 4: Multiple Ribbon Series
- **Series 1**: Tight bands (3% width), green colors
- **Series 2**: Wide bands (7% width), red colors, dotted lines
- **Purpose**: Test multiple series on same chart

### Test 5: Edge Cases & Data Validation
- **Close Values**: Upper/lower very close together
- **Wide Spread**: Large difference between upper/lower
- **Negative Values**: Testing negative price scenarios
- **Normal Variation**: Standard data points
- **Purpose**: Validate edge case handling

## 📊 Data Generation

The test harness generates realistic ribbon data using:

```python
def generate_ribbon_data(
    num_points: int = 100,
    base_price: float = 100.0,
    volatility: float = 0.02,
    band_width: float = 0.05,
    start_date: str = "2024-01-01"
) -> List[RibbonData]:
```

### Parameters:
- **num_points**: Number of data points (default: 100)
- **base_price**: Starting price for the series
- **volatility**: Daily price volatility (0.02 = 2%)
- **band_width**: Band width as fraction of price (0.05 = 5%)
- **start_date**: Starting date for the time series

### Data Structure:
Each `RibbonData` point contains:
- **time**: Timestamp string (YYYY-MM-DD format)
- **upper**: Upper band value
- **lower**: Lower band value
- **fill**: Optional fill color (uses series default if None)

## 🎨 Styling Options

### Line Options
```python
from streamlit_lightweight_charts_pro.charts.options.line_options import LineOptions

# Create custom line options
upper_line = LineOptions(
    color="#FF6B6B",      # Hex color
    line_width=3,         # Line width in pixels
    line_style="solid"    # "solid", "dotted", "dashed"
)
```

### Series Configuration
```python
# Create ribbon series
ribbon_series = RibbonSeries(data)

# Configure styling
ribbon_series.upper_line = upper_line
ribbon_series.lower_line = lower_line
ribbon_series.fill = "rgba(255, 107, 107, 0.2)"  # Fill color with opacity
ribbon_series.fill_visible = True
```

## 🔧 Frontend Integration

The ribbon series uses a hybrid rendering approach:

### Direct ICustomSeries Rendering (Default)
- Series renders lines and fill directly
- Normal z-order
- Best for most use cases

### Primitive Rendering Mode
- Series provides autoscaling only
- Primitive handles rendering in background
- Custom z-order control (default: -100)
- Best for background indicators

## 📈 Expected Results

### Visual Validation
- **Upper/Lower Lines**: Should be clearly visible with specified colors
- **Fill Area**: Should fill the space between upper and lower lines
- **Data Points**: 100 points should be rendered smoothly
- **Time Range**: Should span from start_date to start_date + 99 days

### Functional Validation
- **Autoscaling**: Chart should auto-scale to fit all data
- **Price Axis**: Should show upper and lower band values
- **Interactivity**: Chart should be interactive (zoom, pan)
- **Performance**: Should render smoothly with 100 data points

## 🐛 Troubleshooting

### Common Issues

#### Chart Not Rendering
- Check that Streamlit is running on correct port (8502)
- Verify ribbon series data is valid
- Check browser console for JavaScript errors

#### Missing Data Points
- Ensure all RibbonData points have valid time, upper, lower values
- Check for NaN or None values in data
- Verify time format is YYYY-MM-DD

#### Styling Not Applied
- Verify LineOptions are properly configured
- Check color format (hex colors like "#FF6B6B")
- Ensure fill_visible is set to True

#### Performance Issues
- Reduce number of data points if needed
- Check for memory leaks in browser
- Verify frontend build is up to date

### Debug Mode
Enable debug information in the sidebar:
- ✅ **Show Sample Data**: Display first 10 data points
- ✅ **Show Debug Info**: Display technical details

## 📁 File Structure

```
├── temp_ribbon_test.py      # Main test harness
├── run_ribbon_test.py       # Helper script to run tests
├── RIBBON_TEST_README.md    # This documentation
└── streamlit_lightweight_charts_pro/
    ├── charts/series/ribbon.py           # Python ribbon series
    ├── data/ribbon.py                    # RibbonData class
    └── frontend/src/plugins/series/
        ├── ribbonSeriesPlugin.ts         # Frontend ribbon series
        └── primitives/RibbonPrimitive.ts # Primitive implementation
```

## 🔗 Related Files

### Python Implementation
- `streamlit_lightweight_charts_pro/charts/series/ribbon.py`
- `streamlit_lightweight_charts_pro/data/ribbon.py`

### Frontend Implementation
- `streamlit_lightweight_charts_pro/frontend/src/plugins/series/ribbonSeriesPlugin.ts`
- `streamlit_lightweight_charts_pro/frontend/src/primitives/RibbonPrimitive.ts`
- `streamlit_lightweight_charts_pro/frontend/src/utils/seriesFactory.ts`

### Examples
- `examples/advanced_features/ribbon_example.py`
- `examples/advanced_features/gradient_ribbon_example.py`

## 🧹 Cleanup

After testing, you can remove the temporary files:

```bash
rm temp_ribbon_test.py
rm run_ribbon_test.py
rm RIBBON_TEST_README.md
```

## 📝 Notes

- This test harness is temporary and should be removed after testing
- All test data is generated programmatically for consistency
- The harness tests both Python and frontend implementations
- Results should be visually inspected for proper rendering
- Performance should be acceptable with 100 data points

---

**Status**: ✅ **READY FOR TESTING**
**Created**: December 2024
**Purpose**: Validate ribbon series implementation with 100 data points
