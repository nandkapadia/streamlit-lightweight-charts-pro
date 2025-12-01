"""Pytest configuration for lightweight_charts_core tests."""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

# Ensure the package is on the path
package_path = Path(__file__).parent.parent
if str(package_path) not in sys.path:
    sys.path.insert(0, str(package_path))

# Also add the tests directory to the path for test utilities
tests_path = Path(__file__).parent
if str(tests_path) not in sys.path:
    sys.path.insert(0, str(tests_path))


@pytest.fixture
def sample_dataframe():
    """Generate sample DataFrame for testing.

    Creates a pandas DataFrame with multiple columns commonly used in financial data:
    time, value, OHLC prices, and volume.

    Returns:
        pd.DataFrame: DataFrame with datetime index and financial data columns.

    """
    rng = np.random.default_rng(42)
    dates = pd.date_range("2023-01-01", periods=10, freq="h")

    data = {
        "time": dates,
        "value": [100 + i * 10 + rng.integers(-5, 5) for i in range(10)],
        "open": [100 + i * 2 + rng.integers(-5, 5) for i in range(10)],
        "high": [110 + i * 2 + rng.integers(1, 10) for i in range(10)],
        "low": [90 + i * 2 - rng.integers(1, 10) for i in range(10)],
        "close": [105 + i * 2 + rng.integers(-5, 5) for i in range(10)],
        "volume": [rng.integers(100, 1000) for _ in range(10)],
    }
    return pd.DataFrame(data)
