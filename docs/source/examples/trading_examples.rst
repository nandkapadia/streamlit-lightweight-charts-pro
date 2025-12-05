Trading Examples
================

Real-world trading visualization examples with indicators, annotations, and overlays.

Price Chart with Bollinger Bands
---------------------------------

.. code-block:: python

   import streamlit as st
   from streamlit_lightweight_charts_pro import renderChart
   import pandas as pd
   import numpy as np

   # Generate price data
   dates = pd.date_range('2023-01-01', periods=200)
   prices = 100 + np.cumsum(np.random.randn(200) * 2)

   # Calculate Bollinger Bands
   rolling_mean = pd.Series(prices).rolling(20).mean()
   rolling_std = pd.Series(prices).rolling(20).std()
   upper_band = rolling_mean + (rolling_std * 2)
   lower_band = rolling_mean - (rolling_std * 2)

   # Prepare data
   df_price = pd.DataFrame({'time': dates, 'value': prices})
   df_upper = pd.DataFrame({'time': dates, 'value': upper_band})
   df_lower = pd.DataFrame({'time': dates, 'value': lower_band})
   df_middle = pd.DataFrame({'time': dates, 'value': rolling_mean})

   # Render chart
   renderChart(
       df_price,
       title="Price with Bollinger Bands",
       height=500,
       seriesType='line',
       lineColor='#2962FF',
       lineWidth=2,
       additionalSeries=[
           {
               'data': df_upper,
               'type': 'line',
               'options': {
                   'color': 'rgba(239, 83, 80, 0.5)',
                   'lineWidth': 1
               }
           },
           {
               'data': df_middle,
               'type': 'line',
               'options': {
                   'color': 'rgba(255, 152, 0, 0.8)',
                   'lineWidth': 1
               }
           },
           {
               'data': df_lower,
               'type': 'line',
               'options': {
                   'color': 'rgba(38, 166, 154, 0.5)',
                   'lineWidth': 1
               }
           }
       ]
   )

OHLC with Volume
----------------

Candlestick chart with volume overlay:

.. code-block:: python

   # Generate OHLC data
   ohlc_data = []
   volume_data = []
   base = 100

   for i, date in enumerate(dates):
       open_price = base + np.random.randn()
       close_price = open_price + np.random.randn() * 2
       high_price = max(open_price, close_price) + abs(np.random.randn())
       low_price = min(open_price, close_price) - abs(np.random.randn())
       volume = np.random.randint(1000, 10000)

       ohlc_data.append({
           'time': date,
           'open': open_price,
           'high': high_price,
           'low': low_price,
           'close': close_price
       })

       # Color volume bars by price direction
       color = '#26a69a' if close_price > open_price else '#ef5350'
       volume_data.append({
           'time': date,
           'value': volume,
           'color': color
       })

       base = close_price

   df_ohlc = pd.DataFrame(ohlc_data)
   df_volume = pd.DataFrame(volume_data)

   # Main chart
   renderChart(
       df_ohlc,
       title="Price",
       height=400,
       seriesType='candlestick'
   )

   # Volume chart
   renderChart(
       df_volume,
       title="Volume",
       height=150,
       seriesType='histogram'
   )

Multi-Timeframe Analysis
-------------------------

Compare different timeframes:

.. code-block:: python

   col1, col2 = st.columns(2)

   with col1:
       # Daily data
       df_daily = df_ohlc.copy()
       renderChart(
           df_daily,
           title="Daily Chart",
           height=400,
           seriesType='candlestick'
       )

   with col2:
       # Weekly data (resample)
       df_weekly = df_ohlc.set_index('time').resample('W').agg({
           'open': 'first',
           'high': 'max',
           'low': 'min',
           'close': 'last'
       }).reset_index()

       renderChart(
           df_weekly,
           title="Weekly Chart",
           height=400,
           seriesType='candlestick'
       )

Support and Resistance Levels
------------------------------

Mark key price levels:

.. code-block:: python

   # Calculate support/resistance
   high_pivot = df_ohlc['high'].rolling(20).max().iloc[-1]
   low_pivot = df_ohlc['low'].rolling(20).min().iloc[-1]

   renderChart(
       df_ohlc,
       title="Support and Resistance",
       height=500,
       seriesType='candlestick',
       priceLines=[
           {
               'price': high_pivot,
               'color': '#ef5350',
               'lineWidth': 2,
               'lineStyle': 'dashed',
               'title': 'Resistance'
           },
           {
               'price': low_pivot,
               'color': '#26a69a',
               'lineWidth': 2,
               'lineStyle': 'dashed',
               'title': 'Support'
           }
       ]
   )

Moving Average Crossover
------------------------

Visualize MA crossover signals:

.. code-block:: python

   # Calculate moving averages
   df_price = pd.DataFrame({
       'time': dates,
       'value': df_ohlc['close']
   })

   ma_fast = df_price['value'].rolling(10).mean()
   ma_slow = df_price['value'].rolling(30).mean()

   df_ma_fast = pd.DataFrame({'time': dates, 'value': ma_fast})
   df_ma_slow = pd.DataFrame({'time': dates, 'value': ma_slow})

   # Find crossover points
   crossovers = []
   for i in range(1, len(ma_fast)):
       if pd.notna(ma_fast.iloc[i]) and pd.notna(ma_slow.iloc[i]):
           # Bullish crossover
           if ma_fast.iloc[i-1] < ma_slow.iloc[i-1] and ma_fast.iloc[i] > ma_slow.iloc[i]:
               crossovers.append({
                   'time': dates[i],
                   'position': 'belowBar',
                   'color': '#26a69a',
                   'shape': 'arrowUp',
                   'text': 'Buy'
               })
           # Bearish crossover
           elif ma_fast.iloc[i-1] > ma_slow.iloc[i-1] and ma_fast.iloc[i] < ma_slow.iloc[i]:
               crossovers.append({
                   'time': dates[i],
                   'position': 'aboveBar',
                   'color': '#ef5350',
                   'shape': 'arrowDown',
                   'text': 'Sell'
               })

   renderChart(
       df_price,
       title="Moving Average Crossover",
       height=500,
       seriesType='line',
       lineColor='#2962FF',
       additionalSeries=[
           {
               'data': df_ma_fast,
               'type': 'line',
               'options': {'color': '#FF6D00', 'lineWidth': 2}
           },
           {
               'data': df_ma_slow,
               'type': 'line',
               'options': {'color': '#00C853', 'lineWidth': 2}
           }
       ],
       markers=crossovers
   )

RSI Indicator
-------------

Add RSI oscillator below price chart:

.. code-block:: python

   # Calculate RSI
   def calculate_rsi(prices, period=14):
       delta = prices.diff()
       gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
       loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
       rs = gain / loss
       rsi = 100 - (100 / (1 + rs))
       return rsi

   rsi = calculate_rsi(df_ohlc['close'])
   df_rsi = pd.DataFrame({'time': dates, 'value': rsi})

   # Price chart
   renderChart(
       df_ohlc,
       title="Price",
       height=400,
       seriesType='candlestick'
   )

   # RSI chart
   renderChart(
       df_rsi,
       title="RSI (14)",
       height=150,
       seriesType='line',
       lineColor='#9C27B0',
       priceLines=[
           {'price': 70, 'color': '#ef5350', 'lineStyle': 'dotted'},
           {'price': 30, 'color': '#26a69a', 'lineStyle': 'dotted'}
       ]
   )

Trade Annotations
-----------------

Mark entry and exit points:

.. code-block:: python

   # Simulate trades
   trades = [
       {'time': dates[20], 'type': 'buy', 'price': prices[20]},
       {'time': dates[50], 'type': 'sell', 'price': prices[50]},
       {'time': dates[80], 'type': 'buy', 'price': prices[80]},
       {'time': dates[120], 'type': 'sell', 'price': prices[120]},
   ]

   markers = []
   for trade in trades:
       if trade['type'] == 'buy':
           markers.append({
               'time': trade['time'],
               'position': 'belowBar',
               'color': '#26a69a',
               'shape': 'arrowUp',
               'text': f"Buy @ {trade['price']:.2f}"
           })
       else:
           markers.append({
               'time': trade['time'],
               'position': 'aboveBar',
               'color': '#ef5350',
               'shape': 'arrowDown',
               'text': f"Sell @ {trade['price']:.2f}"
           })

   renderChart(
       df_price,
       title="Trade History",
       height=500,
       seriesType='line',
       markers=markers
   )

Real-Time Data Feed
-------------------

Simulate real-time updates:

.. code-block:: python

   import time

   placeholder = st.empty()
   stop_button = st.button("Stop")

   # Initialize data
   current_data = df_ohlc[:50].copy()

   # Streaming loop
   idx = 50
   while not stop_button and idx < len(df_ohlc):
       # Add new bar
       current_data = pd.concat([
           current_data,
           df_ohlc.iloc[[idx]]
       ])

       # Update chart
       with placeholder:
           renderChart(
               current_data,
               title=f"Real-Time Chart ({len(current_data)} bars)",
               height=500,
               seriesType='candlestick'
           )

       idx += 1
       time.sleep(0.1)  # Update every 100ms

Complete Trading Dashboard
---------------------------

Full example combining multiple features:

.. code-block:: python

   st.set_page_config(layout="wide")
   st.title("Trading Dashboard")

   # Sidebar controls
   symbol = st.sidebar.selectbox("Symbol", ["AAPL", "GOOGL", "MSFT"])
   timeframe = st.sidebar.selectbox("Timeframe", ["1D", "1W", "1M"])

   # Main layout
   col1, col2 = st.columns([3, 1])

   with col1:
       # Price chart with indicators
       st.subheader("Price Chart")
       renderChart(df_ohlc, height=400, seriesType='candlestick')

       # Volume
       st.subheader("Volume")
       renderChart(df_volume, height=150, seriesType='histogram')

       # RSI
       st.subheader("RSI")
       renderChart(df_rsi, height=150, seriesType='line')

   with col2:
       # Stats panel
       st.metric("Last Price", f"${prices[-1]:.2f}")
       st.metric("Change", f"{((prices[-1] - prices[-2]) / prices[-2] * 100):.2f}%")
       st.metric("Volume", f"{int(df_volume['value'].iloc[-1]):,}")

       # Trade controls
       st.button("Buy", type="primary")
       st.button("Sell")

Tips for Trading Charts
------------------------

1. **Multiple Timeframes**: Always analyze multiple timeframes
2. **Volume**: Include volume for confirmation
3. **Indicators**: Don't overcrowd - use 2-3 key indicators
4. **Colors**: Use consistent color scheme (green=up, red=down)
5. **Annotations**: Mark important levels and trades
6. **Performance**: For real-time, update incrementally
7. **Validation**: Validate data before rendering
8. **Error Handling**: Handle missing/invalid data gracefully
