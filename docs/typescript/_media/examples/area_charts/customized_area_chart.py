"""Customized Area Chart Example.

This example demonstrates various customization options for AreaSeries including
colors, gradients, line options, and styling.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from lightweight_charts_pro.charts.options import LineOptions
from lightweight_charts_pro.charts.options.price_line_options import PriceLineOptions
from streamlit_lightweight_charts_pro.charts.series import AreaSeries
from streamlit_lightweight_charts_pro.type_definitions.enums import LineStyle

from examples.utilities.data_samples import get_line_data
from streamlit_lightweight_charts_pro.charts import Chart

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


def main():
    """Demonstrate AreaSeries customization options."""
    st.title("Customized Area Chart Example")
    st.write("This example shows various customization options for AreaSeries.")

    # Get sample data
    area_data = get_line_data()

    # 1. Default area with default colors
    st.subheader("1. Default Area Series")
    area_series = AreaSeries(data=area_data)

    chart = Chart()
    chart.add_series(area_series)
    chart.render(key="default_area")

    # 2. Custom colors
    st.subheader("2. Custom Colors")
    area_series_colors = AreaSeries(
        data=area_data,
        top_color="#ff6b6b",
        bottom_color="rgba(255, 107, 107, 0.1)",
        line_options=LineOptions(color="#ff6b6b", line_width=3, line_style=LineStyle.SOLID),
    )

    chart2 = Chart()
    chart2.add_series(area_series_colors)
    chart2.render(key="custom_colors")

    # 3. Gradient area
    st.subheader("3. Gradient Area")
    area_series_gradient = AreaSeries(
        data=area_data,
        top_color="#4ecdc4",
        bottom_color="rgba(78, 205, 196, 0.2)",
        relative_gradient=True,
        line_options=LineOptions(color="#4ecdc4", line_width=2),
    )

    chart3 = Chart()
    chart3.add_series(area_series_gradient)
    chart3.render(key="gradient_area")

    # 4. Inverted filled area
    st.subheader("4. Inverted Filled Area")
    area_series_inverted = AreaSeries(
        data=area_data,
        top_color="#45b7d1",
        bottom_color="rgba(69, 183, 209, 0.3)",
        invert_filled_area=True,
        line_options=LineOptions(color="#45b7d1", line_width=2, line_style=LineStyle.DASHED),
    )

    chart4 = Chart()
    chart4.add_series(area_series_inverted)
    chart4.render(key="inverted_area")

    # 5. Different line styles
    st.subheader("5. Different Line Styles")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.write("**Solid Line**")
        area_solid = AreaSeries(
            data=area_data,
            top_color="#ff9ff3",
            bottom_color="rgba(255, 159, 243, 0.2)",
            line_options=LineOptions(color="#ff9ff3", line_width=2, line_style=LineStyle.SOLID),
        )

        chart_solid = Chart()
        chart_solid.add_series(area_solid)
        chart_solid.render(key="solid_line")

    with col2:
        st.write("**Dashed Line**")
        area_dashed = AreaSeries(
            data=area_data,
            top_color="#54a0ff",
            bottom_color="rgba(84, 160, 255, 0.2)",
            line_options=LineOptions(color="#54a0ff", line_width=2, line_style=LineStyle.DASHED),
        )

        chart_dashed = Chart()
        chart_dashed.add_series(area_dashed)
        chart_dashed.render(key="dashed_line")

    with col3:
        st.write("**Dotted Line**")
        area_dotted = AreaSeries(
            data=area_data,
            top_color="#feca57",
            bottom_color="rgba(254, 202, 87, 0.2)",
            line_options=LineOptions(color="#feca57", line_width=2, line_style=LineStyle.DOTTED),
        )

        chart_dotted = Chart()
        chart_dotted.add_series(area_dotted)
        chart_dotted.render(key="dotted_line")

    # 6. Area with markers
    st.subheader("6. Area with Markers")
    area_series_markers = AreaSeries(
        data=area_data,
        top_color="#ff9ff3",
        bottom_color="rgba(255, 159, 243, 0.2)",
        line_options=LineOptions(color="#ff9ff3", line_width=2),
    )

    # Add some markers
    area_series_markers.add_marker(
        time=area_data[2].time,  # Third data point
        position="above_bar",
        color="#e74c3c",
        shape="circle",
        text="Peak",
        size=12,
    )

    area_series_markers.add_marker(
        time=area_data[7].time,  # Eighth data point
        position="below_bar",
        color="#27ae60",
        shape="square",
        text="Valley",
        size=10,
    )

    chart6 = Chart()
    chart6.add_series(area_series_markers)
    chart6.render(key="area_with_markers")

    # 7. Area with price lines
    st.subheader("7. Area with Price Lines")
    area_series_price_lines = AreaSeries(
        data=area_data,
        top_color="#feca57",
        bottom_color="rgba(254, 202, 87, 0.2)",
        line_options=LineOptions(color="#feca57", line_width=2),
    )

    # Calculate some reference levels
    values = [point.value for point in area_data]
    avg_value = sum(values) / len(values)
    max_value = max(values)
    min(values)

    area_series_price_lines.add_price_line(
        PriceLineOptions(
            price=avg_value,
            color="#e74c3c",
            line_width=2,
            line_style=LineStyle.DASHED,
        ),
    )

    area_series_price_lines.add_price_line(
        PriceLineOptions(
            price=max_value,
            color="#27ae60",
            line_width=2,
            line_style=LineStyle.DASHED,
        ),
    )

    chart7 = Chart()
    chart7.add_series(area_series_price_lines)
    chart7.render(key="area_with_price_lines")

    # Show customization options
    st.subheader("Customization Options Used")
    st.write(
        """
    - **Colors**: Custom top and bottom colors with rgba transparency
    - **Gradients**: Relative gradient option for smooth color transitions
    - **Inverted Areas**: Filled area below the line instead of above
    - **Line Options**: Custom line colors, widths, and styles (solid, dashed, dotted)
    - **Markers**: Added markers at specific data points
    - **Price Lines**: Horizontal reference lines at specific values
    """,
    )

    # Show color palette
    st.subheader("Color Palette Used")
    colors = {
        "Red": "#ff6b6b",
        "Teal": "#4ecdc4",
        "Blue": "#45b7d1",
        "Pink": "#ff9ff3",
        "Light Blue": "#54a0ff",
        "Yellow": "#feca57",
        "Purple": "#9b59b6",
    }

    for name, color in colors.items():
        st.color_picker(f"{name}", color, disabled=True)


if __name__ == "__main__":
    main()
