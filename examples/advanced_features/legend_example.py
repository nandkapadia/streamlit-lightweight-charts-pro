"""Legend Example for streamlit-lightweight-charts-pro.

This example demonstrates how to use legends with different chart configurations,
including multi-pane charts with legends for each pane and custom HTML templates.
"""

import numpy as np
import pandas as pd
import streamlit as st
from lightweight_charts_pro.charts.options.layout_options import (
    LayoutOptions,
    PaneHeightOptions,
)
from lightweight_charts_pro.charts.options.ui_options import LegendOptions

from streamlit_lightweight_charts_pro import AreaSeries, Chart, ChartOptions, LineSeries
from streamlit_lightweight_charts_pro.data import AreaData, CandlestickData, HistogramData, LineData

# pylint: disable=no-member

# Page configuration
st.set_page_config(page_title="Legend Examples", page_icon="📊", layout="wide")

st.title("📊 Legend Examples for Multi-Pane Charts")
st.markdown(
    "This example demonstrates how to configure legends at the series level "
    "for multi-pane charts with custom styling.",
)


# Generate sample data
def generate_sample_data():
    """Generate sample data for demonstration."""
    dates = pd.date_range(start="2024-01-01", end="2024-01-31", freq="D")

    # Price data
    base_price = 100
    price_data = []
    rng = np.random.default_rng(42)
    for _i, date in enumerate(dates):
        # Simulate some price movement
        change = np.sin(_i * 0.1) * 5 + rng.normal(0, 2)
        base_price += change
        open_price = base_price
        high_price = base_price + abs(rng.normal(0, 3))
        low_price = base_price - abs(rng.normal(0, 3))
        close_price = base_price + rng.normal(0, 1)

        price_data.append(
            CandlestickData(
                time=date,
                open=open_price,
                high=high_price,
                low=low_price,
                close=close_price,
            ),
        )

    # Volume data
    volume_data = []
    for _i, date in enumerate(dates):
        volume = int(rng.uniform(1000, 10000))
        volume_data.append(HistogramData(time=date, value=volume))

    # Moving averages
    ma20_data = []
    ma50_data = []
    for _i, date in enumerate(dates):
        if _i >= 19:  # 20-day MA
            ma20 = sum([price_data[j].close for j in range(_i - 19, _i + 1)]) / 20
            ma20_data.append(LineData(time=date, value=ma20))

        if _i >= 49:  # 50-day MA
            ma50 = sum([price_data[j].close for j in range(_i - 49, _i + 1)]) / 50
            ma50_data.append(LineData(time=date, value=ma50))

    # RSI data
    rsi_data = []
    for _i, date in enumerate(dates):
        if _i >= 14:  # 14-day RSI
            gains = []
            losses = []
            for j in range(_i - 13, _i + 1):
                change = price_data[j].close - price_data[j - 1].close
                if change > 0:
                    gains.append(change)
                    losses.append(0)
                else:
                    gains.append(0)
                    losses.append(abs(change))

            avg_gain = sum(gains) / 14
            avg_loss = sum(losses) / 14

            if avg_loss == 0:
                rsi = 100
            else:
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))

            rsi_data.append(LineData(time=date, value=rsi))

    return price_data, volume_data, ma20_data, ma50_data, rsi_data


# Generate data
price_data, volume_data, ma20_data, ma50_data, rsi_data = generate_sample_data()

# Example 1: Basic Legend
st.header("1. Basic Legend Example")
st.markdown("Simple chart with a legend showing series information.")

# Create series objects
ma20_series = LineSeries(data=ma20_data)
ma50_series = LineSeries(data=ma50_data)

# Set titles
ma20_series.title = "20-Day MA"
ma50_series.title = "50-Day MA"

# Set line colors
ma20_series.line_options.set_color("#2196f3")
ma50_series.line_options.set_color("#ff9800")

basic_chart = Chart(
    options=ChartOptions(
        width=800,
        height=400,
    ),
    series=[ma20_series, ma50_series],
)

# Set legend for the first series
basic_chart.series[0].legend = LegendOptions(
    visible=True,
    position="top-right",
    background_color="rgba(255, 255, 255, 0.9)",
    border_color="#e1e3e6",
    border_width=1,
    border_radius=4,
    padding=5,
)

basic_chart.render(key="basic_legend")

st.code(
    """
# Basic Legend Configuration
ma20_series = LineSeries(data=ma20_data)
ma50_series = LineSeries(data=ma50_data)

# Set titles and colors
ma20_series.title = "20-Day MA"
ma50_series.title = "50-Day MA"
ma20_series.line_options.set_color("#2196f3")
ma50_series.line_options.set_color("#ff9800")

chart = Chart(
    options=ChartOptions(width=800, height=400),
    series=[ma20_series, ma50_series],
)

# Set legend on series
chart.series[0].legend = LegendOptions(
    visible=True,
    position="top-right",
    background_color="rgba(255, 255, 255, 0.9)",
    border_color="#e1e3e6",
    border_width=1,
    border_radius=4,
    padding=5,
)
""",
    language="python",
)

# Example 2: Multi-Pane Chart with Legends
st.header("2. Multi-Pane Chart with Legends")
st.markdown("Chart with multiple panes, each with its own legend.")

# Create series objects
price_series = LineSeries(data=price_data)
ma20_series_mp = LineSeries(data=ma20_data)
ma50_series_mp = LineSeries(data=ma50_data)
volume_series = LineSeries(data=volume_data)
rsi_series = LineSeries(data=rsi_data)

# Set titles
price_series.title = "Price"
ma20_series_mp.title = "20-Day MA"
ma50_series_mp.title = "50-Day MA"
volume_series.title = "Volume"
rsi_series.title = "RSI"

# Set colors
price_series.line_options.set_color("#333333")
ma20_series_mp.line_options.set_color("#2196f3")
ma50_series_mp.line_options.set_color("#ff9800")
volume_series.line_options.set_color("#4caf50")
rsi_series.line_options.set_color("#ff5722")

# Set pane IDs
volume_series.pane_id = 1
rsi_series.pane_id = 2

multi_pane_chart = Chart(
    options=ChartOptions(
        width=1000,
        height=600,
        layout=LayoutOptions(
            pane_heights={
                0: PaneHeightOptions(factor=3.0),  # Main chart
                1: PaneHeightOptions(factor=1.0),  # Volume
                2: PaneHeightOptions(factor=1.5),  # RSI
            },
        ),
    ),
    series=[price_series, ma20_series_mp, ma50_series_mp, volume_series, rsi_series],
)

# Set legends for each series
multi_pane_chart.series[1].legend = LegendOptions(
    visible=True,
    position="top-right",
    background_color="rgba(255, 255, 255, 0.95)",
    border_color="#cccccc",
    border_width=1,
    border_radius=6,
    padding=5,
    margin=8,
)

multi_pane_chart.series[3].legend = LegendOptions(
    visible=True,
    position="top-left",
    background_color="rgba(255, 255, 255, 0.9)",
    border_color="#4caf50",
    border_width=1,
    border_radius=4,
    padding=5,
    margin=4,
)

multi_pane_chart.series[4].legend = LegendOptions(
    visible=True,
    position="bottom-right",
    background_color="rgba(255, 255, 255, 0.9)",
    border_color="#ff9800",
    border_width=1,
    border_radius=4,
    padding=5,
    margin=4,
)

multi_pane_chart.render(key="multi_pane_legend")

st.code(
    """
# Multi-Pane Chart with Legends
price_series = LineSeries(data=price_data)
ma20_series = LineSeries(data=ma20_data)
ma50_series = LineSeries(data=ma50_data)
volume_series = LineSeries(data=volume_data)
rsi_series = LineSeries(data=rsi_data)

# Set titles and colors
price_series.title = "Price"
ma20_series.title = "20-Day MA"
ma50_series.title = "50-Day MA"
volume_series.title = "Volume"
rsi_series.title = "RSI"

# Set colors
price_series.line_options.set_color("#333333")
ma20_series.line_options.set_color("#2196f3")
ma50_series.line_options.set_color("#ff9800")
volume_series.line_options.set_color("#4caf50")
rsi_series.line_options.set_color("#ff5722")

# Set pane IDs
volume_series.pane_id = 1
rsi_series.pane_id = 2

chart = Chart(
    options=ChartOptions(
        layout=LayoutOptions(
            pane_heights={
                0: PaneHeightOptions(factor=3.0),  # Main chart
                1: PaneHeightOptions(factor=1.0),  # Volume
                2: PaneHeightOptions(factor=1.5),  # RSI
            }
        ),
    ),
    series=[price_series, ma20_series, ma50_series, volume_series, rsi_series],
)

# Set legends on series
chart.series[1].legend = LegendOptions(
    visible=True,
    position="top-right",
    background_color="rgba(255, 255, 255, 0.95)",
    border_color="#cccccc",
    border_width=1,
    border_radius=6,
    padding=5,
    margin=8,
)
""",
    language="python",
)

# Example 3: Custom HTML Templates
st.header("3. Custom HTML Templates")
st.markdown("Demonstrating custom HTML templates for legends with dynamic placeholders.")

# Create series objects
ma20_custom = LineSeries(data=ma20_data)
ma50_custom = LineSeries(data=ma50_data)

# Set titles and colors
ma20_custom.title = "20-Day MA"
ma50_custom.title = "50-Day MA"
ma20_custom.line_options.set_color("#2196f3")
ma50_custom.line_options.set_color("#ff9800")

custom_template_chart = Chart(
    options=ChartOptions(
        width=800,
        height=400,
    ),
    series=[ma20_custom, ma50_custom],
)

# Set custom legend for the first series
custom_template_chart.series[0].legend = LegendOptions(
    visible=True,
    position="top-right",
    background_color="rgba(255, 255, 255, 0.95)",
    border_color="#e1e3e6",
    border_width=1,
    border_radius=4,
    padding=5,
    text=(
        "<div style='display: flex; align-items: center; margin-bottom: 4px;'><span"
        " style='width: 12px; height: 2px; background-color: #2196f3; margin-right:"
        " 6px; display: inline-block;'></span><span style='font-weight: bold;'>20-Day"
        " MA</span><span style='margin-left: 8px; color: #2196f3; font-weight:"
        " bold;'>$$value$$</span></div>"
    ),
)

custom_template_chart.render(key="custom_template_legend")

st.code(
    """
# Custom HTML Template Example
ma20_series = LineSeries(data=ma20_data)
ma50_series = LineSeries(data=ma50_data)

# Set titles and colors
ma20_series.title = "20-Day MA"
ma50_series.title = "50-Day MA"
ma20_series.line_options.set_color("#2196f3")
ma50_series.line_options.set_color("#ff9800")

chart = Chart(
    options=ChartOptions(width=800, height=400),
    series=[ma20_series, ma50_series],
)

# Set custom legend
chart.series[0].legend = LegendOptions(
    visible=True,
    position="top-right",
    background_color="rgba(255, 255, 255, 0.95)",
    border_color="#e1e3e6",
    border_width=1,
    border_radius=4,
    padding=5,
    text="<div style='display: flex; align-items: center; margin-bottom: 4px;'>"
         "<span style='width: 12px; height: 2px; background-color: #2196f3; "
         "margin-right: 6px; display: inline-block;'></span>"
         "<span style='font-weight: bold;'>20-Day MA</span>"
         "<span style='margin-left: 8px; color: #2196f3; font-weight: bold;'>"
         "$$value$$</span></div>"
)
""",
    language="python",
)

# Example 4: Different Legend Positions
st.header("4. Legend Position Examples")
st.markdown("Demonstrating different legend positions.")

col1, col2 = st.columns(2)

with col1:
    st.subheader("Top-Left Position")

    # Create series objects
    ma20_tl = LineSeries(data=ma20_data)
    ma50_tl = LineSeries(data=ma50_data)

    # Set titles and colors
    ma20_tl.title = "MA20"
    ma50_tl.title = "MA50"
    ma20_tl.line_options.set_color("#2196f3")
    ma50_tl.line_options.set_color("#ff9800")

    top_left_chart = Chart(
        options=ChartOptions(
            width=400,
            height=300,
        ),
        series=[ma20_tl, ma50_tl],
    )

    # Set legend for top-left chart
    top_left_chart.series[0].legend = LegendOptions(
        visible=True,
        position="top-left",
        background_color="rgba(255, 255, 255, 0.9)",
        border_color="#e1e3e6",
        padding=5,
    )

    top_left_chart.render(key="top_left_legend")

with col2:
    st.subheader("Bottom-Right Position")

    # Create series objects
    ma20_br = LineSeries(data=ma20_data)
    ma50_br = LineSeries(data=ma50_data)

    # Set titles and colors
    ma20_br.title = "MA20"
    ma50_br.title = "MA50"
    ma20_br.line_options.set_color("#2196f3")
    ma50_br.line_options.set_color("#ff9800")

    bottom_right_chart = Chart(
        options=ChartOptions(
            width=400,
            height=300,
        ),
        series=[ma20_br, ma50_br],
    )

    # Set legend for bottom-right chart
    bottom_right_chart.series[0].legend = LegendOptions(
        visible=True,
        position="bottom-right",
        background_color="rgba(255, 255, 255, 0.9)",
        border_color="#e1e3e6",
        padding=5,
    )

    bottom_right_chart.render(key="bottom_right_legend")

st.code(
    """
# Different Legend Positions
ma20_series = LineSeries(data=ma20_data)
ma50_series = LineSeries(data=ma50_data)

# Set titles and colors
ma20_series.title = "MA20"
ma50_series.title = "MA50"
ma20_series.line_options.set_color("#2196f3")
ma50_series.line_options.set_color("#ff9800")

top_left_chart = Chart(
    options=ChartOptions(width=400, height=300),
    series=[ma20_series, ma50_series],
)

# Set legend
top_left_chart.series[0].legend = LegendOptions(
    visible=True,
    position="top-left",
    background_color="rgba(255, 255, 255, 0.9)",
    border_color="#e1e3e6",
    padding=5,
)
""",
    language="python",
)

# Example 5: Area Chart with Legend
st.header("5. Area Chart with Legend")
st.markdown("Area chart with custom legend styling.")

area_data = [
    AreaData(
        time=date.time,
        value=date.value,
    )
    for date in ma20_data
]

# Create area series
area_series = AreaSeries(data=area_data)
area_series.title = "Price Area"

area_chart = Chart(
    options=ChartOptions(
        width=800,
        height=400,
    ),
    series=[area_series],
)

# Set legend for area chart
area_chart.series[0].legend = LegendOptions(
    visible=True,
    position="top-right",
    background_color="rgba(255, 255, 255, 0.9)",
    border_color="#e1e3e6",
    border_width=1,
    border_radius=4,
    padding=5,
    text=(
        "<div style='display: flex; align-items: center;'><span style='width: 8px;"
        " height: 8px; background-color: #ff5722; margin-right: 4px; border-radius:"
        " 2px;'></span><span>Price Area</span><span style='margin-left: 6px; color:"
        " #ff5722;'>$$value$$</span></div>"
    ),
)

area_chart.render(key="area_legend")

st.code(
    """
# Area Chart with Legend
area_data = [
    AreaData(
        time=date.time,
        value=date.value,
        topColor="rgba(33, 150, 243, 0.3)",
        bottomColor="rgba(33, 150, 243, 0.1)"
    ) for date in ma20_data
]

area_series = AreaSeries(data=area_data)
area_series.title = "Price Area"

chart = Chart(
    options=ChartOptions(width=800, height=400),
    series=[area_series],
)

# Set legend
chart.series[0].legend = LegendOptions(
    visible=True,
    position="top-right",
    background_color="rgba(255, 255, 255, 0.9)",
    border_color="#e1e3e6",
    border_width=1,
    border_radius=4,
    padding=5,
    text="<div style='display: flex; align-items: center;'>"
         "<span style='width: 8px; height: 8px; background-color: #ff5722; "
         "margin-right: 4px; border-radius: 2px;'></span>"
         "<span>Price Area</span>"
         "<span style='margin-left: 6px; color: #ff5722;'>$$value$$</span></div>"
)
""",
    language="python",
)

# Example 6: Legend Configuration Options
st.header("6. Legend Configuration Options")
st.markdown(
    """
### Available Legend Options:

- **visible**: Show/hide the legend (default: true)
- **position**: Legend position - 'top-left', 'top-right', 'bottom-left',
  'bottom-right' (default: 'top-right')
- **background_color**: Background color (default: 'rgba(255, 255, 255, 0.9)')
- **border_color**: Border color (default: '#e1e3e6')
- **border_width**: Border width in pixels (default: 1)
- **border_radius**: Border radius in pixels (default: 4)
- **padding**: Internal padding in pixels (default: 5)
- **margin**: External margin in pixels (default: 4)
- **z_index**: CSS z-index (default: 1000)
- **text**: Custom HTML template with placeholders (default: "")

### Available Template Placeholders:

- **$$value$$**: Current value of the series at crosshair position

Note: Title and color should be handled directly in your HTML template using
the series title and color from your series configuration. This avoids
conflicts with Python's f-string syntax and other templating systems.
""",
)

# Example 7: Interactive legend configuration
st.header("7. Interactive Legend Configuration")
st.markdown("Try different legend settings:")

col1, col2 = st.columns(2)

with col1:
    legend_position = st.selectbox(
        "Legend Position",
        ["top-left", "top-right", "bottom-left", "bottom-right"],
        index=1,
    )

    legend_padding = st.slider("Padding", 2, 15, 5)

with col2:
    legend_background = st.color_picker("Background Color", "#ffffff")
    legend_border = st.color_picker("Border Color", "#e1e3e6")

# Create series objects for interactive chart
ma20_interactive = LineSeries(data=ma20_data)
ma50_interactive = LineSeries(data=ma50_data)

# Set titles and colors
ma20_interactive.title = "20-Day MA"
ma50_interactive.title = "50-Day MA"
ma20_interactive.line_options.set_color("#2196f3")
ma50_interactive.line_options.set_color("#ff9800")

# Create interactive chart
interactive_chart = Chart(
    options=ChartOptions(
        width=800,
        height=400,
    ),
    series=[ma20_interactive, ma50_interactive],
)

# Set interactive legend based on user selections
interactive_chart.series[0].legend = LegendOptions(
    visible=True,
    position=legend_position,
    background_color=(
        f"rgba({int(legend_background[1:3], 16)}, "
        f"{int(legend_background[3:5], 16)}, "
        f"{int(legend_background[5:7], 16)}, 0.9)"
    ),
    border_color=legend_border,
    border_width=1,
    border_radius=4,
    padding=legend_padding,
    margin=4,
)

interactive_chart.render(key="interactive_legend")

st.code(
    """
# Interactive Legend Configuration
legend_position = st.selectbox(
    "Legend Position",
    ["top-left", "top-right", "bottom-left", "bottom-right"]
)
legend_padding = st.slider("Padding", 2, 15, 5)
legend_background = st.color_picker("Background Color", "#ffffff")
legend_border = st.color_picker("Border Color", "#e1e3e6")

ma20_series = LineSeries(data=ma20_data)
ma50_series = LineSeries(data=ma50_data)

# Set titles and colors
ma20_series.title = "20-Day MA"
ma50_series.title = "50-Day MA"
ma20_series.line_options.set_color("#2196f3")
ma50_series.line_options.set_color("#ff9800")

chart = Chart(
    options=ChartOptions(width=800, height=400),
    series=[ma20_series, ma50_series],
)

# Set interactive legend
chart.series[0].legend = LegendOptions(
    visible=True,
    position=legend_position,
    background_color=f"rgba(255, 255, 255, 0.9)",
    border_color=legend_border,
    border_width=1,
    border_radius=4,
    padding=legend_padding,
    margin=4,
)
""",
    language="python",
)
