"""Data-Aware Range Switcher Example for Streamlit Lightweight Charts Pro.

Demonstrates how to configure `RangeSwitcherOptions` with `RangeConfig` presets
matched to the granularity and timespan of the underlying OHLC dataset.
"""

from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import (
    CandlestickSeries,
    Chart,
    ChartOptions,
    LegendOptions,
)
from streamlit_lightweight_charts_pro.charts.options.ui_options import (
    RangeConfig,
    RangeSwitcherOptions,
    TimeRange,
)

OHLC_COLUMN_MAPPING = {
    "time": "time",
    "open": "open",
    "high": "high",
    "low": "low",
    "close": "close",
}


def generate_ohlc_dataframe(granularity: str) -> pd.DataFrame:
    """Generate sample OHLC data at the requested timeframe granularity."""
    rng = np.random.default_rng(42)

    if granularity == "5m Intraday (2 days)":
        periods = 2 * 24 * 12
        step = timedelta(minutes=5)
        start = datetime(2024, 1, 10, 0, 0)
    elif granularity == "1h Hourly (30 days)":
        periods = 30 * 24
        step = timedelta(hours=1)
        start = datetime(2024, 1, 1, 0, 0)
    else:
        periods = 365
        step = timedelta(days=1)
        start = datetime(2023, 6, 1, 0, 0)

    price = 100.0
    rows = []
    for i in range(periods):
        timestamp = int((start + i * step).timestamp())
        delta = rng.normal(0.02, 0.8)
        open_px = price
        close_px = max(10.0, open_px + delta)
        high_px = max(open_px, close_px) + abs(rng.normal(0.0, 0.4))
        low_px = max(1.0, min(open_px, close_px) - abs(rng.normal(0.0, 0.4)))
        price = close_px
        rows.append(
            {
                "time": timestamp,
                "open": round(open_px, 2),
                "high": round(high_px, 2),
                "low": round(low_px, 2),
                "close": round(close_px, 2),
            }
        )

    return pd.DataFrame(rows)


def build_ranges_for_granularity(granularity: str) -> list[RangeConfig]:
    """Return range presets tailored to the selected dataset granularity."""
    if granularity == "5m Intraday (2 days)":
        return [
            RangeConfig(text="5m", tooltip="Last 5 minutes", range=TimeRange.FIVE_MINUTES),
            RangeConfig(text="15m", tooltip="Last 15 minutes", range=TimeRange.FIFTEEN_MINUTES),
            RangeConfig(text="1H", tooltip="Last 1 hour", range=TimeRange.ONE_HOUR),
            RangeConfig(text="4H", tooltip="Last 4 hours", range=TimeRange.FOUR_HOURS),
            RangeConfig(text="1D", tooltip="Last 1 day", range=TimeRange.ONE_DAY),
            RangeConfig(text="ALL", tooltip="All data", range=TimeRange.ALL),
        ]
    if granularity == "1h Hourly (30 days)":
        return [
            RangeConfig(text="4H", tooltip="Last 4 hours", range=TimeRange.FOUR_HOURS),
            RangeConfig(text="1D", tooltip="Last 1 day", range=TimeRange.ONE_DAY),
            RangeConfig(text="1W", tooltip="Last 1 week", range=TimeRange.ONE_WEEK),
            RangeConfig(text="1M", tooltip="Last 1 month", range=TimeRange.ONE_MONTH),
            RangeConfig(text="ALL", tooltip="All data", range=TimeRange.ALL),
        ]
    return [
        RangeConfig(text="1W", tooltip="Last 1 week", range=TimeRange.ONE_WEEK),
        RangeConfig(text="1M", tooltip="Last 1 month", range=TimeRange.ONE_MONTH),
        RangeConfig(text="3M", tooltip="Last 3 months", range=TimeRange.THREE_MONTHS),
        RangeConfig(text="6M", tooltip="Last 6 months", range=TimeRange.SIX_MONTHS),
        RangeConfig(text="1Y", tooltip="Last 1 year", range=TimeRange.ONE_YEAR),
        RangeConfig(text="ALL", tooltip="All data", range=TimeRange.ALL),
    ]


def main() -> None:
    """Render the Streamlit page."""
    st.set_page_config(page_title="Data-Aware Range Switcher", layout="wide")
    st.title("Data-Aware Range Switcher Example")

    granularity = st.selectbox(
        "Dataset Granularity",
        ["5m Intraday (2 days)", "1h Hourly (30 days)", "1d Daily (1 year)"],
        index=2,
    )
    position = st.selectbox(
        "Range Switcher Position",
        ["top-right", "top-left", "bottom-right", "bottom-left"],
        index=0,
    )

    df = generate_ohlc_dataframe(granularity)
    ranges = build_ranges_for_granularity(granularity)

    series = CandlestickSeries(data=df, column_mapping=OHLC_COLUMN_MAPPING)
    series.title = "Price"
    series.legend = LegendOptions(visible=True, position="top-left", text="Price: $$value$$")

    options = ChartOptions(
        height=550,
        range_switcher=RangeSwitcherOptions(
            visible=True,
            ranges=ranges,
            position=position,  # type: ignore[arg-type]
        ),
    )

    chart = Chart(series=series, options=options)
    chart.render(key=f"range_switcher_{granularity}")


if __name__ == "__main__":
    main()
