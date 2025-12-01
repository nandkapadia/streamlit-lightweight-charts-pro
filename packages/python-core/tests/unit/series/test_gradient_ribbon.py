"""Tests for GradientRibbonSeries.

This module tests the GradientRibbonSeries class functionality including
gradient bounds calculation, normalization, and data handling.
"""

import time

import pandas as pd
from lightweight_charts_core.charts.series.gradient_ribbon import GradientRibbonSeries
from lightweight_charts_core.data.gradient_ribbon import GradientRibbonData
from lightweight_charts_core.type_definitions.enums import ChartType


class TestGradientRibbonSeries:
    """Test suite for GradientRibbonSeries."""

    def test_gradient_ribbon_series_creation(self):
        """Test basic GradientRibbonSeries creation."""
        data = [
            GradientRibbonData("2024-01-01", upper=110, lower=100, gradient=0.5),
            GradientRibbonData("2024-01-02", upper=112, lower=102, gradient=0.7),
        ]

        series = GradientRibbonSeries(data=data)

        assert series.chart_type == ChartType.GRADIENT_RIBBON
        assert len(series.data) == 2
        assert series._gradient_start_color == "#4CAF50"
        assert series._gradient_end_color == "#F44336"
        assert series._normalize_gradients is False
        assert series._gradient_bounds is None

    def test_gradient_ribbon_series_with_custom_colors(self):
        """Test GradientRibbonSeries with custom gradient colors."""
        data = [
            GradientRibbonData("2024-01-01", upper=110, lower=100, gradient=0.5),
        ]

        series = GradientRibbonSeries(
            data=data,
            gradient_start_color="#FF0000",
            gradient_end_color="#00FF00",
        )

        assert series._gradient_start_color == "#FF0000"
        assert series._gradient_end_color == "#00FF00"

    def test_gradient_ribbon_series_with_normalization(self):
        """Test GradientRibbonSeries with gradient normalization enabled."""
        data = [
            GradientRibbonData("2024-01-01", upper=110, lower=100, gradient=10),
            GradientRibbonData("2024-01-02", upper=112, lower=102, gradient=20),
            GradientRibbonData("2024-01-03", upper=114, lower=104, gradient=30),
        ]

        series = GradientRibbonSeries(data=data, normalize_gradients=True)

        # Test that bounds are calculated correctly
        series._calculate_gradient_bounds()
        assert series._gradient_bounds == (10.0, 30.0)

    def test_calculate_gradient_bounds_empty_data(self):
        """Test gradient bounds calculation with empty data."""
        series = GradientRibbonSeries(data=[])
        series._calculate_gradient_bounds()

        assert series._gradient_bounds is None

    def test_calculate_gradient_bounds_no_gradients(self):
        """Test gradient bounds calculation with no gradient values."""
        data = [
            GradientRibbonData("2024-01-01", upper=110, lower=100),
            GradientRibbonData("2024-01-02", upper=112, lower=102),
        ]

        series = GradientRibbonSeries(data=data)
        series._calculate_gradient_bounds()

        assert series._gradient_bounds is None

    def test_calculate_gradient_bounds_with_valid_gradients(self):
        """Test gradient bounds calculation with valid gradient values."""
        data = [
            GradientRibbonData("2024-01-01", upper=110, lower=100, gradient=5.0),
            GradientRibbonData("2024-01-02", upper=112, lower=102, gradient=15.0),
            GradientRibbonData("2024-01-03", upper=114, lower=104, gradient=10.0),
        ]

        series = GradientRibbonSeries(data=data)
        series._calculate_gradient_bounds()

        assert series._gradient_bounds == (5.0, 15.0)

    def test_calculate_gradient_bounds_with_invalid_gradients(self):
        """Test gradient bounds calculation with invalid gradient values."""
        data = [
            GradientRibbonData("2024-01-01", upper=110, lower=100, gradient=5.0),
            GradientRibbonData("2024-01-02", upper=112, lower=102, gradient=None),  # No gradient
            GradientRibbonData("2024-01-03", upper=114, lower=104, gradient=10.0),
        ]

        series = GradientRibbonSeries(data=data)
        series._calculate_gradient_bounds()

        # Should only consider valid gradients (5.0 and 10.0)
        assert series._gradient_bounds == (5.0, 10.0)

    def test_calculate_gradient_bounds_with_mixed_types(self):
        """Test gradient bounds calculation with mixed gradient types."""
        data = [
            GradientRibbonData("2024-01-01", upper=110, lower=100, gradient=5),
            GradientRibbonData("2024-01-02", upper=112, lower=102, gradient=10.5),
            GradientRibbonData("2024-01-03", upper=114, lower=104, gradient=15),
        ]

        series = GradientRibbonSeries(data=data)
        series._calculate_gradient_bounds()

        assert series._gradient_bounds == (5, 15)

    def test_asdict_without_normalization(self):
        """Test asdict method without gradient normalization."""
        data = [
            GradientRibbonData("2024-01-01", upper=110, lower=100, gradient=0.5),
            GradientRibbonData("2024-01-02", upper=112, lower=102, gradient=0.7),
        ]

        series = GradientRibbonSeries(data=data, normalize_gradients=False)
        result = series.asdict()

        # Should not modify gradient values
        assert result["data"][0]["gradient"] == 0.5
        assert result["data"][1]["gradient"] == 0.7

    def test_asdict_with_normalization(self):
        """Test asdict method with gradient normalization."""
        data = [
            GradientRibbonData("2024-01-01", upper=110, lower=100, gradient=10),
            GradientRibbonData("2024-01-02", upper=112, lower=102, gradient=20),
            GradientRibbonData("2024-01-03", upper=114, lower=104, gradient=30),
        ]

        series = GradientRibbonSeries(data=data, normalize_gradients=True)
        result = series.asdict()

        # Gradients should be normalized to 0-1 range
        assert result["data"][0]["gradient"] == 0.0  # (10-10)/(30-10) = 0
        assert result["data"][1]["gradient"] == 0.5  # (20-10)/(30-10) = 0.5
        assert result["data"][2]["gradient"] == 1.0  # (30-10)/(30-10) = 1

    def test_asdict_with_normalization_edge_cases(self):
        """Test asdict method with gradient normalization edge cases."""
        data = [
            GradientRibbonData("2024-01-01", upper=110, lower=100, gradient=5.0),
            GradientRibbonData("2024-01-02", upper=112, lower=102, gradient=5.0),  # Same value
        ]

        series = GradientRibbonSeries(data=data, normalize_gradients=True)
        result = series.asdict()

        # When min == max, bounds are calculated but normalization handles it gracefully
        assert series._gradient_bounds == (5.0, 5.0)
        # Both values should remain 5.0 since normalization would result in 0/0
        assert result["data"][0]["gradient"] == 5.0
        assert result["data"][1]["gradient"] == 5.0

    def test_asdict_with_invalid_gradients_during_normalization(self):
        """Test asdict method with invalid gradients during normalization."""
        data = [
            GradientRibbonData("2024-01-01", upper=110, lower=100, gradient=10),
            GradientRibbonData("2024-01-02", upper=112, lower=102, gradient=20),
        ]

        series = GradientRibbonSeries(data=data, normalize_gradients=True)

        # Manually set bounds to trigger normalization
        series._gradient_bounds = (10.0, 20.0)

        # Modify data to have invalid gradient
        series.data[1].gradient = "invalid"

        result = series.asdict()

        # Invalid gradient should be removed
        assert "gradient" not in result["data"][1]

    def test_chainable_properties(self):
        """Test that chainable properties work correctly."""
        data = [
            GradientRibbonData("2024-01-01", upper=110, lower=100, gradient=0.5),
        ]

        series = GradientRibbonSeries(data=data)

        # Test gradient start color
        series.gradient_start_color = "#FF0000"
        assert series._gradient_start_color == "#FF0000"

        # Test gradient end color
        series.gradient_end_color = "#00FF00"
        assert series._gradient_end_color == "#00FF00"

        # Test normalize gradients
        series.normalize_gradients = True
        assert series._normalize_gradients is True

    def test_dataframe_integration(self):
        """Test GradientRibbonSeries creation from DataFrame."""
        ribbon_data = pd.DataFrame(
            {
                "datetime": ["2024-01-01", "2024-01-02"],
                "upper": [110, 112],
                "lower": [100, 102],
                "gradient": [0.5, 0.7],
            },
        )

        # Set datetime as index to match the expected format
        ribbon_data["datetime"] = pd.to_datetime(ribbon_data["datetime"])
        ribbon_data = ribbon_data.set_index("datetime")

        column_mapping = {
            "time": "datetime",
            "upper": "upper",
            "lower": "lower",
            "gradient": "gradient",
        }

        series = GradientRibbonSeries(data=ribbon_data, column_mapping=column_mapping)

        assert len(series.data) == 2
        assert series.data[0].gradient == 0.5
        assert series.data[1].gradient == 0.7

    def test_series_integration(self):
        """Test GradientRibbonSeries creation from pandas Series."""
        # Create a DataFrame from the Series data for proper testing
        ribbon_data = pd.DataFrame(
            [{"datetime": "2024-01-01", "upper": 110, "lower": 100, "gradient": 0.5}],
        )

        # Set datetime as index to match the expected format
        ribbon_data["datetime"] = pd.to_datetime(ribbon_data["datetime"])
        ribbon_data = ribbon_data.set_index("datetime")

        column_mapping = {
            "time": "datetime",
            "upper": "upper",
            "lower": "lower",
            "gradient": "gradient",
        }

        series = GradientRibbonSeries(data=ribbon_data, column_mapping=column_mapping)

        assert len(series.data) == 1
        assert series.data[0].gradient == 0.5

    def test_performance_optimization_verification(self):
        """Test that performance optimizations are working correctly."""
        # Create a large dataset to test performance
        data = [
            GradientRibbonData(
                f"2024-01-{(i % 31) + 1:02d}",
                upper=100 + i * 0.1,
                lower=90 + i * 0.1,
                gradient=i * 0.001,
            )
            for i in range(1000)
        ]

        series = GradientRibbonSeries(data=data, normalize_gradients=True)

        # Test that bounds calculation is fast and correct
        start_time = time.perf_counter()
        series._calculate_gradient_bounds()
        end_time = time.perf_counter()

        execution_time = (end_time - start_time) * 1000  # Convert to milliseconds

        # Should complete in under 10ms for 1000 data points
        assert (
            execution_time < 10.0
        ), f"Bounds calculation took {execution_time:.2f}ms, expected < 10ms"

        # Verify bounds are correct
        assert series._gradient_bounds == (0.0, 0.999)

        # Test normalization performance
        start_time = time.perf_counter()
        result = series.asdict()
        end_time = time.perf_counter()

        execution_time = (end_time - start_time) * 1000  # Convert to milliseconds

        # Should complete in under 2000ms for 1000 data points
        # Increased threshold to account for CI/CD system variance and parallel test execution
        assert (
            execution_time < 2000.0
        ), f"Normalization took {execution_time:.2f}ms, expected < 2000ms"

        # Verify first and last normalized values
        assert result["data"][0]["gradient"] == 0.0
        assert result["data"][-1]["gradient"] == 1.0
