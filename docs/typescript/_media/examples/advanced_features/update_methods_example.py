"""Example demonstrating the update methods for Options and Series classes.

This example shows how to use the dictionary-based update functionality
for both Options and Series classes, including nested object handling.
"""

import streamlit as st
from lightweight_charts_pro.charts.options import LineOptions
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.type_definitions.enums import LineStyle

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.data import LineData

# Sample data
data = [
    LineData(time=1640995200, value=100),
    LineData(time=1641081600, value=105),
    LineData(time=1641168000, value=102),
    LineData(time=1641254400, value=108),
    LineData(time=1641340800, value=110),
]


def main():
    st.title("Update Methods Example")
    st.write("Demonstrating dictionary-based updates for Options and Series classes")

    st.header("1. Options Update Method")
    st.write("Update LineOptions using dictionary:")

    # Create options and update them
    options = LineOptions()

    # Simple property updates
    options.update({"color": "#ff0000", "line_width": 3, "line_style": LineStyle.DASHED})

    st.write("**Updated Options:**")
    st.write(f"- Color: {options.color}")
    st.write(f"- Line Width: {options.line_width}")
    st.write(f"- Line Style: {options.line_style}")

    # Method chaining
    options.update({"color": "#00ff00"}).update({"line_width": 5})

    st.write("**After Method Chaining:**")
    st.write(f"- Color: {options.color}")
    st.write(f"- Line Width: {options.line_width}")

    # CamelCase key support
    options.update({"lineWidth": 2, "lineStyle": LineStyle.DOTTED})

    st.write("**After CamelCase Updates:**")
    st.write(f"- Line Width: {options.line_width}")
    st.write(f"- Line Style: {options.line_style}")

    st.header("2. Series Update Method")
    st.write("Update LineSeries using dictionary:")

    # Create series with basic options
    line_options = LineOptions()
    series = LineSeries(data=data, line_options=line_options)

    # Simple property updates
    series.update({"visible": False, "price_scale_id": "left", "pane_id": 1})

    st.write("**Updated Series Properties:**")
    st.write(f"- Visible: {series.visible}")  # pylint: disable=no-member
    st.write(f"- Price Scale ID: {series.price_scale_id}")  # pylint: disable=no-member
    st.write(f"- Pane ID: {series.pane_id}")  # pylint: disable=no-member

    # Nested options updates
    series.update(
        {"line_options": {"color": "#0000ff", "line_width": 4, "line_style": LineStyle.SOLID}},
    )

    st.write("**Updated Nested Options:**")
    st.write(f"- Line Color: {series.line_options.color}")
    st.write(f"- Line Width: {series.line_options.line_width}")
    st.write(f"- Line Style: {series.line_options.line_style}")

    # Complex nested updates
    series.update(
        {
            "visible": True,
            "price_scale_id": "right",
            "line_options": {"color": "#ff6600", "line_width": 2, "line_style": LineStyle.DASHED},
        },
    )

    st.write("**After Complex Updates:**")
    st.write(f"- Visible: {series.visible}")  # pylint: disable=no-member
    st.write(f"- Price Scale ID: {series.price_scale_id}")  # pylint: disable=no-member
    st.write(f"- Line Color: {series.line_options.color}")

    st.header("3. Method Chaining")
    st.write("Demonstrate method chaining:")

    # Create new series for chaining example
    chain_options = LineOptions()
    chain_series = LineSeries(data=data, line_options=chain_options)

    # Method chaining
    result = (
        chain_series.update({"visible": False})
        .update({"price_scale_id": "left"})
        .update({"pane_id": 2})
        .update({"line_options": {"color": "#ff00ff"}})
    )

    st.write("**After Method Chaining:**")
    st.write(f"- Visible: {chain_series.visible}")  # pylint: disable=no-member
    st.write(f"- Price Scale ID: {chain_series.price_scale_id}")  # pylint: disable=no-member
    st.write(f"- Pane ID: {chain_series.pane_id}")  # pylint: disable=no-member
    st.write(f"- Line Color: {chain_series.line_options.color}")
    st.write(f"- Result is same object: {result is chain_series}")

    st.header("4. Serialization After Updates")
    st.write("Show how updates affect serialization:")

    # Create options and update them
    serial_options = LineOptions()
    serial_options.update({"color": "#ff0000", "line_width": 3, "line_style": LineStyle.DASHED})

    # Serialize to dictionary
    options_dict = serial_options.asdict()

    st.write("**Serialized Options:**")
    st.write(options_dict)

    # Create series and update it
    serial_line_options = LineOptions()
    serial_series = LineSeries(data=data, line_options=serial_line_options)
    serial_series.update(
        {
            "visible": False,
            "price_scale_id": "left",
            "line_options": {"color": "#00ff00", "line_width": 2},
        },
    )

    # Serialize to dictionary
    series_dict = serial_series.asdict()

    st.write("**Serialized Series:**")
    st.write("Keys:", list(series_dict.keys()))
    st.write("Options keys:", list(series_dict.get("options", {}).keys()))

    st.header("5. Error Handling")
    st.write("Demonstrate error handling:")

    # Create options for error handling
    error_options = LineOptions()

    # This should raise an error
    try:
        error_options.update({"invalid_field": "value"})
        st.error("❌ Expected error was not raised!")
    except ValueError as e:
        st.success(f"✅ Correctly caught error: {e}")

    # Create series for error handling
    error_line_options = LineOptions()
    error_series = LineSeries(data=data, line_options=error_line_options)

    # This should raise an error
    try:
        error_series.update({"invalid_attr": "value"})
        st.error("❌ Expected error was not raised!")
    except ValueError as e:
        st.success(f"✅ Correctly caught error: {e}")

    st.header("6. Display Updated Chart")
    st.write("Show the final updated chart:")

    # Create final chart with all updates
    final_options = LineOptions()
    final_series = LineSeries(data=data, line_options=final_options)

    # Apply comprehensive updates
    final_series.update(
        {
            "visible": True,
            "price_scale_id": "right",
            "pane_id": 0,
            "line_options": {"color": "#ff6600", "line_width": 3, "line_style": LineStyle.SOLID},
        },
    )

    # Create and display chart
    chart = Chart(series=final_series)
    chart.render(key="chart")

    st.header("7. Usage Patterns")
    st.write("Common usage patterns:")

    st.subheader("Pattern 1: Configuration from Dictionary")
    config = {"color": "#ff0000", "line_width": 2, "line_style": LineStyle.DASHED}

    pattern_options = LineOptions()
    pattern_options.update(config)

    st.write("**Configuration from Dict:**")
    st.write(f"- Color: {pattern_options.color}")
    st.write(f"- Line Width: {pattern_options.line_width}")

    st.subheader("Pattern 2: Conditional Updates")
    condition = True
    conditional_options = LineOptions()

    if condition:
        conditional_options.update({"color": "#00ff00"})
    else:
        conditional_options.update({"color": "#ff0000"})

    st.write("**Conditional Updates:**")
    st.write(f"- Color: {conditional_options.color}")

    st.subheader("Pattern 3: Progressive Updates")
    progressive_options = LineOptions()

    # Update in stages
    progressive_options.update({"color": "#ff0000"})
    progressive_options.update({"line_width": 3})
    progressive_options.update({"line_style": LineStyle.DOTTED})

    st.write("**Progressive Updates:**")
    st.write(f"- Color: {progressive_options.color}")
    st.write(f"- Line Width: {progressive_options.line_width}")
    st.write(f"- Line Style: {progressive_options.line_style}")


if __name__ == "__main__":
    main()
