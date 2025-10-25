"""Band Series Per-Point Color Styling Example.

This example demonstrates how to use per-point color overrides for Band series
to customize individual data points with different line and fill colors.

Features demonstrated:
- Basic per-point color styling
- Highlighting specific data points (anomalies, signals)
- Dynamic styling based on data conditions
- Mixed styling (some points with custom colors, others using global options)
"""

import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import BandSeries
from streamlit_lightweight_charts_pro.data import BandData


def create_bollinger_bands_data():
    """Create sample Bollinger Bands data with per-point styling.

    This example highlights:
    - Breakouts above upper band (red)
    - Breakouts below lower band (green)
    - Normal data points (default styling)
    """
    dates = pd.date_range("2024-01-01", periods=50, freq="D")

    data = []
    for i, date in enumerate(dates):
        # Create sample price data with some volatility
        price = 100 + i * 0.5 + (i % 10) * 2
        upper = price + 10 + (i % 7) * 0.5
        middle = price
        lower = price - 10 - (i % 5) * 0.3

        # Simulate price breakouts
        if i in [15, 16, 17]:  # Breakout above upper band
            # Highlight these points with red styling
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    upper_line_color="#ff0000",
                    upper_fill_color="rgba(255, 0, 0, 0.3)",
                )
            )
        elif i in [35, 36, 37]:  # Breakout below lower band
            # Highlight these points with green styling
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    lower_line_color="#00ff00",
                    lower_fill_color="rgba(0, 255, 0, 0.3)",
                )
            )
        else:
            # Normal data point without custom styling
            data.append(BandData(time=str(date.date()), upper=upper, middle=middle, lower=lower))

    return data


def create_dynamic_volatility_bands():
    """Create bands with dynamic styling based on volatility.

    This example demonstrates:
    - Different colors during high volatility periods
    - Different colors during low volatility
    - Color transitions based on market conditions
    """
    dates = pd.date_range("2024-01-01", periods=40, freq="D")

    data = []
    for i, date in enumerate(dates):
        price = 100 + i * 0.3
        volatility = abs((i % 15) - 7)  # Simulate volatility cycle

        upper = price + volatility * 2
        middle = price
        lower = price - volatility * 2

        # High volatility periods (volatility > 5)
        if volatility > 5:
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    upper_line_color="#ff6b6b",
                    middle_line_color="#4ecdc4",
                    lower_line_color="#ff6b6b",
                    upper_fill_color="rgba(255, 107, 107, 0.2)",
                    lower_fill_color="rgba(255, 107, 107, 0.2)",
                )
            )
        # Low volatility periods (volatility < 3)
        elif volatility < 3:
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    upper_line_color="#95e1d3",
                    middle_line_color="#38ada9",
                    lower_line_color="#95e1d3",
                )
            )
        else:
            # Medium volatility - use default styling
            data.append(BandData(time=str(date.date()), upper=upper, middle=middle, lower=lower))

    return data


def create_signal_bands():
    """Create bands with signal highlighting.

    This example demonstrates:
    - Buy signals (green)
    - Sell signals (red)
    - Neutral periods (default)
    """
    dates = pd.date_range("2024-01-01", periods=30, freq="D")

    data = []
    for i, date in enumerate(dates):
        price = 100 + (i % 20) * 2 - 10
        upper = price + 8
        middle = price
        lower = price - 8

        # Buy signal
        if i in [5, 18, 25]:
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    middle_line_color="#00ff00",
                    upper_fill_color="rgba(0, 255, 0, 0.15)",
                    lower_fill_color="rgba(0, 255, 0, 0.15)",
                )
            )
        # Sell signal
        elif i in [10, 22]:
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    middle_line_color="#ff0000",
                    upper_fill_color="rgba(255, 0, 0, 0.15)",
                    lower_fill_color="rgba(255, 0, 0, 0.15)",
                )
            )
        else:
            # Neutral - use default styling
            data.append(BandData(time=str(date.date()), upper=upper, middle=middle, lower=lower))

    return data


def create_complete_styling_example():
    """Create bands demonstrating all available color options.

    This example shows:
    - All line color options
    - All fill color options
    - Complete per-point color overrides
    """
    dates = pd.date_range("2024-01-01", periods=20, freq="D")

    data = []
    for i, date in enumerate(dates):
        price = 100 + i * 0.5
        upper = price + 5
        middle = price
        lower = price - 5

        # Show different styling at specific points
        if i == 5:
            # All lines with different colors
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    upper_line_color="#2196f3",
                    middle_line_color="#4caf50",
                    lower_line_color="#ff9800",
                )
            )
        elif i == 10:
            # Only fill colors
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    upper_fill_color="rgba(33, 150, 243, 0.3)",
                    lower_fill_color="rgba(255, 152, 0, 0.3)",
                )
            )
        elif i == 15:
            # Complete styling example
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    upper_line_color="#e91e63",
                    middle_line_color="#9c27b0",
                    lower_line_color="#673ab7",
                    upper_fill_color="rgba(233, 30, 99, 0.3)",
                    lower_fill_color="rgba(103, 58, 183, 0.3)",
                )
            )
        else:
            # Default styling
            data.append(BandData(time=str(date.date()), upper=upper, middle=middle, lower=lower))

    return data


def main():
    """Main function to demonstrate Band per-point color styling."""
    st.title("Band Series Per-Point Color Styling Examples")
    st.write(
        """
        This example demonstrates how to use per-point color overrides for Band series.
        You can customize individual data points with different line and fill colors.
        """
    )

    # Example 1: Bollinger Bands with Breakout Highlighting
    st.header("1. Bollinger Bands with Breakout Highlighting")
    st.write(
        """
        This example highlights breakouts above/below the bands:
        - **Red styling**: Breakouts above upper band (days 15-17)
        - **Green styling**: Breakouts below lower band (days 35-37)
        - **Default styling**: Normal periods
        """
    )

    bb_data = create_bollinger_bands_data()
    bb_chart = Chart()
    bb_series = BandSeries(data=bb_data, visible=True, price_scale_id="right")

    # Set global styling (used when no per-point styling is specified)
    bb_series.upper_line.color = "#2962ff"
    bb_series.upper_line.line_width = 1
    bb_series.middle_line.color = "#787b86"
    bb_series.middle_line.line_width = 2
    bb_series.lower_line.color = "#2962ff"
    bb_series.lower_line.line_width = 1
    bb_series.upper_fill.color = "rgba(41, 98, 255, 0.1)"
    bb_series.lower_fill.color = "rgba(41, 98, 255, 0.1)"

    bb_chart.add_series(bb_series)
    st.components.v1.html(bb_chart.to_html(), height=400)

    # Example 2: Dynamic Volatility Bands
    st.header("2. Dynamic Volatility Bands")
    st.write(
        """
        This example adapts styling based on market volatility:
        - **High volatility**: Red lines and fills
        - **Low volatility**: Teal lines
        - **Medium volatility**: Default styling
        """
    )

    vol_data = create_dynamic_volatility_bands()
    vol_chart = Chart()
    vol_series = BandSeries(data=vol_data, visible=True, price_scale_id="right")

    # Set global styling
    vol_series.upper_line.color = "#787b86"
    vol_series.middle_line.color = "#2962ff"
    vol_series.lower_line.color = "#787b86"
    vol_series.upper_fill.color = "rgba(120, 123, 134, 0.1)"
    vol_series.lower_fill.color = "rgba(120, 123, 134, 0.1)"

    vol_chart.add_series(vol_series)
    st.components.v1.html(vol_chart.to_html(), height=400)

    # Example 3: Signal Bands
    st.header("3. Signal Highlighting Bands")
    st.write(
        """
        This example uses per-point styling to highlight trading signals:
        - **Green middle line**: Buy signals (days 5, 18, 25)
        - **Red middle line**: Sell signals (days 10, 22)
        - **Default styling**: Neutral periods
        """
    )

    signal_data = create_signal_bands()
    signal_chart = Chart()
    signal_series = BandSeries(data=signal_data, visible=True, price_scale_id="right")

    # Set global styling
    signal_series.upper_line.color = "#787b86"
    signal_series.middle_line.color = "#2962ff"
    signal_series.lower_line.color = "#787b86"

    signal_chart.add_series(signal_series)
    st.components.v1.html(signal_chart.to_html(), height=400)

    # Example 4: Complete Styling Options
    st.header("4. Complete Styling Options Reference")
    st.write(
        """
        This example demonstrates all available color options:
        - **Day 5**: All line colors customized
        - **Day 10**: Only fill colors customized
        - **Day 15**: Complete styling with all options
        """
    )

    complete_data = create_complete_styling_example()
    complete_chart = Chart()
    complete_series = BandSeries(data=complete_data, visible=True, price_scale_id="right")

    # Set global styling
    complete_series.upper_line.color = "#ccc"
    complete_series.middle_line.color = "#999"
    complete_series.lower_line.color = "#ccc"

    complete_chart.add_series(complete_series)
    st.components.v1.html(complete_chart.to_html(), height=400)

    # Code examples
    st.header("Code Examples")

    st.subheader("Basic Per-Point Color Styling")
    st.code(
        """
from streamlit_lightweight_charts_pro.data import BandData

# Create a data point with custom upper line color
data = BandData(
    time='2024-01-01',
    upper=110,
    middle=105,
    lower=100,
    upper_line_color='#ff0000'
)
""",
        language="python",
    )

    st.subheader("Complete Styling Example")
    st.code(
        """
# Create a data point with all color options
data = BandData(
    time='2024-01-01',
    upper=110,
    middle=105,
    lower=100,
    upper_line_color='#ff0000',
    middle_line_color='#00ff00',
    lower_line_color='#0000ff',
    upper_fill_color='rgba(255, 0, 0, 0.2)',
    lower_fill_color='rgba(0, 0, 255, 0.2)'
)
""",
        language="python",
    )

    st.subheader("Color Format Options")
    st.markdown(
        """
        **Supported color formats:**
        - Hex colors: `'#ff0000'`, `'#2196F3'`
        - RGBA colors: `'rgba(255, 0, 0, 0.5)'`, `'rgba(33, 150, 243, 0.2)'`

        **Available properties:**
        - `upper_line_color`: Color for the upper line
        - `middle_line_color`: Color for the middle line
        - `lower_line_color`: Color for the lower line
        - `upper_fill_color`: Color for the upper fill area (between middle and upper)
        - `lower_fill_color`: Color for the lower fill area (between middle and lower)

        **Note:** Width, style (dotted/dashed), and visible properties are no longer
        supported per-point. Use series-level options for these settings.
        """
    )

    st.subheader("Practical Use Cases")
    st.markdown(
        """
        **Common scenarios for per-point color styling:**

        1. **Breakout Detection**: Highlight when price breaks band boundaries
        2. **Volatility Visualization**: Change colors based on band width
        3. **Signal Highlighting**: Mark entry/exit points with distinct colors
        4. **Anomaly Detection**: Highlight unusual market behavior
        5. **Trend Strength**: Use color intensity to show trend strength
        6. **Multiple Timeframe Analysis**: Different colors for different timeframes
        """
    )


if __name__ == "__main__":
    main()
