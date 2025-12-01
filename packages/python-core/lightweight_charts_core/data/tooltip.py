"""Tooltip data structures and utilities for Lightweight Charts.

This module provides comprehensive tooltip functionality with support for
dynamic content using placeholders, multiple tooltip types, and flexible
configuration options.
"""

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

import pandas as pd
from lightweight_charts_core.type_definitions.enums import TooltipPosition, TooltipType


@dataclass
class TooltipField:
    """Represents a single field in a tooltip.

    Attributes:
        label: Display label for the field
        value_key: Key to access the value from data
        formatter: Optional function to format the value
        color: Optional color for the field
        font_size: Optional font size for the field
        font_weight: Optional font weight for the field
        prefix: Optional prefix to add before the value
        suffix: Optional suffix to add after the value
        precision: Optional decimal precision for numeric values

    """

    label: str
    value_key: str
    formatter: Callable[[Any], str] | None = None
    color: str | None = None
    font_size: int | None = None
    font_weight: str | None = None
    prefix: str | None = None
    suffix: str | None = None
    precision: int | None = None

    def format_value(self, value: Any) -> str:
        """Format the value according to field configuration."""
        if self.formatter:
            return self.formatter(value)

        # Apply precision for numeric values
        if self.precision is not None and isinstance(value, (int, float)):
            value = f"{value:.{self.precision}f}"
        else:
            value = str(value)

        # Add prefix and suffix
        result = value
        if self.prefix:
            result = f"{self.prefix}{result}"
        if self.suffix:
            result = f"{result}{self.suffix}"

        return result


@dataclass
class TooltipStyle:
    """Styling configuration for tooltips.

    Attributes:
        background_color: Background color of the tooltip
        border_color: Border color of the tooltip
        border_width: Border width in pixels
        border_radius: Border radius in pixels
        padding: Padding in pixels
        font_size: Font size in pixels
        font_family: Font family
        color: Text color
        box_shadow: CSS box shadow
        z_index: Z-index for layering

    """

    background_color: str = "rgba(255, 255, 255, 0.95)"
    border_color: str = "#e1e3e6"
    border_width: int = 1
    border_radius: int = 4
    padding: int = 6
    font_size: int = 12
    font_family: str = "sans-serif"
    color: str = "#131722"
    box_shadow: str = "0 2px 4px rgba(0, 0, 0, 0.1)"
    z_index: int = 1000


@dataclass
class TooltipConfig:
    """Configuration for tooltip functionality.

    Attributes:
        enabled: Whether tooltips are enabled
        type: Type of tooltip to display
        template: Template string with placeholders
        fields: List of tooltip fields
        position: Tooltip positioning
        offset: Offset from cursor or fixed position
        style: Tooltip styling
        show_date: Whether to show date
        date_format: Date format string
        show_time: Whether to show time
        time_format: Time format string
        custom_formatters: Custom formatter functions

    """

    enabled: bool = True
    type: TooltipType = TooltipType.OHLC
    template: str | None = None
    fields: list[TooltipField] = field(default_factory=list)
    position: TooltipPosition = TooltipPosition.CURSOR
    offset: dict[str, int] | None = None
    style: TooltipStyle = field(default_factory=TooltipStyle)
    show_date: bool = True
    date_format: str = "%Y-%m-%d"
    show_time: bool = True
    time_format: str = "%H:%M:%S"
    custom_formatters: dict[str, Callable[[Any], str]] = field(default_factory=dict)

    def __post_init__(self):
        """Initialize default fields based on tooltip type."""
        if not self.fields and self.type == TooltipType.OHLC:
            self.fields = self._get_default_ohlc_fields()
        elif not self.fields and self.type == TooltipType.SINGLE:
            self.fields = self._get_default_single_fields()
        elif not self.fields and self.type == TooltipType.TRADE:
            self.fields = self._get_default_trade_fields()

    def _get_default_ohlc_fields(self) -> list[TooltipField]:
        """Get default fields for OHLC tooltip."""
        return [
            TooltipField("Open", "open", precision=2, prefix="$"),
            TooltipField("High", "high", precision=2, prefix="$"),
            TooltipField("Low", "low", precision=2, prefix="$"),
            TooltipField("Close", "close", precision=2, prefix="$"),
            TooltipField("Volume", "volume", formatter=self._format_volume),
        ]

    def _get_default_single_fields(self) -> list[TooltipField]:
        """Get default fields for single value tooltip."""
        return [
            TooltipField("Value", "value", precision=2),
        ]

    def _get_default_trade_fields(self) -> list[TooltipField]:
        """Get default fields for trade tooltip."""
        return [
            TooltipField("Entry", "entryPrice", precision=2, prefix="$"),
            TooltipField("Exit", "exitPrice", precision=2, prefix="$"),
            TooltipField("Quantity", "quantity"),
            TooltipField("P&L", "pnl", precision=2, prefix="$"),
            TooltipField("P&L %", "pnlPercentage", precision=1, suffix="%"),
        ]

    def _format_volume(self, value: Any) -> str:
        """Format volume with K, M, B suffixes."""
        if not isinstance(value, (int, float)):
            return str(value)

        if value >= 1e9:
            return f"{value / 1e9:.1f}B"
        if value >= 1e6:
            return f"{value / 1e6:.1f}M"
        if value >= 1e3:
            return f"{value / 1e3:.1f}K"
        return f"{value:,.0f}"

    def format_tooltip(
        self,
        data: dict[str, Any],
        time_value: int | str | pd.Timestamp | None = None,
    ) -> str:
        """Format tooltip content using template or fields.

        Args:
            data: Data dictionary containing values
            time_value: Optional time value for date/time formatting

        Returns:
            Formatted tooltip string

        """
        if self.template:
            return self._format_with_template(data, time_value)
        return self._format_with_fields(data, time_value)

    def _format_with_template(
        self,
        data: dict[str, Any],
        time_value: int | str | pd.Timestamp | None = None,
    ) -> str:
        """Format tooltip using template string with placeholders."""
        if not self.template:
            return ""

        # Start with the template
        result = self.template

        # Replace placeholders with actual values
        for key, value in data.items():
            placeholder = f"{{{key}}}"
            if placeholder in result:
                # Format the value based on field configuration
                field_config = next((f for f in self.fields if f.value_key == key), None)
                formatted_value = field_config.format_value(value) if field_config else str(value)
                result = result.replace(placeholder, formatted_value)

        # Add date/time if configured
        if time_value and (self.show_date or self.show_time):
            time_str = self._format_time(time_value)
            if time_str:
                result = f"{time_str}\n{result}"

        return result

    def _format_with_fields(
        self,
        data: dict[str, Any],
        time_value: int | str | pd.Timestamp | None = None,
    ) -> str:
        """Format tooltip using field configuration."""
        lines = []

        # Add date/time if configured
        if time_value and (self.show_date or self.show_time):
            time_str = self._format_time(time_value)
            if time_str:
                lines.append(time_str)

        # Add field values
        for tooltip_field in self.fields:
            if tooltip_field.value_key in data:
                value = data[tooltip_field.value_key]
                formatted_value = tooltip_field.format_value(value)
                lines.append(f"{tooltip_field.label}: {formatted_value}")

        return "\n".join(lines)

    def _format_time(self, time_value: int | str | pd.Timestamp) -> str:
        """Format time value according to configuration."""
        try:
            if isinstance(time_value, (int, float)):
                # Convert timestamp to datetime
                dt = pd.to_datetime(time_value, unit="s")
            elif isinstance(time_value, str):
                dt = pd.to_datetime(time_value)
            else:
                dt = pd.to_datetime(time_value)

            parts = []
            if self.show_date:
                parts.append(dt.strftime(self.date_format))
            if self.show_time:
                parts.append(dt.strftime(self.time_format))

            return " ".join(parts)
        except Exception:
            return str(time_value)

    def asdict(self) -> dict[str, Any]:
        """Convert tooltip config to dictionary for serialization."""
        return {
            "enabled": self.enabled,
            "type": self.type.value,
            "template": self.template,
            "fields": [self._field_to_dict(f) for f in self.fields],
            "position": self.position.value,
            "offset": self.offset,
            "style": self._style_to_dict(self.style),
            "showDate": self.show_date,
            "dateFormat": self.date_format,
            "showTime": self.show_time,
            "timeFormat": self.time_format,
        }

    def _field_to_dict(self, tooltip_field: TooltipField) -> dict[str, Any]:
        """Convert tooltip field to dictionary."""
        return {
            "label": tooltip_field.label,
            "valueKey": tooltip_field.value_key,
            "color": tooltip_field.color,
            "fontSize": tooltip_field.font_size,
            "fontWeight": tooltip_field.font_weight,
            "prefix": tooltip_field.prefix,
            "suffix": tooltip_field.suffix,
            "precision": tooltip_field.precision,
        }

    def _style_to_dict(self, style: TooltipStyle) -> dict[str, Any]:
        """Convert tooltip style to dictionary."""
        return {
            "backgroundColor": style.background_color,
            "borderColor": style.border_color,
            "borderWidth": style.border_width,
            "borderRadius": style.border_radius,
            "padding": style.padding,
            "fontSize": style.font_size,
            "fontFamily": style.font_family,
            "color": style.color,
            "boxShadow": style.box_shadow,
            "zIndex": style.z_index,
        }


class TooltipManager:
    """Manages tooltip functionality across multiple series and data types.

    This class provides centralized tooltip management with support for
    different data types, dynamic content, and consistent formatting.
    """

    def __init__(self) -> None:
        """Initialize tooltip manager."""
        self.configs: dict[str, TooltipConfig] = {}
        self.custom_formatters: dict[str, Callable[[Any], str]] = {}

    def add_config(self, name: str, config: TooltipConfig) -> "TooltipManager":
        """Add a tooltip configuration."""
        self.configs[name] = config
        return self

    def get_config(self, name: str) -> TooltipConfig | None:
        """Get a tooltip configuration by name."""
        return self.configs.get(name)

    def remove_config(self, name: str) -> bool:
        """Remove a tooltip configuration."""
        if name in self.configs:
            del self.configs[name]
            return True
        return False

    def add_custom_formatter(self, name: str, formatter: Callable[[Any], str]) -> "TooltipManager":
        """Add a custom formatter function."""
        self.custom_formatters[name] = formatter
        return self

    def format_tooltip(
        self,
        config_name: str,
        data: dict[str, Any],
        time_value: int | str | pd.Timestamp | None = None,
    ) -> str:
        """Format tooltip using specified configuration."""
        config = self.get_config(config_name)
        if not config:
            return ""

        # Add custom formatters to config
        config.custom_formatters.update(self.custom_formatters)

        return config.format_tooltip(data, time_value)

    def create_ohlc_tooltip(self, name: str = "default") -> TooltipConfig:
        """Create a standard OHLC tooltip configuration."""
        config = TooltipConfig(type=TooltipType.OHLC)
        self.add_config(name, config)
        return config

    def create_trade_tooltip(self, name: str = "trade") -> TooltipConfig:
        """Create a standard trade tooltip configuration."""
        config = TooltipConfig(type=TooltipType.TRADE)
        self.add_config(name, config)
        return config

    def create_custom_tooltip(self, template: str, name: str = "custom") -> TooltipConfig:
        """Create a custom tooltip configuration with template."""
        config = TooltipConfig(type=TooltipType.CUSTOM, template=template)
        self.add_config(name, config)
        return config


# Convenience functions for common tooltip configurations
def create_ohlc_tooltip() -> TooltipConfig:
    """Create a standard OHLC tooltip configuration."""
    return TooltipConfig(type=TooltipType.OHLC)


def create_trade_tooltip() -> TooltipConfig:
    """Create a standard trade tooltip configuration."""
    return TooltipConfig(type=TooltipType.TRADE)


def create_custom_tooltip(template: str) -> TooltipConfig:
    """Create a custom tooltip configuration with template."""
    return TooltipConfig(type=TooltipType.CUSTOM, template=template)


def create_single_value_tooltip() -> TooltipConfig:
    """Create a single value tooltip configuration."""
    return TooltipConfig(type=TooltipType.SINGLE)


def create_multi_series_tooltip() -> TooltipConfig:
    """Create a multi-series tooltip configuration."""
    return TooltipConfig(type=TooltipType.MULTI)
