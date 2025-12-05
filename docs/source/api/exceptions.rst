Exceptions
==========

All custom exceptions raised by Streamlit Lightweight Charts Pro.

Exception Hierarchy
-------------------

.. code-block:: text

   StreamlitLightweightChartsProError (base)
   ├── ConfigurationError
   │   ├── ComponentNotAvailableError
   │   └── InvalidConfigurationError
   ├── ValidationError
   │   ├── InvalidDataError
   │   ├── InvalidColorError
   │   ├── InvalidSeriesTypeError
   │   └── InvalidCoordinateError
   └── DataProcessingError
       ├── SerializationError
       └── DataTransformError

Exception Classes
-----------------

.. automodule:: streamlit_lightweight_charts_pro.exceptions
   :members:
   :undoc-members:
   :show-inheritance:

Usage Examples
--------------

**Catching specific exceptions**:

.. code-block:: python

   from streamlit_lightweight_charts_pro import renderChart
   from streamlit_lightweight_charts_pro.exceptions import (
       InvalidDataError,
       InvalidColorError
   )

   try:
       renderChart(data, lineColor="invalid-color")
   except InvalidColorError as e:
       st.error(f"Invalid color: {e}")
   except InvalidDataError as e:
       st.error(f"Data error: {e}")

**Catching all package exceptions**:

.. code-block:: python

   from streamlit_lightweight_charts_pro.exceptions import (
       StreamlitLightweightChartsProError
   )

   try:
       renderChart(data)
   except StreamlitLightweightChartsProError as e:
       st.error(f"Chart error: {e}")
