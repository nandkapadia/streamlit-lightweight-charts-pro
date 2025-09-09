"""
Base Series Examples Launcher

This launcher provides navigation to all base series examples.
"""

import streamlit as st
from advanced_features import main as advanced_features

# Import all example modules
from basic_series_usage import main as basic_usage
from data_handling import main as data_handling
from markers_and_price_lines import main as markers_price_lines


def main():
    """Main launcher function."""
    st.set_page_config(page_title="Base Series Examples", page_icon="📊", layout="wide")

    st.title("📊 Base Series Examples")
    st.write(
        "This collection demonstrates the fundamental Series functionality that all series types"
        " share. These examples show common patterns and capabilities using LineSeries as a"
        " concrete implementation."
    )

    st.markdown("---")

    # Navigation
    st.header("🎯 Available Examples")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📋 Basic Usage")
        st.write("Fundamental Series functionality including creation, visibility, and properties.")
        if st.button("🚀 Run Basic Usage Example", key="basic"):
            st.session_state.example = "basic"

    with col2:
        st.subheader("📍 Markers & Price Lines")
        st.write("Add and manage markers and price lines on any series type.")
        if st.button("🚀 Run Markers & Price Lines Example", key="markers"):
            st.session_state.example = "markers"

    with col1:
        st.subheader("📊 Data Handling")
        st.write("Work with different data formats: Data objects, DataFrames, and Series.")
        if st.button("🚀 Run Data Handling Example", key="data"):
            st.session_state.example = "data"

    with col2:
        st.subheader("⚡ Advanced Features")
        st.write("Advanced functionality including method chaining, serialization, and validation.")
        if st.button("🚀 Run Advanced Features Example", key="advanced"):
            st.session_state.example = "advanced"

    st.markdown("---")

    # Run selected example
    if hasattr(st.session_state, "example"):
        st.header("📈 Running Example")

        if st.session_state.example == "basic":
            basic_usage()
        elif st.session_state.example == "markers":
            markers_price_lines()
        elif st.session_state.example == "data":
            data_handling()
        elif st.session_state.example == "advanced":
            advanced_features()

    # Documentation
    st.markdown("---")
    st.header("📚 Documentation")

    st.write(
        """
    ### What is Base Series?
    
    The `Series` class is the abstract base class for all series types in the library. 
    It provides common functionality that all series share:
    
    - **Data Handling**: Support for Data objects, DataFrames, and Series
    - **Configuration**: Visibility, price scale, pane, and overlay settings
    - **Markers**: Add visual markers to highlight specific points
    - **Price Lines**: Add horizontal lines for support/resistance levels
    - **Method Chaining**: Fluent API for configuration
    - **Serialization**: Convert to dictionary/JSON for frontend
    
    ### Key Features Demonstrated
    
    1. **Basic Usage**: Series creation, properties, and configuration
    2. **Markers & Price Lines**: Visual enhancements for any series
    3. **Data Handling**: Multiple input formats and validation
    4. **Advanced Features**: Method chaining, serialization, validation
    
    ### Usage Pattern
    
    ```python
    from streamlit_lightweight_charts_pro.charts.series import LineSeries
    
    # Create series with data
    series = LineSeries(data=line_data)
    
    # Configure with method chaining
    series = (
        LineSeries(data=line_data)
        .add_marker(time, position, color, shape, text)
        .add_price_line(price_line_options)
    )
    
    # Add to chart
    chart = Chart(series=series)
    chart.render()
    ```
    """
    )


if __name__ == "__main__":
    main()
