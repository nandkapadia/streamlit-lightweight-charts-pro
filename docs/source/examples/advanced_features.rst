Advanced Features
=================

This page demonstrates advanced features like multiple series, custom styling, and primitives.

Multiple Series
---------------

Display multiple data series on a single chart:

.. code-block:: python

   import streamlit as st
   from streamlit_lightweight_charts_pro import renderChart
   import pandas as pd
   import numpy as np

   # Generate main price data
   dates = pd.date_range('2023-01-01', periods=100)
   prices = 100 + np.cumsum(np.random.randn(100) * 2)

   df_price = pd.DataFrame({
       'time': dates,
       'value': prices
   })

   # Generate moving averages
   df_ma20 = pd.DataFrame({
       'time': dates,
       'value': pd.Series(prices).rolling(20).mean()
   })

   df_ma50 = pd.DataFrame({
       'time': dates,
       'value': pd.Series(prices).rolling(50).mean()
   })

   # Render with multiple series
   renderChart(
       df_price,
       title="Price with Moving Averages",
       height=500,
       seriesType='line',
       lineColor='#2962FF',
       lineWidth=2,
       additionalSeries=[
           {
               'data': df_ma20,
               'type': 'line',
               'options': {
                   'color': '#FF6D00',
                   'lineWidth': 1
               }
           },
           {
               'data': df_ma50,
               'type': 'line',
               'options': {
                   'color': '#00C853',
                   'lineWidth': 1
               }
           }
       ]
   )

Custom Styling
--------------

Advanced chart styling options:

.. code-block:: python

   renderChart(
       data,
       title="Custom Styled Chart",
       height=500,
       seriesType='area',
       # Line styling
       lineColor='#2962FF',
       lineWidth=3,
       lineStyle='solid',  # 'solid', 'dotted', 'dashed'
       # Area fill
       topColor='rgba(41, 98, 255, 0.4)',
       bottomColor='rgba(41, 98, 255, 0.0)',
       # Chart layout
       layout={
           'background': {'color': '#ffffff'},
           'textColor': '#333333',
           'fontSize': 12,
           'fontFamily': 'Arial'
       },
       # Grid lines
       grid={
           'vertLines': {'color': 'rgba(197, 203, 206, 0.5)'},
           'horzLines': {'color': 'rgba(197, 203, 206, 0.5)'}
       },
       # Price scale
       priceScale={
           'borderColor': '#cccccc',
           'autoScale': True,
           'scaleMargins': {
               'top': 0.1,
               'bottom': 0.1
           }
       },
       # Time scale
       timeScale={
           'borderColor': '#cccccc',
           'timeVisible': True,
           'secondsVisible': False
       }
   )

Dark Theme
----------

Dark theme configuration:

.. code-block:: python

   renderChart(
       data,
       title="Dark Theme Chart",
       height=500,
       seriesType='candlestick',
       upColor='#26a69a',
       downColor='#ef5350',
       layout={
           'background': {'color': '#1e222d'},
           'textColor': '#d1d4dc'
       },
       grid={
           'vertLines': {'color': 'rgba(42, 46, 57, 0.5)'},
           'horzLines': {'color': 'rgba(42, 46, 57, 0.5)'}
       },
       priceScale={
           'borderColor': '#2b2b43'
       },
       timeScale={
           'borderColor': '#2b2b43',
           'timeVisible': True
       }
   )

Crosshair Customization
-----------------------

Customize crosshair behavior:

.. code-block:: python

   renderChart(
       data,
       title="Custom Crosshair",
       height=500,
       crosshair={
           'mode': 'normal',  # 'normal', 'magnet'
           'vertLine': {
               'color': '#9598a1',
               'width': 1,
               'style': 'dashed',
               'labelBackgroundColor': '#2962FF'
           },
           'horzLine': {
               'color': '#9598a1',
               'width': 1,
               'style': 'dashed',
               'labelBackgroundColor': '#2962FF'
           }
       }
   )

Price Lines and Markers
-----------------------

Add price lines and markers:

.. code-block:: python

   # This feature requires custom event handling
   # See examples for complete implementation
   renderChart(
       data,
       title="Chart with Price Lines",
       height=500,
       priceLines=[
           {
               'price': 105.0,
               'color': '#26a69a',
               'lineWidth': 2,
               'lineStyle': 'dashed',
               'title': 'Target'
           },
           {
               'price': 95.0,
               'color': '#ef5350',
               'lineWidth': 2,
               'lineStyle': 'dashed',
               'title': 'Stop Loss'
           }
       ]
   )

Responsive Charts
-----------------

Create responsive charts that adapt to container size:

.. code-block:: python

   # Auto-width chart
   renderChart(
       data,
       title="Responsive Chart",
       height=500,
       autosize=True,
       timeScale={
           'rightOffset': 12,
           'barSpacing': 3,
           'fixLeftEdge': True,
           'lockVisibleTimeRangeOnResize': True,
           'rightBarStaysOnScroll': True,
           'borderVisible': False,
           'visible': True,
           'timeVisible': True,
           'secondsVisible': False
       }
   )

Performance Optimization
------------------------

Optimize for large datasets:

.. code-block:: python

   # Large dataset (10,000+ points)
   dates = pd.date_range('2020-01-01', periods=10000)
   values = 100 + np.cumsum(np.random.randn(10000) * 0.5)

   df_large = pd.DataFrame({
       'time': dates,
       'value': values
   })

   renderChart(
       df_large,
       title="Large Dataset Chart",
       height=500,
       seriesType='line',
       # Performance settings
       timeScale={
           'barSpacing': 3,
           'minBarSpacing': 0.5
       },
       # Reduce visual updates
       handleScroll=False,
       handleScale=False
   )

Interactive Features
--------------------

Handle chart interactions:

.. code-block:: python

   # Get chart state
   result = renderChart(
       data,
       title="Interactive Chart",
       height=500,
       key="interactive_chart"
   )

   # Process result
   if result:
       if 'click' in result:
           st.write(f"Clicked at: {result['click']}")
       if 'crosshair' in result:
           st.write(f"Crosshair at: {result['crosshair']}")

Synchronized Charts
-------------------

Synchronize multiple charts:

.. code-block:: python

   # Create two synchronized charts
   col1, col2 = st.columns(2)

   with col1:
       result1 = renderChart(
           df_price,
           title="Price",
           height=400,
           key="chart1",
           sync_group="sync1"
       )

   with col2:
       result2 = renderChart(
           df_volume,
           title="Volume",
           height=400,
           seriesType='histogram',
           key="chart2",
           sync_group="sync1"
       )

Tips
----

1. **Multiple Series**: Use additionalSeries for overlay indicators
2. **Styling**: Customize colors, fonts, and layout for branding
3. **Dark Theme**: Use dark background colors for night mode
4. **Crosshair**: Customize for better UX
5. **Performance**: For >10k points, reduce visual updates
6. **Responsive**: Use autosize for fluid layouts
7. **Interactive**: Use key parameter to track state
8. **Sync**: Use sync_group for coordinated charts
