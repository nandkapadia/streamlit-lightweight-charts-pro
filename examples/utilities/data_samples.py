"""Sample data for streamlit-lightweight-charts examples and testing.

This module contains sample datasets in various formats for demonstrating
different chart types and features. All data is structured according to
the library's data models and can be used directly in examples.

The module provides:
    - Raw data dictionaries for backward compatibility
    - Converted data model objects for the new API
    - Helper functions for data conversion
    - Sample datasets for all chart types

Example:
    ```python
    from examples.dataSamples import get_line_data, get_candlestick_data, get_volume_data

    # Get data as data model objects
    line_data = get_line_data()
    candlestick_data = get_candlestick_data()

    # Use with new API
    chart = SinglePaneChart(series=LineSeries(data=line_data))
    ```
"""

from typing import Dict, List, Union

import pandas as pd

from streamlit_lightweight_charts_pro.data import BarData, CandlestickData, LineData
from streamlit_lightweight_charts_pro.type_definitions.enums import ColumnNames

# =============================================================================
# RAW DATA DICTIONARIES (for backward compatibility)
# =============================================================================

# Sample data for single value charts (line, area)
series_single_value_data = [
    {ColumnNames.DATETIME: "2018-12-22", ColumnNames.VALUE: 32.51},
    {ColumnNames.DATETIME: "2018-12-23", ColumnNames.VALUE: 31.11},
    {ColumnNames.DATETIME: "2018-12-24", ColumnNames.VALUE: 27.02},
    {ColumnNames.DATETIME: "2018-12-25", ColumnNames.VALUE: 27.32},
    {ColumnNames.DATETIME: "2018-12-26", ColumnNames.VALUE: 25.17},
    {ColumnNames.DATETIME: "2018-12-27", ColumnNames.VALUE: 28.89},
    {ColumnNames.DATETIME: "2018-12-28", ColumnNames.VALUE: 25.46},
    {ColumnNames.DATETIME: "2018-12-29", ColumnNames.VALUE: 23.92},
    {ColumnNames.DATETIME: "2018-12-30", ColumnNames.VALUE: 22.68},
    {ColumnNames.DATETIME: "2018-12-31", ColumnNames.VALUE: 22.67},
]

# Sample data for baseline charts
series_baseline_chart = [
    {ColumnNames.VALUE: 1, ColumnNames.DATETIME: 1642425322},
    {ColumnNames.VALUE: 8, ColumnNames.DATETIME: 1642511722},
    {ColumnNames.VALUE: 10, ColumnNames.DATETIME: 1642598122},
    {ColumnNames.VALUE: 20, ColumnNames.DATETIME: 1642684522},
    {ColumnNames.VALUE: 3, ColumnNames.DATETIME: 1642770922},
    {ColumnNames.VALUE: 43, ColumnNames.DATETIME: 1642857322},
    {ColumnNames.VALUE: 41, ColumnNames.DATETIME: 1642943722},
    {ColumnNames.VALUE: 43, ColumnNames.DATETIME: 1643030122},
    {ColumnNames.VALUE: 56, ColumnNames.DATETIME: 1643116522},
    {ColumnNames.VALUE: 46, ColumnNames.DATETIME: 1643202922},
]

# Sample data for histogram charts
series_histogram_chart = [
    {ColumnNames.VALUE: 1, ColumnNames.DATETIME: 1642425322},
    {ColumnNames.VALUE: 8, ColumnNames.DATETIME: 1642511722},
    {ColumnNames.VALUE: 10, ColumnNames.DATETIME: 1642598122},
    {ColumnNames.VALUE: 20, ColumnNames.DATETIME: 1642684522},
    {ColumnNames.VALUE: 3, ColumnNames.DATETIME: 1642770922, "color": "red"},
    {ColumnNames.VALUE: 43, ColumnNames.DATETIME: 1642857322},
    {ColumnNames.VALUE: 41, ColumnNames.DATETIME: 1642943722, "color": "red"},
    {ColumnNames.VALUE: 43, ColumnNames.DATETIME: 1643030122},
    {ColumnNames.VALUE: 56, ColumnNames.DATETIME: 1643116522},
    {ColumnNames.VALUE: 46, ColumnNames.DATETIME: 1643202922, "color": "red"},
]

# Sample data for bar charts
series_bar_chart = [
    {
        ColumnNames.OPEN: 10,
        ColumnNames.HIGH: 10.63,
        ColumnNames.LOW: 9.49,
        ColumnNames.CLOSE: 9.55,
        ColumnNames.DATETIME: 1642427876,
    },
    {
        ColumnNames.OPEN: 9.55,
        ColumnNames.HIGH: 10.30,
        ColumnNames.LOW: 9.42,
        ColumnNames.CLOSE: 9.94,
        ColumnNames.DATETIME: 1642514276,
    },
    {
        ColumnNames.OPEN: 9.94,
        ColumnNames.HIGH: 10.17,
        ColumnNames.LOW: 9.92,
        ColumnNames.CLOSE: 9.78,
        ColumnNames.DATETIME: 1642600676,
    },
    {
        ColumnNames.OPEN: 9.78,
        ColumnNames.HIGH: 10.59,
        ColumnNames.LOW: 9.18,
        ColumnNames.CLOSE: 9.51,
        ColumnNames.DATETIME: 1642687076,
    },
    {
        ColumnNames.OPEN: 9.51,
        ColumnNames.HIGH: 10.46,
        ColumnNames.LOW: 9.10,
        ColumnNames.CLOSE: 10.17,
        ColumnNames.DATETIME: 1642773476,
    },
    {
        ColumnNames.OPEN: 10.17,
        ColumnNames.HIGH: 10.96,
        ColumnNames.LOW: 10.16,
        ColumnNames.CLOSE: 10.47,
        ColumnNames.DATETIME: 1642859876,
    },
    {
        ColumnNames.OPEN: 10.47,
        ColumnNames.HIGH: 11.39,
        ColumnNames.LOW: 10.40,
        ColumnNames.CLOSE: 10.81,
        ColumnNames.DATETIME: 1642946276,
    },
    {
        ColumnNames.OPEN: 10.81,
        ColumnNames.HIGH: 11.60,
        ColumnNames.LOW: 10.30,
        ColumnNames.CLOSE: 10.75,
        ColumnNames.DATETIME: 1643032676,
    },
    {
        ColumnNames.OPEN: 10.75,
        ColumnNames.HIGH: 11.60,
        ColumnNames.LOW: 10.49,
        ColumnNames.CLOSE: 10.93,
        ColumnNames.DATETIME: 1643119076,
    },
    {
        ColumnNames.OPEN: 10.93,
        ColumnNames.HIGH: 11.53,
        ColumnNames.LOW: 10.76,
        ColumnNames.CLOSE: 10.96,
        ColumnNames.DATETIME: 1643205476,
    },
]

# Sample data for candlestick charts
series_candlestick_chart = [
    {
        ColumnNames.OPEN: 10,
        ColumnNames.HIGH: 10.63,
        ColumnNames.LOW: 9.49,
        ColumnNames.CLOSE: 9.55,
        ColumnNames.DATETIME: 1642427876,
    },
    {
        ColumnNames.OPEN: 9.55,
        ColumnNames.HIGH: 10.30,
        ColumnNames.LOW: 9.42,
        ColumnNames.CLOSE: 9.94,
        ColumnNames.DATETIME: 1642514276,
    },
    {
        ColumnNames.OPEN: 9.94,
        ColumnNames.HIGH: 10.17,
        ColumnNames.LOW: 9.92,
        ColumnNames.CLOSE: 9.78,
        ColumnNames.DATETIME: 1642600676,
    },
    {
        ColumnNames.OPEN: 9.78,
        ColumnNames.HIGH: 10.59,
        ColumnNames.LOW: 9.18,
        ColumnNames.CLOSE: 9.51,
        ColumnNames.DATETIME: 1642687076,
    },
    {
        ColumnNames.OPEN: 9.51,
        ColumnNames.HIGH: 10.46,
        ColumnNames.LOW: 9.10,
        ColumnNames.CLOSE: 10.17,
        ColumnNames.DATETIME: 1642773476,
    },
    {
        ColumnNames.OPEN: 10.17,
        ColumnNames.HIGH: 10.96,
        ColumnNames.LOW: 10.16,
        ColumnNames.CLOSE: 10.47,
        ColumnNames.DATETIME: 1642859876,
    },
    {
        ColumnNames.OPEN: 10.47,
        ColumnNames.HIGH: 11.39,
        ColumnNames.LOW: 10.40,
        ColumnNames.CLOSE: 10.81,
        ColumnNames.DATETIME: 1642946276,
    },
    {
        ColumnNames.OPEN: 10.81,
        ColumnNames.HIGH: 11.60,
        ColumnNames.LOW: 10.30,
        ColumnNames.CLOSE: 10.75,
        ColumnNames.DATETIME: 1643032676,
    },
    {
        ColumnNames.OPEN: 10.75,
        ColumnNames.HIGH: 11.60,
        ColumnNames.LOW: 10.49,
        ColumnNames.CLOSE: 10.93,
        ColumnNames.DATETIME: 1643119076,
    },
    {
        ColumnNames.OPEN: 10.93,
        ColumnNames.HIGH: 11.53,
        ColumnNames.LOW: 10.76,
        ColumnNames.CLOSE: 10.96,
        ColumnNames.DATETIME: 1643205476,
    },
]

# Sample data for multi-chart area series 1
series_multiple_chart_area_01 = [
    {ColumnNames.DATETIME: "2019-03-01", ColumnNames.VALUE: 42.58},
    {ColumnNames.DATETIME: "2019-03-04", ColumnNames.VALUE: 42.64},
    {ColumnNames.DATETIME: "2019-03-05", ColumnNames.VALUE: 42.74},
    {ColumnNames.DATETIME: "2019-03-06", ColumnNames.VALUE: 42.7},
    {ColumnNames.DATETIME: "2019-03-07", ColumnNames.VALUE: 42.63},
    {ColumnNames.DATETIME: "2019-03-08", ColumnNames.VALUE: 42.25},
    {ColumnNames.DATETIME: "2019-03-11", ColumnNames.VALUE: 42.33},
    {ColumnNames.DATETIME: "2019-03-12", ColumnNames.VALUE: 42.46},
    {ColumnNames.DATETIME: "2019-03-13", ColumnNames.VALUE: 43.83},
    {ColumnNames.DATETIME: "2019-03-14", ColumnNames.VALUE: 43.95},
    {ColumnNames.DATETIME: "2019-03-15", ColumnNames.VALUE: 43.87},
    {ColumnNames.DATETIME: "2019-03-18", ColumnNames.VALUE: 44.24},
    {ColumnNames.DATETIME: "2019-03-19", ColumnNames.VALUE: 44.47},
    {ColumnNames.DATETIME: "2019-03-20", ColumnNames.VALUE: 44.53},
    {ColumnNames.DATETIME: "2019-03-21", ColumnNames.VALUE: 44.53},
    {ColumnNames.DATETIME: "2019-03-22", ColumnNames.VALUE: 43.95},
    {ColumnNames.DATETIME: "2019-03-25", ColumnNames.VALUE: 43.53},
    {ColumnNames.DATETIME: "2019-03-26", ColumnNames.VALUE: 43.82},
    {ColumnNames.DATETIME: "2019-03-27", ColumnNames.VALUE: 43.59},
    {ColumnNames.DATETIME: "2019-03-28", ColumnNames.VALUE: 43.63},
    {ColumnNames.DATETIME: "2019-03-29", ColumnNames.VALUE: 43.72},
    {ColumnNames.DATETIME: "2019-04-01", ColumnNames.VALUE: 44.09},
    {ColumnNames.DATETIME: "2019-04-02", ColumnNames.VALUE: 44.23},
    {ColumnNames.DATETIME: "2019-04-03", ColumnNames.VALUE: 44.23},
    {ColumnNames.DATETIME: "2019-04-04", ColumnNames.VALUE: 44.15},
    {ColumnNames.DATETIME: "2019-04-05", ColumnNames.VALUE: 44.53},
    {ColumnNames.DATETIME: "2019-04-08", ColumnNames.VALUE: 45.23},
    {ColumnNames.DATETIME: "2019-04-09", ColumnNames.VALUE: 44.99},
    {ColumnNames.DATETIME: "2019-04-10", ColumnNames.VALUE: 45.04},
    {ColumnNames.DATETIME: "2019-04-11", ColumnNames.VALUE: 44.87},
    {ColumnNames.DATETIME: "2019-04-12", ColumnNames.VALUE: 44.67},
    {ColumnNames.DATETIME: "2019-04-15", ColumnNames.VALUE: 44.67},
    {ColumnNames.DATETIME: "2019-04-16", ColumnNames.VALUE: 44.48},
    {ColumnNames.DATETIME: "2019-04-17", ColumnNames.VALUE: 44.62},
    {ColumnNames.DATETIME: "2019-04-18", ColumnNames.VALUE: 44.39},
    {ColumnNames.DATETIME: "2019-04-22", ColumnNames.VALUE: 45.04},
    {ColumnNames.DATETIME: "2019-04-23", ColumnNames.VALUE: 45.02},
    {ColumnNames.DATETIME: "2019-04-24", ColumnNames.VALUE: 44.13},
    {ColumnNames.DATETIME: "2019-04-25", ColumnNames.VALUE: 43.96},
    {ColumnNames.DATETIME: "2019-04-26", ColumnNames.VALUE: 43.31},
    {ColumnNames.DATETIME: "2019-04-29", ColumnNames.VALUE: 43.02},
    {ColumnNames.DATETIME: "2019-04-30", ColumnNames.VALUE: 43.73},
    {ColumnNames.DATETIME: "2019-05-01", ColumnNames.VALUE: 43.08},
    {ColumnNames.DATETIME: "2019-05-02", ColumnNames.VALUE: 42.63},
    {ColumnNames.DATETIME: "2019-05-03", ColumnNames.VALUE: 43.08},
    {ColumnNames.DATETIME: "2019-05-06", ColumnNames.VALUE: 42.93},
    {ColumnNames.DATETIME: "2019-05-07", ColumnNames.VALUE: 42.22},
    {ColumnNames.DATETIME: "2019-05-08", ColumnNames.VALUE: 42.28},
    {ColumnNames.DATETIME: "2019-05-09", ColumnNames.VALUE: 41.65},
    {ColumnNames.DATETIME: "2019-05-10", ColumnNames.VALUE: 41.5},
    {ColumnNames.DATETIME: "2019-05-13", ColumnNames.VALUE: 41.23},
    {ColumnNames.DATETIME: "2019-05-14", ColumnNames.VALUE: 41.55},
    {ColumnNames.DATETIME: "2019-05-15", ColumnNames.VALUE: 41.77},
    {ColumnNames.DATETIME: "2019-05-16", ColumnNames.VALUE: 42.28},
    {ColumnNames.DATETIME: "2019-05-17", ColumnNames.VALUE: 42.34},
    {ColumnNames.DATETIME: "2019-05-20", ColumnNames.VALUE: 42.58},
    {ColumnNames.DATETIME: "2019-05-21", ColumnNames.VALUE: 42.75},
    {ColumnNames.DATETIME: "2019-05-22", ColumnNames.VALUE: 42.34},
    {ColumnNames.DATETIME: "2019-05-23", ColumnNames.VALUE: 41.34},
    {ColumnNames.DATETIME: "2019-05-24", ColumnNames.VALUE: 41.76},
    {ColumnNames.DATETIME: "2019-05-28", ColumnNames.VALUE: 41.625},
]

# Sample data for multi-chart area series 2
series_multiple_chart_area_02 = [
    {ColumnNames.DATETIME: "2019-03-01", ColumnNames.VALUE: 174.97},
    {ColumnNames.DATETIME: "2019-03-04", ColumnNames.VALUE: 175.85},
    {ColumnNames.DATETIME: "2019-03-05", ColumnNames.VALUE: 175.53},
    {ColumnNames.DATETIME: "2019-03-06", ColumnNames.VALUE: 174.52},
    {ColumnNames.DATETIME: "2019-03-07", ColumnNames.VALUE: 172.5},
    {ColumnNames.DATETIME: "2019-03-08", ColumnNames.VALUE: 172.91},
    {ColumnNames.DATETIME: "2019-03-11", ColumnNames.VALUE: 178.9},
    {ColumnNames.DATETIME: "2019-03-12", ColumnNames.VALUE: 180.91},
    {ColumnNames.DATETIME: "2019-03-13", ColumnNames.VALUE: 181.71},
    {ColumnNames.DATETIME: "2019-03-14", ColumnNames.VALUE: 183.73},
    {ColumnNames.DATETIME: "2019-03-15", ColumnNames.VALUE: 186.12},
    {ColumnNames.DATETIME: "2019-03-18", ColumnNames.VALUE: 188.02},
    {ColumnNames.DATETIME: "2019-03-19", ColumnNames.VALUE: 186.53},
    {ColumnNames.DATETIME: "2019-03-20", ColumnNames.VALUE: 188.16},
    {ColumnNames.DATETIME: "2019-03-21", ColumnNames.VALUE: 195.09},
    {ColumnNames.DATETIME: "2019-03-22", ColumnNames.VALUE: 191.05},
    {ColumnNames.DATETIME: "2019-03-25", ColumnNames.VALUE: 188.74},
    {ColumnNames.DATETIME: "2019-03-26", ColumnNames.VALUE: 186.79},
    {ColumnNames.DATETIME: "2019-03-27", ColumnNames.VALUE: 188.47},
    {ColumnNames.DATETIME: "2019-03-28", ColumnNames.VALUE: 188.72},
    {ColumnNames.DATETIME: "2019-03-29", ColumnNames.VALUE: 189.95},
    {ColumnNames.DATETIME: "2019-04-01", ColumnNames.VALUE: 191.24},
    {ColumnNames.DATETIME: "2019-04-02", ColumnNames.VALUE: 194.02},
    {ColumnNames.DATETIME: "2019-04-03", ColumnNames.VALUE: 195.35},
    {ColumnNames.DATETIME: "2019-04-04", ColumnNames.VALUE: 195.69},
    {ColumnNames.DATETIME: "2019-04-05", ColumnNames.VALUE: 197},
    {ColumnNames.DATETIME: "2019-04-08", ColumnNames.VALUE: 200.1},
    {ColumnNames.DATETIME: "2019-04-09", ColumnNames.VALUE: 199.5},
    {ColumnNames.DATETIME: "2019-04-10", ColumnNames.VALUE: 200.62},
    {ColumnNames.DATETIME: "2019-04-11", ColumnNames.VALUE: 198.95},
    {ColumnNames.DATETIME: "2019-04-12", ColumnNames.VALUE: 198.87},
    {ColumnNames.DATETIME: "2019-04-15", ColumnNames.VALUE: 199.23},
    {ColumnNames.DATETIME: "2019-04-16", ColumnNames.VALUE: 199.25},
    {ColumnNames.DATETIME: "2019-04-17", ColumnNames.VALUE: 203.13},
    {ColumnNames.DATETIME: "2019-04-18", ColumnNames.VALUE: 203.86},
    {ColumnNames.DATETIME: "2019-04-22", ColumnNames.VALUE: 204.53},
    {ColumnNames.DATETIME: "2019-04-23", ColumnNames.VALUE: 207.48},
    {ColumnNames.DATETIME: "2019-04-24", ColumnNames.VALUE: 207.16},
    {ColumnNames.DATETIME: "2019-04-25", ColumnNames.VALUE: 205.28},
    {ColumnNames.DATETIME: "2019-04-26", ColumnNames.VALUE: 204.3},
    {ColumnNames.DATETIME: "2019-04-29", ColumnNames.VALUE: 204.61},
    {ColumnNames.DATETIME: "2019-04-30", ColumnNames.VALUE: 200.67},
    {ColumnNames.DATETIME: "2019-05-01", ColumnNames.VALUE: 210.52},
    {ColumnNames.DATETIME: "2019-05-02", ColumnNames.VALUE: 209.15},
    {ColumnNames.DATETIME: "2019-05-03", ColumnNames.VALUE: 211.75},
    {ColumnNames.DATETIME: "2019-05-06", ColumnNames.VALUE: 208.48},
    {ColumnNames.DATETIME: "2019-05-07", ColumnNames.VALUE: 202.86},
    {ColumnNames.DATETIME: "2019-05-08", ColumnNames.VALUE: 202.9},
    {ColumnNames.DATETIME: "2019-05-09", ColumnNames.VALUE: 200.72},
    {ColumnNames.DATETIME: "2019-05-10", ColumnNames.VALUE: 197.18},
    {ColumnNames.DATETIME: "2019-05-13", ColumnNames.VALUE: 185.72},
    {ColumnNames.DATETIME: "2019-05-14", ColumnNames.VALUE: 188.66},
    {ColumnNames.DATETIME: "2019-05-15", ColumnNames.VALUE: 190.92},
    {ColumnNames.DATETIME: "2019-05-16", ColumnNames.VALUE: 190.08},
    {ColumnNames.DATETIME: "2019-05-17", ColumnNames.VALUE: 191.44},
    {ColumnNames.DATETIME: "2019-05-20", ColumnNames.VALUE: 191.83},
    {ColumnNames.DATETIME: "2019-05-21", ColumnNames.VALUE: 190.04},
    {ColumnNames.DATETIME: "2019-05-22", ColumnNames.VALUE: 186.6},
    {ColumnNames.DATETIME: "2019-05-23", ColumnNames.VALUE: 186.79},
    {ColumnNames.DATETIME: "2019-05-24", ColumnNames.VALUE: 185.72},
    {ColumnNames.DATETIME: "2019-05-28", ColumnNames.VALUE: 188.66},
]

# Sample data for volume charts
series_volume_chart = [
    {ColumnNames.VALUE: 1000000, ColumnNames.DATETIME: 1642425322},
    {ColumnNames.VALUE: 1200000, ColumnNames.DATETIME: 1642511722},
    {ColumnNames.VALUE: 800000, ColumnNames.DATETIME: 1642598122},
    {ColumnNames.VALUE: 1500000, ColumnNames.DATETIME: 1642684522},
    {ColumnNames.VALUE: 900000, ColumnNames.DATETIME: 1642770922},
    {ColumnNames.VALUE: 2000000, ColumnNames.DATETIME: 1642857322},
    {ColumnNames.VALUE: 1800000, ColumnNames.DATETIME: 1642943722},
    {ColumnNames.VALUE: 1600000, ColumnNames.DATETIME: 1643030122},
    {ColumnNames.VALUE: 2200000, ColumnNames.DATETIME: 1643116522},
    {ColumnNames.VALUE: 1900000, ColumnNames.DATETIME: 1643202922},
]

# =============================================================================
# DATA MODEL CONVERSION FUNCTIONS
# =============================================================================


def get_line_data() -> List[LineData]:
    """Get sample line chart data as LineData objects.

    Returns:
        List[LineData]: List of line data points for line charts.

    Example:
        ```python
        from examples.dataSamples import get_line_data

        line_data = get_line_data()
        chart = Chart(series=LineSeries(data=line_data))
        ```
    """
    return [
        LineData(time=item[ColumnNames.DATETIME], value=item[ColumnNames.VALUE])
        for item in series_single_value_data
    ]


def get_bar_data() -> List[BarData]:
    """Get sample bar chart data as BarData objects.

    Returns:
        List[BarData]: List of OHLC data points for bar charts.

    Example:
        ```python
        from examples.dataSamples import get_bar_data

        bar_data = get_bar_data()
        chart = Chart(series=BarSeries(data=bar_data))
        ```
    """
    return [
        BarData(
            time=item[ColumnNames.DATETIME],
            open=item[ColumnNames.OPEN],
            high=item[ColumnNames.HIGH],
            low=item[ColumnNames.LOW],
            close=item[ColumnNames.CLOSE],
        )
        for item in series_bar_chart
    ]


def get_candlestick_data() -> List[CandlestickData]:
    """Get sample candlestick chart data as CandlestickData objects.

    Returns:
        List[CandlestickData]: List of OHLC data points for candlestick charts.

    Example:
        ```python
        from examples.dataSamples import get_candlestick_data

        ohlc_data = get_candlestick_data()
        chart = SinglePaneChart(series=CandlestickSeries(data=ohlc_data))
        ```
    """
    return [
        CandlestickData(
            time=item[ColumnNames.DATETIME],
            open=item[ColumnNames.OPEN],
            high=item[ColumnNames.HIGH],
            low=item[ColumnNames.LOW],
            close=item[ColumnNames.CLOSE],
        )
        for item in series_candlestick_chart
    ]


def get_volume_data() -> List[LineData]:
    """Get sample volume chart data as LineData objects.

    Returns:
        List[LineData]: List of histogram data points for volume charts.

    Example:
        ```python
        from examples.dataSamples import get_volume_data

        volume_data = get_volume_data()
        chart = Chart(series=HistogramSeries(data=volume_data))
        ```
    """
    return [
        LineData(
            time=item[ColumnNames.DATETIME],
            value=item[ColumnNames.VALUE],
            color=item.get("color"),
        )
        for item in series_histogram_chart
    ]


def get_baseline_data() -> List[LineData]:
    """Get sample baseline chart data as LineData objects.

    Returns:
        List[LineData]: List of baseline data points for baseline charts.

    Example:
        ```python
        from examples.dataSamples import get_baseline_data

        baseline_data = get_baseline_data()
        chart = Chart(series=BaselineSeries(data=baseline_data))
        ```
    """
    return [
        LineData(time=item[ColumnNames.DATETIME], value=item[ColumnNames.VALUE])
        for item in series_baseline_chart
    ]


def get_multi_area_data_1() -> List[LineData]:
    """Get first multi-area chart data as LineData objects.

    Returns:
        List[LineData]: List of line data points for area charts.

    Example:
        ```python
        from examples.dataSamples import get_multi_area_data_1

        area_data = get_multi_area_data_1()
        chart = Chart(series=AreaSeries(data=area_data))
        ```
    """
    return [
        LineData(time=item[ColumnNames.DATETIME], value=item[ColumnNames.VALUE])
        for item in series_multiple_chart_area_01
    ]


def get_multi_area_data_2() -> List[LineData]:
    """Get second multi-area chart data as LineData objects.

    Returns:
        List[LineData]: List of line data points for area charts.

    Example:
        ```python
        from examples.dataSamples import get_multi_area_data_2

        area_data = get_multi_area_data_2()
        chart = Chart(series=AreaSeries(data=area_data))
        ```
    """
    return [
        LineData(time=item[ColumnNames.DATETIME], value=item[ColumnNames.VALUE])
        for item in series_multiple_chart_area_02
    ]


def get_volume_histogram_data() -> List[LineData]:
    """Get sample volume histogram data as LineData objects.

    Returns:
        List[LineData]: List of histogram data points for volume charts.

    Example:
        ```python
        from examples.dataSamples import get_volume_histogram_data

        volume_data = get_volume_histogram_data()
        chart = Chart(series=HistogramSeries(data=volume_data))
        ```
    """
    return [
        LineData(time=item[ColumnNames.DATETIME], value=item[ColumnNames.VALUE])
        for item in series_volume_chart
    ]


def get_dataframe_line_data() -> pd.DataFrame:
    """Get sample line chart data as a pandas DataFrame.

    Returns:
        pd.DataFrame: DataFrame with datetime and close columns for line charts.

    Example:
        ```python
        from examples.dataSamples import get_dataframe_line_data

        df = get_dataframe_line_data()
        chart = SinglePaneChart(series=LineSeries(data=df))
        ```
    """
    return pd.DataFrame(series_single_value_data)


def get_dataframe_candlestick_data() -> pd.DataFrame:
    """Get sample candlestick chart data as a pandas DataFrame.

    Returns:
        pd.DataFrame: DataFrame with OHLC columns for candlestick charts.

    Example:
        ```python
        from examples.dataSamples import get_dataframe_candlestick_data

        df = get_dataframe_candlestick_data()
        chart = SinglePaneChart(series=CandlestickSeries(data=df))
        ```
    """
    return pd.DataFrame(series_candlestick_chart)


def get_dataframe_volume_data() -> pd.DataFrame:
    """Get sample volume chart data as a pandas DataFrame.

    Returns:
        pd.DataFrame: DataFrame with datetime and value columns for volume charts.

    Example:
        ```python
        from examples.dataSamples import get_dataframe_volume_data

        df = get_dataframe_volume_data()
        chart = SinglePaneChart(series=HistogramSeries(data=df))
        ```
    """
    return pd.DataFrame(series_volume_chart)


# =============================================================================
# CONVENIENCE FUNCTIONS FOR COMMON USE CASES
# =============================================================================


def get_sample_data_for_chart_type(chart_type: str) -> Union[List, pd.DataFrame]:
    """Get sample data for a specific chart type.

    Args:
        chart_type: Type of chart ("line", "candlestick", ColumnNames.VOLUME, "baseline", "area").

    Returns:
        Union[List, pd.DataFrame]: Sample data appropriate for the chart type.

    Raises:
        ValueError: If chart_type is not supported.

    Example:
        ```python
        from examples.dataSamples import get_sample_data_for_chart_type

        # Get data for different chart types
        line_data = get_sample_data_for_chart_type("line")
        candlestick_data = get_sample_data_for_chart_type("candlestick")
        ```
    """
    chart_type = chart_type.lower()

    if chart_type == "line":
        return get_line_data()
    if chart_type == "candlestick":
        return get_candlestick_data()
    if chart_type == ColumnNames.VOLUME:
        return get_volume_data()
    if chart_type == "baseline":
        return get_baseline_data()
    if chart_type == "area":
        return get_multi_area_data_1()
    if chart_type == "histogram":
        return get_volume_histogram_data()
    raise ValueError(f"Unsupported chart type: {chart_type}")


def get_all_sample_datasets() -> Dict[str, Union[List, pd.DataFrame]]:
    """Get all available sample datasets.

    Returns:
        Dict[str, Union[List, pd.DataFrame]]: Dictionary mapping chart types to sample data.

    Example:
        ```python
        from examples.dataSamples import get_all_sample_datasets

        datasets = get_all_sample_datasets()
        for chart_type, data in datasets.items():
            print(f"{chart_type}: {len(data)} data points")
        ```
    """
    return {
        "line": get_line_data(),
        "candlestick": get_candlestick_data(),
        ColumnNames.VOLUME: get_volume_data(),
        "baseline": get_baseline_data(),
        "area_1": get_multi_area_data_1(),
        "area_2": get_multi_area_data_2(),
        "histogram": get_volume_histogram_data(),
        "dataframe_line": get_dataframe_line_data(),
        "dataframe_candlestick": get_dataframe_candlestick_data(),
        "dataframe_volume": get_dataframe_volume_data(),
    }
