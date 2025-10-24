"""Ribbon Series Per-Point Styling Example.

This example demonstrates how to use per-point style overrides for Ribbon series
to customize individual data points with different line colors, widths, styles,
and fill colors.

Features demonstrated:
- Basic per-point styling with LineStyle and FillStyle
- Highlighting specific data points (trend changes, volatility spikes)
- Dynamic styling based on data conditions
- Mixed styling (some points with custom styles, others using global options)
- Line style variations (solid, dotted, dashed)
- Fill color transitions for visual effect
"""

import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import RibbonSeries
from streamlit_lightweight_charts_pro.data import RibbonData
from streamlit_lightweight_charts_pro.data.styles import FillStyle, LineStyle, PerPointStyles


def create_volatility_ribbon_data():
    """Create sample volatility ribbon with per-point highlighting.

    This example highlights:
    - High volatility periods (red)
    - Low volatility periods (green)
    - Normal periods (default styling)
    """
    dates = pd.date_range("2024-01-01", periods=50, freq="D")

    data = []
    for i, date in enumerate(dates):
        price = 100 + i * 0.5
        volatility = abs((i % 20) - 10)  # Simulate volatility cycle

        upper = price + volatility
        lower = price - volatility

        # High volatility periods (volatility > 7)
        if volatility > 7:
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#ff4444", width=3),
                        lower_line=LineStyle(color="#ff4444", width=3),
                        fill=FillStyle(color="rgba(255, 68, 68, 0.3)", visible=True),
                    ),
                )
            )
        # Low volatility periods (volatility < 3)
        elif volatility < 3:
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#44ff44", width=2),
                        lower_line=LineStyle(color="#44ff44", width=2),
                        fill=FillStyle(color="rgba(68, 255, 68, 0.2)", visible=True),
                    ),
                )
            )
        else:
            # Normal volatility - use default styling
            data.append(RibbonData(time=str(date.date()), upper=upper, lower=lower))

    return data


def create_trend_ribbon_data():
    """Create ribbon with trend change highlighting.

    This example demonstrates:
    - Uptrend periods (green with thick lines)
    - Downtrend periods (red with thick lines)
    - Sideways periods (default styling)
    """
    dates = pd.date_range("2024-01-01", periods=60, freq="D")

    data = []
    prev_middle = 100

    for i, date in enumerate(dates):
        # Create trending price data
        if i < 20:  # Uptrend
            middle = 100 + i * 0.8
            trend = "up"
        elif i < 40:  # Downtrend
            middle = 116 - (i - 20) * 0.6
            trend = "down"
        else:  # Sideways
            middle = 104 + (i % 5) * 0.3
            trend = "sideways"

        upper = middle + 3
        lower = middle - 3

        # Highlight trend changes
        if trend == "up":
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#00c853", width=2, style=0),
                        lower_line=LineStyle(color="#00c853", width=2, style=0),
                        fill=FillStyle(color="rgba(0, 200, 83, 0.15)", visible=True),
                    ),
                )
            )
        elif trend == "down":
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#ff1744", width=2, style=0),
                        lower_line=LineStyle(color="#ff1744", width=2, style=0),
                        fill=FillStyle(color="rgba(255, 23, 68, 0.15)", visible=True),
                    ),
                )
            )
        else:
            # Sideways - use default styling
            data.append(RibbonData(time=str(date.date()), upper=upper, lower=lower))

        prev_middle = middle

    return data


def create_support_resistance_ribbon():
    """Create ribbon highlighting support and resistance tests.

    This example demonstrates:
    - Support test points (green)
    - Resistance test points (red)
    - Normal periods (default)
    """
    dates = pd.date_range("2024-01-01", periods=40, freq="D")

    data = []
    support_tests = [8, 9, 25, 26, 35]
    resistance_tests = [15, 16, 30, 31]

    for i, date in enumerate(dates):
        price = 100 + (i % 15) * 0.8
        upper = price + 4
        lower = price - 4

        if i in support_tests:
            # Highlight support test
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        lower_line=LineStyle(color="#4caf50", width=4, style=0),
                        fill=FillStyle(color="rgba(76, 175, 80, 0.25)", visible=True),
                    ),
                )
            )
        elif i in resistance_tests:
            # Highlight resistance test
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#f44336", width=4, style=0),
                        fill=FillStyle(color="rgba(244, 67, 54, 0.25)", visible=True),
                    ),
                )
            )
        else:
            # Normal period
            data.append(RibbonData(time=str(date.date()), upper=upper, lower=lower))

    return data


def create_line_style_variations():
    """Create ribbon demonstrating different line styles.

    This example shows:
    - Solid lines (style=0)
    - Dotted lines (style=1)
    - Dashed lines (style=2)
    - Mixed line styles
    """
    dates = pd.date_range("2024-01-01", periods=30, freq="D")

    data = []
    for i, date in enumerate(dates):
        price = 100 + i * 0.3
        upper = price + 5
        lower = price - 5

        # Different line styles every 7 days
        if i % 21 < 7:
            # Solid lines
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#2196f3", width=2, style=0),
                        lower_line=LineStyle(color="#2196f3", width=2, style=0),
                    ),
                )
            )
        elif i % 21 < 14:
            # Dotted lines
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#ff9800", width=2, style=1),
                        lower_line=LineStyle(color="#ff9800", width=2, style=1),
                    ),
                )
            )
        else:
            # Dashed lines
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#4caf50", width=2, style=2),
                        lower_line=LineStyle(color="#4caf50", width=2, style=2),
                    ),
                )
            )

    return data


def create_gradient_transition_ribbon():
    """Create ribbon with color transitions.

    This example demonstrates:
    - Gradual color transitions between periods
    - Different opacity levels
    - Visual flow effect
    """
    dates = pd.date_range("2024-01-01", periods=30, freq="D")

    data = []
    for i, date in enumerate(dates):
        price = 100 + i * 0.4
        upper = price + 6
        lower = price - 6

        # Create color transition effect
        # Red -> Yellow -> Green
        if i < 10:
            # Red phase
            intensity = i / 10
            color = f"rgba(255, {int(intensity * 100)}, 0, 0.2)"
            line_color = f"#ff{int(intensity * 100):02x}00"
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color=line_color, width=2),
                        lower_line=LineStyle(color=line_color, width=2),
                        fill=FillStyle(color=color, visible=True),
                    ),
                )
            )
        elif i < 20:
            # Yellow to Green phase
            progress = (i - 10) / 10
            red = int(255 * (1 - progress))
            green = int(255 * (0.6 + 0.4 * progress))
            color = f"rgba({red}, {green}, 0, 0.2)"
            line_color = f"#{red:02x}{green:02x}00"
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color=line_color, width=2),
                        lower_line=LineStyle(color=line_color, width=2),
                        fill=FillStyle(color=color, visible=True),
                    ),
                )
            )
        else:
            # Green phase
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#00ff00", width=2),
                        lower_line=LineStyle(color="#00ff00", width=2),
                        fill=FillStyle(color="rgba(0, 255, 0, 0.2)", visible=True),
                    ),
                )
            )

    return data


def create_complete_styling_example():
    """Create ribbon demonstrating all styling options.

    This example shows:
    - All LineStyle parameters
    - All FillStyle parameters
    - Complete per-point override
    """
    dates = pd.date_range("2024-01-01", periods=25, freq="D")

    data = []
    for i, date in enumerate(dates):
        price = 100 + i * 0.5
        upper = price + 5
        lower = price - 5

        # Show specific styling features
        if i == 5:
            # Only upper line styled
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(upper_line=LineStyle(color="#e91e63", width=3, style=0)),
                )
            )
        elif i == 10:
            # Only lower line styled
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(lower_line=LineStyle(color="#9c27b0", width=3, style=1)),
                )
            )
        elif i == 15:
            # Only fill styled
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        fill=FillStyle(color="rgba(63, 81, 181, 0.4)", visible=True)
                    ),
                )
            )
        elif i == 20:
            # Complete styling with all options
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    styles=PerPointStyles(
                        upper_line=LineStyle(color="#ff5722", width=4, style=2, visible=True),
                        lower_line=LineStyle(color="#ff5722", width=4, style=2, visible=True),
                        fill=FillStyle(color="rgba(255, 87, 34, 0.3)", visible=True),
                    ),
                )
            )
        else:
            # Default styling
            data.append(RibbonData(time=str(date.date()), upper=upper, lower=lower))

    return data


def main():
    """Main function to demonstrate Ribbon per-point styling."""
    st.title("Ribbon Series Per-Point Styling Examples")
    st.write(
        """
        This example demonstrates how to use per-point style overrides for Ribbon series.
        You can customize individual data points with different colors, line widths,
        line styles (solid, dotted, dashed), and fill colors.
        """
    )

    # Example 1: Volatility Ribbon
    st.header("1. Volatility Ribbon with Dynamic Highlighting")
    st.write(
        """
        This example highlights different volatility regimes:
        - **Red styling**: High volatility periods (thick lines)
        - **Green styling**: Low volatility periods (medium lines)
        - **Default styling**: Normal volatility
        """
    )

    vol_data = create_volatility_ribbon_data()
    vol_chart = Chart()
    vol_series = RibbonSeries(data=vol_data, visible=True, price_scale_id="right")

    # Set global styling (used when no per-point styling is specified)
    vol_series.upper_line.color = "#2962ff"
    vol_series.upper_line.line_width = 1
    vol_series.lower_line.color = "#2962ff"
    vol_series.lower_line.line_width = 1
    vol_series.fill = "rgba(41, 98, 255, 0.1)"
    vol_series.fill_visible = True

    vol_chart.add_series(vol_series)
    st.components.v1.html(vol_chart.to_html(), height=400)

    # Example 2: Trend Ribbon
    st.header("2. Trend Highlighting Ribbon")
    st.write(
        """
        This example uses per-point styling to visualize market trends:
        - **Green styling**: Uptrend periods (days 1-20)
        - **Red styling**: Downtrend periods (days 21-40)
        - **Default styling**: Sideways/consolidation (days 41-60)
        """
    )

    trend_data = create_trend_ribbon_data()
    trend_chart = Chart()
    trend_series = RibbonSeries(data=trend_data, visible=True, price_scale_id="right")

    # Set global styling
    trend_series.upper_line.color = "#787b86"
    trend_series.lower_line.color = "#787b86"
    trend_series.fill = "rgba(120, 123, 134, 0.1)"
    trend_series.fill_visible = True

    trend_chart.add_series(trend_series)
    st.components.v1.html(trend_chart.to_html(), height=400)

    # Example 3: Support/Resistance Tests
    st.header("3. Support and Resistance Test Highlighting")
    st.write(
        """
        This example highlights key support and resistance tests:
        - **Green lower line**: Support tests (emphasized lower boundary)
        - **Red upper line**: Resistance tests (emphasized upper boundary)
        - **Default styling**: Normal periods
        """
    )

    sr_data = create_support_resistance_ribbon()
    sr_chart = Chart()
    sr_series = RibbonSeries(data=sr_data, visible=True, price_scale_id="right")

    # Set global styling
    sr_series.upper_line.color = "#2962ff"
    sr_series.lower_line.color = "#2962ff"
    sr_series.fill = "rgba(41, 98, 255, 0.1)"

    sr_chart.add_series(sr_series)
    st.components.v1.html(sr_chart.to_html(), height=400)

    # Example 4: Line Style Variations
    st.header("4. Line Style Variations")
    st.write(
        """
        This example demonstrates different line styles:
        - **Blue solid lines**: Days 1-7, 22-28
        - **Orange dotted lines**: Days 8-14
        - **Green dashed lines**: Days 15-21
        """
    )

    style_data = create_line_style_variations()
    style_chart = Chart()
    style_series = RibbonSeries(data=style_data, visible=True, price_scale_id="right")

    # Set global styling
    style_series.upper_line.color = "#ccc"
    style_series.lower_line.color = "#ccc"

    style_chart.add_series(style_series)
    st.components.v1.html(style_chart.to_html(), height=400)

    # Example 5: Color Gradient Transitions
    st.header("5. Color Gradient Transitions")
    st.write(
        """
        This example creates a visual gradient effect:
        - **Days 1-10**: Red to Yellow transition
        - **Days 11-20**: Yellow to Green transition
        - **Days 21-30**: Green (stable)
        """
    )

    gradient_data = create_gradient_transition_ribbon()
    gradient_chart = Chart()
    gradient_series = RibbonSeries(data=gradient_data, visible=True, price_scale_id="right")

    gradient_chart.add_series(gradient_series)
    st.components.v1.html(gradient_chart.to_html(), height=400)

    # Example 6: Complete Styling Options
    st.header("6. Complete Styling Options Reference")
    st.write(
        """
        This example demonstrates all available styling options:
        - **Day 5**: Only upper line styled
        - **Day 10**: Only lower line styled (dotted)
        - **Day 15**: Only fill styled
        - **Day 20**: Complete styling with all options (dashed)
        """
    )

    complete_data = create_complete_styling_example()
    complete_chart = Chart()
    complete_series = RibbonSeries(data=complete_data, visible=True, price_scale_id="right")

    # Set global styling
    complete_series.upper_line.color = "#999"
    complete_series.lower_line.color = "#999"
    complete_series.fill = "rgba(153, 153, 153, 0.1)"

    complete_chart.add_series(complete_series)
    st.components.v1.html(complete_chart.to_html(), height=400)

    # Code examples
    st.header("Code Examples")

    st.subheader("Basic Per-Point Styling")
    st.code(
        """
from streamlit_lightweight_charts_pro.data import RibbonData
from streamlit_lightweight_charts_pro.data.styles import (
    PerPointStyles, LineStyle, FillStyle
)

# Create a data point with custom styling
data = RibbonData(
    time='2024-01-01',
    upper=110, lower=100,
    styles=PerPointStyles(
        upper_line=LineStyle(color='#ff0000', width=3),
        lower_line=LineStyle(color='#ff0000', width=3),
        fill=FillStyle(color='rgba(255, 0, 0, 0.2)', visible=True)
    )
)
""",
        language="python",
    )

    st.subheader("Highlighting Specific Points")
    st.code(
        """
# Highlight only the lower line (e.g., support test)
data = RibbonData(
    time='2024-01-01',
    upper=110, lower=100,
    styles=PerPointStyles(
        lower_line=LineStyle(color='#00ff00', width=4, style=0)
    )
)

# Highlight only the upper line (e.g., resistance test)
data = RibbonData(
    time='2024-01-02',
    upper=112, lower=102,
    styles=PerPointStyles(
        upper_line=LineStyle(color='#ff0000', width=4, style=0)
    )
)
""",
        language="python",
    )

    st.subheader("Complete Styling Example")
    st.code(
        """
# Create a data point with all styling options
data = RibbonData(
    time='2024-01-01',
    upper=110, lower=100,
    styles=PerPointStyles(
        upper_line=LineStyle(
            color='#ff0000',
            width=3,
            style=2,  # Dashed
            visible=True
        ),
        lower_line=LineStyle(
            color='#0000ff',
            width=3,
            style=1,  # Dotted
            visible=True
        ),
        fill=FillStyle(
            color='rgba(128, 0, 128, 0.3)',
            visible=True
        )
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

        **Ribbon-specific notes:**
        - Ribbon has single `fill` (not `upper_fill`/`lower_fill` like Band)
        - Ribbon has `upper_line` and `lower_line` (no `middle_line`)
        """
    )

    st.subheader("Practical Use Cases")
    st.markdown(
        """
        **Common scenarios for per-point styling:**

        1. **Volatility Visualization**: Change colors/widths based on volatility
        2. **Trend Highlighting**: Use green for uptrends, red for downtrends
        3. **Support/Resistance**: Emphasize boundary tests
        4. **Signal Highlighting**: Mark entry/exit points
        5. **Anomaly Detection**: Highlight unusual periods
        6. **Gradient Effects**: Create visual flow with color transitions
        7. **Pattern Recognition**: Mark specific chart patterns
        """
    )


if __name__ == "__main__":
    main()
