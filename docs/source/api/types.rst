Type Definitions
================

This module contains all type definitions used throughout the package.

Main Types Module
-----------------

.. automodule:: streamlit_lightweight_charts_pro.type_definitions
   :members:
   :undoc-members:
   :show-inheritance:

Type Categories
---------------

The type system is organized into:

* **Chart Types**: Basic chart configuration and options
* **Series Types**: Different data series configurations (line, area, candlestick, etc.)
* **Style Types**: Styling and appearance options
* **Data Types**: Data structure definitions
* **Event Types**: User interaction event types

Usage Example
-------------

.. code-block:: python

   from streamlit_lightweight_charts_pro.type_definitions import (
       ChartOptions,
       SeriesType,
       LineStyle
   )

   options: ChartOptions = {
       'height': 400,
       'layout': {
           'background': {'color': '#ffffff'},
           'textColor': '#333333'
       }
   }
