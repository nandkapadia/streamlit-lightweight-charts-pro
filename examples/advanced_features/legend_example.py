"""
Legend Example for streamlit-lightweight-charts.

This example demonstrates how to use legends with different chart configurations,
including multi-pane charts with legends for each pane and custom HTML templates.
"""

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import (
    AreaSeries,
    Chart,
    ChartOptions,
    LineSeries,
)
from streamlit_lightweight_charts_pro.charts.options.layout_options import (
    LayoutOptions,
    PaneHeightOptions,
)
from streamlit_lightweight_charts_pro.charts.options.ui_options import LegendOptions
from streamlit_lightweight_charts_pro.data import AreaData, CandlestickData, HistogramData, LineData

# Page configuration
st.set_page_config(page_title="Legend Examples", page_icon="📊", layout="wide")

st.title("📊 Legend Examples for Multi-Pane Charts")
st.markdown(
    "This example demonstrates legends for each pane in multi-pane charts with custom HTML"
    " templates."
)


# Generate sample data
def generate_sample_data():
    """Generate sample data for demonstration."""
    dates = pd.date_range(start="2024-01-01", end="2024-01-31", freq="D")

    # Price data
    base_price = 100
    price_data = []
    for i, date in enumerate(dates):
        # Simulate some price movement
        change = np.sin(i * 0.1) * 5 + np.random.normal(0, 2)
        base_price += change
        open_price = base_price
        high_price = base_price + abs(np.random.normal(0, 3))
        low_price = base_price - abs(np.random.normal(0, 3))
        close_price = base_price + np.random.normal(0, 1)

        price_data.append(
            CandlestickData(
                time=date, open=open_price, high=high_price, low=low_price, close=close_price
            )
        )

    # Volume data
    volume_data = []
    for i, date in enumerate(dates):
        volume = int(np.random.uniform(1000, 10000))
        volume_data.append(HistogramData(time=date, value=volume))

    # Moving averages
    ma20_data = []
    ma50_data = []
    for i, date in enumerate(dates):
        if i >= 19:  # 20-day MA
            ma20 = sum([price_data[j].close for j in range(i - 19, i + 1)]) / 20
            ma20_data.append(LineData(time=date, value=ma20))

        if i >= 49:  # 50-day MA
            ma50 = sum([price_data[j].close for j in range(i - 49, i + 1)]) / 50
            ma50_data.append(LineData(time=date, value=ma50))

    # RSI data
    rsi_data = []
    for i, date in enumerate(dates):
        if i >= 14:  # 14-day RSI
            gains = []
            losses = []
            for j in range(i - 13, i + 1):
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

basic_chart = Chart(
    options=ChartOptions(
        width=800,
        height=400,
        legends={
            0: LegendOptions(
                visible=True,
                position="top-right",
                background_color="rgba(255, 255, 255, 0.9)",
                border_color="#e1e3e6",
                border_width=1,
                border_radius=4,
                padding=5,
            ),
        },
    ),
    series=[
        LineSeries(data=ma20_data).set_title("20-Day MA"),
        LineSeries(data=ma50_data).set_title("50-Day MA"),
    ],
)

# Note: Colors are set to defaults for now

basic_chart.render(key="basic_legend")

st.code(
    """
# Basic Legend Configuration
chart = Chart(
    options=ChartOptions(
        legends={
            0: LegendOptions(
                visible=True,
                position="top-right",
                background_color="rgba(255, 255, 255, 0.9)",
                border_color="#e1e3e6",
                border_width=1,
                border_radius=4,
                padding=5
            )
        }
    ),
    series=[
        LineSeries(data=ma20_data).set_title("20-Day MA").line_options.set_color("#2196f3"),
        LineSeries(data=ma50_data).set_title("50-Day MA").line_options.set_color("#ff9800")
    ]
)
""",
    language="python",
)

# Example 2: Multi-Pane Chart with Legends
st.header("2. Multi-Pane Chart with Legends")
st.markdown("Chart with multiple panes, each with its own legend.")

multi_pane_chart = Chart(
    options=ChartOptions(
        width=1000,
        height=600,
        layout=LayoutOptions(
            pane_heights={
                0: PaneHeightOptions(factor=3.0),  # Main chart
                1: PaneHeightOptions(factor=1.0),  # Volume
                2: PaneHeightOptions(factor=1.5),  # RSI
            }
        ),
        legends={
            0: LegendOptions(
                visible=True,
                position="top-right",
                background_color="rgba(255, 255, 255, 0.95)",
                border_color="#cccccc",
                border_width=1,
                border_radius=6,
                padding=5,
                margin=8,
            ),
            1: LegendOptions(
                visible=True,
                position="top-left",
                background_color="rgba(255, 255, 255, 0.9)",
                border_color="#4caf50",
                border_width=1,
                border_radius=4,
                padding=5,
                margin=4,
            ),
            2: LegendOptions(
                visible=True,
                position="bottom-right",
                background_color="rgba(255, 255, 255, 0.9)",
                border_color="#ff9800",
                border_width=1,
                border_radius=4,
                padding=5,
                margin=4,
            ),
        },
    ),
    series=[
        LineSeries(data=price_data).set_title("Price"),
        LineSeries(data=ma20_data).set_title("20-Day MA"),
        LineSeries(data=ma50_data).set_title("50-Day MA"),
        LineSeries(data=volume_data, pane_id=1).set_title("Volume"),
        LineSeries(data=rsi_data, pane_id=2).set_title("RSI"),
    ],
)

multi_pane_chart.render(key="multi_pane_legend")

st.code(
    """
# Multi-Pane Chart with Legends
chart = Chart(
    options=ChartOptions(
        layout=LayoutOptions(
            pane_heights={
                0: PaneHeightOptions(factor=3.0),  # Main chart
                1: PaneHeightOptions(factor=1.0),  # Volume
                2: PaneHeightOptions(factor=1.5),  # RSI
            }
        ),
        legends={
            0: LegendOptions(
                visible=True,
                position="top-right",
                background_color="rgba(255, 255, 255, 0.95)",
                border_color="#cccccc",
                border_width=1,
                border_radius=6,
                padding=5,
                margin=8,
            ),
            1: LegendOptions(
                visible=True,
                position="top-left",
                background_color="rgba(255, 255, 255, 0.9)",
                border_color="#4caf50",
                border_width=1,
                border_radius=4,
                padding=5,
                margin=4,
            ),
            2: LegendOptions(
                visible=True,
                position="bottom-right",
                background_color="rgba(255, 255, 255, 0.9)",
                border_color="#ff9800",
                border_width=1,
                border_radius=4,
                padding=5,
                margin=4,
            ),
        },
    ),
    series=[
        LineSeries(data=price_data).set_title("Price"),
        LineSeries(data=ma20_data).set_title("20-Day MA"),
        LineSeries(data=ma50_data).set_title("50-Day MA"),
        LineSeries(data=volume_data, pane_id=1).set_title("Volume"),
        LineSeries(data=rsi_data, pane_id=2).set_title("RSI"),
    ],
)
""",
    language="python",
)

# Example 3: Custom HTML Templates
st.header("3. Custom HTML Templates")
st.markdown("Demonstrating custom HTML templates for legends with dynamic placeholders.")

custom_template_chart = Chart(
    options=ChartOptions(
        width=800,
        height=400,
        legends={
            0: LegendOptions(
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
            ),
        },
    ),
    series=[
        LineSeries(data=ma20_data).set_title("20-Day MA"),
        LineSeries(data=ma50_data).set_title("50-Day MA"),
    ],
)

custom_template_chart.render(key="custom_template_legend")

st.code(
    """
# Custom HTML Template Example
chart = Chart(
    options=ChartOptions(
        legends={
            0: LegendOptions(
                visible=True,
                position="top-right",
                background_color="rgba(255, 255, 255, 0.95)",
                border_color="#e1e3e6",
                border_width=1,
                border_radius=4,
                padding=5,
                text="<div style='display: flex; align-items: center; margin-bottom: 4px;'><span style='width: 12px; height: 2px; background-color: #2196f3; margin-right: 6px; display: inline-block;'></span><span style='font-weight: bold;'>20-Day MA</span><span style='margin-left: 8px; color: #2196f3; font-weight: bold;'>$$value$$</span></div>"
            )
        }
    ),
    series=[
        LineSeries(data=ma20_data).set_title("20-Day MA"),
        LineSeries(data=ma50_data).set_title("50-Day MA")
    ]
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
    top_left_chart = Chart(
        options=ChartOptions(
            width=400,
            height=300,
            legends={
                0: LegendOptions(
                    visible=True,
                    position="top-left",
                    background_color="rgba(255, 255, 255, 0.9)",
                    border_color="#e1e3e6",
                    padding=5,
                ),
            },
        ),
        series=[
            LineSeries(data=ma20_data).set_title("MA20"),
            LineSeries(data=ma50_data).set_title("MA50"),
        ],
    )
    top_left_chart.render(key="top_left_legend")

with col2:
    st.subheader("Bottom-Right Position")
    bottom_right_chart = Chart(
        options=ChartOptions(
            width=400,
            height=300,
            legends={
                0: LegendOptions(
                    visible=True,
                    position="bottom-right",
                    background_color="rgba(255, 255, 255, 0.9)",
                    border_color="#e1e3e6",
                    padding=5,
                ),
            },
        ),
        series=[
            LineSeries(data=ma20_data).set_title("MA20"),
            LineSeries(data=ma50_data).set_title("MA50"),
        ],
    )
    bottom_right_chart.render(key="bottom_right_legend")

st.code(
    """
# Different Legend Positions
top_left_chart = Chart(
    options=ChartOptions(
        legends={
            0: LegendOptions(
                visible=True,
                position="top-left",
                background_color="rgba(255, 255, 255, 0.9)",
                border_color="#e1e3e6",
                padding=5,
            ),
        },
    ),
    series=[
        LineSeries(data=ma20_data).set_title("MA20"),
        LineSeries(data=ma50_data).set_title("MA50"),
    ],
)

bottom_right_chart = Chart(
    options=ChartOptions(
        legends={
            0: LegendOptions(
                visible=True,
                position="bottom-right",
                background_color="rgba(255, 255, 255, 0.9)",
                border_color="#e1e3e6",
                padding=5,
            ),
        },
    ),
    series=[
        LineSeries(data=ma20_data).set_title("MA20"),
        LineSeries(data=ma50_data).set_title("MA50"),
    ],
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
        topColor="rgba(33, 150, 243, 0.3)",
        bottomColor="rgba(33, 150, 243, 0.1)",
    )
    for date in ma20_data
]

area_chart = Chart(
    options=ChartOptions(
        width=800,
        height=400,
        legends={
            0: LegendOptions(
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
                    " 2px;'></span><span>Volume</span><span style='margin-left: 6px; color:"
                    " #ff5722;'>$$value$$</span></div>"
                ),
            ),
        },
    ),
    series=[AreaSeries(data=area_data).set_title("Price Area")],
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

chart = Chart(
    options=ChartOptions(
        legends={
            0: LegendOptions(
                visible=True,
                position="top-right",
                background_color="rgba(255, 255, 255, 0.9)",
                border_color="#e1e3e6",
                border_width=1,
                border_radius=4,
                padding=5,
                text="<div style='display: flex; align-items: center;'><span style='width: 8px; height: 8px; background-color: #ff5722; margin-right: 4px; border-radius: 2px;'></span><span>Volume</span><span style='margin-left: 6px; color: #ff5722;'>$$value$$</span></div>"
            )
        }
    ),
    series=[
        AreaSeries(data=area_data).set_title("Price Area")
    ]
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
- **position**: Legend position - 'top-left', 'top-right', 'bottom-left', 'bottom-right' (default: 'top-right')
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
"""
)

# Interactive legend configuration
st.header("7. Interactive Legend Configuration")
st.markdown("Try different legend settings:")

col1, col2 = st.columns(2)

with col1:
    legend_position = st.selectbox(
        "Legend Position", ["top-left", "top-right", "bottom-left", "bottom-right"], index=1
    )

    legend_padding = st.slider("Padding", 2, 15, 5)

with col2:
    legend_background = st.color_picker("Background Color", "#ffffff")
    legend_border = st.color_picker("Border Color", "#e1e3e6")

# Create interactive chart
interactive_chart = Chart(
    options=ChartOptions(
        width=800,
        height=400,
        legends={
            0: LegendOptions(
                visible=True,
                position=legend_position,
                background_color=f"rgba(255, 255, 255, 0.9)",
                border_color=legend_border,
                border_width=1,
                border_radius=4,
                padding=legend_padding,
                margin=4,
            ),
        },
    ),
    series=[
        LineSeries(data=ma20_data).set_title("20-Day MA"),
        LineSeries(data=ma50_data).set_title("50-Day MA"),
    ],
)

interactive_chart.render(key="interactive_legend")

st.code(
    """
# Interactive Legend Configuration
legend_position = st.selectbox("Legend Position", ["top-left", "top-right", "bottom-left", "bottom-right"])
legend_padding = st.slider("Padding", 2, 15, 5)
legend_background = st.color_picker("Background Color", "#ffffff")
legend_border = st.color_picker("Border Color", "#e1e3e6")

chart = Chart(
    options=ChartOptions(
        legends={
            0: LegendOptions(
                visible=True,
                position=legend_position,
                background_color=f"rgba(255, 255, 255, 0.9)",
                border_color=legend_border,
                border_width=1,
                border_radius=4,
                padding=legend_padding,
                margin=4,
            ),
        },
    ),
    series=[
        LineSeries(data=ma20_data).set_title("20-Day MA"),
        LineSeries(data=ma50_data).set_title("50-Day MA"),
    ],
)
""",
    language="python",
)
