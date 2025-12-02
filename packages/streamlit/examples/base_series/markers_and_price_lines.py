"""Markers and Price Lines Example

This example demonstrates the markers and price lines functionality that all series types share.
It shows how to add, configure, and manage markers and price lines on any series.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data.marker import BarMarker
from streamlit_lightweight_charts_pro.type_definitions.enums import MarkerPosition, MarkerShape

from examples.utilities.data_samples import get_line_data
from streamlit_lightweight_charts_pro.charts import Chart

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


def main():
    """Demonstrate markers and price lines functionality."""
    st.title("Markers and Price Lines")
    st.write("This example shows how to add markers and price lines to any series type.")

    # Get sample data
    data = get_line_data()

    st.header("1. Adding Markers")
    st.write("Add markers to highlight specific points on the series:")

    # Create series with markers
    series_with_markers = LineSeries(data=data)

    # Add various types of markers
    series_with_markers.add_marker(
        BarMarker(
            time="2018-12-25",
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
            text="Peak",
            size=12,
        ),
    )

    series_with_markers.add_marker(
        BarMarker(
            time="2018-12-30",
            position=MarkerPosition.BELOW_BAR,
            color="#00FF00",
            shape=MarkerShape.SQUARE,
            text="Low",
            size=10,
        ),
    )

    series_with_markers.add_marker(
        BarMarker(
            time="2018-12-27",
            position=MarkerPosition.IN_BAR,
            color="#0000FF",
            shape=MarkerShape.TRIANGLE,
            text="Important",
            size=8,
        ),
    )

    chart = Chart(series=series_with_markers)
    chart.render(key="chart")

    st.header("2. Different Marker Positions")
    st.write("Demonstrate different marker positions:")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Above Bar Markers")
        above_series = LineSeries(data=data)
        above_series.add_marker(
            BarMarker(
                time="2018-12-25",
                position=MarkerPosition.ABOVE_BAR,
                color="#FF0000",
                shape=MarkerShape.CIRCLE,
                text="Above",
            ),
        )
        above_chart = Chart(series=above_series)
        above_chart.render(key="chart")

    with col2:
        st.subheader("Below Bar Markers")
        below_series = LineSeries(data=data)
        below_series.add_marker(
            BarMarker(
                time="2018-12-25",
                position=MarkerPosition.BELOW_BAR,
                color="#00FF00",
                shape=MarkerShape.SQUARE,
                text="Below",
            ),
        )
        below_chart = Chart(series=below_series)
        below_chart.render(key="chart")

    st.header("3. Different Marker Shapes")
    st.write("Demonstrate different marker shapes:")

    shapes_series = LineSeries(data=data)

    # Add markers with different shapes
    shapes_series.add_marker(
        BarMarker(
            time="2018-12-22",
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
            text="Circle",
        ),
    )
    shapes_series.add_marker(
        BarMarker(
            time="2018-12-24",
            position=MarkerPosition.ABOVE_BAR,
            color="#00FF00",
            shape=MarkerShape.SQUARE,
            text="Square",
        ),
    )
    shapes_series.add_marker(
        BarMarker(
            time="2018-12-26",
            position=MarkerPosition.ABOVE_BAR,
            color="#0000FF",
            shape=MarkerShape.TRIANGLE,
            text="Triangle",
        ),
    )
    shapes_series.add_marker(
        BarMarker(
            time="2018-12-28",
            position=MarkerPosition.ABOVE_BAR,
            color="#FFFF00",
            shape=MarkerShape.ARROW_DOWN,
            text="Arrow",
        ),
    )

    chart = Chart(series=shapes_series)
    chart.render(key="chart")

    st.header("4. Adding Price Lines")
    st.write("Add price lines to show support/resistance levels:")

    # Create series with price lines
    series_with_price_lines = LineSeries(data=data)

    # Add price lines
    support_line = PriceLineOptions(
        price=25.0,
        color="#00FF00",
        line_width=2,
        line_style="dashed",
        axis_label_visible=True,
        title="Support",
    )

    resistance_line = PriceLineOptions(
        price=35.0,
        color="#FF0000",
        line_width=2,
        line_style="dashed",
        axis_label_visible=True,
        title="Resistance",
    )

    series_with_price_lines.add_price_line(support_line)
    series_with_price_lines.add_price_line(resistance_line)

    chart = Chart(series=series_with_price_lines)
    chart.render(key="chart")

    st.header("5. Multiple Price Lines")
    st.write("Add multiple price lines with different styles:")

    multi_lines_series = LineSeries(data=data)

    # Add multiple price lines
    multi_lines_series.add_price_line(PriceLineOptions(price=30.0, color="#FF0000", title="Upper"))
    multi_lines_series.add_price_line(PriceLineOptions(price=25.0, color="#00FF00", title="Middle"))
    multi_lines_series.add_price_line(PriceLineOptions(price=20.0, color="#0000FF", title="Lower"))

    chart = Chart(series=multi_lines_series)
    chart.render(key="chart")

    st.header("6. Combined Markers and Price Lines")
    st.write("Combine markers and price lines on the same series:")

    combined_series = LineSeries(data=data)

    # Add markers
    combined_series.add_marker(
        BarMarker(
            time="2018-12-25",
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
            text="Peak",
        ),
    )
    combined_series.add_marker(
        BarMarker(
            time="2018-12-30",
            position=MarkerPosition.BELOW_BAR,
            color="#00FF00",
            shape=MarkerShape.SQUARE,
            text="Low",
        ),
    )

    # Add price lines
    combined_series.add_price_line(
        PriceLineOptions(price=30.0, color="#FF0000", title="Resistance"),
    )
    combined_series.add_price_line(PriceLineOptions(price=20.0, color="#00FF00", title="Support"))

    chart = Chart(series=combined_series)
    chart.render(key="chart")

    st.header("7. Marker and Price Line Management")
    st.write("Manage markers and price lines programmatically:")

    management_series = LineSeries(data=data)

    # Add initial markers and price lines
    management_series.add_marker(
        BarMarker(
            time="2018-12-25",
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
            text="Initial",
        ),
    )
    management_series.add_price_line(PriceLineOptions(price=30.0, color="#FF0000", title="Initial"))

    st.write("**Initial Configuration:**")
    st.write(f"Number of markers: {len(management_series.markers)}")
    st.write(f"Number of price lines: {len(management_series.price_lines)}")

    # Clear markers and price lines
    management_series.clear_markers()
    management_series.clear_price_lines()

    st.write("**After Clearing:**")
    st.write(f"Number of markers: {len(management_series.markers)}")
    st.write(f"Number of price lines: {len(management_series.price_lines)}")

    chart = Chart(series=management_series)
    chart.render(key="chart")


if __name__ == "__main__":
    main()
