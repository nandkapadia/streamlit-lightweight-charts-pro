"""
Dynamic Legend Values Example for streamlit-lightweight-charts.

This example demonstrates the enhanced legend functionality that allows users
to display and dynamically update values in the legend based on crosshair position.
"""
# pylint: disable=no-member

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import CandlestickSeries, Chart, LineSeries, HistogramSeries
from streamlit_lightweight_charts_pro.charts.options import ChartOptions, LayoutOptions, PaneHeightOptions
from streamlit_lightweight_charts_pro.charts.options.ui_options import LegendOptions
from streamlit_lightweight_charts_pro.data import CandlestickData, LineData, HistogramData

# Page configuration
st.set_page_config(page_title="Dynamic Legend Values", page_icon="📊", layout="wide")

st.title("📊 Dynamic Legend Values Example")
st.markdown(
    """
This example demonstrates the enhanced legend functionality that allows you to:
- **Display current values** in the legend that update as you move the crosshair
- **Control value formatting** (number of decimal places)
- **Enable/disable dynamic updates** based on crosshair position
- **Combine with custom templates** for advanced styling
"""
)


# Generate sample data
@st.cache_data
def generate_sample_data():
    """Generate sample data for demonstration."""
    dates = pd.date_range(start="2024-01-01", periods=100, freq="D")

    # Price data with some volatility
    prices = []
    volume_data = []
    base_price = 100
    for i, date in enumerate(dates):
        price_change = np.sin(i * 0.1) * 5 + np.random.normal(0, 2)
        base_price += price_change
        open_price = base_price
        high_price = base_price + abs(np.random.normal(0, 3))
        low_price = base_price - abs(np.random.normal(0, 3))
        close_price = base_price + np.random.normal(0, 1)

        # Generate volume data (higher volume on bigger price changes)
        volume = abs(np.random.normal(1000000, 300000)) + abs(price_change) * 50000

        prices.append(
            CandlestickData(
                time=date.strftime("%Y-%m-%d"),
                open=round(open_price, 2),
                high=round(high_price, 2),
                low=round(low_price, 2),
                close=round(close_price, 2),
            )
        )

        volume_data.append(
            HistogramData(
                time=date.strftime("%Y-%m-%d"),
                value=round(volume, 0),
                color="rgba(76, 175, 80, 0.5)" if close_price >= open_price else "rgba(255, 82, 82, 0.5)"
            )
        )

    # Moving averages
    ma20_data = []
    ma50_data = []
    for i, date in enumerate(dates):
        if i >= 19:  # 20-day MA
            ma20 = sum([prices[j].close for j in range(i - 19, i + 1)]) / 20
            ma20_data.append(LineData(time=date.strftime("%Y-%m-%d"), value=round(ma20, 3)))

        if i >= 49:  # 50-day MA
            ma50 = sum([prices[j].close for j in range(i - 49, i + 1)]) / 50
            ma50_data.append(LineData(time=date.strftime("%Y-%m-%d"), value=round(ma50, 3)))

    return prices, ma20_data, ma50_data, volume_data


# Generate data
prices, ma20_data, ma50_data, volume_data = generate_sample_data()

# Example 1: Basic Dynamic Legend
st.header("1. Basic Dynamic Legend")
st.markdown(
    "Simple legend with dynamic values enabled by default. Move your mouse over the chart to see"
    " values update!"
)

basic_chart = Chart(
    options=ChartOptions(
        width=800,
        height=400,
    ),
    series=[
        CandlestickSeries(data=prices)
        .set_title("Stock Price")
        .set_legend(LegendOptions(
            visible=True,
            position="top-right",
            text="📈 OHLC: O:$$open$$ H:$$high$$ L:$$low$$ C:$$close$$",
            value_format=".2f",  # 2 decimal places (default)
            background_color="rgba(0, 0, 0, 0.8)",
            border_color="#e1e3e6",
            border_width=1,
            padding=8,
        )),
        LineSeries(data=ma20_data)
        .set_title("20-Day MA")
        .set_legend(LegendOptions(
            visible=True,
            position="top-right",
            text="📊 20-Day MA: $$value$$",
            value_format=".2f",
            background_color="rgba(0, 0, 0, 0.8)",
            border_color="#e1e3e6",
            border_width=1,
            padding=8,
        )),
        LineSeries(data=ma50_data)
        .set_title("50-Day MA")
        .set_legend(LegendOptions(
            visible=True,
            position="top-right",
            text="📉 50-Day MA: $$value$$",
            value_format=".2f",
            background_color="rgba(0, 0, 0, 0.8)",
            border_color="#e1e3e6",
            border_width=1,
            padding=8,
        )),
    ],
)

basic_chart.render(key="basic_dynamic_legend")

with st.expander("💻 Code for Basic Dynamic Legend"):
    st.code(
        """
# Basic dynamic legend - values update automatically as you move the crosshair!
legend_options = LegendOptions(
    visible=True,
    position="top-right",
    text="Value: $$value$$",  # Template with dynamic value placeholder
    value_format=".2f",      # Format to 2 decimal places
)

chart = Chart(
    options=ChartOptions(legends={0: legend_options}),
    series=[
        CandlestickSeries(data=prices).set_title("Stock Price"),
        LineSeries(data=ma20_data).set_title("20-Day MA"),
        LineSeries(data=ma50_data).set_title("50-Day MA"),
    ]
)
""",
        language="python",
    )

# Example 2: Customized Value Formatting
st.header("2. Custom Value Formatting")
st.markdown("Different decimal places and positioning options.")

col1, col2 = st.columns(2)

with col1:
    st.subheader("High Precision (4 decimals)")
    precise_chart = Chart(
        options=ChartOptions(
            width=400,
            height=300,
        ),
        series=[LineSeries(data=ma20_data)
                .set_title("Precise MA20")
                .set_legend(LegendOptions(
                    visible=True,
                    position="top-left",
                    text="🎯 Precise MA20: $$value$$",
                    value_format=".4f",  # 4 decimal places
                    background_color="rgba(0, 0, 0, 0.8)",
                    border_color="#4CAF50",
                    border_width=2,
                    padding=6,
                ))],
    )
    precise_chart.render(key="precise_legend")

with col2:
    st.subheader("Integer Values (0 decimals)")
    integer_chart = Chart(
        options=ChartOptions(
            width=400,
            height=300,
        ),
        series=[LineSeries(data=ma50_data)
                .set_title("Rounded MA50")
                .set_legend(LegendOptions(
                    visible=True,
                    position="bottom-right",
                    text="🔢 Rounded MA50: $$value$$",
                    value_format=".0f",  # No decimal places
                    background_color="rgba(0, 0, 0, 0.8)",
                    border_color="#FF9800",
                    border_width=2,
                    padding=6,
                ))],
    )
    integer_chart.render(key="integer_legend")

# Example 3: Interactive Configuration
st.header("3. Interactive Legend Configuration")
st.markdown("Try different settings and see how they affect the legend behavior.")

col1, col2, col3 = st.columns(3)

with col1:
    legend_template = st.text_input("Legend Template", value="📊 Price: $$value$$", help="Use $$value$$ for dynamic values")
    show_legend = st.checkbox("Show Legend", value=True, help="Display the legend")

with col2:
    position = st.selectbox(
        "Position", ["top-left", "top-right", "bottom-left", "bottom-right"], index=1
    )
    decimal_places = st.slider("Decimal Places", 0, 4, 2, help="Number of decimal places to show")

with col3:
    bg_opacity = st.slider("Background Opacity", 0.5, 1.0, 0.95, 0.05)
    border_color = st.color_picker("Border Color", "#e1e3e6")

# Create interactive chart
interactive_chart = Chart(
    options=ChartOptions(
        width=800,
        height=400,
    ),
    series=[
        CandlestickSeries(data=prices)
        .set_title("Interactive Price")
        .set_legend(LegendOptions(
            visible=show_legend,
            position=position,
            text=legend_template,
            value_format=f".{decimal_places}f",
            background_color=f"rgba(0, 0, 0, {bg_opacity})",
            border_color=border_color,
            border_width=1,
            padding=8,
        )),
        LineSeries(data=ma20_data)
        .set_title("MA20")
        .set_legend(LegendOptions(
            visible=show_legend,
            position=position,
            text="📈 MA20: $$value$$",
            value_format=f".{decimal_places}f",
            background_color=f"rgba(0, 0, 0, {bg_opacity})",
            border_color=border_color,
            border_width=1,
            padding=8,
        )),
    ],
)

interactive_chart.render(key="interactive_legend")

# Example 4: Custom Template with Dynamic Values
st.header("4. Custom Template with Dynamic Values")
st.markdown("Combine custom HTML templates with dynamic value options for maximum flexibility.")

template_chart = Chart(
    options=ChartOptions(
        width=800,
        height=400,
    ),
    series=[
        CandlestickSeries(data=prices)
        .set_title("Styled Price")
        .set_legend(LegendOptions(
            visible=True,
            position="top-right",
            value_format=".3f",
            text="""
            <div style='padding: 8px; font-family: "Consolas", monospace; background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(50,50,50,0.9)); color: white; border-radius: 8px; border: 1px solid #2196f3; box-shadow: 0 4px 8px rgba(0,0,0,0.2);'>
                <div style='display: flex; align-items: center; margin-bottom: 6px;'>
                    <div style='width: 16px; height: 3px; background: #2196f3; margin-right: 8px; border-radius: 2px;'></div>
                    <span style='font-weight: bold; font-size: 14px; color: #2196f3;'>Stock Price</span>
                </div>
                <div style='font-size: 12px; color: #ccc; margin-left: 24px;'>
                    💰 Value: <span style='color: #2196f3; font-weight: bold;'>$$value$$</span>
                </div>
            </div>
            """,
        )),
        LineSeries(data=ma20_data)
        .set_title("Styled MA20")
        .set_legend(LegendOptions(
            visible=True,
            position="top-right",
            value_format=".3f",
            text="""
            <div style='padding: 8px; font-family: "Consolas", monospace; background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(50,50,50,0.9)); color: white; border-radius: 8px; border: 1px solid #2196f3; box-shadow: 0 4px 8px rgba(0,0,0,0.2);'>
                <div style='display: flex; align-items: center; margin-bottom: 6px;'>
                    <div style='width: 16px; height: 3px; background: #2196f3; margin-right: 8px; border-radius: 2px;'></div>
                    <span style='font-weight: bold; font-size: 14px; color: #2196f3;'>MA20</span>
                </div>
                <div style='font-size: 12px; color: #ccc; margin-left: 24px;'>
                    💰 Value: <span style='color: #2196f3; font-weight: bold;'>$$value$$</span>
                </div>
            </div>
            """,
        )),
    ],
)

template_chart.render(key="template_legend")

with st.expander("💻 Code for Custom Template"):
    st.code(
        """
# Custom template with dynamic values
legend_options = LegendOptions(
    visible=True,
    position="top-right",
    value_format=".3f",
    text='''
    <div style='padding: 8px; background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(50,50,50,0.9));
                color: white; border-radius: 8px; border: 1px solid #2196f3;'>
        <div style='display: flex; align-items: center;'>
            <div style='width: 16px; height: 3px; background: #2196f3; margin-right: 8px;'></div>
            <span style='font-weight: bold; color: #2196f3;'>Stock Price</span>
        </div>
        <div style='margin-left: 24px;'>
            💰 Value: <span style='color: #2196f3;'>$$value$$</span>
        </div>
    </div>
    '''
)
""",
        language="python",
    )

# Example 5: Advanced Placeholder System
st.header("5. Advanced Placeholder System")
st.markdown("Demonstrate different placeholder types for different series data structures.")

col1, col2 = st.columns(2)

with col1:
    st.subheader("OHLC Placeholders")
    st.markdown("Use specific OHLC placeholders for candlestick data")

    ohlc_chart = Chart(
        options=ChartOptions(
            width=400,
            height=300,
        ),
        series=[CandlestickSeries(data=prices)
                .set_title("Detailed OHLC")
                .set_legend(LegendOptions(
                    visible=True,
                    position="top-left",
                    text="""
                    <div style='font-family: monospace; background: rgba(0,0,0,0.8); color: white; padding: 6px; border-radius: 4px;'>
                        <div>📈 <strong>Stock Price</strong></div>
                        <div>Open: $$open$$</div>
                        <div>High: $$high$$</div>
                        <div>Low: $$low$$</div>
                        <div>Close: $$close$$</div>
                    </div>
                    """,
                    value_format=".2f",
                ))],
    )
    ohlc_chart.render(key="ohlc_placeholders")

with col2:
    st.subheader("Smart $$value$$ Fallback")
    st.markdown("$$value$$ automatically picks the best value for each series type")

    smart_chart = Chart(
        options=ChartOptions(
            width=400,
            height=300,
        ),
        series=[
            CandlestickSeries(data=prices)
            .set_title("Smart Candlestick")
            .set_legend(LegendOptions(
                visible=True,
                position="top-right",
                text="📊 Candlestick: $$value$$ (auto=close)",
                value_format=".2f",
                background_color="rgba(0, 0, 0, 0.8)",
                border_color="#4CAF50",
                border_width=2,
                padding=6,
            )),
            LineSeries(data=ma20_data)
            .set_title("Smart Line")
            .set_legend(LegendOptions(
                visible=True,
                position="top-right",
                text="📈 Line: $$value$$ (auto=value)",
                value_format=".2f",
                background_color="rgba(0, 0, 0, 0.8)",
                border_color="#2196F3",
                border_width=2,
                padding=6,
            )),
        ],
    )
    smart_chart.render(key="smart_fallback")

# Example 6: Static vs Dynamic Comparison
st.header("6. Static vs Dynamic Comparison")
st.markdown("Compare static legends (no crosshair updates) with dynamic legends.")

col1, col2 = st.columns(2)

with col1:
    st.subheader("Static Legend")
    st.markdown("Values don't change as you move the crosshair")

    static_chart = Chart(
        options=ChartOptions(
            width=400,
            height=300,
        ),
        series=[LineSeries(data=ma20_data)
                .set_title("Static MA20")
                .set_legend(LegendOptions(
                    visible=True,
                    position="top-right",
                    text="📊 Static MA20: Fixed Value",  # Static text, no $$value$$
                    background_color="rgba(0, 0, 0, 0.8)",
                    border_color="#f44336",
                    border_width=2,
                ))],
    )
    static_chart.render(key="static_legend")

with col2:
    st.subheader("Dynamic Legend")
    st.markdown("Values update as you move the crosshair")

    dynamic_chart = Chart(
        options=ChartOptions(
            width=400,
            height=300,
        ),
        series=[LineSeries(data=ma20_data)
                .set_title("Dynamic MA20")
                .set_legend(LegendOptions(
                    visible=True,
                    position="top-right",
                    text="📈 Dynamic MA20: $$value$$",  # Dynamic text with $$value$$
                    value_format=".2f",
                    background_color="rgba(0, 0, 0, 0.8)",
                    border_color="#4CAF50",
                    border_width=2,
                ))],
    )
    dynamic_chart.render(key="dynamic_legend")

# Example 7: Multi-Pane Chart with Dynamic Legends
st.header("7. Multi-Pane Chart with Dynamic Legends")
st.markdown("Test dynamic legends across multiple panes - price data in main pane and volume in secondary pane.")

multi_pane_chart = Chart(
    options=ChartOptions(
        width=800,
        height=600,
    ),
    series=[
        # Main pane (pane 0) - Price data with OHLC and moving averages
        CandlestickSeries(data=prices)
        .set_title("Stock Price")
        .set_legend(LegendOptions(
            visible=True,
            position="top-left",
            text="📈 OHLC: O:$$open$$ H:$$high$$ L:$$low$$ C:$$close$$",
            value_format=".2f",
            background_color="rgba(0, 0, 0, 0.8)",
            border_color="#2196F3",
            border_width=2,
            padding=8,
        )),
        LineSeries(data=ma20_data)
        .set_title("20-Day MA")
        .set_legend(LegendOptions(
            visible=True,
            position="top-left",
            text="📊 20-Day MA: $$value$$",
            value_format=".2f",
            background_color="rgba(0, 0, 0, 0.8)",
            border_color="#FF9800",
            border_width=2,
            padding=8,
        )),
        LineSeries(data=ma50_data)
        .set_title("50-Day MA")
        .set_legend(LegendOptions(
            visible=True,
            position="top-left",
            text="📉 50-Day MA: $$value$$",
            value_format=".2f",
            background_color="rgba(0, 0, 0, 0.8)",
            border_color="#4CAF50",
            border_width=2,
            padding=8,
        )),
        # Secondary pane (pane 1) - Volume data
        HistogramSeries(data=volume_data, pane_id=1)
        .set_title("Volume")
        .set_legend(LegendOptions(
            visible=True,
            position="top-right",
            text="📊 Volume: $$value$$",
            value_format=".0f",  # No decimals for volume
            background_color="rgba(0, 0, 0, 0.8)",
            border_color="#9C27B0",
            border_width=2,
            padding=8,
        )),
    ],
)

multi_pane_chart.render(key="multi_pane_legend")

st.markdown(
    """
**Multi-Pane Legend Features:**
- **Pane 0 (Price)**: OHLC legend with individual placeholder values ($$open$$, $$high$$, $$low$$, $$close$$)
- **Pane 0 (Price)**: Two moving average legends with $$value$$ placeholders
- **Pane 1 (Volume)**: Volume legend with integer formatting (no decimals)
- **Cross-Pane Sync**: All legends update simultaneously as you move the crosshair
- **Independent Positioning**: Each pane can have legends positioned independently
"""
)

with st.expander("💻 Code for Multi-Pane Chart"):
    st.code(
        """
# Multi-pane chart with legends in different panes
multi_pane_chart = Chart(
    series=[
        # Main pane (pane 0) - Price data
        CandlestickSeries(data=prices)
        .set_legend(LegendOptions(
            text="📈 OHLC: O:$$open$$ H:$$high$$ L:$$low$$ C:$$close$$",
            position="top-left"
        )),
        LineSeries(data=ma20_data)
        .set_legend(LegendOptions(
            text="📊 20-Day MA: $$value$$",
            position="top-left"
        )),

        # Secondary pane (pane 1) - Volume data
        HistogramSeries(data=volume_data, pane_id=1)  # Creates new pane
        .set_legend(LegendOptions(
            text="📊 Volume: $$value$$",
            value_format=".0f",  # Integer format for volume
            position="top-right"
        )),
    ]
)
""",
        language="python",
    )

# Summary
st.header("📋 Summary")
st.markdown(
    """
### Dynamic Legend Implementation

Dynamic legends use text templates with `$$value$$` placeholders that automatically update with crosshair movement:

- **`text`** (str): The legend text template. Use `$$value$$` where you want dynamic values to appear
- **`value_format`** (str, default: ".2f"): Controls number formatting (e.g., ".0f", ".3f", ".4f")

### Usage Examples

```python
# Simple dynamic legend
LegendOptions(text="Price: $$value$$", value_format=".2f")

# High precision values
LegendOptions(text="Precise Value: $$value$$", value_format=".4f")

# Custom styled template
LegendOptions(
    text="<span style='color: blue;'>📊 Value: $$value$$</span>",
    value_format=".2f"
)

# Static legend (no dynamic values)
LegendOptions(text="Fixed Legend Text")

# Complex HTML template
LegendOptions(
    text='''
    <div style="padding: 8px; background: rgba(0,0,0,0.9); color: white;">
        <div>💰 Current Value</div>
        <div style="font-weight: bold;">$$value$$</div>
    </div>
    ''',
    value_format=".3f"
)
```

### How It Works

The `$$value$$` placeholder in your text template gets replaced with the current series value at the crosshair position, formatted according to your `value_format` specification.
"""
)

st.success(
    "🎉 Try moving your mouse over the charts above to see the dynamic legend values in action!"
)
