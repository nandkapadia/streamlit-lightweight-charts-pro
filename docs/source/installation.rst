Installation
============

Requirements
------------

* Python ≥ 3.9
* Streamlit ≥ 1.0
* pandas ≥ 1.0
* numpy ≥ 1.19

Basic Installation
------------------

Install from PyPI (when published):

.. code-block:: bash

   pip install streamlit-lightweight-charts-pro

Development Installation
------------------------

Install from GitHub repository:

.. code-block:: bash

   pip install git+https://github.com/nandkapadia/streamlit-lightweight-charts-pro.git@dev

For development with editable install:

.. code-block:: bash

   git clone https://github.com/nandkapadia/streamlit-lightweight-charts-pro.git
   cd streamlit-lightweight-charts-pro
   pip install -e ".[dev,test]"

Verify Installation
-------------------

.. code-block:: python

   import streamlit_lightweight_charts_pro
   print(streamlit_lightweight_charts_pro.__version__)

Dependencies
------------

The package automatically installs:

* **streamlit**: Web app framework
* **pandas**: Data manipulation
* **numpy**: Numerical operations
* **lightweight-charts-pro**: Core Python utilities

Optional Dependencies
---------------------

Development tools:

.. code-block:: bash

   pip install streamlit-lightweight-charts-pro[dev]

Includes: black, isort, pylint, ruff, mypy

Testing tools:

.. code-block:: bash

   pip install streamlit-lightweight-charts-pro[test]

Includes: pytest, pytest-cov, pytest-xdist, hypothesis

Troubleshooting
---------------

**Issue**: Component not rendering

**Solution**: Ensure frontend build exists:

.. code-block:: bash

   cd streamlit_lightweight_charts_pro/frontend
   npm install
   npm run build

**Issue**: Import errors

**Solution**: Verify Python version and dependencies:

.. code-block:: bash

   python --version  # Should be ≥3.9
   pip list | grep streamlit

**Issue**: Type checking errors

**Solution**: Install development dependencies:

.. code-block:: bash

   pip install streamlit-lightweight-charts-pro[dev]
