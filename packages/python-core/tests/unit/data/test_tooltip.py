"""Unit tests for tooltip functionality.

This module tests the tooltip data structures, configuration, and formatting
functionality to ensure proper operation of the tooltip system.
"""

import pandas as pd
from lightweight_charts_core.charts import BaseChart, LineSeries
from lightweight_charts_core.data import SingleValueData
from lightweight_charts_core.data.tooltip import (
    TooltipConfig,
    TooltipField,
    TooltipManager,
    TooltipPosition,
    TooltipStyle,
    TooltipType,
    create_custom_tooltip,
    create_multi_series_tooltip,
    create_ohlc_tooltip,
    create_single_value_tooltip,
    create_trade_tooltip,
)


class TestTooltipField:
    """Test TooltipField functionality."""

    def test_basic_construction(self):
        """Test basic TooltipField construction."""
        field = TooltipField("Price", "price")
        assert field.label == "Price"
        assert field.value_key == "price"
        assert field.formatter is None
        assert field.color is None

    def test_construction_with_options(self):
        """Test TooltipField construction with all options."""
        field = TooltipField(
            label="Volume",
            value_key="volume",
            color="#ff0000",
            font_size=14,
            font_weight="bold",
            prefix="$",
            suffix="K",
            precision=2,
        )
        assert field.label == "Volume"
        assert field.value_key == "volume"
        assert field.color == "#ff0000"
        assert field.font_size == 14
        assert field.font_weight == "bold"
        assert field.prefix == "$"
        assert field.suffix == "K"
        assert field.precision == 2

    def test_format_value_basic(self):
        """Test basic value formatting."""
        field = TooltipField("Price", "price")
        result = field.format_value(100.123)
        assert result == "100.123"

    def test_format_value_with_precision(self):
        """Test value formatting with precision."""
        field = TooltipField("Price", "price", precision=2)
        result = field.format_value(100.123)
        assert result == "100.12"

    def test_format_value_with_prefix_suffix(self):
        """Test value formatting with prefix and suffix."""
        field = TooltipField("Price", "price", prefix="$", suffix=" USD")
        result = field.format_value(100.12)
        assert result == "$100.12 USD"

    def test_format_value_with_custom_formatter(self):
        """Test value formatting with custom formatter."""

        def volume_formatter(value):
            if value >= 1000000:
                return f"{value / 1000000:.1f}M"
            if value >= 1000:
                return f"{value / 1000:.1f}K"
            return str(value)

        field = TooltipField("Volume", "volume", formatter=volume_formatter)
        assert field.format_value(1500000) == "1.5M"
        assert field.format_value(1500) == "1.5K"
        assert field.format_value(150) == "150"


class TestTooltipStyle:
    """Test TooltipStyle functionality."""

    def test_default_construction(self):
        """Test default TooltipStyle construction."""
        style = TooltipStyle()
        assert style.background_color == "rgba(255, 255, 255, 0.95)"
        assert style.border_color == "#e1e3e6"
        assert style.border_width == 1
        assert style.border_radius == 4
        assert style.padding == 6
        assert style.font_size == 12
        assert style.font_family == "sans-serif"
        assert style.color == "#131722"
        assert style.box_shadow == "0 2px 4px rgba(0, 0, 0, 0.1)"
        assert style.z_index == 1000

    def test_custom_construction(self):
        """Test custom TooltipStyle construction."""
        style = TooltipStyle(
            background_color="rgba(0, 0, 0, 0.9)",
            border_color="#00ff00",
            border_width=2,
            border_radius=8,
            padding=12,
            font_size=14,
            font_family="monospace",
            color="#ffffff",
            box_shadow="0 4px 8px rgba(0, 0, 0, 0.3)",
            z_index=2000,
        )
        assert style.background_color == "rgba(0, 0, 0, 0.9)"
        assert style.border_color == "#00ff00"
        assert style.border_width == 2
        assert style.border_radius == 8
        assert style.padding == 12
        assert style.font_size == 14
        assert style.font_family == "monospace"
        assert style.color == "#ffffff"
        assert style.box_shadow == "0 4px 8px rgba(0, 0, 0, 0.3)"
        assert style.z_index == 2000


class TestTooltipConfig:
    """Test TooltipConfig functionality."""

    def test_default_ohlc_construction(self):
        """Test default OHLC tooltip construction."""
        config = TooltipConfig(type=TooltipType.OHLC)
        assert config.enabled is True
        assert config.type == TooltipType.OHLC
        assert config.template is None
        assert len(config.fields) == 5  # Default OHLC fields
        assert config.position == TooltipPosition.CURSOR
        assert config.offset is None
        assert config.show_date is True
        assert config.show_time is True

    def test_custom_construction(self):
        """Test custom tooltip construction."""
        fields = [
            TooltipField("Price", "price", precision=2, prefix="$"),
            TooltipField("Volume", "volume"),
        ]
        style = TooltipStyle(background_color="rgba(0, 0, 0, 0.9)")

        config = TooltipConfig(
            enabled=False,
            type=TooltipType.CUSTOM,
            template="Price: ${price}",
            fields=fields,
            position=TooltipPosition.FIXED,
            offset={"x": 10, "y": -10},
            style=style,
            show_date=False,
            show_time=False,
        )

        assert config.enabled is False
        assert config.type == TooltipType.CUSTOM
        assert config.template == "Price: ${price}"
        assert len(config.fields) == 2
        assert config.position == TooltipPosition.FIXED
        assert config.offset == {"x": 10, "y": -10}
        assert config.style == style
        assert config.show_date is False
        assert config.show_time is False

    def test_format_tooltip_with_template(self):
        """Test tooltip formatting with template."""
        config = TooltipConfig(
            type=TooltipType.CUSTOM,
            template="Price: {price}, Volume: {volume}",
            fields=[
                TooltipField("Price", "price", precision=2, prefix="$"),
                TooltipField("Volume", "volume"),
            ],
        )

        data = {"price": 100.50, "volume": 1500}
        result = config.format_tooltip(data)
        assert "Price: $100.50" in result
        assert "Volume: 1500" in result

    def test_format_tooltip_with_fields(self):
        """Test tooltip formatting with fields."""
        config = TooltipConfig(
            type=TooltipType.SINGLE,
            fields=[
                TooltipField("Price", "price", precision=2, prefix="$"),
                TooltipField("Volume", "volume"),
            ],
        )

        data = {"price": 100.50, "volume": 1500}
        result = config.format_tooltip(data)
        assert "Price: $100.50" in result
        assert "Volume: 1500" in result

    def test_format_tooltip_with_time(self):
        """Test tooltip formatting with time."""
        config = TooltipConfig(
            type=TooltipType.SINGLE,
            fields=[TooltipField("Price", "price")],
            show_date=True,
            show_time=True,
            date_format="%Y-%m-%d",
            time_format="%H:%M",
        )

        data = {"price": 100.50}
        time_value = 1640995200  # 2022-01-01 00:00:00 UTC
        result = config.format_tooltip(data, time_value)
        assert "2022-01-01" in result
        assert "00:00" in result

    def test_format_tooltip_with_pandas_timestamp(self):
        """Test tooltip formatting with pandas timestamp."""
        config = TooltipConfig(
            type=TooltipType.SINGLE,
            fields=[TooltipField("Price", "price")],
            show_date=True,
            show_time=True,
        )

        data = {"price": 100.50}
        time_value = pd.Timestamp("2022-01-01 12:30:00")
        result = config.format_tooltip(data, time_value)
        assert "2022-01-01" in result
        assert "12:30:00" in result

    def test_asdict(self):
        """Test tooltip config serialization."""
        fields = [TooltipField("Price", "price", precision=2, prefix="$")]
        style = TooltipStyle(background_color="rgba(0, 0, 0, 0.9)")

        config = TooltipConfig(
            enabled=True,
            type=TooltipType.CUSTOM,
            template="Price: ${price}",
            fields=fields,
            position=TooltipPosition.CURSOR,
            offset={"x": 10, "y": -10},
            style=style,
            show_date=True,
            show_time=True,
            date_format="%Y-%m-%d",
            time_format="%H:%M",
        )

        result = config.asdict()

        assert result["enabled"] is True
        assert result["type"] == "custom"
        assert result["template"] == "Price: ${price}"
        assert len(result["fields"]) == 1
        assert result["position"] == "cursor"
        assert result["offset"] == {"x": 10, "y": -10}
        assert result["showDate"] is True
        assert result["showTime"] is True
        assert result["dateFormat"] == "%Y-%m-%d"
        assert result["timeFormat"] == "%H:%M"


class TestTooltipManager:
    """Test TooltipManager functionality."""

    def test_construction(self):
        """Test TooltipManager construction."""
        manager = TooltipManager()
        assert len(manager.configs) == 0
        assert len(manager.custom_formatters) == 0

    def test_add_config(self):
        """Test adding tooltip configuration."""
        manager = TooltipManager()
        config = TooltipConfig(type=TooltipType.OHLC)

        result = manager.add_config("default", config)
        assert result is manager  # Method chaining
        assert "default" in manager.configs
        assert manager.configs["default"] == config

    def test_get_config(self):
        """Test getting tooltip configuration."""
        manager = TooltipManager()
        config = TooltipConfig(type=TooltipType.OHLC)
        manager.add_config("default", config)

        result = manager.get_config("default")
        assert result == config

        result = manager.get_config("nonexistent")
        assert result is None

    def test_remove_config(self):
        """Test removing tooltip configuration."""
        manager = TooltipManager()
        config = TooltipConfig(type=TooltipType.OHLC)
        manager.add_config("default", config)

        result = manager.remove_config("default")
        assert result is True
        assert "default" not in manager.configs

        result = manager.remove_config("nonexistent")
        assert result is False

    def test_add_custom_formatter(self):
        """Test adding custom formatter."""
        manager = TooltipManager()

        def volume_formatter(value):
            return f"{value / 1000:.1f}K"

        result = manager.add_custom_formatter("volume", volume_formatter)
        assert result is manager  # Method chaining
        assert "volume" in manager.custom_formatters

    def test_format_tooltip(self):
        """Test formatting tooltip with manager."""
        manager = TooltipManager()
        config = TooltipConfig(
            type=TooltipType.CUSTOM,
            template="Price: {price}",
            fields=[TooltipField("Price", "price", precision=2, prefix="$")],
        )
        manager.add_config("default", config)

        data = {"price": 100.50}
        result = manager.format_tooltip("default", data)
        assert "Price: $100.50" in result

    def test_create_ohlc_tooltip(self):
        """Test creating OHLC tooltip."""
        manager = TooltipManager()
        config = manager.create_ohlc_tooltip("price")

        assert config.type == TooltipType.OHLC
        assert "price" in manager.configs
        assert manager.configs["price"] == config

    def test_create_trade_tooltip(self):
        """Test creating trade tooltip."""
        manager = TooltipManager()
        config = manager.create_trade_tooltip("trade")

        assert config.type == TooltipType.TRADE
        assert "trade" in manager.configs
        assert manager.configs["trade"] == config

    def test_create_custom_tooltip(self):
        """Test creating custom tooltip."""
        manager = TooltipManager()
        config = manager.create_custom_tooltip("Price: ${price}", "custom")

        assert config.type == TooltipType.CUSTOM
        assert config.template == "Price: ${price}"
        assert "custom" in manager.configs
        assert manager.configs["custom"] == config


class TestTooltipConvenienceFunctions:
    """Test tooltip convenience functions."""

    def test_create_ohlc_tooltip(self):
        """Test create_ohlc_tooltip function."""
        config = create_ohlc_tooltip()
        assert config.type == TooltipType.OHLC
        assert len(config.fields) == 5  # Default OHLC fields

    def test_create_trade_tooltip(self):
        """Test create_trade_tooltip function."""
        config = create_trade_tooltip()
        assert config.type == TooltipType.TRADE
        assert len(config.fields) == 5  # Default trade fields

    def test_create_custom_tooltip(self):
        """Test create_custom_tooltip function."""
        template = "Price: ${price}, Volume: {volume}"
        config = create_custom_tooltip(template)
        assert config.type == TooltipType.CUSTOM
        assert config.template == template

    def test_create_single_value_tooltip(self):
        """Test create_single_value_tooltip function."""
        config = create_single_value_tooltip()
        assert config.type == TooltipType.SINGLE
        assert len(config.fields) == 1  # Default single value field

    def test_create_multi_series_tooltip(self):
        """Test create_multi_series_tooltip function."""
        config = create_multi_series_tooltip()
        assert config.type == TooltipType.MULTI


class TestTooltipIntegration:
    """Test tooltip integration with chart components."""

    def test_tooltip_with_chart_series(self):
        """Test tooltip integration with chart series."""
        # Create data
        data = [
            SingleValueData(time="2024-01-01", value=100),
            SingleValueData(time="2024-01-02", value=105),
        ]

        # Create series with tooltip
        series = LineSeries(data=data)
        tooltip_config = create_single_value_tooltip()
        series.tooltip = tooltip_config

        # Create chart
        BaseChart(series=series)

        # Verify tooltip is set
        assert series.tooltip == tooltip_config

    def test_tooltip_with_chart_manager(self):
        """Test tooltip integration with chart tooltip manager."""
        # Create data
        data = [
            SingleValueData(time="2024-01-01", value=100),
            SingleValueData(time="2024-01-02", value=105),
        ]

        # Create chart
        chart = BaseChart(series=LineSeries(data=data))

        # Create tooltip manager
        tooltip_manager = TooltipManager()
        tooltip_manager.create_ohlc_tooltip("default")

        # Set tooltip manager
        chart.set_tooltip_manager(tooltip_manager)

        # Verify tooltip manager is set
        assert chart._tooltip_manager == tooltip_manager

    def test_tooltip_config_serialization(self):
        """Test tooltip configuration serialization for frontend."""
        config = TooltipConfig(
            type=TooltipType.CUSTOM,
            template="Price: {price}",
            fields=[TooltipField("Price", "price", precision=2, prefix="$")],
            position=TooltipPosition.CURSOR,
            offset={"x": 10, "y": -10},
            style=TooltipStyle(background_color="rgba(0, 0, 0, 0.9)"),
            show_date=True,
            show_time=True,
            date_format="%Y-%m-%d",
            time_format="%H:%M",
        )

        result = config.asdict()

        # Verify all fields are properly serialized
        assert "enabled" in result
        assert "type" in result
        assert "template" in result
        assert "fields" in result
        assert "position" in result
        assert "offset" in result
        assert "style" in result
        assert "showDate" in result
        assert "showTime" in result
        assert "dateFormat" in result
        assert "timeFormat" in result

        # Verify field serialization
        assert len(result["fields"]) == 1
        field = result["fields"][0]
        assert field["label"] == "Price"
        assert field["valueKey"] == "price"
        assert field["precision"] == 2
        assert field["prefix"] == "$"

        # Verify style serialization
        style = result["style"]
        assert style["backgroundColor"] == "rgba(0, 0, 0, 0.9)"
