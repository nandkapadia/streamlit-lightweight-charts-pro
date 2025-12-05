Basic Charts
============

This page demonstrates basic chart types and simple usage patterns.

Line Chart
----------

Simple line chart showing a time series:

.. code-block:: python

   import streamlit as st
   from streamlit_lightweight_charts_pro import renderChart
   import pandas as pd
   import numpy as np

   # Generate sample data
   dates = pd.date_range('2023-01-01', periods=100)
   values = 100 + np.cumsum(np.random.randn(100) * 2)

   data = pd.DataFrame({
       'time': dates,
       'value': values
   })

   # Render line chart
   renderChart(
       data,
       title="Simple Line Chart",
       height=400,
       seriesType='line',
       lineWidth=2,
       lineColor='#2962FF'
   )

Area Chart
----------

Area chart with gradient fill:

.. code-block:: python

   renderChart(
       data,
       title="Area Chart with Gradient",
       height=400,
       seriesType='area',
       lineColor='#2962FF',
       topColor='rgba(41, 98, 255, 0.4)',
       bottomColor='rgba(41, 98, 255, 0.0)',
       lineWidth=2
   )

Candlestick Chart
-----------------

Financial candlestick chart:

.. code-block:: python

   # Generate OHLC data
   dates = pd.date_range('2023-01-01', periods=100)
   np.random.seed(42)

   base = 100
   data = []
   for date in dates:
       open_price = base + np.random.randn()
       close_price = open_price + np.random.randn() * 2
       high_price = max(open_price, close_price) + abs(np.random.randn())
       low_price = min(open_price, close_price) - abs(np.random.randn())

       data.append({
           'time': date,
           'open': open_price,
           'high': high_price,
           'low': low_price,
           'close': close_price
       })
       base = close_price

   df = pd.DataFrame(data)

   renderChart(
       df,
       title="Candlestick Chart",
       height=500,
       seriesType='candlestick',
       upColor='#26a69a',
       downColor='#ef5350',
       borderUpColor='#26a69a',
       borderDownColor='#ef5350',
       wickUpColor='#26a69a',
       wickDownColor='#ef5350'
   )

Histogram Chart
---------------

Volume histogram chart:

.. code-block:: python

   # Generate volume data
   dates = pd.date_range('2023-01-01', periods=100)
   volumes = np.random.randint(1000, 10000, 100)

   volume_data = pd.DataFrame({
       'time': dates,
       'value': volumes,
       'color': ['#26a69a' if i % 2 == 0 else '#ef5350' for i in range(100)]
   })

   renderChart(
       volume_data,
       title="Volume Histogram",
       height=200,
       seriesType='histogram'
   )

Bar Chart
---------

Simple bar chart:

.. code-block:: python

   renderChart(
       data,
       title="Bar Chart",
       height=400,
       seriesType='bar',
       upColor='#26a69a',
       downColor='#ef5350'
   )

Baseline Chart
--------------

Baseline chart with custom base value:

.. code-block:: python

   renderChart(
       data,
       title="Baseline Chart",
       height=400,
       seriesType='baseline',
       baseValue=100,
       topLineColor='#26a69a',
       topFillColor1='rgba(38, 166, 154, 0.28)',
       topFillColor2='rgba(38, 166, 154, 0.05)',
       bottomLineColor='#ef5350',
       bottomFillColor1='rgba(239, 83, 80, 0.05)',
       bottomFillColor2='rgba(239, 83, 80, 0.28)'
   )

Complete Example App
--------------------

Here's a complete Streamlit app with multiple chart types:

.. code-block:: python

   import streamlit as st
   from streamlit_lightweight_charts_pro import renderChart
   import pandas as pd
   import numpy as np

   st.set_page_config(layout="wide")
   st.title("Chart Gallery")

   # Generate data
   np.random.seed(42)
   dates = pd.date_range('2023-01-01', periods=100)

   # OHLC data
   ohlc_data = []
   base = 100
   for date in dates:
       open_price = base + np.random.randn()
       close_price = open_price + np.random.randn() * 2
       high_price = max(open_price, close_price) + abs(np.random.randn())
       low_price = min(open_price, close_price) - abs(np.random.randn())
       ohlc_data.append({
           'time': date,
           'open': open_price,
           'high': high_price,
           'low': low_price,
           'close': close_price
       })
       base = close_price

   df_ohlc = pd.DataFrame(ohlc_data)

   # Line data
   df_line = pd.DataFrame({
       'time': dates,
       'value': df_ohlc['close'].rolling(10).mean()
   })

   # Volume data
   df_volume = pd.DataFrame({
       'time': dates,
       'value': np.random.randint(1000, 10000, 100)
   })

   # Create two columns
   col1, col2 = st.columns(2)

   with col1:
       st.subheader("Candlestick Chart")
       renderChart(df_ohlc, height=400, seriesType='candlestick')

       st.subheader("Line Chart (Moving Average)")
       renderChart(df_line, height=300, seriesType='line')

   with col2:
       st.subheader("Area Chart")
       renderChart(
           df_line,
           height=400,
           seriesType='area',
           topColor='rgba(41, 98, 255, 0.4)',
           bottomColor='rgba(41, 98, 255, 0.0)'
       )

       st.subheader("Volume")
       renderChart(df_volume, height=300, seriesType='histogram')

Tips
----

1. **Data Format**: Always use pandas DataFrame with 'time' column
2. **Time Column**: Can be datetime, date, or Unix timestamp
3. **Value Column**: For line/area charts, use 'value' column
4. **OHLC Columns**: For candlestick charts, use 'open', 'high', 'low', 'close'
5. **Color Column**: Optional 'color' column for per-bar coloring
6. **Height**: Specify chart height in pixels (default: 400)
