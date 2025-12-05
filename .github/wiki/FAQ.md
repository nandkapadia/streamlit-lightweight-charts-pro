# Frequently Asked Questions (FAQ)

## General Questions

### What is Streamlit Lightweight Charts Pro?

Streamlit Lightweight Charts Pro is a high-performance Streamlit component for creating financial charts using TradingView's Lightweight Charts library. It provides an ultra-simplified API optimized for trading and financial visualizations.

### Is it free to use?

Yes, this package is open-source and released under the MIT license. Both personal and commercial use are permitted.

### What's the difference from the original lightweight-charts?

This is a **Streamlit wrapper** that:
- Works seamlessly with Streamlit applications
- Accepts pandas DataFrames directly
- Provides simplified Python API
- Handles bidirectional Python ↔ React communication
- Includes trading-specific primitives and utilities

### Do I need TradingView account or license?

No. This uses the open-source TradingView Lightweight Charts library, which is free and doesn't require a TradingView account.

## Installation & Setup

### How do I install the package?

```bash
pip install streamlit-lightweight-charts-pro
```

See [Installation Guide](Installation-Guide) for detailed instructions.

### Why isn't the chart rendering?

Common causes:
1. **Frontend build missing** (for dev installations)
2. **Browser cache** - Try hard refresh (Ctrl+Shift+R)
3. **Import error** - Verify import: `from streamlit_lightweight_charts_pro import renderChart`
4. **Data format** - Ensure DataFrame has 'time' column

### Can I use this in production?

Yes, the package is production-ready. However:
- Test thoroughly in your environment
- Pin package versions in requirements.txt
- Monitor for updates and security fixes
- Consider implementing error handling

## Data & Usage

### What data format is required?

**Line/Area charts**:
```python
pd.DataFrame({
    'time': pd.date_range('2023-01-01', periods=100),
    'value': [100, 101, 102, ...]
})
```

**Candlestick charts**:
```python
pd.DataFrame({
    'time': pd.date_range('2023-01-01', periods=100),
    'open': [...],
    'high': [...],
    'low': [...],
    'close': [...]
})
```

### What time formats are supported?

- **pandas datetime**: `pd.Timestamp`, `pd.DatetimeIndex`
- **Python datetime**: `datetime.datetime`, `datetime.date`
- **Unix timestamp**: Integer (seconds since epoch)
- **String dates**: '2023-01-01' (will be parsed)

### How much data can I display?

**Recommended limits**:
- **Optimal**: < 1,000 points
- **Good**: 1,000 - 10,000 points
- **Acceptable**: 10,000 - 50,000 points
- **Slow**: > 50,000 points

For large datasets, consider:
- Downsampling/aggregation
- Pagination
- Server-side filtering

See [Performance Optimization](Performance-Optimization) for details.

### Can I use real-time data?

Yes! Update the chart by re-rendering with new data:

```python
import time

placeholder = st.empty()

while True:
    new_data = fetch_latest_data()
    with placeholder:
        renderChart(new_data, height=400)
    time.sleep(1)
```

See [Real-Time Updates](Real-Time-Updates) for complete examples.

## Customization

### How do I change colors?

```python
renderChart(
    data,
    lineColor='#2962FF',
    topColor='rgba(41, 98, 255, 0.4)',
    bottomColor='rgba(41, 98, 255, 0.0)'
)
```

See [Styling and Theming](Styling-and-Theming) for all options.

### Can I use dark mode?

Yes:

```python
renderChart(
    data,
    layout={
        'background': {'color': '#1e222d'},
        'textColor': '#d1d4dc'
    },
    grid={
        'vertLines': {'color': 'rgba(42, 46, 57, 0.5)'},
        'horzLines': {'color': 'rgba(42, 46, 57, 0.5)'}
    }
)
```

### How do I add multiple series?

```python
renderChart(
    main_data,
    additionalSeries=[
        {'data': series1_data, 'type': 'line'},
        {'data': series2_data, 'type': 'line'}
    ]
)
```

### Can I customize the legend?

Currently, legend customization is limited. This is a planned feature. Track progress in GitHub Issues.

## Technical Questions

### Does it work with Streamlit Cloud?

Yes, it works with Streamlit Cloud deployments. Ensure:
- Package is in `requirements.txt`
- Correct version is specified
- All dependencies are included

### Can I use it with multipage apps?

Yes, works perfectly with Streamlit multipage apps. Use unique `key` parameters to avoid conflicts:

```python
renderChart(data, key="page1_chart")
```

### Does it support Streamlit sessions?

Yes, the component respects Streamlit's session state. Use `st.session_state` to manage chart data:

```python
if 'chart_data' not in st.session_state:
    st.session_state.chart_data = initial_data

renderChart(st.session_state.chart_data)
```

### Can I export charts as images?

Direct export is not currently supported. Workarounds:
1. Use browser screenshot
2. Use Streamlit's built-in download button with chart data
3. Implement custom export functionality

This is a planned feature.

### Is TypeScript/React knowledge required?

No, you only need Python knowledge. The TypeScript/React frontend is already built and bundled with the package.

You only need TypeScript/React knowledge if you want to:
- Modify the frontend component
- Add custom primitives
- Contribute to development

## Trading-Specific

### Can I add indicators?

Yes! Calculate indicators in Python and add as additional series:

```python
# Calculate MA
ma = data['close'].rolling(20).mean()

renderChart(
    candlestick_data,
    additionalSeries=[{
        'data': pd.DataFrame({'time': dates, 'value': ma}),
        'type': 'line',
        'options': {'color': '#FF6D00'}
    }]
)
```

See [Trading Indicators](Trading-Indicators) for examples.

### How do I add buy/sell markers?

```python
markers = [
    {
        'time': '2023-01-15',
        'position': 'belowBar',
        'color': '#26a69a',
        'shape': 'arrowUp',
        'text': 'Buy'
    },
    {
        'time': '2023-01-20',
        'position': 'aboveBar',
        'color': '#ef5350',
        'shape': 'arrowDown',
        'text': 'Sell'
    }
]

renderChart(data, markers=markers)
```

### Can I display multiple timeframes?

Yes, create separate charts:

```python
col1, col2 = st.columns(2)

with col1:
    renderChart(daily_data, title="Daily")

with col2:
    renderChart(weekly_data, title="Weekly")
```

See [Multiple Timeframes](Multiple-Timeframes) for advanced patterns.

### Does it support backtesting visualization?

Yes! You can visualize:
- Entry/exit points (markers)
- P&L zones (colored areas)
- Trade rectangles (custom primitives)
- Equity curves (line charts)

See [Code Recipes](Code-Recipes) for examples.

## Performance

### Why is my chart slow?

Common causes:
1. **Too many data points** - Reduce to < 10,000 points
2. **Too many series** - Limit to 5-10 series
3. **Complex calculations** - Move to server-side
4. **Frequent re-renders** - Use `key` parameter to prevent unnecessary re-renders

See [Performance Optimization](Performance-Optimization).

### How do I optimize for large datasets?

```python
# Downsample
data_downsampled = data.resample('1H').agg({
    'open': 'first',
    'high': 'max',
    'low': 'min',
    'close': 'last'
})

# Or use pagination
page_size = 1000
data_page = data.iloc[:page_size]

renderChart(data_page)
```

## Errors & Troubleshooting

### Error: "Component not available"

**Causes**:
- Frontend build missing
- Import error
- Installation incomplete

**Solution**:
```bash
pip install --force-reinstall streamlit-lightweight-charts-pro
streamlit cache clear
```

### Error: "Invalid data format"

**Solution**: Ensure DataFrame has correct columns:
- Line/Area: `time`, `value`
- Candlestick: `time`, `open`, `high`, `low`, `close`

### Chart is blank/not showing

**Solutions**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check browser console for errors (F12)
3. Verify data is not empty: `print(data.head())`
4. Check time column format: `print(data['time'].dtype)`

See [Troubleshooting](Troubleshooting) for more issues.

## Contributing

### How can I contribute?

See [Contributing Guide](https://nandkapadia.github.io/streamlit-lightweight-charts-pro/contributing.html) in the official docs.

### Can I add my example to the wiki?

Yes! Edit [User Examples](User-Examples) page or create a new page.

### How do I report bugs?

Open an issue on [GitHub Issues](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/issues) with:
- Description of the bug
- Minimal code to reproduce
- Expected vs actual behavior
- Environment details (Python version, OS, package version)

## Migration

### How do I migrate from v0.2.x to v0.3.0?

See [Migration Guides](Migration-Guides).

Key changes in v0.3.0:
- Lazy loading removed
- Package renamed: `lightweight-charts-core` → `lightweight-charts-pro`

## Still Have Questions?

- Check [Troubleshooting](Troubleshooting) page
- Search [Discussions](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/discussions)
- Ask in [GitHub Discussions](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/discussions)
- Open an [Issue](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/issues) for bugs
