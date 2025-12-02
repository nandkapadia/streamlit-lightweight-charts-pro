"""Comprehensive Price Scale Examples.

This example demonstrates the new price scale auto-creation feature:
1. Auto-creation of price scales (aligns with TradingView's official API)
2. PriceScaleConfig builder utilities for advanced use cases
3. Series-based architecture (clean and simple)

These improvements reduce boilerplate code by 66%+ and align with TradingView's
official API behavior where price scales are auto-created on-demand.

The series-based approach is clean: each series declares which pane it belongs to.
"""

import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import (
    CandlestickSeries,
    Chart,
    HistogramSeries,
    LineSeries,
    PriceScaleConfig,
)

# Page configuration
st.set_page_config(page_title="Price Scale Examples", layout="wide")
st.title("🎯 Comprehensive Price Scale Examples")

st.markdown(
    """
This example demonstrates the **new price scale auto-creation** feature in v0.1.9:

### Key Improvements
1. ⭐ **Auto-Creation** - Price scales auto-created like TradingView's official API
2. 🛠️ **PriceScaleConfig** - Builder patterns for advanced configurations
3. 🎯 **Series-Based** - Clean architecture where series declare their pane
4. ✅ **66% Less Code** - Reduced boilerplate for multi-pane charts

---
"""
)


# Generate sample data
@st.cache_data
def generate_sample_data():
    """Generate sample OHLCV data for demonstration."""
    dates = pd.date_range("2024-01-01", periods=100, freq="D")
    price_dataframe = pd.DataFrame(
        {
            "time": dates,
            "open": 100
            + pd.Series(range(100)).cumsum() * 0.5
            + pd.Series(range(100)).apply(lambda x: (-1) ** x * 2),
            "high": 102
            + pd.Series(range(100)).cumsum() * 0.5
            + pd.Series(range(100)).apply(lambda x: (-1) ** x * 3),
            "low": 98
            + pd.Series(range(100)).cumsum() * 0.5
            + pd.Series(range(100)).apply(lambda x: (-1) ** x * 1),
            "close": 101
            + pd.Series(range(100)).cumsum() * 0.5
            + pd.Series(range(100)).apply(lambda x: (-1) ** x * 2),
            "volume": [1000000 + i * 10000 for i in range(100)],
        }
    )

    # RSI indicator (0-100 range)
    price_dataframe["rsi"] = 50 + 20 * pd.Series([(-1) ** i for i in range(100)])

    # MACD indicator
    price_dataframe["macd"] = pd.Series(range(100)).apply(lambda x: 5 * (x % 20 - 10))
    price_dataframe["macd_signal"] = price_dataframe["macd"].rolling(9, min_periods=1).mean()

    return price_dataframe


market_data = generate_sample_data()

# Example 1: Auto-Creation (Simplest - Aligns with TradingView API)
st.header("1️⃣ Auto-Creation (Recommended)")
st.markdown(
    """
**Before (v0.1.7 - Manual Pre-Registration):**
```python
# 14 lines of boilerplate
chart = Chart()
volume_scale = PriceScaleOptions(visible=True, auto_scale=True, ...)
chart.add_overlay_price_scale("volume", volume_scale)
rsi_scale = PriceScaleOptions(visible=True, auto_scale=True, ...)
chart.add_overlay_price_scale("rsi", rsi_scale)
price_series = CandlestickSeries(data=price_data, pane_id=0, price_scale_id="right")
volume_series = HistogramSeries(data=volume_data, pane_id=1, price_scale_id="volume")
rsi_series = LineSeries(data=rsi_data, pane_id=2, price_scale_id="rsi")
chart.add_series(price_series)
chart.add_series(volume_series)
chart.add_series(rsi_series)
```

**After (v0.1.9 - Auto-Creation):**
```python
# 5 lines - 66% reduction!
chart = Chart()
chart.add_series(CandlestickSeries(data=price_data, pane_id=0))
chart.add_series(HistogramSeries(data=volume_data, pane_id=1, price_scale_id="volume"))
chart.add_series(LineSeries(data=rsi_data, pane_id=2, price_scale_id="rsi"))
```

Price scales are **auto-created with smart defaults** based on context (overlay vs separate pane).
This matches TradingView's official API behavior!
"""
)

chart1 = Chart()

# Price series (pane 0, uses built-in 'right' scale)
chart1.add_series(
    CandlestickSeries(
        data=market_data,
        column_mapping={
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
        },
        pane_id=0,
    )
)

# Volume series (pane 1, auto-creates 'volume' scale with visible=True)
chart1.add_series(
    HistogramSeries(
        data=market_data,
        column_mapping={"time": "time", "value": "volume"},
        pane_id=1,
        price_scale_id="volume",
        up_color="#26a69a",
        down_color="#ef5350",
    )
)

# RSI series (pane 2, auto-creates 'rsi' scale with visible=True)
chart1.add_series(
    LineSeries(
        data=market_data,
        column_mapping={"time": "time", "value": "rsi"},
        pane_id=2,
        price_scale_id="rsi",
        line_options={"color": "#2962FF", "lineWidth": 2},
    )
)

chart1.render(key="auto_creation_chart")

# Example 2: PriceScaleConfig Builder Utilities
st.header("2️⃣ PriceScaleConfig Builder Utilities (Advanced)")
st.markdown(
    """
Use `PriceScaleConfig` factory methods for advanced price scale configurations:

```python
from streamlit_lightweight_charts_pro import PriceScaleConfig

# RSI indicator (0-100 range)
rsi_config = PriceScaleConfig.for_indicator("rsi", min_value=0, max_value=100)
chart.add_overlay_price_scale("rsi", rsi_config)

# Volume overlay (hidden axis, large top margin)
volume_config = PriceScaleConfig.for_volume(as_overlay=True)
chart.add_overlay_price_scale("volume", volume_config)

# Percentage-based series
pct_config = PriceScaleConfig.for_percentage("pct_change")
chart.add_overlay_price_scale("pct_change", pct_config)
```

Available builders:
- `for_overlay()` - Hidden axis, large top margin
- `for_separate_pane()` - Visible axis, balanced margins
- `for_volume()` - Volume-specific configuration
- `for_indicator()` - Bounded indicators (RSI, Stochastic)
- `for_percentage()` - Percentage mode
- `for_logarithmic()` - Logarithmic scale
"""
)

chart3 = Chart()

# Price series
chart3.add_series(
    CandlestickSeries(
        data=market_data,
        column_mapping={
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
        },
        pane_id=0,
    )
)

# Volume pane with builder config
volume_config = PriceScaleConfig.for_separate_pane("volume")
chart3.add_overlay_price_scale("volume", volume_config)
chart3.add_series(
    HistogramSeries(
        data=market_data,
        column_mapping={"time": "time", "value": "volume"},
        pane_id=1,
        price_scale_id="volume",
        up_color="#26a69a",
        down_color="#ef5350",
    )
)

# RSI with indicator config (bounded 0-100)
rsi_config = PriceScaleConfig.for_indicator("rsi", min_value=0, max_value=100)
chart3.add_overlay_price_scale("rsi", rsi_config)
chart3.add_series(
    LineSeries(
        data=market_data,
        column_mapping={"time": "time", "value": "rsi"},
        pane_id=2,
        price_scale_id="rsi",
        line_options={"color": "#2962FF", "lineWidth": 2},
    )
)

chart3.render(key="builder_config_chart")

# Example 3: Multi-Series in Same Pane
st.header("3️⃣ Multi-Series in Same Pane (MACD Example)")
st.markdown(
    """
Multiple series can share the same pane and price scale. Each series declares its pane and scale:

```python
# Both series use same pane_id and price_scale_id
macd_line = LineSeries(data=df, pane_id=2, price_scale_id="macd", ...)
macd_signal = LineSeries(data=df, pane_id=2, price_scale_id="macd", ...)
chart.add_series(macd_line)
chart.add_series(macd_signal)
```

The "macd" price scale is auto-created when the first series references it.
"""
)

chart4 = Chart()

# Price series
chart4.add_series(
    CandlestickSeries(
        data=market_data,
        column_mapping={
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
        },
        pane_id=0,
    )
)

# Volume series
chart4.add_series(
    HistogramSeries(
        data=market_data,
        column_mapping={"time": "time", "value": "volume"},
        pane_id=1,
        price_scale_id="volume",
        up_color="#26a69a",
        down_color="#ef5350",
    )
)

# MACD pane with two series sharing same scale
chart4.add_series(
    LineSeries(
        data=market_data,
        column_mapping={"time": "time", "value": "macd"},
        pane_id=2,
        price_scale_id="macd",
        line_options={"color": "#2962FF", "lineWidth": 2},
    )
)

chart4.add_series(
    LineSeries(
        data=market_data,
        column_mapping={"time": "time", "value": "macd_signal"},
        pane_id=2,
        price_scale_id="macd",
        line_options={"color": "#FF6D00", "lineWidth": 2},
    )
)

chart4.render(key="multi_series_chart")

# Summary
st.header("📊 Summary")
st.markdown(
    """
### Code Reduction Metrics

| Feature | Before (v0.1.7) | After (v0.1.9) | Reduction |
|---------|-----------------|----------------|-----------|
| **3-Pane Chart** | 14 lines | 5 lines | **66%** |
| **Price Scale Setup** | Manual pre-registration | Auto-created | **3x simpler** |
| **TradingView Alignment** | Custom API | Official API behavior | **100% aligned** |

### Key Takeaways

1. ⭐ **Use Auto-Creation** - Let the library handle price scale creation automatically
2. 🎯 **Series-Based Architecture** - Each series declares its pane_id and price_scale_id
3. 🛠️ **PriceScaleConfig** - Use builder methods for advanced configurations
4. ✅ **Backwards Compatible** - All existing code continues to work

### Best Practices

- **For simple charts**: Use auto-creation (just add series with price_scale_id)
- **For multi-pane layouts**: Each series declares its pane_id (clean and direct)
- **For advanced configs**: Use `PriceScaleConfig` builder methods
- **For manual control**: Still supported via `add_overlay_price_scale()`
"""
)
