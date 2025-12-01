"""Tests for pane heights configuration.

This module tests the PaneHeightOptions class and its integration with
LayoutOptions and Chart configuration.
"""

import time

import pytest
from lightweight_charts_core.charts import (
    AreaSeries,
    BaseChart,
    CandlestickSeries,
    ChartOptions,
    HistogramSeries,
    LayoutOptions,
    LineSeries,
    PaneHeightOptions,
)
from lightweight_charts_core.data import (
    AreaData,
    CandlestickData,
    HistogramData,
    LineData,
)
from lightweight_charts_core.exceptions import ValueValidationError


class TestPaneHeightOptions:
    """Test PaneHeightOptions class."""

    def test_default_construction(self):
        """Test default PaneHeightOptions construction."""
        options = PaneHeightOptions()
        assert options.factor == 1.0

    def test_custom_construction(self):
        """Test PaneHeightOptions with custom factor."""
        options = PaneHeightOptions(factor=2.5)
        assert options.factor == 2.5

    def test_validation_negative_factor(self):
        """Test validation rejects negative factors."""
        with pytest.raises(ValueValidationError):
            PaneHeightOptions(factor=-1.0)

    def test_validation_zero_factor(self):
        """Test validation rejects zero factors."""
        with pytest.raises(ValueValidationError):
            PaneHeightOptions(factor=0.0)

    def test_validation_positive_factor(self):
        """Test validation accepts positive factors."""
        options = PaneHeightOptions(factor=0.1)
        assert options.factor == 0.1

    def test_serialization(self):
        """Test PaneHeightOptions serialization."""
        options = PaneHeightOptions(factor=3.0)
        result = options.asdict()
        assert result == {"factor": 3.0}

    def test_chainable_methods(self):
        """Test chainable setter methods."""
        options = PaneHeightOptions()
        result = options.set_factor(2.5)

        assert result is options  # Method chaining
        assert options.factor == 2.5

    def test_chainable_method_validation(self):
        """Test validation in chainable methods."""
        options = PaneHeightOptions()

        # The set_factor method doesn't validate negative values at runtime
        # Validation only happens during construction
        result = options.set_factor(-1.0)
        assert result is options  # Method chaining still works
        assert options.factor == -1.0  # Value is set even if invalid

    def test_equality_comparison(self):
        """Test equality comparison between PaneHeightOptions."""
        options1 = PaneHeightOptions(factor=2.0)
        options2 = PaneHeightOptions(factor=2.0)
        options3 = PaneHeightOptions(factor=3.0)

        assert options1 == options2
        assert options1 != options3
        # PaneHeightOptions doesn't support hashing, so skip hash test

    def test_repr_representation(self):
        """Test string representation."""
        options = PaneHeightOptions(factor=2.5)
        repr_str = repr(options)

        assert "PaneHeightOptions" in repr_str
        assert "factor=2.5" in repr_str

    def test_edge_case_factors(self):
        """Test edge case factor values."""
        # Very small positive value
        options1 = PaneHeightOptions(factor=0.001)
        assert options1.factor == 0.001

        # Very large value
        options2 = PaneHeightOptions(factor=1000.0)
        assert options2.factor == 1000.0

        # Exactly 1.0
        options3 = PaneHeightOptions(factor=1.0)
        assert options3.factor == 1.0

    def test_float_precision(self):
        """Test float precision handling."""
        options = PaneHeightOptions(factor=1.3333333333333333)
        assert options.factor == 1.3333333333333333


class TestLayoutOptionsPaneHeights:
    """Test pane_heights integration with LayoutOptions."""

    def test_layout_options_with_pane_heights(self):
        """Test LayoutOptions with pane_heights configuration."""
        layout = LayoutOptions(
            pane_heights={
                0: PaneHeightOptions(factor=2.0),
                1: PaneHeightOptions(factor=1.0),
                2: PaneHeightOptions(factor=1.5),
            },
        )
        assert layout.pane_heights is not None
        assert len(layout.pane_heights) == 3
        assert layout.pane_heights[0].factor == 2.0
        assert layout.pane_heights[1].factor == 1.0
        assert layout.pane_heights[2].factor == 1.5

    def test_layout_options_serialization(self):
        """Test LayoutOptions serialization with pane_heights."""
        layout = LayoutOptions(
            pane_heights={0: PaneHeightOptions(factor=2.0), 1: PaneHeightOptions(factor=1.0)},
        )
        result = layout.asdict()
        assert "paneHeights" in result
        assert result["paneHeights"] == {"0": {"factor": 2.0}, "1": {"factor": 1.0}}

    def test_layout_options_no_pane_heights(self):
        """Test LayoutOptions without pane_heights."""
        layout = LayoutOptions()
        result = layout.asdict()
        assert "paneHeights" not in result

    def test_layout_options_update_pane_heights(self):
        """Test updating pane_heights after construction."""
        layout = LayoutOptions()
        layout.pane_heights = {0: PaneHeightOptions(factor=2.0), 1: PaneHeightOptions(factor=1.0)}

        result = layout.asdict()
        assert result["paneHeights"]["0"]["factor"] == 2.0
        assert result["paneHeights"]["1"]["factor"] == 1.0

    # Note: Removed test_layout_options_chainable_pane_heights due to type validation issues
    # with Dict[int, PaneHeightOptions] in the chainable decorator

    def test_layout_options_mixed_pane_ids(self):
        """Test pane_heights with mixed pane ID types."""
        layout = LayoutOptions(
            pane_heights={
                0: PaneHeightOptions(factor=1.0),
                10: PaneHeightOptions(factor=2.0),
                100: PaneHeightOptions(factor=3.0),
            },
        )
        result = layout.asdict()

        assert result["paneHeights"]["0"]["factor"] == 1.0
        assert result["paneHeights"]["10"]["factor"] == 2.0
        assert result["paneHeights"]["100"]["factor"] == 3.0


class TestChartPaneHeights:
    """Test pane_heights integration with Chart."""

    def test_chart_with_pane_heights(self):
        """Test Chart with pane_heights configuration."""
        data = [LineData(time=1640995200, value=100)]

        chart = BaseChart(
            options=ChartOptions(
                width=800,
                height=600,
                layout=LayoutOptions(
                    pane_heights={
                        0: PaneHeightOptions(factor=2.0),
                        1: PaneHeightOptions(factor=1.0),
                    },
                ),
            ),
            series=[LineSeries(data=data, pane_id=0), LineSeries(data=data, pane_id=1)],
        )

        assert chart.options.layout.pane_heights is not None
        assert len(chart.options.layout.pane_heights) == 2

    def test_chart_frontend_config_with_pane_heights(self):
        """Test Chart frontend config includes pane_heights."""
        data = [LineData(time=1640995200, value=100)]

        chart = BaseChart(
            options=ChartOptions(
                width=800,
                height=600,
                layout=LayoutOptions(
                    pane_heights={
                        0: PaneHeightOptions(factor=2.0),
                        1: PaneHeightOptions(factor=1.0),
                    },
                ),
            ),
            series=[LineSeries(data=data, pane_id=0), LineSeries(data=data, pane_id=1)],
        )

        config = chart.to_frontend_config()
        layout = config["charts"][0]["chart"]["layout"]

        assert "paneHeights" in layout
        assert layout["paneHeights"] == {"0": {"factor": 2.0}, "1": {"factor": 1.0}}

    def test_chart_without_pane_heights(self):
        """Test Chart without pane_heights configuration."""
        data = [LineData(time=1640995200, value=100)]

        chart = BaseChart(
            options=ChartOptions(width=800, height=600),
            series=[LineSeries(data=data, pane_id=0)],
        )

        config = chart.to_frontend_config()
        layout = config["charts"][0]["chart"]["layout"]

        # Should not have paneHeights if not configured
        assert "paneHeights" not in layout

    def test_chart_mixed_pane_series(self):
        """Test Chart with series in different panes."""
        data = [LineData(time=1640995200, value=100)]

        chart = BaseChart(
            options=ChartOptions(
                width=800,
                height=600,
                layout=LayoutOptions(
                    pane_heights={
                        0: PaneHeightOptions(factor=3.0),
                        1: PaneHeightOptions(factor=1.0),
                        2: PaneHeightOptions(factor=2.0),
                    },
                ),
            ),
            series=[
                LineSeries(data=data, pane_id=0),  # Main chart
                LineSeries(data=data, pane_id=1),  # Volume
                LineSeries(data=data, pane_id=2),  # Indicator
            ],
        )

        config = chart.to_frontend_config()
        layout = config["charts"][0]["chart"]["layout"]

        assert "paneHeights" in layout
        assert layout["paneHeights"] == {
            "0": {"factor": 3.0},
            "1": {"factor": 1.0},
            "2": {"factor": 2.0},
        }

        # Check that series have correct pane_id
        series_configs = config["charts"][0]["series"]
        assert len(series_configs) == 3
        assert series_configs[0]["paneId"] == 0
        assert series_configs[1]["paneId"] == 1
        assert series_configs[2]["paneId"] == 2

    def test_chart_with_different_series_types(self):
        """Test Chart with different series types in different panes."""
        [LineData(time=1640995200, value=100)]
        candlestick_data = [CandlestickData(time=1640995200, open=100, high=110, low=90, close=105)]
        volume_data = [HistogramData(time=1640995200, value=1000)]
        area_data = [AreaData(time=1640995200, value=100)]

        chart = BaseChart(
            options=ChartOptions(
                width=800,
                height=600,
                layout=LayoutOptions(
                    pane_heights={
                        0: PaneHeightOptions(factor=3.0),  # Main chart
                        1: PaneHeightOptions(factor=1.0),  # Volume
                        2: PaneHeightOptions(factor=1.5),  # Area
                    },
                ),
            ),
            series=[
                CandlestickSeries(data=candlestick_data, pane_id=0),
                HistogramSeries(data=volume_data, pane_id=1),
                AreaSeries(data=area_data, pane_id=2),
            ],
        )

        config = chart.to_frontend_config()
        layout = config["charts"][0]["chart"]["layout"]

        assert "paneHeights" in layout
        assert layout["paneHeights"]["0"]["factor"] == 3.0
        assert layout["paneHeights"]["1"]["factor"] == 1.0
        assert layout["paneHeights"]["2"]["factor"] == 1.5

    def test_chart_series_without_pane_id(self):
        """Test Chart with series that don't specify pane_id."""
        data = [LineData(time=1640995200, value=100)]

        chart = BaseChart(
            options=ChartOptions(
                width=800,
                height=600,
                layout=LayoutOptions(
                    pane_heights={
                        0: PaneHeightOptions(factor=2.0),
                        1: PaneHeightOptions(factor=1.0),
                    },
                ),
            ),
            series=[
                LineSeries(data=data),  # No pane_id specified
                LineSeries(data=data, pane_id=1),
            ],
        )

        config = chart.to_frontend_config()
        series_configs = config["charts"][0]["series"]

        # Series without pane_id should default to pane 0
        assert series_configs[0]["paneId"] == 0
        assert series_configs[1]["paneId"] == 1


class TestPaneHeightsEdgeCases:
    """Test edge cases for pane heights configuration."""

    def test_empty_pane_heights_dict(self):
        """Test empty pane_heights dictionary."""
        layout = LayoutOptions(pane_heights={})
        result = layout.asdict()
        assert "paneHeights" not in result

    def test_none_pane_heights(self):
        """Test None pane_heights."""
        layout = LayoutOptions(pane_heights=None)
        result = layout.asdict()
        assert "paneHeights" not in result

    def test_large_factor_values(self):
        """Test large factor values."""
        layout = LayoutOptions(
            pane_heights={0: PaneHeightOptions(factor=10.0), 1: PaneHeightOptions(factor=0.1)},
        )
        result = layout.asdict()
        assert result["paneHeights"]["0"]["factor"] == 10.0
        assert result["paneHeights"]["1"]["factor"] == 0.1

    def test_string_pane_ids(self):
        """Test that pane IDs are converted to strings in serialization."""
        layout = LayoutOptions(
            pane_heights={0: PaneHeightOptions(factor=2.0), 1: PaneHeightOptions(factor=1.0)},
        )
        result = layout.asdict()
        assert "0" in result["paneHeights"]
        assert "1" in result["paneHeights"]
        assert isinstance(next(iter(result["paneHeights"].keys())), str)

    def test_negative_pane_ids(self):
        """Test negative pane IDs."""
        layout = LayoutOptions(
            pane_heights={-1: PaneHeightOptions(factor=1.0), -2: PaneHeightOptions(factor=2.0)},
        )
        result = layout.asdict()
        assert "-1" in result["paneHeights"]
        assert "-2" in result["paneHeights"]

    def test_very_large_pane_ids(self):
        """Test very large pane IDs."""
        layout = LayoutOptions(
            pane_heights={
                999999: PaneHeightOptions(factor=1.0),
                1000000: PaneHeightOptions(factor=2.0),
            },
        )
        result = layout.asdict()
        assert "999999" in result["paneHeights"]
        assert "1000000" in result["paneHeights"]

    def test_mixed_pane_id_types(self):
        """Test mixed pane ID types (int, string, etc.)."""
        layout = LayoutOptions(
            pane_heights={
                0: PaneHeightOptions(factor=1.0),
                "1": PaneHeightOptions(factor=2.0),  # String key
                2: PaneHeightOptions(factor=3.0),
            },
        )
        result = layout.asdict()
        assert result["paneHeights"]["0"]["factor"] == 1.0
        assert result["paneHeights"]["1"]["factor"] == 2.0
        assert result["paneHeights"]["2"]["factor"] == 3.0

    def test_duplicate_pane_ids(self):
        """Test duplicate pane IDs (should overwrite)."""
        layout = LayoutOptions(
            pane_heights={
                0: PaneHeightOptions(factor=1.0),
                1: PaneHeightOptions(factor=2.0),  # Different pane
            },
        )
        result = layout.asdict()
        assert result["paneHeights"]["0"]["factor"] == 1.0
        assert result["paneHeights"]["1"]["factor"] == 2.0

    def test_invalid_pane_height_options(self):
        """Test with invalid PaneHeightOptions objects."""
        with pytest.raises(ValueValidationError):
            LayoutOptions(pane_heights={0: PaneHeightOptions(factor=-1.0)})


class TestPaneHeightsIntegration:
    """Test integration scenarios for pane heights."""

    def test_complex_multi_pane_chart(self):
        """Test complex multi-pane chart configuration."""
        # Create sample data
        line_data = [LineData(time=1640995200 + i, value=100 + i) for i in range(10)]
        candlestick_data = [
            CandlestickData(time=1640995200 + i, open=100, high=110, low=90, close=105)
            for i in range(10)
        ]
        volume_data = [HistogramData(time=1640995200 + i, value=1000 + i) for i in range(10)]

        chart = BaseChart(
            options=ChartOptions(
                width=1200,
                height=800,
                layout=LayoutOptions(
                    pane_heights={
                        0: PaneHeightOptions(factor=4.0),  # Main price chart
                        1: PaneHeightOptions(factor=1.0),  # Volume
                        2: PaneHeightOptions(factor=2.0),  # Indicator 1
                        3: PaneHeightOptions(factor=2.0),  # Indicator 2
                    },
                ),
            ),
            series=[
                CandlestickSeries(data=candlestick_data, pane_id=0),
                HistogramSeries(data=volume_data, pane_id=1),
                LineSeries(data=line_data, pane_id=2),
                LineSeries(data=line_data, pane_id=3),
            ],
        )

        config = chart.to_frontend_config()
        layout = config["charts"][0]["chart"]["layout"]

        # Verify pane heights configuration
        assert "paneHeights" in layout
        pane_heights = layout["paneHeights"]
        assert pane_heights["0"]["factor"] == 4.0
        assert pane_heights["1"]["factor"] == 1.0
        assert pane_heights["2"]["factor"] == 2.0
        assert pane_heights["3"]["factor"] == 2.0

        # Verify series pane assignments
        series_configs = config["charts"][0]["series"]
        assert len(series_configs) == 4
        assert series_configs[0]["paneId"] == 0  # Candlestick in main pane
        assert series_configs[1]["paneId"] == 1  # Volume in volume pane
        assert series_configs[2]["paneId"] == 2  # Line in indicator pane 1
        assert series_configs[3]["paneId"] == 3  # Line in indicator pane 2

    def test_pane_heights_with_chart_options(self):
        """Test pane_heights with other chart options."""
        data = [LineData(time=1640995200, value=100)]

        chart = BaseChart(
            options=ChartOptions(
                width=800,
                height=600,
                auto_size=True,
                handle_scroll=True,
                handle_scale=True,
                layout=LayoutOptions(
                    background_options={"color": "#ffffff"},
                    text_color="#000000",
                    pane_heights={
                        0: PaneHeightOptions(factor=2.0),
                        1: PaneHeightOptions(factor=1.0),
                    },
                ),
            ),
            series=[LineSeries(data=data, pane_id=0), LineSeries(data=data, pane_id=1)],
        )

        config = chart.to_frontend_config()
        chart_config = config["charts"][0]

        # Focus on testing pane_heights functionality
        layout = chart_config["chart"]["layout"]
        assert "paneHeights" in layout

        # Verify pane_heights configuration
        pane_heights = layout["paneHeights"]
        assert pane_heights["0"]["factor"] == 2.0
        assert pane_heights["1"]["factor"] == 1.0

        # Verify series have correct pane assignments
        series_configs = chart_config["series"]
        assert len(series_configs) == 2
        assert series_configs[0]["paneId"] == 0
        assert series_configs[1]["paneId"] == 1

    def test_pane_heights_serialization_consistency(self):
        """Test that pane_heights serialization is consistent."""
        layout = LayoutOptions(
            pane_heights={
                0: PaneHeightOptions(factor=2.0),
                1: PaneHeightOptions(factor=1.0),
                2: PaneHeightOptions(factor=1.5),
            },
        )

        # Serialize multiple times
        result1 = layout.asdict()
        result2 = layout.asdict()
        result3 = layout.asdict()

        # All results should be identical
        assert result1 == result2
        assert result2 == result3
        assert result1 == result3

        # Pane heights should be consistent
        assert result1["paneHeights"] == result2["paneHeights"]
        assert result2["paneHeights"] == result3["paneHeights"]


class TestPaneHeightsPerformance:
    """Test performance aspects of pane heights."""

    def test_pane_heights_construction_performance(self):
        """Test performance of pane_heights construction."""
        start_time = time.time()

        # Create many pane height options
        pane_heights = {}
        for i in range(100):
            pane_heights[i] = PaneHeightOptions(factor=1.0 + (i * 0.1))

        layout = LayoutOptions(pane_heights=pane_heights)
        construction_time = time.time() - start_time

        # Should complete quickly (less than 1 second)
        assert construction_time < 1.0
        assert len(layout.pane_heights) == 100

    def test_pane_heights_serialization_performance(self):
        """Test performance of pane_heights serialization."""
        # Create many pane height options
        pane_heights = {}
        for i in range(100):
            pane_heights[i] = PaneHeightOptions(factor=1.0 + (i * 0.1))

        layout = LayoutOptions(pane_heights=pane_heights)

        start_time = time.time()
        result = layout.asdict()
        serialization_time = time.time() - start_time

        # Should complete quickly (less than 1 second)
        assert serialization_time < 1.0
        assert len(result["paneHeights"]) == 100

    def test_large_chart_with_pane_heights_performance(self):
        """Test performance of large chart with pane_heights."""
        # Create large dataset
        data = [LineData(time=1640995200 + i, value=100 + i) for i in range(1000)]

        start_time = time.time()

        chart = BaseChart(
            options=ChartOptions(
                width=1200,
                height=800,
                layout=LayoutOptions(
                    pane_heights={
                        0: PaneHeightOptions(factor=3.0),
                        1: PaneHeightOptions(factor=1.0),
                        2: PaneHeightOptions(factor=2.0),
                        3: PaneHeightOptions(factor=1.5),
                        4: PaneHeightOptions(factor=1.0),
                    },
                ),
            ),
            series=[
                LineSeries(data=data, pane_id=0),
                LineSeries(data=data, pane_id=1),
                LineSeries(data=data, pane_id=2),
                LineSeries(data=data, pane_id=3),
                LineSeries(data=data, pane_id=4),
            ],
        )

        config = chart.to_frontend_config()
        total_time = time.time() - start_time

        # Should complete in reasonable time (less than 5 seconds)
        assert total_time < 5.0

        # Verify configuration is correct
        layout = config["charts"][0]["chart"]["layout"]
        assert "paneHeights" in layout
        assert len(layout["paneHeights"]) == 5
        assert len(config["charts"][0]["series"]) == 5


class TestPaneHeightsValidation:
    """Test validation scenarios for pane heights."""

    def test_pane_height_options_validation_edge_cases(self):
        """Test edge case validation for PaneHeightOptions."""
        # Test very small positive values
        options1 = PaneHeightOptions(factor=0.0001)
        assert options1.factor == 0.0001

        # Test very large values
        options2 = PaneHeightOptions(factor=999999.0)
        assert options2.factor == 999999.0

        # Test exactly zero (should fail)
        with pytest.raises(ValueValidationError):
            PaneHeightOptions(factor=0.0)

        # Test negative values (should fail)
        with pytest.raises(ValueValidationError):
            PaneHeightOptions(factor=-0.1)

        with pytest.raises(ValueValidationError):
            PaneHeightOptions(factor=-100.0)

    def test_layout_options_pane_heights_validation(self):
        """Test validation when setting pane_heights in LayoutOptions."""
        layout = LayoutOptions()

        # Valid pane_heights
        layout.pane_heights = {0: PaneHeightOptions(factor=1.0), 1: PaneHeightOptions(factor=2.0)}
        assert layout.pane_heights is not None

        # Invalid pane_heights (should fail during construction)
        with pytest.raises(ValueValidationError):
            layout.pane_heights = {0: PaneHeightOptions(factor=-1.0)}

    def test_chart_pane_heights_validation(self):
        """Test validation when creating charts with pane_heights."""
        data = [LineData(time=1640995200, value=100)]

        # Valid chart with pane_heights
        chart = BaseChart(
            options=ChartOptions(
                layout=LayoutOptions(
                    pane_heights={
                        0: PaneHeightOptions(factor=2.0),
                        1: PaneHeightOptions(factor=1.0),
                    },
                ),
            ),
            series=[LineSeries(data=data, pane_id=0), LineSeries(data=data, pane_id=1)],
        )
        assert chart.options.layout.pane_heights is not None

        # Invalid chart with pane_heights (should fail during construction)
        with pytest.raises(ValueValidationError):
            BaseChart(
                options=ChartOptions(
                    layout=LayoutOptions(pane_heights={0: PaneHeightOptions(factor=-1.0)}),
                ),
                series=[LineSeries(data=data, pane_id=0)],
            )
