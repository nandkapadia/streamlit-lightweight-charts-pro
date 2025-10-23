"""
Integration tests for Chart and Series interaction.

This module tests the integration between Chart and Series classes,
ensuring they work together correctly in real-world scenarios.
"""

import gc
import json
from typing import List

import numpy as np
import pandas as pd
import psutil
import pytest

from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.chart_manager import ChartManager
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.line_options import LineOptions
from streamlit_lightweight_charts_pro.charts.options.price_line_options import PriceLineOptions
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import PriceScaleOptions
from streamlit_lightweight_charts_pro.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)
from streamlit_lightweight_charts_pro.charts.series import (
    AreaSeries,
    CandlestickSeries,
    HistogramSeries,
    LineSeries,
)
from streamlit_lightweight_charts_pro.data import Annotation, LineData, OhlcvData, TradeData
from streamlit_lightweight_charts_pro.data.marker import BarMarker
from streamlit_lightweight_charts_pro.exceptions import SeriesItemsTypeError, TypeValidationError
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    LineStyle,
    MarkerPosition,
    MarkerShape,
    PriceScaleMode,
    TradeType,
    TradeVisualization,
)


class TestChartSeriesIntegration:
    """Test integration between Chart and Series classes."""

    @pytest.fixture
    def sample_ohlcv_data(self) -> List[OhlcvData]:
        """Create sample OHLCV data for testing."""
        return [
            OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000),
            OhlcvData("2024-01-01 11:00:00", 101, 103, 100, 102, 1500),
            OhlcvData("2024-01-01 12:00:00", 102, 104, 101, 103, 1200),
            OhlcvData("2024-01-01 13:00:00", 103, 105, 102, 104, 1800),
            OhlcvData("2024-01-01 14:00:00", 104, 106, 103, 105, 2000),
        ]

    @pytest.fixture
    def sample_line_data(self) -> List[LineData]:
        """Create sample line data for testing."""
        return [
            LineData(time=1640995200, value=100),
            LineData(time=1640998800, value=101),
            LineData(time=1641002400, value=102),
            LineData(time=1641006000, value=103),
            LineData(time=1641009600, value=104),
        ]

    @pytest.fixture
    def sample_trades(self) -> List[TradeData]:
        """Create sample trades for testing."""
        return [
            TradeData(
                entry_time="2024-01-01 10:00:00",
                entry_price=100.0,
                exit_time="2024-01-01 12:00:00",
                exit_price=102.0,
                is_profitable=True,
                id="trade_001",
                additional_data={
                    "quantity": 100,
                    "trade_type": "long",
                    "tradeType": "long",
                },
            ),
            TradeData(
                entry_time="2024-01-01 13:00:00",
                entry_price=103.0,
                exit_time="2024-01-01 14:00:00",
                exit_price=101.0,
                is_profitable=False,
                id="trade_002",
                additional_data={
                    "quantity": 50,
                    "trade_type": "short",
                    "tradeType": "short",
                },
            ),
        ]

    def test_multiple_series_with_different_price_scales(self):
        """Test chart with multiple series using different price scales."""
        # Create candlestick series on left scale
        candlestick_data = [
            OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000),
            OhlcvData("2024-01-01 11:00:00", 101, 103, 100, 102, 1500),
        ]
        candlestick_series = CandlestickSeries(data=candlestick_data, price_scale_id="left")

        # Create volume series on right scale
        volume_series = HistogramSeries.create_volume_series(
            candlestick_data,
            column_mapping={"time": "time", "volume": "volume"},
            price_scale_id="right",
        )

        # Create chart with both series
        chart = Chart(series=[candlestick_series, volume_series])

        # Verify chart configuration
        config = chart.to_frontend_config()
        assert len(config["charts"][0]["series"]) == 2

        # Verify price scales are configured correctly
        series_configs = config["charts"][0]["series"]
        assert series_configs[0]["priceScaleId"] == "left"
        assert series_configs[1]["priceScaleId"] == "right"

    def test_series_visibility_toggling(self):
        """Test toggling series visibility."""
        # Create multiple series
        line_series = LineSeries(data=[LineData(time=1640995200, value=100)], visible=True)
        candlestick_series = CandlestickSeries(
            data=[OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000)],
            visible=True,
        )

        chart = Chart(series=[line_series, candlestick_series])

        # Initially both series should be visible
        config = chart.to_frontend_config()
        assert len(config["charts"][0]["series"]) == 2
        assert config["charts"][0]["series"][0]["visible"] is True
        assert config["charts"][0]["series"][1]["visible"] is True

        # Hide first series
        line_series._visible = False
        config = chart.to_frontend_config()
        assert config["charts"][0]["series"][0]["visible"] is False
        assert config["charts"][0]["series"][1]["visible"] is True

        # Show first series again
        line_series._visible = True
        config = chart.to_frontend_config()
        assert config["charts"][0]["series"][0]["visible"] is True
        assert config["charts"][0]["series"][1]["visible"] is True

    def test_series_ordering_and_layering(self):
        """Test series ordering and layering."""
        # Create series in specific order
        line_series = LineSeries(data=[LineData(time=1640995200, value=100)])
        candlestick_series = CandlestickSeries(
            data=[OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000)],
        )
        area_series = AreaSeries(data=[LineData(time=1640995200, value=100)])

        chart = Chart(series=[line_series, candlestick_series, area_series])

        # Verify series order is maintained
        config = chart.to_frontend_config()
        series_configs = config["charts"][0]["series"]
        assert len(series_configs) == 3
        assert series_configs[0]["type"] == "line"
        assert series_configs[1]["type"] == "candlestick"
        assert series_configs[2]["type"] == "area"

    def test_series_z_index_ordering(self):
        """Test series ordering by z-index within each pane."""
        # Create series with different z-index values in the same pane
        line_series = LineSeries(data=[LineData(time=1640995200, value=100)])
        line_series.z_index = 10  # Higher z-index (renders on top)

        candlestick_series = CandlestickSeries(
            data=[OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000)],
        )
        candlestick_series.z_index = 5  # Lower z-index (renders behind)

        area_series = AreaSeries(data=[LineData(time=1640995200, value=100)])
        area_series.z_index = 15  # Highest z-index (renders on top)

        chart = Chart(series=[line_series, candlestick_series, area_series])

        # Verify series are ordered by z-index (ascending)
        config = chart.to_frontend_config()
        series_configs = config["charts"][0]["series"]
        assert len(series_configs) == 3

        # Should be ordered by z-index: candlestick(5), line(10), area(15)
        assert series_configs[0]["zIndex"] == 5
        assert series_configs[1]["zIndex"] == 10
        assert series_configs[2]["zIndex"] == 15

    def test_series_z_index_ordering_multiple_panes(self):
        """Test series ordering by z-index across multiple panes."""
        # Create series in different panes with different z-index values
        line_series = LineSeries(data=[LineData(time=1640995200, value=100)], pane_id=0)
        line_series.z_index = 20  # Higher z-index in pane 0

        candlestick_series = CandlestickSeries(
            data=[OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000)],
            pane_id=0,
        )
        candlestick_series.z_index = 10  # Lower z-index in pane 0

        area_series = AreaSeries(
            data=[LineData(time=1640995200, value=100)],
            pane_id=1,  # Different pane
        )
        area_series.z_index = 5  # Lower z-index in pane 1

        histogram_series = HistogramSeries(data=[LineData(time=1640995200, value=100)], pane_id=1)
        histogram_series.z_index = 15  # Higher z-index in pane 1

        chart = Chart(series=[line_series, candlestick_series, area_series, histogram_series])

        # Verify series are ordered by z-index within each pane
        config = chart.to_frontend_config()
        series_configs = config["charts"][0]["series"]
        assert len(series_configs) == 4

        # Pane 0: candlestick(10), line(20) - ordered by z-index
        # Pane 1: area(5), histogram(15) - ordered by z-index
        # Overall order should maintain pane grouping and z-index sorting

        # Find series by type to verify ordering
        candlestick_idx = next(
            i for i, s in enumerate(series_configs) if s["type"] == "candlestick"
        )
        line_idx = next(i for i, s in enumerate(series_configs) if s["type"] == "line")
        area_idx = next(i for i, s in enumerate(series_configs) if s["type"] == "area")
        histogram_idx = next(i for i, s in enumerate(series_configs) if s["type"] == "histogram")

        # Within pane 0: candlestick should come before line
        assert candlestick_idx < line_idx
        # Within pane 1: area should come before histogram
        assert area_idx < histogram_idx

    def test_series_with_markers_and_price_lines(self):
        """Test series with markers and price lines."""
        # Create series with markers and price lines
        line_series = LineSeries(data=[LineData(time=1640995200, value=100)])

        # Add markers
        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="red",
            shape=MarkerShape.CIRCLE,
            text="Important Point",
        )
        line_series.add_marker(marker)

        # Add price line
        price_line = PriceLineOptions(price=100, color="blue", line_width=2, title="Support Level")
        line_series.add_price_line(price_line)

        chart = Chart(series=line_series)

        # Verify markers and price lines are included
        config = chart.to_frontend_config()
        series_config = config["charts"][0]["series"][0]

        assert "markers" in series_config
        assert len(series_config["markers"]) == 1
        assert series_config["markers"][0]["text"] == "Important Point"

        assert "priceLines" in series_config
        assert len(series_config["priceLines"]) == 1
        assert series_config["priceLines"][0]["title"] == "Support Level"

    def test_series_with_custom_options(self):
        """Test series with custom options."""
        # Create series with custom options
        line_series = LineSeries(
            data=[LineData(time=1640995200, value=100)],
            price_scale_id="custom_scale",
            visible=False,
        )

        # Set custom line options after construction
        line_series.line_options = LineOptions(
            color="rgba(255,0,0,1)",
            line_width=3,
            line_style=LineStyle.DASHED,
        )

        chart = Chart(series=line_series)

        # Verify custom options are applied
        config = chart.to_frontend_config()
        series_config = config["charts"][0]["series"][0]

        assert series_config["priceScaleId"] == "custom_scale"
        assert series_config["visible"] is False
        assert series_config["options"]["lineOptions"]["color"] == "rgba(255,0,0,1)"
        assert series_config["options"]["lineOptions"]["lineWidth"] == 3
        assert series_config["options"]["lineOptions"]["lineStyle"] == 2  # Dashed

    def test_chart_with_annotations_and_series(self):
        """Test chart with annotations and series."""
        # Create series
        line_series = LineSeries(data=[LineData(time=1640995200, value=100)])

        # Create annotation
        annotation = Annotation(
            time="2024-01-01 10:00:00",
            price=100,
            position="above",
            text="Market Event",
            color="red",
        )

        chart = Chart(series=line_series, annotations=[annotation])

        # Verify both series and annotations are included
        config = chart.to_frontend_config()

        assert len(config["charts"][0]["series"]) == 1
        assert "annotations" in config["charts"][0]
        assert "layers" in config["charts"][0]["annotations"]
        assert "default" in config["charts"][0]["annotations"]["layers"]
        assert len(config["charts"][0]["annotations"]["layers"]["default"]["annotations"]) == 1
        assert (
            config["charts"][0]["annotations"]["layers"]["default"]["annotations"][0]["text"]
            == "Market Event"
        )

    def test_chart_with_trade_visualization(self):
        """Test chart with trade visualization."""
        # Create candlestick series
        candlestick_data = [
            OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000),
            OhlcvData("2024-01-01 11:00:00", 101, 103, 100, 102, 1500),
        ]
        candlestick_series = CandlestickSeries(data=candlestick_data)

        # Create chart with trade visualization options
        trade_viz_options = TradeVisualizationOptions(style=TradeVisualization.MARKERS)
        chart_options = ChartOptions(trade_visualization=trade_viz_options)

        chart = Chart(series=candlestick_series, options=chart_options)

        # Add trade visualization
        trades = [
            TradeData(
                entry_time="2024-01-01 10:00:00",
                entry_price=100.0,
                exit_time="2024-01-01 11:00:00",
                exit_price=102.0,
                is_profitable=True,
                id="trade_001",
                additional_data={"quantity": 100, "trade_type": TradeType.LONG},
            ),
        ]

        chart.add_trades(trades)

        # Verify trade visualization is added
        config = chart.to_frontend_config()
        chart_config = config["charts"][0]

        # Should have trades in chart config (markers are created in frontend)
        assert "trades" in chart_config
        assert len(chart_config["trades"]) == 1  # One trade added
        assert chart_config["trades"][0]["id"] == "trade_001"

        # Should have trade visualization options
        assert "tradeVisualizationOptions" in chart_config

    def test_chart_with_overlay_price_scales(self):
        """Test chart with overlay price scales."""
        # Create series with different price scales
        line_series = LineSeries(
            data=[LineData(time=1640995200, value=100)],
            price_scale_id="left",
        )

        candlestick_series = CandlestickSeries(
            data=[OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000)],
            price_scale_id="right",
        )

        chart = Chart(series=[line_series, candlestick_series])

        # Add overlay price scale
        overlay_options = PriceScaleOptions(
            visible=True,
            auto_scale=True,
            mode=PriceScaleMode.NORMAL,
        )

        chart.add_overlay_price_scale("overlay_scale", overlay_options)

        # Verify overlay price scale is configured
        config = chart.to_frontend_config()
        assert "overlayPriceScales" in config["charts"][0]["chart"]
        assert "overlay_scale" in config["charts"][0]["chart"]["overlayPriceScales"]

    def test_chart_method_chaining(self):
        """Test chart method chaining."""
        # Test complex method chaining
        chart = (
            Chart()
            .add_series(LineSeries(data=[LineData(time=1640995200, value=100)]))
            .update_options(height=500, width=800)
            .add_series(
                CandlestickSeries(data=[OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000)]),
            )
        )

        # Verify all operations were applied
        assert len(chart.series) == 2
        assert chart.options.height == 500
        assert chart.options.width == 800

        # Verify series types
        assert isinstance(chart.series[0], LineSeries)
        assert isinstance(chart.series[1], CandlestickSeries)

    def test_chart_with_large_dataset(self):
        """Test chart with large dataset."""
        # Create large dataset (1000 points)
        large_data = [LineData(time=1640995200 + i, value=100 + i) for i in range(1000)]

        line_series = LineSeries(data=large_data)
        chart = Chart(series=line_series)

        # Verify large dataset is handled correctly
        config = chart.to_frontend_config()
        series_config = config["charts"][0]["series"][0]

        assert len(series_config["data"]) == 1000
        assert series_config["data"][0]["time"] == 1640995200
        assert series_config["data"][999]["time"] == 1640995200 + 999

    def test_chart_with_mixed_data_types(self):
        """Test chart with mixed data types."""
        # Create mixed data types
        line_data = [LineData(time=1640995200, value=100)]
        ohlcv_data = [OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000)]

        line_series = LineSeries(data=line_data)
        candlestick_series = CandlestickSeries(data=ohlcv_data)

        chart = Chart(series=[line_series, candlestick_series])

        # Verify mixed data types are handled correctly
        config = chart.to_frontend_config()
        series_configs = config["charts"][0]["series"]

        assert len(series_configs) == 2
        assert series_configs[0]["type"] == "line"
        assert series_configs[1]["type"] == "candlestick"

        # Verify data structures are correct
        assert "value" in series_configs[0]["data"][0]
        assert "open" in series_configs[1]["data"][0]
        assert "high" in series_configs[1]["data"][0]
        assert "low" in series_configs[1]["data"][0]
        assert "close" in series_configs[1]["data"][0]

    def test_chart_json_serialization_consistency(self):
        """Test chart JSON serialization consistency."""
        # Create chart with complex configuration
        line_series = LineSeries(data=[LineData(time=1640995200, value=100)])

        candlestick_series = CandlestickSeries(
            data=[OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000)],
        )

        chart = Chart(series=[line_series, candlestick_series])

        # Serialize multiple times
        config1 = chart.to_frontend_config()
        config2 = chart.to_frontend_config()
        config3 = chart.to_frontend_config()

        # All results should be identical
        assert config1 == config2 == config3

        # Verify JSON serialization works
        json1 = json.dumps(config1)
        json2 = json.dumps(config2)
        json3 = json.dumps(config3)

        assert json1 == json2 == json3

    def test_chart_with_empty_series(self):
        """Test chart with empty series."""
        # Create series with empty data
        empty_line_series = LineSeries(data=[])
        empty_candlestick_series = CandlestickSeries(data=[])

        chart = Chart(series=[empty_line_series, empty_candlestick_series])

        # Verify empty series are handled correctly
        config = chart.to_frontend_config()
        series_configs = config["charts"][0]["series"]

        assert len(series_configs) == 2
        assert len(series_configs[0]["data"]) == 0
        assert len(series_configs[1]["data"]) == 0

    def test_chart_with_single_data_point(self):
        """Test chart with single data point."""
        # Create series with single data point
        single_line_data = [LineData(time=1640995200, value=100)]
        single_ohlcv_data = [OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000)]

        line_series = LineSeries(data=single_line_data)
        candlestick_series = CandlestickSeries(data=single_ohlcv_data)

        chart = Chart(series=[line_series, candlestick_series])

        # Verify single data point is handled correctly
        config = chart.to_frontend_config()
        series_configs = config["charts"][0]["series"]

        assert len(series_configs) == 2
        assert len(series_configs[0]["data"]) == 1
        assert len(series_configs[1]["data"]) == 1

    def test_chart_with_series_properties(self):
        """Test chart with series properties."""
        # Create series with various properties
        line_series = LineSeries(
            data=[LineData(time=1640995200, value=100)],
            price_scale_id="custom_scale",
            visible=False,
        )

        chart = Chart(series=line_series)

        # Verify series properties are preserved
        config = chart.to_frontend_config()
        series_config = config["charts"][0]["series"][0]

        assert series_config["priceScaleId"] == "custom_scale"
        assert series_config["visible"] is False

        # Change properties and verify they're updated
        line_series._visible = True
        line_series.price_scale_id = "new_scale"

        config = chart.to_frontend_config()
        series_config = config["charts"][0]["series"][0]

        assert series_config["priceScaleId"] == "new_scale"
        assert series_config["visible"] is True


class TestChartSeriesDataFlowIntegration:
    """Test data flow integration between Chart and Series."""

    def test_dataframe_to_series_to_chart_pipeline(self):
        """Test complete pipeline: DataFrame → Series → Chart → JSON."""
        # Create sample DataFrame
        test_data = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=5, freq="1h"),
                "open": [100, 101, 102, 103, 104],
                "high": [102, 103, 104, 105, 106],
                "low": [99, 100, 101, 102, 103],
                "close": [101, 102, 101, 104, 105],
                "volume": [1000, 1500, 1200, 1800, 2000],
            },
        )

        # Process through pipeline
        manager = ChartManager()
        chart = manager.from_price_volume_dataframe(
            data=test_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
        )

        # Verify pipeline integrity
        config = chart.to_frontend_config()
        json_str = json.dumps(config)

        # Verify JSON is valid and contains expected structure
        assert len(json_str) > 0
        assert "charts" in config
        assert "series" in config["charts"][0]
        assert len(config["charts"][0]["series"]) == 2

        # Verify data integrity
        candlestick_series = config["charts"][0]["series"][0]
        volume_series = config["charts"][0]["series"][1]

        assert candlestick_series["type"] == "candlestick"
        assert volume_series["type"] == "histogram"
        assert len(candlestick_series["data"]) == 5
        assert len(volume_series["data"]) == 5

    def test_data_type_conversions_throughout_pipeline(self):
        """Test data type conversions throughout the pipeline."""
        # Create DataFrame with various data types
        test_data = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=3, freq="1h"),
                "open": [100.0, 101.5, 102.25],
                "high": [102, 103, 104],
                "low": [99, 100, 101],
                "close": [101, 102, 103],
                "volume": [1000, 1500, 2000],
            },
        )

        # Process through pipeline
        manager = ChartManager()
        chart = manager.from_price_volume_dataframe(
            data=test_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
        )

        # Verify data type conversions
        config = chart.to_frontend_config()
        candlestick_data = config["charts"][0]["series"][0]["data"]

        # Verify numeric types are properly converted
        for data_point in candlestick_data:
            assert isinstance(data_point["open"], (int, float))
            assert isinstance(data_point["high"], (int, float))
            assert isinstance(data_point["low"], (int, float))
            assert isinstance(data_point["close"], (int, float))

        # Check volume data in histogram series
        histogram_data = config["charts"][0]["series"][1]["data"]
        for data_point in histogram_data:
            assert isinstance(data_point["value"], (int, float))
            assert isinstance(data_point["time"], int)  # Unix timestamp

    def test_memory_usage_in_data_processing_pipeline(self):
        """Test memory usage in data processing pipeline."""
        process = psutil.Process()
        initial_memory = process.memory_info().rss
        rng = np.random.default_rng(42)

        # Create large DataFrame
        test_data = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=10000, freq="1min"),
                "open": rng.uniform(100, 200, 10000),
                "high": rng.uniform(200, 300, 10000),
                "low": rng.uniform(50, 100, 10000),
                "close": rng.uniform(100, 200, 10000),
                "volume": rng.integers(1000, 10000, 10000),
            },
        )

        # Process through pipeline
        manager = ChartManager()
        chart = manager.from_price_volume_dataframe(
            data=test_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
        )

        config = chart.to_frontend_config()
        json.dumps(config)

        # Force garbage collection
        gc.collect()

        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory

        # Memory increase should be reasonable (< 1GB for 10K points)
        assert memory_increase < 1024 * 1024 * 1024

        # Verify data integrity
        assert len(config["charts"][0]["series"][0]["data"]) == 10000
        assert len(config["charts"][0]["series"][1]["data"]) == 10000


class TestChartSeriesErrorHandlingIntegration:
    """Test error handling integration between Chart and Series."""

    def test_chart_recovery_after_invalid_series(self):
        """Test chart behavior when invalid series is added."""
        chart = Chart()

        # Add valid series
        valid_series = LineSeries(data=[LineData(time=1640995200, value=100)])
        chart.add_series(valid_series)

        # Attempt to add invalid series
        with pytest.raises(TypeValidationError):
            chart.add_series("invalid_series")

        # Verify chart still works with valid series
        config = chart.to_frontend_config()
        assert len(config["charts"][0]["series"]) == 1
        assert config["charts"][0]["series"][0]["type"] == "line"

    def test_series_recovery_after_invalid_data(self):
        """Test series behavior when invalid data is provided."""
        # Test series with corrupted data - error happens during serialization
        series = LineSeries(data=[LineData(time=float("inf"), value=100)])
        chart = Chart(series=series)
        # Error happens when serializing
        with pytest.raises((OverflowError, ValueError)):
            chart.to_frontend_config()

    def test_chart_with_partially_invalid_series_list(self):
        """Test chart with partially invalid series list."""
        valid_series = LineSeries(data=[LineData(time=1640995200, value=100)])

        # Chart constructor now validates series types, so this should raise SeriesItemsTypeError
        with pytest.raises(SeriesItemsTypeError):
            Chart(series=[valid_series, "invalid_series", valid_series])

    def test_chart_with_series_returning_invalid_config(self):
        """Test chart with series returning invalid configuration."""

        # Create a real series that returns invalid config by overriding asdict
        class InvalidConfigSeries(LineSeries):
            def asdict(self):
                return "not_a_dict"

        invalid_series = InvalidConfigSeries(data=[LineData(time=1640995200, value=100)])

        chart = Chart(series=[invalid_series])

        # Should handle invalid config gracefully or raise appropriate error
        config = chart.to_frontend_config()
        assert "charts" in config
        assert len(config["charts"]) == 1

    def test_chart_with_series_missing_required_fields(self):
        """Test chart with series missing required fields."""

        # Create a real series that returns incomplete config by overriding asdict
        class IncompleteConfigSeries(LineSeries):
            def asdict(self):
                return {}  # Empty dict with missing required fields

        incomplete_series = IncompleteConfigSeries(data=[LineData(time=1640995200, value=100)])

        chart = Chart(series=[incomplete_series])

        # Should handle missing fields gracefully
        config = chart.to_frontend_config()
        assert "charts" in config
        assert len(config["charts"]) == 1
