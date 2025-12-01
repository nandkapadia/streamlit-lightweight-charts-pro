"""Pytest configuration and fixtures for backend tests."""

import pytest


@pytest.fixture
def sample_line_data():
    """Sample line chart data."""
    return [{"time": i, "value": i * 100} for i in range(100)]


@pytest.fixture
def sample_candlestick_data():
    """Sample candlestick chart data."""
    return [
        {
            "time": i,
            "open": 100 + i,
            "high": 105 + i,
            "low": 95 + i,
            "close": 102 + i,
        }
        for i in range(100)
    ]


@pytest.fixture
def large_dataset():
    """Large dataset for testing chunking (> 500 points)."""
    return [{"time": i, "value": i * 100} for i in range(1000)]


@pytest.fixture
def small_dataset():
    """Small dataset for testing non-chunking (< 500 points)."""
    return [{"time": i, "value": i * 100} for i in range(100)]
