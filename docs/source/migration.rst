Migration Guide
===============

This guide helps you migrate between versions of Streamlit Lightweight Charts Pro.

v0.2.x → v0.3.0
---------------

Core Package Renamed
~~~~~~~~~~~~~~~~~~~~~

Version 0.3.0 renames the core dependency from ``lightweight-charts-core`` to ``lightweight-charts-pro``.

**Update Dependencies**:

.. code-block:: diff

   # pyproject.toml or requirements.txt
   - lightweight-charts-core>=0.2.0
   + lightweight-charts-pro>=0.3.0

**Update Imports**:

.. code-block:: diff

   # Python code
   - from lightweight_charts_core import BaseChart
   + from lightweight_charts_pro import BaseChart

Lazy Loading Removed
~~~~~~~~~~~~~~~~~~~~~

The lazy loading feature was removed in v0.3.0 as it was not functional for Streamlit components.

**Remove Lazy Loading Code**:

.. code-block:: diff

   - from streamlit_lightweight_charts_pro import (
   -     lazy_chart,
   -     LazyLoadingManager,
   - )
   + from streamlit_lightweight_charts_pro import renderChart

   - chart = lazy_chart(data, chunk_size=1000)
   + chart = renderChart(data)

Breaking Changes
~~~~~~~~~~~~~~~~

1. **Lazy loading functions removed**: ``lazy_chart()``, ``LazyLoadingManager``, etc.
2. **Package rename**: ``lightweight-charts-core`` → ``lightweight-charts-pro``
3. **Configuration changes**: Removed ``lazyLoading`` from chart configuration

No Action Required
~~~~~~~~~~~~~~~~~~

* All existing ``renderChart()`` calls work unchanged
* Chart styling and configuration remain the same
* Type definitions are backward compatible (except lazy loading)

Future Versions
---------------

Future migration guides will be added here as new versions are released.

Best Practices
--------------

When upgrading:

1. **Read the changelog**: Check ``CHANGELOG.md`` for all changes
2. **Test thoroughly**: Run your test suite after upgrading
3. **Update gradually**: Test in development before production
4. **Pin versions**: Use exact versions in production dependencies

Getting Help
------------

If you encounter migration issues:

1. Check the `GitHub Issues <https://github.com/nandkapadia/streamlit-lightweight-charts-pro/issues>`_
2. Review the `API documentation <api/index.html>`_
3. Open a new issue with reproduction steps
