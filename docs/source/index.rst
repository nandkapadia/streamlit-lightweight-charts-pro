Streamlit Lightweight Charts Pro Documentation
===============================================

**Streamlit Lightweight Charts Pro** is a high-performance wrapper for TradingView's Lightweight Charts library,
optimized for Streamlit applications with an ultra-simplified API.

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   installation
   quickstart
   api/index
   examples/index
   migration
   contributing

Quick Links
-----------

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

Overview
--------

This package provides:

* **Ultra-simplified API**: Create professional financial charts with minimal code
* **Performance optimized**: Handles large datasets efficiently
* **Bidirectional communication**: Python ↔ React data flow
* **Type-safe**: Comprehensive type hints and validation
* **Trading primitives**: Built-in support for bands, ribbons, annotations

Installation
------------

.. code-block:: bash

   pip install streamlit-lightweight-charts-pro

Quick Example
-------------

.. code-block:: python

   import streamlit as st
   from streamlit_lightweight_charts_pro import renderChart
   import pandas as pd

   # Sample data
   data = pd.DataFrame({
       'time': pd.date_range('2023-01-01', periods=100),
       'value': range(100)
   })

   # Render chart
   renderChart(data, title="My Chart", height=400)

Features
--------

**Core Components**:

* Chart rendering with multiple series types (line, area, candlestick, etc.)
* Interactive primitives (bands, ribbons, annotations)
* Real-time data updates
* Customizable styling and layout

**Performance Features**:

* Efficient data serialization
* Optimized rendering pipeline
* Memory-conscious data handling
* Production-ready build system

**Developer Experience**:

* Comprehensive type hints
* Google-style docstrings
* Extensive test coverage
* Clear error messages

Indices and Tables
------------------

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
