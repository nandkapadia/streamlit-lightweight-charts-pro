"""
Simple Tooltip Demo for Lightweight Charts

This script demonstrates the basic tooltip functionality with a simple line chart.
"""

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import (
    SingleValueData,
    TooltipField,
    create_custom_tooltip,
    create_ohlc_tooltip,
)


def create_sample_data():
    """Create sample data for the demo."""
    dates = pd.date_range("2024-01-01", periods=50, freq="D")
    np.random.seed(42)

    # Generate price data with some trend
    base_price = 100
    prices = []
    for i in range(50):
        if i == 0:
            price = base_price
        else:
            change = np.random.normal(0, 2)
            price = prices[-1] + change
        prices.append(max(price, 1))

    # Create line data
    line_data = []
    for date, price in zip(dates, prices):
        line_data.append(SingleValueData(time=date, value=price))

    return line_data


def main():
    """Main function to run the tooltip demo."""
    st.title("Lightweight Charts - Tooltip Demo")
    st.write("This demo shows the new tooltip functionality with dynamic content.")

    # Create sample data
    data = create_sample_data()

    # Create tabs for different tooltip examples
    tab1, tab2, tab3 = st.tabs(["Default OHLC", "Custom Template", "Custom Fields"])

    with tab1:
        st.header("Default OHLC Tooltip")
        st.write("This example shows a line chart with default OHLC tooltip.")

        # Create chart with default OHLC tooltip
        chart = Chart(series=LineSeries(data=data))

        # Add default OHLC tooltip
        tooltip_config = create_ohlc_tooltip()
        chart.add_tooltip_config("default", tooltip_config)

        chart.render(key="default_ohlc_tooltip")

    with tab2:
        st.header("Custom Template Tooltip")
        st.write("This example shows a line chart with custom template tooltip using placeholders.")

        # Create custom tooltip with template
        custom_tooltip = create_custom_tooltip(
            template="📈 Price: {price}\n📅 Date: {time}\n💰 Value: {value}"
        )

        # Add custom fields for formatting
        custom_tooltip.fields = [
            TooltipField("Price", "price", precision=2, prefix="$"),
            TooltipField("Date", "time"),
            TooltipField("Value", "value", precision=2, prefix="$"),
        ]

        chart = Chart(series=LineSeries(data=data))

        chart.add_tooltip_config("custom", custom_tooltip)
        chart.render(key="custom_template_tooltip")

    with tab3:
        st.header("Custom Fields Tooltip")
        st.write("This example shows a line chart with custom field configuration.")

        # Create tooltip with custom fields
        from streamlit_lightweight_charts_pro.data.tooltip import TooltipConfig, TooltipType

        field_tooltip = TooltipConfig(
            type=TooltipType.SINGLE,
            fields=[
                TooltipField("Current Price", "value", precision=2, prefix="$", color="#ff6b6b"),
                TooltipField("Change", "change", precision=2, prefix="$", color="#4ecdc4"),
                TooltipField("Change %", "change_pct", precision=1, suffix="%", color="#45b7d1"),
            ],
            show_date=True,
            show_time=True,
            date_format="%Y-%m-%d",
            time_format="%H:%M",
        )

        chart = Chart(series=LineSeries(data=data))

        chart.add_tooltip_config("fields", field_tooltip)
        chart.render(key="custom_fields_tooltip")

    # Add some explanation
    st.markdown("---")
    st.markdown(
        """
    ## How to Use Tooltips
    
    ### 1. Default OHLC Tooltip
    ```python
    from streamlit_lightweight_charts_pro.data import create_ohlc_tooltip
    
    tooltip_config = create_ohlc_tooltip()
    chart.add_tooltip_config("default", tooltip_config)
    ```
    
    ### 2. Custom Template Tooltip
    ```python
    from streamlit_lightweight_charts_pro.data import create_custom_tooltip, TooltipField
    
    custom_tooltip = create_custom_tooltip(
        template="Price: {price}, Date: {time}"
    )
    custom_tooltip.fields = [
        TooltipField("Price", "price", precision=2, prefix="$")
    ]
    ```
    
    ### 3. Custom Fields Tooltip
    ```python
    from streamlit_lightweight_charts_pro.data.tooltip import TooltipConfig, TooltipType, TooltipField
    
    field_tooltip = TooltipConfig(
        type=TooltipType.SINGLE,
        fields=[
            TooltipField("Price", "value", precision=2, prefix="$")
        ]
    )
    ```
    
    ### Available Placeholders
    - `{price}` - Current price value
    - `{value}` - Series value
    - `{time}` - Time/date
    - `{open}`, `{high}`, `{low}`, `{close}` - OHLC values
    - `{volume}` - Volume data
    - Any custom data field from your series
    """
    )


if __name__ == "__main__":
    main()
