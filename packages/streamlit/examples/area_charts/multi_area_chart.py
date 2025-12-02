"""Multi-Area Chart Example.

This example demonstrates how to create charts with multiple AreaSeries,
showing different datasets and overlay options.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from lightweight_charts_core.charts.options import LineOptions
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from streamlit_lightweight_charts_pro.charts.series import AreaSeries
from streamlit_lightweight_charts_pro.type_definitions.enums import LineStyle

from examples.utilities.data_samples import (
    get_line_data,
    get_multi_area_data_1,
    get_multi_area_data_2,
)
from streamlit_lightweight_charts_pro.charts import Chart

sys.path.insert(0, str(Path(__file__).parent.parent))


def main():
    """Demonstrate multi-area chart functionality."""
    st.title("Multi-Area Chart Example")
    st.write("This example shows how to create charts with multiple AreaSeries.")

    # Get sample data
    area_data_1 = get_multi_area_data_1()
    area_data_2 = get_multi_area_data_2()
    line_data = get_line_data()

    # 1. Two areas in separate panes
    st.subheader("1. Two Areas in Separate Panes")
    st.write("Displaying two different datasets in separate panes:")

    # First area in main pane
    area1 = AreaSeries(
        data=area_data_1,
        pane_id=0,
        top_color="#4ecdc4",
        bottom_color="rgba(78, 205, 196, 0.2)",
        line_options=LineOptions(color="#4ecdc4", line_width=2),
    )

    # Second area in separate pane
    area2 = AreaSeries(
        data=area_data_2,
        pane_id=1,
        top_color="#ff6b6b",
        bottom_color="rgba(255, 107, 107, 0.2)",
        line_options=LineOptions(color="#ff6b6b", line_width=2),
    )

    chart1 = Chart()
    chart1.add_series(area1)
    chart1.add_series(area2)
    chart1.render(key="separate_panes")

    # Show data info
    col1, col2 = st.columns(2)
    with col1:
        st.write("**Area 1 Data:**")
        st.write(f"Data points: {len(area_data_1)}")
        values1 = [point.value for point in area_data_1]
        st.write(f"Value range: {min(values1):.2f} - {max(values1):.2f}")

    with col2:
        st.write("**Area 2 Data:**")
        st.write(f"Data points: {len(area_data_2)}")
        values2 = [point.value for point in area_data_2]
        st.write(f"Value range: {min(values2):.2f} - {max(values2):.2f}")

    # 2. Overlay areas with transparency
    st.subheader("2. Overlay Areas with Transparency")
    st.write("Overlaying multiple areas with transparency for comparison:")

    # Main area
    main_area = AreaSeries(
        data=area_data_1,
        top_color="#4ecdc4",
        bottom_color="rgba(78, 205, 196, 0.3)",
        line_options=LineOptions(color="#4ecdc4", line_width=2),
    )

    # Overlay area
    overlay_area = AreaSeries(
        data=area_data_2,
        top_color="rgba(255, 107, 107, 0.4)",
        bottom_color="rgba(255, 107, 107, 0.1)",
        line_options=LineOptions(
            color="rgba(255, 107, 107, 0.8)",
            line_width=1,
            line_style=LineStyle.DOTTED,
        ),
    )

    chart2 = Chart()
    chart2.add_series(main_area)
    chart2.add_series(overlay_area)
    chart2.render(key="overlay_areas")

    # 3. Three areas with different styles
    st.subheader("3. Three Areas with Different Styles")
    st.write("Showing three different datasets with distinct styling:")

    # Create a third dataset by scaling the line data
    scaled_data = [type(point)(time=point.time, value=point.value * 2 + 100) for point in line_data]

    # Area 1 - Solid style
    area1_style = AreaSeries(
        data=area_data_1,
        top_color="#ff9ff3",
        bottom_color="rgba(255, 159, 243, 0.2)",
        line_options=LineOptions(color="#ff9ff3", line_width=2, line_style=LineStyle.SOLID),
    )

    # Area 2 - Dashed style
    area2_style = AreaSeries(
        data=area_data_2,
        top_color="#54a0ff",
        bottom_color="rgba(84, 160, 255, 0.2)",
        line_options=LineOptions(color="#54a0ff", line_width=2, line_style=LineStyle.DASHED),
    )

    # Area 3 - Dotted style
    area3_style = AreaSeries(
        data=scaled_data,
        top_color="#feca57",
        bottom_color="rgba(254, 202, 87, 0.2)",
        line_options=LineOptions(color="#feca57", line_width=2, line_style=LineStyle.DOTTED),
    )

    chart3 = Chart()
    chart3.add_series(area1_style)
    chart3.add_series(area2_style)
    chart3.add_series(area3_style)
    chart3.render(key="three_styles")

    # 4. Comparison chart with annotations
    st.subheader("4. Comparison Chart with Annotations")
    st.write("Comparing datasets with markers and price lines:")

    # Create comparison areas
    comp_area1 = AreaSeries(
        data=area_data_1,
        top_color="#9b59b6",
        bottom_color="rgba(155, 89, 182, 0.2)",
        line_options=LineOptions(color="#9b59b6", line_width=2),
    )

    comp_area2 = AreaSeries(
        data=area_data_2,
        top_color="#e67e22",
        bottom_color="rgba(230, 126, 34, 0.2)",
        line_options=LineOptions(color="#e67e22", line_width=2),
    )

    # Add markers to first area
    comp_area1.add_marker(
        time=area_data_1[5].time,
        position="above_bar",
        color="#e74c3c",
        shape="circle",
        text="Peak 1",
        size=10,
    )

    comp_area1.add_marker(
        time=area_data_1[15].time,
        position="below_bar",
        color="#27ae60",
        shape="square",
        text="Valley 1",
        size=8,
    )

    # Add markers to second area
    comp_area2.add_marker(
        time=area_data_2[8].time,
        position="above_bar",
        color="#f39c12",
        shape="triangle",
        text="Peak 2",
        size=10,
    )

    # Add price lines for reference
    values1 = [point.value for point in area_data_1]
    values2 = [point.value for point in area_data_2]

    avg1 = sum(values1) / len(values1)
    avg2 = sum(values2) / len(values2)

    comp_area1.add_price_line(
        PriceLineOptions(price=avg1, color="#e74c3c", line_width=1, line_style=LineStyle.DASHED),
    )

    comp_area2.add_price_line(
        PriceLineOptions(price=avg2, color="#f39c12", line_width=1, line_style=LineStyle.DASHED),
    )

    chart4 = Chart()
    chart4.add_series(comp_area1)
    chart4.add_series(comp_area2)
    chart4.render(key="comparison_annotations")

    # 5. Data comparison table
    st.subheader("5. Data Comparison")

    comparison_data = {
        "Metric": ["Data Points", "Min Value", "Max Value", "Average", "Range"],
        "Area 1": [
            len(area_data_1),
            f"{min(values1):.2f}",
            f"{max(values1):.2f}",
            f"{avg1:.2f}",
            f"{max(values1) - min(values1):.2f}",
        ],
        "Area 2": [
            len(area_data_2),
            f"{min(values2):.2f}",
            f"{max(values2):.2f}",
            f"{avg2:.2f}",
            f"{max(values2) - min(values2):.2f}",
        ],
    }

    st.dataframe(comparison_data, use_container_width=True)

    # Show multi-area features
    st.subheader("Multi-Area Features Demonstrated")
    st.write(
        """
    - **Separate Panes**: Different datasets in separate chart panes
    - **Overlay Areas**: Multiple areas with transparency for comparison
    - **Different Styles**: Various line styles and colors for distinction
    - **Annotations**: Markers and price lines for key points
    - **Data Comparison**: Statistical comparison of different datasets
    """,
    )


if __name__ == "__main__":
    main()
