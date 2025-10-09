"""
Simple Series Test Harness

A simplified test harness that tests all series types with minimal configuration.
This is easier to maintain and focuses on core functionality testing.
"""

import math
import random
from datetime import datetime, timedelta

import numpy as np
import streamlit as st

# Import core series types
from streamlit_lightweight_charts_pro import (
    AreaSeries,
    BandSeries,
    BarSeries,
    BaselineSeries,
    CandlestickSeries,
    Chart,
    GradientRibbonSeries,
    HistogramSeries,
    LineSeries,
    RibbonSeries,
    SignalSeries,
    TrendFillSeries,
    create_arrow_annotation,
    create_text_annotation,
)
from streamlit_lightweight_charts_pro.data import (
    BandData,
    GradientRibbonData,
    OhlcvData,
    RibbonData,
    SignalData,
    SingleValueData,
    TrendFillData,
)


def generate_nse_synthetic_data(
    symbol: str = "NIFTY50",
    start_price: float = 18000.0,
    days: int = 100,
    start_date: str = "2024-01-01",
    market_hours: bool = True,
    **kwargs,
) -> dict:
    """Generate realistic synthetic NSE data using Geometric Brownian Motion.

    This function creates realistic OHLCV data for Indian stock market symbols
    using GBM with parameters tuned for NSE characteristics.

    Args:
        symbol: Stock symbol (NIFTY50, BANKNIFTY, RELIANCE, etc.)
        start_price: Starting price for the simulation
        days: Number of trading days to generate
        start_date: Start date in YYYY-MM-DD format
        market_hours: If True, generates intraday data (9:15 AM - 3:30 PM)
        **kwargs: Additional parameters for customization

    Returns:
        dict: Contains 'ohlcv_data', 'line_data', 'volume_data', 'times'

    Example:
        ```python
        # Generate NIFTY50 data
        data = generate_nse_synthetic_data("NIFTY50", 18000, 50)

        # Generate intraday BANKNIFTY data
        data = generate_nse_synthetic_data("BANKNIFTY", 45000, 30, market_hours=True)
        ```
    """
    # Create numpy random generator
    rng = np.random.default_rng()

    # NSE-specific parameters based on symbol - enhanced for better trends
    nse_params = {
        "NIFTY50": {"drift": 0.0015, "volatility": 0.025, "volume_base": 50000000},
        "BANKNIFTY": {"drift": 0.002, "volatility": 0.030, "volume_base": 30000000},
        "RELIANCE": {"drift": 0.0012, "volatility": 0.020, "volume_base": 2000000},
        "TCS": {"drift": 0.0008, "volatility": 0.018, "volume_base": 1500000},
        "HDFC": {"drift": 0.0013, "volatility": 0.022, "volume_base": 1000000},
        "INFY": {"drift": 0.0010, "volatility": 0.019, "volume_base": 1200000},
    }

    # Get parameters for the symbol or use defaults
    params = nse_params.get(symbol, {"drift": 0.0007, "volatility": 0.015, "volume_base": 10000000})

    # Override with custom parameters if provided
    drift = kwargs.get("drift", params["drift"])
    volatility = kwargs.get("volatility", params["volatility"])
    volume_base = kwargs.get("volume_base", params["volume_base"])

    # Generate time series
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")

    if market_hours:
        # Intraday data: 9:15 AM to 3:30 PM (6.25 hours = 375 minutes)
        times = []
        for day in range(days):
            for minute in range(0, 375, 5):  # 5-minute intervals
                current_time = start_dt + timedelta(days=day, minutes=minute)
                # Skip weekends (Saturday=5, Sunday=6)
                if current_time.weekday() < 5:
                    times.append(current_time.strftime("%Y-%m-%dT%H:%M:%S"))
        data_points = len(times)
        dt = 1 / (252 * 75)  # 252 trading days * 75 intervals per day
    else:
        # Daily data
        times = []
        for day in range(days):
            current_time = start_dt + timedelta(days=day)
            # Skip weekends
            if current_time.weekday() < 5:
                times.append(current_time.strftime("%Y-%m-%dT%H:%M:%S"))
        data_points = len(times)
        dt = 1 / 252  # 252 trading days per year

    # Generate price path using Geometric Brownian Motion with trend phases
    prices = [start_price]

    # Define trend phases for 180 days (approximately 6 months)
    trend_phases = [
        (0, 30, 1.5),  # Strong uptrend
        (30, 60, -1.2),  # Downtrend
        (60, 90, 2.0),  # Very strong uptrend
        (90, 120, -1.8),  # Strong downtrend
        (120, 150, 1.0),  # Moderate uptrend
        (150, 180, -0.8),  # Mild downtrend
    ]

    for i in range(1, data_points):
        # Determine current trend phase
        trend_multiplier = 1.0
        for start_day, end_day, strength in trend_phases:
            if start_day <= i < end_day:
                trend_multiplier = strength
                break

        # GBM formula with trend bias: S(t) = S(0) * exp((μ - σ²/2) * t + σ * W(t))
        # where μ = drift * trend_multiplier, σ = volatility, W(t) = Wiener process

        # Random shock (Wiener process)
        random_shock = rng.normal(0, 1)

        # Apply trend multiplier to drift
        adjusted_drift = drift * trend_multiplier

        # GBM price change with trend bias
        price_change = adjusted_drift * dt + volatility * math.sqrt(dt) * random_shock

        # Calculate new price
        new_price = prices[-1] * math.exp(price_change)
        prices.append(new_price)

    # Generate OHLCV data from price path
    ohlcv_data = []
    line_data = []
    volume_data = []

    for i in range(data_points):
        current_price = prices[i]

        if market_hours:
            # Intraday: generate realistic OHLC from price
            # Add some intraday volatility
            intraday_vol = volatility * 0.3  # 30% of daily volatility

            # Generate high and low with realistic spreads
            spread = current_price * intraday_vol * math.sqrt(dt)
            high = current_price + abs(rng.normal(0, spread))
            low = current_price - abs(rng.normal(0, spread))

            # Ensure high >= low and both are reasonable
            high = max(high, current_price)
            low = min(low, current_price)

            # Generate open and close
            if i == 0:
                open_price = current_price
            else:
                # Open is close of previous candle with some gap
                gap = rng.normal(0, spread * 0.5)
                open_price = prices[i - 1] + gap
                open_price = max(open_price, low)
                open_price = min(open_price, high)

            close = current_price

            # Volume with intraday patterns (higher at open/close)
            hour = int(times[i].split("T")[1].split(":")[0])
            if hour in [9, 15]:  # Market open/close
                volume_multiplier = 2.0
            elif hour in [10, 11, 14]:  # Active hours
                volume_multiplier = 1.5
            else:  # Lunch time
                volume_multiplier = 0.8

        else:
            # Daily data: create more realistic OHLC with smaller wicks and better trends
            # Reduce the high-low spread significantly
            daily_vol = current_price * volatility * 0.3  # Much smaller volatility for wicks

            # Generate more realistic high and low (smaller wicks)
            high_spread = abs(rng.normal(0, daily_vol * 0.3))  # Smaller high wick
            low_spread = abs(rng.normal(0, daily_vol * 0.3))  # Smaller low wick

            high = current_price + high_spread
            low = current_price - low_spread

            # Ensure high >= low and both are reasonable
            high = max(high, current_price)
            low = min(low, current_price)

            # Generate open and close with trend bias
            if i == 0:
                open_price = current_price
            else:
                # Add trend bias to open price
                price_change = current_price - prices[i - 1]
                trend_bias = price_change * 0.3  # 30% of price change
                open_price = prices[i - 1] + trend_bias + rng.normal(0, daily_vol * 0.1)
                open_price = max(open_price, low)
                open_price = min(open_price, high)

            close = current_price
            volume_multiplier = 1.0

        # Generate volume
        base_volume = volume_base * (current_price / start_price)  # Scale with price
        volume = int(base_volume * volume_multiplier * rng.uniform(0.5, 2.0))

        # Create OHLCV data
        ohlcv_data.append(
            OhlcvData(
                time=times[i],
                open=round(open_price, 2),
                high=round(high, 2),
                low=round(low, 2),
                close=round(close, 2),
                volume=volume,
            ),
        )

        # Create line data (using close price)
        line_data.append(SingleValueData(times[i], round(close, 2)))

        # Create volume data
        volume_data.append(SingleValueData(times[i], volume))

    return {
        "ohlcv_data": ohlcv_data,
        "line_data": line_data,
        "volume_data": volume_data,
        "times": times,
        "symbol": symbol,
        "start_price": start_price,
        "end_price": round(prices[-1], 2),
        "total_return": round((prices[-1] / start_price - 1) * 100, 2),
    }


def calculate_atr(ohlcv_data, period=10):
    """Calculate Average True Range for Supertrend."""
    true_ranges = []
    for i in range(1, len(ohlcv_data)):
        high = ohlcv_data[i].high
        low = ohlcv_data[i].low
        prev_close = ohlcv_data[i - 1].close

        tr = max(
            high - low,
            abs(high - prev_close),
            abs(low - prev_close),
        )
        true_ranges.append(tr)

    # Calculate ATR using simple moving average
    atr_values = []
    for i in range(len(true_ranges)):
        if i < period - 1:
            atr_values.append(sum(true_ranges[: i + 1]) / (i + 1))
        else:
            atr_values.append(sum(true_ranges[i - period + 1 : i + 1]) / period)

    # Ensure ATR values are reasonable and scale with price
    # Add minimum ATR based on current price level
    for i, atr_value in enumerate(atr_values):
        current_price = ohlcv_data[i + 1].close  # +1 because ATR starts from second candle
        min_atr = current_price * 0.02  # 2% of price as minimum ATR
        atr_values[i] = max(atr_value, min_atr)

    return atr_values


def generate_sample_data():
    """Generate sample data with realistic uptrends and downtrends."""
    base_time = datetime(2024, 1, 1)
    data_points = 100  # Increased for better trend visualization

    # Generate timestamps
    times = [
        (base_time + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%S") for i in range(data_points)
    ]

    # Generate OHLCV data with defined trend phases
    ohlcv_data = []
    base_price = 100

    # Define trend phases: (start_index, end_index, trend_strength)
    # Positive = uptrend, Negative = downtrend
    trend_phases = [
        (0, 20, 2.5),  # Very strong uptrend
        (20, 35, -2.0),  # Strong downtrend
        (35, 60, 3.0),  # Extremely strong uptrend
        (60, 80, -2.5),  # Very strong downtrend
        (80, 100, 2.0),  # Strong uptrend
    ]

    for i in range(data_points):
        # Determine current trend strength
        trend_strength = 0
        for start, end, strength in trend_phases:
            if start <= i < end:
                trend_strength = strength
                break

        # Add trend-based movement with some randomness
        trend_change = trend_strength * 1.2  # Even more pronounced trends
        random_noise = random.uniform(-0.2, 0.2)  # Minimal noise to keep trends very clear
        change = trend_change + random_noise

        base_price += change
        base_price = max(50, base_price)  # Floor price

        # Generate OHLC with realistic candle bodies and wicks
        candle_body = random.uniform(0.5, 2.0)
        wick_size = random.uniform(0.3, 1.5)

        # Determine if bullish or bearish candle
        is_bullish = random.random() > 0.5

        if is_bullish:
            open_price = base_price - candle_body / 2
            close = base_price + candle_body / 2
            low = open_price - wick_size
            high = close + wick_size
        else:
            open_price = base_price + candle_body / 2
            close = base_price - candle_body / 2
            low = close - wick_size
            high = open_price + wick_size

        # Ensure high is highest and low is lowest
        high = max(high, open_price, close)
        low = min(low, open_price, close)

        # Volume tends to be higher during strong trends
        volume_base = 5000
        volume_multiplier = 1 + abs(trend_strength) * 0.5
        volume = int(random.randint(volume_base, volume_base * 2) * volume_multiplier)

        ohlcv_data.append(
            OhlcvData(
                time=times[i],
                open=round(open_price, 2),
                high=round(high, 2),
                low=round(low, 2),
                close=round(close, 2),
                volume=volume,
            ),
        )

    # Generate line data
    line_data = [
        SingleValueData(times[i], round(100 + i * 0.5 + random.uniform(-5, 5), 2))
        for i in range(data_points)
    ]

    # Generate volume data
    volume_data = [
        SingleValueData(times[i], random.randint(5000, 15000)) for i in range(data_points)
    ]

    return {
        "ohlcv_data": ohlcv_data,
        "line_data": line_data,
        "volume_data": volume_data,
        "times": times,
    }


def main():
    st.set_page_config(
        page_title="NSE Synthetic Data Test",
        page_icon="📊",
        layout="wide",
        initial_sidebar_state="collapsed",
    )

    st.title("📊 NSE Synthetic Data Test Harness")
    st.markdown(
        "Testing all series types with realistic NSE data generated using Geometric Brownian Motion.",
    )

    # Fixed parameters for 180 days of NIFTY50 data
    symbol = "NIFTY50"
    start_price = 18000.0
    days = 180
    market_hours = False  # Daily data

    # Generate NSE synthetic data
    data = generate_nse_synthetic_data(
        symbol=symbol,
        start_price=start_price,
        days=days,
        market_hours=market_hours,
    )

    # Define Supertrend parameters for display
    atr_period = 10
    multiplier = 3.5

    # Display data summary
    col1, col2, col3, col4, col5 = st.columns(5)

    with col1:
        st.metric("Symbol", symbol)
    with col2:
        st.metric("Start Price", f"₹{data['start_price']:,}")
    with col3:
        st.metric("End Price", f"₹{data['end_price']:,}")
    with col4:
        st.metric("Total Return", f"{data['total_return']:+.2f}%")
    with col5:
        st.metric("Data Points", f"{len(data['ohlcv_data']):,}")

    st.caption(
        f"Time Period: {data['times'][0]} to {data['times'][-1]} | GBM: Drift=0.0015, Vol=0.025 | Supertrend: ATR={atr_period}, Mult={multiplier}",
    )

    # Create columns for side-by-side charts
    col1, col2 = st.columns(2)

    with col1:
        st.subheader(f"{symbol} - Basic Series Types")

        # Line Chart
        st.write("**Price Line**")
        line_chart = Chart(series=LineSeries(data=data["line_data"]))
        line_chart.render(key="line_test")

        # Candlestick Chart
        st.write("**OHLC Candlesticks**")
        candlestick_chart = Chart(series=CandlestickSeries(data=data["ohlcv_data"]))
        candlestick_chart.render(key="candlestick_test")

        # Area Chart
        st.write("**Price Area**")
        area_chart = Chart(series=AreaSeries(data=data["line_data"]))
        area_chart.render(key="area_test")

    with col2:
        st.subheader(f"{symbol} - Advanced Series Types")

        # Bar Chart
        st.write("**OHLC Bars**")
        bar_chart = Chart(series=BarSeries(data=data["ohlcv_data"]))
        bar_chart.render(key="bar_test")

        # Histogram
        st.write("**Volume Histogram**")
        histogram_chart = Chart(series=HistogramSeries(data=data["volume_data"]))
        histogram_chart.render(key="histogram_test")

        # Baseline
        st.write("**Price Baseline**")
        # Calculate mean of line data for baseline value
        line_values = [point.value for point in data["line_data"]]
        data_mean = sum(line_values) / len(line_values)

        baseline_series = BaselineSeries(data=data["line_data"])
        baseline_series.base_value = {"type": "price", "price": round(data_mean, 2)}
        baseline_series.top_fill_color1 = "rgba(76, 175, 80, 0.3)"  # Green for above mean
        baseline_series.bottom_fill_color1 = "rgba(255, 82, 82, 0.3)"  # Red for below mean

        baseline_chart = Chart(series=baseline_series)
        baseline_chart.render(key="baseline_test")

        # Display the calculated mean
        st.caption(f"Baseline set to data mean: ₹{data_mean:,.2f}")

    # Full-width charts
    st.subheader("Special Series Types")

    # Trend Fill (Supertrend-like indicator)
    st.write(f"**{symbol} Supertrend Analysis**")

    # Calculate Supertrend
    multiplier = 3.5  # Increased for wider bands that scale with price
    atr_period = 10  # Standard period for stable ATR calculation
    atr_values = calculate_atr(data["ohlcv_data"], atr_period)

    trend_data = []
    trend_direction = 1  # Start with uptrend
    prev_supertrend = None

    for i in range(len(data["ohlcv_data"])):
        candle = data["ohlcv_data"][i]
        close = candle.close
        high = candle.high
        low = candle.low

        # Calculate basic bands using high and low
        hl_avg = (high + low) / 2

        if i == 0:
            # First point - use simple calculation
            atr = 5.0  # Larger default ATR for first candle
            upper_band = hl_avg + (multiplier * atr)
            lower_band = hl_avg - (multiplier * atr)
            supertrend = lower_band
            trend_direction = 1  # Start with uptrend
        else:
            # Get ATR value (offset by 1 since ATR starts from second candle)
            atr = atr_values[i - 1] if i - 1 < len(atr_values) else atr_values[-1]

            # Ensure ATR is reasonable (not too small)
            atr = max(atr, 2.0)

            # Calculate bands
            upper_band = hl_avg + (multiplier * atr)
            lower_band = hl_avg - (multiplier * atr)

            # Get previous values
            prev_close = data["ohlcv_data"][i - 1].close
            prev_trend = trend_data[i - 1].trend_line
            prev_direction = trend_data[i - 1].trend_direction

            # Adjust bands based on previous supertrend
            if prev_direction == 1:  # Previous was uptrend
                lower_band = max(lower_band, prev_trend)
            else:  # Previous was downtrend
                upper_band = min(upper_band, prev_trend)

            # Determine trend direction and supertrend value
            if close <= lower_band:
                # Price breaks below lower band - downtrend
                supertrend = upper_band
                trend_direction = -1
            elif close >= upper_band:
                # Price breaks above upper band - uptrend
                supertrend = lower_band
                trend_direction = 1
            else:
                # Price is between bands - maintain previous trend
                supertrend = prev_trend
                trend_direction = prev_direction

        trend_data.append(
            TrendFillData(
                time=data["times"][i],
                base_line=close,  # Price line
                trend_line=round(supertrend, 2),  # Supertrend line
                trend_direction=trend_direction,
            ),
        )

    # Create trend fill series with custom colors
    trend_fill_series = TrendFillSeries(
        data=trend_data,
        uptrend_fill_color="rgba(76, 175, 80, 0.3)",  # Green for uptrend
        downtrend_fill_color="rgba(239, 83, 80, 0.3)",  # Red for downtrend
    )

    # Add candlestick series to show price action
    trend_fill_chart = Chart(
        series=[
            CandlestickSeries(data=data["ohlcv_data"]),
            trend_fill_series,
        ],
    )
    trend_fill_chart.render(key="trend_fill_test")

    st.caption(f"Supertrend (ATR Period: {atr_period}, Multiplier: {multiplier})")

    # Band Series
    st.write("**Band Series**")
    band_data = [
        BandData(
            time=data["times"][i],
            upper=105 + i * 0.3,
            middle=100 + i * 0.3,
            lower=95 + i * 0.3,
        )
        for i in range(len(data["times"]))
    ]
    band_chart = Chart(series=BandSeries(data=band_data))
    band_chart.render(key="band_test")

    # Ribbon Series
    st.write("**Ribbon Series**")
    ribbon_data = [
        RibbonData(
            time=data["times"][i],
            upper=105 + i * 0.3,
            lower=95 + i * 0.3,
        )
        for i in range(len(data["times"]))
    ]
    ribbon_chart = Chart(series=RibbonSeries(data=ribbon_data))
    ribbon_chart.render(key="ribbon_test")

    # Gradient Ribbon Series
    st.write("**Gradient Ribbon Series**")
    # Create simple gradient values that go from 0 to 1 for testing
    gradient_ribbon_data = [
        GradientRibbonData(
            time=data["times"][i],
            upper=105 + i * 0.3,
            lower=95 + i * 0.3,
            # Simple gradient from 0 to 1 across the data
            gradient=i / (len(data["times"]) - 1) if len(data["times"]) > 1 else 0.5,
        )
        for i in range(len(data["times"]))
    ]

    # Configure gradient ribbon with custom colors
    gradient_ribbon_series = GradientRibbonSeries(
        data=gradient_ribbon_data,
        gradient_start_color="#4CAF50",  # Green for low gradient
        gradient_end_color="#F44336",  # Red for high gradient
        normalize_gradients=False,  # Use gradient values as-is (0-1)
    )

    gradient_ribbon_chart = Chart(series=gradient_ribbon_series)
    gradient_ribbon_chart.render(key="gradient_ribbon_test")

    # Display gradient information
    st.caption("Gradient: Green (0.0) → Red (1.0) based on data position")

    # Signal Series (with line series for price axis)
    st.write("**Signal Series**")
    signal_data = [
        SignalData(
            time=data["times"][i],
            value=0 if random.random() > 0.7 else 1,  # Random signal values (0 or 1)
        )
        for i in range(len(data["times"]))
    ]
    # Add a line series to ensure price axis is correctly set
    signal_chart = Chart(
        series=[
            LineSeries(data=data["line_data"]),
            SignalSeries(data=signal_data),
        ],
    )
    signal_chart.render(key="signal_test")

    # Multi-pane chart with proper pane configuration
    st.subheader("Multi-Pane Chart")

    # Create chart with multiple panes
    multi_pane_chart = Chart()

    # Add candlestick series to pane 0 (main price pane)
    candlestick_series = multi_pane_chart.add_series(
        CandlestickSeries(data=data["ohlcv_data"], pane_id=0),
    )
    candlestick_series.title = "Price"

    # Add line series to same pane for better visibility
    line_series = multi_pane_chart.add_series(LineSeries(data=data["line_data"], pane_id=2))
    line_series.color = "#2196F3"  # Set color after creation
    line_series.title = "RSI"

    # Add volume histogram to pane 1 (volume pane)
    volume_series = multi_pane_chart.add_series(
        HistogramSeries(data=data["volume_data"], pane_id=1),
    )
    volume_series.title = "Volume"

    multi_pane_chart.render(key="multi_pane_test")

    st.caption("Price candlesticks + line in top pane, volume histogram in bottom pane")

    # Chart with annotations
    st.subheader("Chart with Annotations")
    annotations = [
        create_text_annotation(data["times"][10], 105, "Support"),
        create_arrow_annotation(data["times"][20], 120, "Resistance"),
    ]
    annotation_chart = Chart(
        series=CandlestickSeries(data=data["ohlcv_data"]),
        annotations=annotations,
    )
    annotation_chart.render(key="annotation_test")


if __name__ == "__main__":
    main()
