Quick Start Guide
=================

This guide will get you started with Streamlit Lightweight Charts Pro in minutes.

Basic Usage
-----------

1. **Import the library**:

.. code-block:: python

   import streamlit as st
   from streamlit_lightweight_charts_pro import renderChart
   import pandas as pd

2. **Prepare your data**:

.. code-block:: python

   # Create sample data
   data = pd.DataFrame({
       'time': pd.date_range('2023-01-01', periods=100),
       'value': range(100, 200)
   })

3. **Render the chart**:

.. code-block:: python

   renderChart(data, title="My First Chart", height=400)

Complete Example
----------------

.. code-block:: python

   import streamlit as st
   from streamlit_lightweight_charts_pro import renderChart
   import pandas as pd
   import numpy as np

   st.title("Financial Chart Example")

   # Generate sample candlestick data
   dates = pd.date_range('2023-01-01', periods=100)
   np.random.seed(42)

   data = pd.DataFrame({
       'time': dates,
       'open': 100 + np.cumsum(np.random.randn(100)),
       'high': 100 + np.cumsum(np.random.randn(100)) + 2,
       'low': 100 + np.cumsum(np.random.randn(100)) - 2,
       'close': 100 + np.cumsum(np.random.randn(100)),
   })

   # Render candlestick chart
   renderChart(
       data,
       title="Stock Price",
       height=500,
       seriesType='candlestick'
   )

Multiple Series
---------------

Add multiple series to a single chart:

.. code-block:: python

   from streamlit_lightweight_charts_pro import renderChart

   # Main price data
   price_data = pd.DataFrame({
       'time': pd.date_range('2023-01-01', periods=100),
       'value': 100 + np.cumsum(np.random.randn(100))
   })

   # Volume data
   volume_data = pd.DataFrame({
       'time': pd.date_range('2023-01-01', periods=100),
       'value': np.random.randint(1000, 10000, 100)
   })

   renderChart(
       price_data,
       title="Price with Volume",
       height=500,
       additionalSeries=[
           {'data': volume_data, 'type': 'histogram'}
       ]
   )

Interactive Features
--------------------

Handle user interactions:

.. code-block:: python

   result = renderChart(
       data,
       title="Interactive Chart",
       height=400,
       key="my_chart"
   )

   if result:
       st.write("Chart state:", result)

Customization
-------------

Customize chart appearance:

.. code-block:: python

   renderChart(
       data,
       title="Customized Chart",
       height=600,
       seriesType='area',
       lineColor='#2962FF',
       topColor='rgba(41, 98, 255, 0.3)',
       bottomColor='rgba(41, 98, 255, 0.0)',
       lineWidth=2
   )

Common Patterns
---------------

**Pattern 1: Real-time Updates**

.. code-block:: python

   import time

   placeholder = st.empty()

   while True:
       # Fetch new data
       new_data = fetch_latest_data()

       # Update chart
       with placeholder:
           renderChart(new_data, height=400)

       time.sleep(1)

**Pattern 2: User Controls**

.. code-block:: python

   # Sidebar controls
   chart_type = st.sidebar.selectbox(
       "Chart Type",
       ["line", "area", "candlestick"]
   )

   height = st.sidebar.slider("Height", 300, 800, 400)

   # Render with user settings
   renderChart(
       data,
       seriesType=chart_type,
       height=height
   )

Next Steps
----------

* Explore the :doc:`api/index` for detailed API reference
* Check out :doc:`examples/index` for advanced use cases
* Read :doc:`migration` for upgrade guides
