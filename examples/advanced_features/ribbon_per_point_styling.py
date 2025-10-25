"""Ribbon Series Per-Point Color Styling Example.

This example demonstrates how to use per-point color overrides for Ribbon series
to customize individual data points with different line and fill colors.

Features demonstrated:
- Basic per-point color styling
- Highlighting specific data points (trend changes, volatility spikes)
- Dynamic styling based on data conditions
- Mixed styling (some points with custom colors, others using global options)
- Color transitions for visual effect
"""

import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import RibbonSeries
from streamlit_lightweight_charts_pro.data import RibbonData


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
                    upper_line_color="#ff4444",
                    lower_line_color="#ff4444",
                    fill="rgba(255, 68, 68, 0.3)",
                )
            )
        # Low volatility periods (volatility < 3)
        elif volatility < 3:
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    upper_line_color="#44ff44",
                    lower_line_color="#44ff44",
                    fill="rgba(68, 255, 68, 0.2)",
                )
            )
        else:
            # Normal volatility - use default styling
            data.append(RibbonData(time=str(date.date()), upper=upper, lower=lower))

    return data


def create_trend_ribbon_data():
    """Create ribbon with trend change highlighting.

    This example demonstrates:
    - Uptrend periods (green)
    - Downtrend periods (red)
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
                    upper_line_color="#00c853",
                    lower_line_color="#00c853",
                    fill="rgba(0, 200, 83, 0.15)",
                )
            )
        elif trend == "down":
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    upper_line_color="#ff1744",
                    lower_line_color="#ff1744",
                    fill="rgba(255, 23, 68, 0.15)",
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
                    lower_line_color="#4caf50",
                    fill="rgba(76, 175, 80, 0.25)",
                )
            )
        elif i in resistance_tests:
            # Highlight resistance test
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    upper_line_color="#f44336",
                    fill="rgba(244, 67, 54, 0.25)",
                )
            )
        else:
            # Normal period
            data.append(RibbonData(time=str(date.date()), upper=upper, lower=lower))

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
                    upper_line_color=line_color,
                    lower_line_color=line_color,
                    fill=color,
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
                    upper_line_color=line_color,
                    lower_line_color=line_color,
                    fill=color,
                )
            )
        else:
            # Green phase
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    upper_line_color="#00ff00",
                    lower_line_color="#00ff00",
                    fill="rgba(0, 255, 0, 0.2)",
                )
            )

    return data


def create_complete_styling_example():
    """Create ribbon demonstrating all styling options.

    This example shows:
    - All color override options
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
                    upper_line_color="#e91e63",
                )
            )
        elif i == 10:
            # Only lower line styled
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    lower_line_color="#9c27b0",
                )
            )
        elif i == 15:
            # Only fill styled
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    fill="rgba(63, 81, 181, 0.4)",
                )
            )
        elif i == 20:
            # Complete styling with all options
            data.append(
                RibbonData(
                    time=str(date.date()),
                    upper=upper,
                    lower=lower,
                    upper_line_color="#ff5722",
                    lower_line_color="#ff5722",
                    fill="rgba(255, 87, 34, 0.3)",
                )
            )
        else:
            # Default styling
            data.append(RibbonData(time=str(date.date()), upper=upper, lower=lower))

    return data


def main():
    """Main function to demonstrate Ribbon per-point color styling."""
    st.title("Ribbon Series Per-Point Color Styling Examples")
    st.write(
        """
        This example demonstrates how to use per-point color overrides for Ribbon series.
        You can customize individual data points with different line and fill colors.
        """
    )

    # Example 1: Volatility Ribbon
    st.header("1. Volatility Ribbon with Dynamic Highlighting")
    st.write(
        """
        This example highlights different volatility regimes:
        - **Red styling**: High volatility periods
        - **Green styling**: Low volatility periods
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

    # Example 4: Color Gradient Transitions
    st.header("4. Color Gradient Transitions")
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

    # Example 5: Complete Styling Options
    st.header("5. Complete Styling Options Reference")
    st.write(
        """
        This example demonstrates all available styling options:
        - **Day 5**: Only upper line styled
        - **Day 10**: Only lower line styled
        - **Day 15**: Only fill styled
        - **Day 20**: Complete styling with all options
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

    st.subheader("Basic Per-Point Color Styling")
    st.code(
        """
from streamlit_lightweight_charts_pro.data import RibbonData

# Create a data point with custom colors
data = RibbonData(
    time='2024-01-01',
    upper=110,
    lower=100,
    upper_line_color='#ff0000',
    lower_line_color='#ff0000',
    fill='rgba(255, 0, 0, 0.2)'
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
    upper=110,
    lower=100,
    lower_line_color='#00ff00',
    fill='rgba(0, 255, 0, 0.25)'
)

# Highlight only the upper line (e.g., resistance test)
data = RibbonData(
    time='2024-01-02',
    upper=112,
    lower=102,
    upper_line_color='#ff0000',
    fill='rgba(255, 0, 0, 0.25)'
)
""",
        language="python",
    )

    st.subheader("Complete Styling Example")
    st.code(
        """
# Create a data point with all color options
data = RibbonData(
    time='2024-01-01',
    upper=110,
    lower=100,
    upper_line_color='#ff0000',
    lower_line_color='#0000ff',
    fill='rgba(128, 0, 128, 0.3)'
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
        - `lower_line_color`: Color for the lower line
        - `fill`: Color for the fill area between lines

        **Note:** Width, style (dotted/dashed), and visible properties are no longer
        supported per-point. Use series-level options for these settings.
        """
    )

    st.subheader("Practical Use Cases")
    st.markdown(
        """
        **Common scenarios for per-point color styling:**

        1. **Volatility Visualization**: Change colors based on volatility
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
