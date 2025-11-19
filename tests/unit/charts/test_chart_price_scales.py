"""
Chart price scale tests - Price scale management and price-volume series.

This module tests price scale functionality including overlay price scales,
price scale validation, and price-volume series creation.
"""

# Third Party Imports
import pandas as pd
import pytest

# Local Imports
from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import PriceScaleOptions
from streamlit_lightweight_charts_pro.charts.series import (
    CandlestickSeries,
    HistogramSeries,
    LineSeries,
)
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData
from streamlit_lightweight_charts_pro.exceptions import (
    TypeValidationError,
    ValueValidationError,
)
from streamlit_lightweight_charts_pro.type_definitions.enums import ColumnNames, PriceScaleMode


class TestOverlayPriceScales:
    """Test overlay price scale management."""

    def test_add_overlay_price_scale(self):
        """Test adding an overlay price scale."""
        chart = Chart()
        options = PriceScaleOptions(visible=True, auto_scale=True, mode=PriceScaleMode.NORMAL)

        result = chart.add_overlay_price_scale("volume", options)

        assert result is chart  # Method chaining
        assert "volume" in chart.options.overlay_price_scales
        assert chart.options.overlay_price_scales["volume"] == options

    def test_add_overlay_price_scale_invalid_options(self):
        """Test adding overlay price scale with invalid options type."""
        chart = Chart()
        invalid_options = "not a PriceScaleOptions"

        with pytest.raises(
            ValueValidationError,
            match="options must be a PriceScaleOptions instance",
        ):
            chart.add_overlay_price_scale("volume", invalid_options)

    def test_add_overlay_price_scale_method_chaining(self):
        """Test method chaining with add_overlay_price_scale."""
        chart = Chart()
        options1 = PriceScaleOptions(visible=True)
        options2 = PriceScaleOptions(visible=False)

        result = chart.add_overlay_price_scale("volume", options1).add_overlay_price_scale(
            "indicator",
            options2,
        )

        assert result is chart
        assert "volume" in chart.options.overlay_price_scales
        assert "indicator" in chart.options.overlay_price_scales

    def test_add_overlay_price_scale_with_none_scale_id(self):
        """Test adding overlay price scale with None scale ID."""
        chart = Chart()
        options = PriceScaleOptions(visible=True)

        with pytest.raises(ValueValidationError):
            chart.add_overlay_price_scale(None, options)

    def test_add_overlay_price_scale_with_empty_scale_id(self):
        """Test adding overlay price scale with empty scale ID."""
        chart = Chart()
        options = PriceScaleOptions(visible=True)

        with pytest.raises(ValueValidationError):
            chart.add_overlay_price_scale("", options)

    def test_add_overlay_price_scale_with_duplicate_scale_id(self):
        """Test adding overlay price scale with duplicate scale ID allows updates."""
        chart = Chart()
        options1 = PriceScaleOptions(visible=True)
        options2 = PriceScaleOptions(visible=False)

        # Add first scale
        chart.add_overlay_price_scale("test_scale", options1)
        assert chart.options.overlay_price_scales["test_scale"].visible is True

        # Adding duplicate scale ID updates the existing scale
        chart.add_overlay_price_scale("test_scale", options2)
        assert chart.options.overlay_price_scales["test_scale"].visible is False

    def test_overlay_price_scales_reference_preservation(self):
        """Test that overlay_price_scales maintains reference between Chart and PriceScaleManager.

        This is a regression test for the bug where empty dicts were replaced
        by the expression `overlay_price_scales or {}`, breaking the reference.
        """
        chart = Chart()

        # Verify the reference is the same object (not a copy)
        assert chart.options.overlay_price_scales is chart._price_scale_manager.overlay_price_scales

        # Verify changes to one are reflected in the other
        chart._price_scale_manager.add_overlay_scale("test", PriceScaleOptions(visible=False))

        # Should be visible in both
        assert "test" in chart.options.overlay_price_scales
        assert "test" in chart._price_scale_manager.overlay_price_scales
        assert (
            chart.options.overlay_price_scales["test"]
            is chart._price_scale_manager.overlay_price_scales["test"]
        )


class TestPriceVolumeSeries:
    """Test price-volume series creation."""

    def test_create_price_volume_series_candlestick(self):
        """Test creating price-volume series with candlestick price type."""
        chart = Chart()
        data = [
            OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000),
            OhlcvData(time=1641081600, open=103, high=107, low=102, close=106, volume=1200),
        ]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        chart.add_price_volume_series(
            data=data,
            column_mapping=column_mapping,
            price_type="candlestick",
        )
        price_series = chart.series[0]
        volume_series = chart.series[1]

        assert isinstance(price_series, CandlestickSeries)
        assert isinstance(volume_series, HistogramSeries)
        assert price_series.price_scale_id == "right"
        assert volume_series.price_scale_id == ColumnNames.VOLUME

    def test_create_price_volume_series_line(self):
        """Test creating price-volume series with line price type."""
        chart = Chart()
        data = [
            OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000),
            OhlcvData(time=1641081600, open=103, high=107, low=102, close=106, volume=1200),
        ]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        chart.add_price_volume_series(data=data, column_mapping=column_mapping, price_type="line")
        price_series = chart.series[0]
        volume_series = chart.series[1]

        assert isinstance(price_series, LineSeries)
        assert isinstance(volume_series, HistogramSeries)

    def test_create_price_volume_series_invalid_price_type(self):
        """Test creating price-volume series with invalid price type."""
        chart = Chart()
        data = [OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000)]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        with pytest.raises(
            ValueValidationError,
            match="price_type must be 'candlestick' or 'line'",
        ):
            chart.add_price_volume_series(
                data=data,
                column_mapping=column_mapping,
                price_type="invalid",
            )

    def test_create_price_volume_series_with_custom_kwargs(self):
        """Test creating price-volume series with custom kwargs."""
        chart = Chart()
        data = [OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000)]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        price_kwargs = {"visible": False}
        volume_kwargs = {"up_color": "#00ff00", "down_color": "#ff0000"}

        chart.add_price_volume_series(
            data=data,
            column_mapping=column_mapping,
            price_type="candlestick",
            price_kwargs=price_kwargs,
            volume_kwargs=volume_kwargs,
        )
        price_series = chart.series[0]
        volume_series = chart.series[1]

        assert price_series.visible is False
        assert len(volume_series.data) == 1
        assert volume_series.data[0].color == "#00ff00"

    def test_add_price_volume_series_method_chaining(self):
        """Test method chaining with add_price_volume_series."""
        chart = Chart()
        data = [OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000)]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        result = chart.add_price_volume_series(
            data=data,
            column_mapping=column_mapping,
            price_type="candlestick",
        )

        assert result is chart  # Method chaining
        assert len(chart.series) == 2

    def test_from_price_volume_dataframe(self):
        """Test from_price_volume_dataframe with pandas DataFrame."""
        test_dataframe = pd.DataFrame(
            {
                "time": [1640995200, 1641081600],
                "open": [100, 103],
                "high": [105, 107],
                "low": [98, 102],
                "close": [103, 106],
                "volume": [1000, 1200],
            },
        )
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        chart = Chart()
        chart.add_price_volume_series(
            data=test_dataframe,
            column_mapping=column_mapping,
            price_type="candlestick",
        )

        assert isinstance(chart, Chart)
        assert len(chart.series) == 2

    def test_create_price_volume_series_with_none_data(self):
        """Test creating price-volume series with None data."""
        chart = Chart()

        with pytest.raises(TypeValidationError):
            chart.add_price_volume_series(data=None, column_mapping={}, price_type="candlestick")

    def test_create_price_volume_series_with_empty_data(self):
        """Test creating price-volume series with empty data."""
        chart = Chart()

        with pytest.raises(ValueValidationError):
            chart.add_price_volume_series(data=[], column_mapping={}, price_type="candlestick")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
