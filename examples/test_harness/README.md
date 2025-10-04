# Test Harness for Streamlit Lightweight Charts Pro

This directory contains comprehensive test harnesses for quickly testing all series types and features.

## Files

- `simple_series_test.py` - Quick test of all series types (recommended)
- `comprehensive_series_test.py` - Complete test harness with all features (lint-free)
- `all_series_test_harness.py` - Original comprehensive test (has linting issues)
- `run_test.py` - Quick launcher script
- `README.md` - This file

## Quick Start

### Option 1: Use the Launcher Script (Recommended)

```bash
# Simple test (quick and easy)
python examples/test_harness/run_test.py

# Complete test harness
python examples/test_harness/run_test.py --complete
```

### Option 2: Direct Streamlit Commands

```bash
# Simple test
streamlit run examples/test_harness/simple_series_test.py

# Complete test harness
streamlit run examples/test_harness/comprehensive_series_test.py
```

### Option 3: Use the Examples Launcher

```bash
streamlit run examples/launcher.py
```
Then navigate to the "🧪 Test Harness" tab.

### What's Tested

The test harness covers:

#### 📈 Basic Series Types
- Line Series
- Candlestick Series
- Area Series
- Bar Series

#### 📊 Advanced Series Types
- Histogram Series (Volume)
- Baseline Series
- Trend Fill Series
- Band Series
- Gradient Ribbon Series

#### 🎯 Multi-Pane Charts
- 2-pane layout (Price + Volume)
- 3-pane layout (Price + Volume + Indicators)

#### 🏷️ Annotations & Trades
- Text annotations
- Arrow annotations
- Line annotations
- Rectangle annotations
- Circle annotations
- Trade visualization (rectangles + markers)
- Signal markers

#### ⚙️ Configuration Tests
- Auto-sizing charts
- Custom styling and colors
- Range switcher
- Dark theme support

## Features

- **Comprehensive Coverage**: Tests all available series types
- **Interactive**: Navigate through tabs to test different features
- **Realistic Data**: Generates sample OHLCV data with trends
- **Error Detection**: Check browser console for any rendering issues
- **Responsive**: Test chart responsiveness by resizing browser
- **Quick Regeneration**: Regenerate test data with button clicks

## Testing Checklist

When using the test harness, verify:

- [ ] All charts render without errors
- [ ] Data displays correctly
- [ ] Interactive features work (zoom, pan, crosshair)
- [ ] Multi-pane charts have proper proportions
- [ ] Annotations display at correct positions
- [ ] Trade visualization shows rectangles and markers
- [ ] Range switcher functions properly
- [ ] Charts resize when browser window changes
- [ ] No console errors in browser developer tools

## Troubleshooting

If you encounter issues:

1. **Check browser console** for JavaScript errors
2. **Verify data format** - ensure time strings are valid
3. **Check series configuration** - ensure required parameters are provided
4. **Test with different browsers** - Chrome, Firefox, Safari
5. **Clear browser cache** if charts don't update

## Extending the Test Harness

To add new series types or features:

1. Import the new series class
2. Generate appropriate test data
3. Add a new chart in the relevant tab
4. Update the test summary in the sidebar
5. Add to the testing checklist
