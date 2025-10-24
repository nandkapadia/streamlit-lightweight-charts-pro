"""Band Series Per-Point Styling Example.

This example demonstrates how to use per-point style overrides for Band series
to customize individual data points with different line colors, widths, styles,
and fill colors.

Features demonstrated:
- Basic per-point styling with LineStyle and FillStyle
- Highlighting specific data points (anomalies, signals)
- Dynamic styling based on data conditions
- Mixed styling (some points with custom styles, others using global options)
- Complete style override examples showing all available options
"""

import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import BandSeries
from streamlit_lightweight_charts_pro.data import BandData
from streamlit_lightweight_charts_pro.data.styles import FillStyle, LineStyle, PerPointStyles


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
            actual_price = upper + 2
            # Highlight these points with red styling
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#ff0000", width=3),
                        upper_fill=FillStyle(color="rgba(255, 0, 0, 0.3)", visible=True),
                    ),
                )
            )
        elif i in [35, 36, 37]:  # Breakout below lower band
            actual_price = lower - 2
            # Highlight these points with green styling
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    styles=PerPointStyles(
                        lower_line=LineStyle(color="#00ff00", width=3),
                        lower_fill=FillStyle(color="rgba(0, 255, 0, 0.3)", visible=True),
                    ),
                )
            )
        else:
            # Normal data point without custom styling
            data.append(BandData(time=str(date.date()), upper=upper, middle=middle, lower=lower))

    return data


def create_dynamic_volatility_bands():
    """Create bands with dynamic styling based on volatility.

    This example demonstrates:
    - Wider lines during high volatility periods
    - Dotted lines during low volatility
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
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#ff6b6b", width=3, style=0),
                        middle_line=LineStyle(color="#4ecdc4", width=2, style=0),
                        lower_line=LineStyle(color="#ff6b6b", width=3, style=0),
                        upper_fill=FillStyle(color="rgba(255, 107, 107, 0.2)"),
                        lower_fill=FillStyle(color="rgba(255, 107, 107, 0.2)"),
                    ),
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
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#95e1d3", width=1, style=1),
                        middle_line=LineStyle(color="#38ada9", width=1, style=1),
                        lower_line=LineStyle(color="#95e1d3", width=1, style=1),
                    ),
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
                    styles=PerPointStyles(
                        middle_line=LineStyle(color="#00ff00", width=4, style=0),
                        upper_fill=FillStyle(color="rgba(0, 255, 0, 0.15)", visible=True),
                        lower_fill=FillStyle(color="rgba(0, 255, 0, 0.15)", visible=True),
                    ),
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
                    styles=PerPointStyles(
                        middle_line=LineStyle(color="#ff0000", width=4, style=0),
                        upper_fill=FillStyle(color="rgba(255, 0, 0, 0.15)", visible=True),
                        lower_fill=FillStyle(color="rgba(255, 0, 0, 0.15)", visible=True),
                    ),
                )
            )
        else:
            # Neutral - use default styling
            data.append(BandData(time=str(date.date()), upper=upper, middle=middle, lower=lower))

    return data


def create_complete_styling_example():
    """Create bands demonstrating all available styling options.

    This example shows:
    - All LineStyle options (color, width, style, visible)
    - All FillStyle options (color, visible)
    - Complete per-point style overrides
    """
    dates = pd.date_range("2024-01-01", periods=20, freq="D")

    data = []
    for i, date in enumerate(dates):
        price = 100 + i * 0.5
        upper = price + 5
        middle = price
        lower = price - 5

        # Show different line styles
        if i == 5:
            # Solid lines
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#2196f3", width=2, style=0),
                        middle_line=LineStyle(color="#4caf50", width=2, style=0),
                        lower_line=LineStyle(color="#ff9800", width=2, style=0),
                    ),
                )
            )
        elif i == 10:
            # Dotted lines
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#2196f3", width=2, style=1),
                        middle_line=LineStyle(color="#4caf50", width=2, style=1),
                        lower_line=LineStyle(color="#ff9800", width=2, style=1),
                    ),
                )
            )
        elif i == 15:
            # Dashed lines
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#2196f3", width=2, style=2),
                        middle_line=LineStyle(color="#4caf50", width=2, style=2),
                        lower_line=LineStyle(color="#ff9800", width=2, style=2),
                    ),
                )
            )
        elif i == 18:
            # Complete styling example
            data.append(
                BandData(
                    time=str(date.date()),
                    upper=upper,
                    middle=middle,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#e91e63", width=3, style=0, visible=True),
                        middle_line=LineStyle(color="#9c27b0", width=4, style=0, visible=True),
                        lower_line=LineStyle(color="#673ab7", width=3, style=0, visible=True),
                        upper_fill=FillStyle(color="rgba(233, 30, 99, 0.3)", visible=True),
                        lower_fill=FillStyle(color="rgba(103, 58, 183, 0.3)", visible=True),
                    ),
                )
            )
        else:
            # Default styling
            data.append(BandData(time=str(date.date()), upper=upper, middle=middle, lower=lower))

    return data


def main():
    """Main function to demonstrate Band per-point styling."""
    st.title("Band Series Per-Point Styling Examples")
    st.write(
        """
        This example demonstrates how to use per-point style overrides for Band series.
        You can customize individual data points with different colors, line widths,
        line styles (solid, dotted, dashed), and fill colors.
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
        - **High volatility**: Wider red lines (width=3, solid)
        - **Low volatility**: Thin dotted teal lines (width=1, dotted)
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
        This example demonstrates all available styling options:
        - **Day 5**: Solid lines (style=0) with different colors
        - **Day 10**: Dotted lines (style=1)
        - **Day 15**: Dashed lines (style=2)
        - **Day 18**: Complete styling with all options
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

    st.subheader("Basic Per-Point Styling")
    st.code(
        """
from streamlit_lightweight_charts_pro.data import BandData
from streamlit_lightweight_charts_pro.data.styles import (
    PerPointStyles, LineStyle, FillStyle
)

# Create a data point with custom red upper line
data = BandData(
    time='2024-01-01',
    upper=110, middle=105, lower=100,
    styles=PerPointStyles(
        upper_line=LineStyle(color='#ff0000', width=3)
    )
)
""",
        language="python",
    )

    st.subheader("Complete Styling Example")
    st.code(
        """
# Create a data point with all styling options
data = BandData(
    time='2024-01-01',
    upper=110, middle=105, lower=100,
    styles=PerPointStyles(
        upper_line=LineStyle(color='#ff0000', width=3, style=2, visible=True),
        middle_line=LineStyle(color='#00ff00', width=4, style=0, visible=True),
        lower_line=LineStyle(color='#0000ff', width=3, style=1, visible=True),
        upper_fill=FillStyle(color='rgba(255, 0, 0, 0.2)', visible=True),
        lower_fill=FillStyle(color='rgba(0, 0, 255, 0.2)', visible=True)
    )
)
""",
        language="python",
    )

    st.subheader("Line Style Options")
    st.markdown(
        """
        **LineStyle parameters:**
        - `color`: Hex color (e.g., '#ff0000') or rgba (e.g., 'rgba(255,0,0,0.5)')
        - `width`: Integer from 1-4 (line width in pixels)
        - `style`: 0=solid, 1=dotted, 2=dashed
        - `visible`: Boolean to show/hide the line

        **FillStyle parameters:**
        - `color`: Hex color or rgba format
        - `visible`: Boolean to show/hide the fill
        """
    )


if __name__ == "__main__":
    main()
