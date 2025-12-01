"""Type definitions for series configuration system.

This module provides type definitions and dataclasses for series configuration
management used in the frontend-backend communication.
"""

from dataclasses import dataclass, field
from typing import Any, Literal, Union

from lightweight_charts_core.types.options import Options
from lightweight_charts_core.utils.chainable import chainable_field

# Type aliases
SeriesType = Literal[
    "line",
    "area",
    "baseline",
    "histogram",
    "candlestick",
    "bar",
    "custom",
    "ribbon",
    "supertrend",
    "bollinger",
    "macd",
]

ConfigValue = Union[str, int, float, bool, dict[str, Any]]
ConfigDict = dict[str, ConfigValue]


@dataclass
@chainable_field("pane_id", int)
@chainable_field("series_id", str)
@chainable_field("series_type", str)
@chainable_field("config", dict)
@chainable_field("timestamp", int)
@chainable_field("chart_id", str)
class SeriesConfigChange(Options):
    """Represents a single series configuration change from frontend."""

    pane_id: int = 0
    series_id: str = ""
    series_type: str = ""
    config: dict[str, Any] = field(default_factory=dict)
    timestamp: int = 0
    chart_id: str | None = None


@dataclass
@chainable_field("config", dict)
@chainable_field("series_type", str)
@chainable_field("last_modified", int)
class SeriesConfigState(Options):
    """Represents the complete series configuration state structure."""

    config: dict[str, Any] = field(default_factory=dict)
    series_type: str = ""
    last_modified: int = 0


@dataclass
@chainable_field("complete_state", dict)
class SeriesConfigBackendData(Options):
    """Backend data passed to frontend for series configuration initialization."""

    complete_state: dict[str, Any] = field(default_factory=dict)


@dataclass
@chainable_field("type", str)
@chainable_field("changes", list)
@chainable_field("complete_state", dict)
@chainable_field("timestamp", int)
class SeriesConfigChangesResult(Options):
    """Result object from frontend containing series configuration changes."""

    type: str = "series_config_changes"
    changes: list = field(default_factory=list)
    complete_state: dict[str, Any] = field(default_factory=dict)
    timestamp: int = 0

    @classmethod
    def fromdict(cls, data: dict) -> "SeriesConfigChangesResult":
        """Create from dictionary with proper change object conversion."""
        changes = [
            SeriesConfigChange.fromdict(change_data) for change_data in data.get("changes", [])
        ]

        return cls(
            type=data.get("type", "series_config_changes"),
            changes=changes,
            complete_state=data.get("completeState", {}),
            timestamp=data.get("timestamp", 0),
        )


@dataclass
@chainable_field("enabled", bool)
@chainable_field("auto_save", bool)
@chainable_field("session_key", str)
@chainable_field("export_format", str)
class SeriesConfigPersistenceOptions(Options):
    """Options for series configuration persistence."""

    enabled: bool = True
    auto_save: bool = True
    session_key: str = "series_configs"
    export_format: Literal["json", "yaml"] = "json"


@dataclass
@chainable_field("color", str)
@chainable_field("opacity", float)
@chainable_field("line_width", int)
@chainable_field("line_style", str)
@chainable_field("last_price_visible", bool)
@chainable_field("price_line_visible", bool)
@chainable_field("base_line_visible", bool)
@chainable_field("base_line_color", str)
@chainable_field("base_line_style", str)
@chainable_field("base_line_width", int)
class SeriesStyleConfig(Options):
    """Style configuration options for series."""

    color: str | None = None
    opacity: float | None = None
    line_width: int | None = None
    line_style: Literal["solid", "dashed", "dotted"] | None = None
    last_price_visible: bool | None = None
    price_line_visible: bool | None = None
    base_line_visible: bool | None = None
    base_line_color: str | None = None
    base_line_style: Literal["solid", "dashed", "dotted"] | None = None
    base_line_width: int | None = None


@dataclass
@chainable_field("visible", bool)
@chainable_field("price_line_visible", bool)
@chainable_field("last_value_visible", bool)
@chainable_field("title", str)
@chainable_field("price_format", dict)
@chainable_field("precision", int)
@chainable_field("min_move", float)
class SeriesVisibilityConfig(Options):
    """Visibility configuration options for series."""

    visible: bool | None = None
    price_line_visible: bool | None = None
    last_value_visible: bool | None = None
    title: str | None = None
    price_format: dict[str, Any] | None = None
    precision: int | None = None
    min_move: float | None = None


@dataclass
class SeriesInputConfig(Options):
    """Input configuration options for series (series-specific parameters)."""

    def __init__(self, **kwargs):
        """Initialize with dynamic properties based on series type."""
        for key, value in kwargs.items():
            setattr(self, key, value)


@dataclass
@chainable_field("style", SeriesStyleConfig)
@chainable_field("visibility", SeriesVisibilityConfig)
@chainable_field("inputs", SeriesInputConfig)
class SeriesConfiguration(Options):
    """Complete series configuration structure."""

    style: SeriesStyleConfig | None = None
    visibility: SeriesVisibilityConfig | None = None
    inputs: SeriesInputConfig | None = None

    # Legacy support for flat structure
    color: str | None = None
    opacity: float | None = None
    line_width: int | None = None
    line_style: Literal["solid", "dashed", "dotted"] | None = None
    last_price_visible: bool | None = None
    price_line_visible: bool | None = None
    visible: bool | None = None

    @classmethod
    def fromdict(cls, data: dict) -> "SeriesConfiguration":
        """Create from dictionary with proper nested object conversion."""
        style = None
        if "style" in data:
            style = SeriesStyleConfig.fromdict(data["style"])

        visibility = None
        if "visibility" in data:
            visibility = SeriesVisibilityConfig.fromdict(data["visibility"])

        inputs = None
        if "inputs" in data:
            inputs = SeriesInputConfig(**data["inputs"])

        return cls(
            style=style,
            visibility=visibility,
            inputs=inputs,
            color=data.get("color"),
            opacity=data.get("opacity"),
            line_width=data.get("lineWidth"),
            line_style=data.get("lineStyle"),
            last_price_visible=data.get("lastPriceVisible"),
            price_line_visible=data.get("priceLineVisible"),
            visible=data.get("visible"),
        )


# Type aliases for convenience
CompleteSeriesConfigState = dict[str, Any]
ChartSeriesConfigs = dict[str, Any]

__all__ = [
    "ChartSeriesConfigs",
    "CompleteSeriesConfigState",
    "ConfigDict",
    "ConfigValue",
    "SeriesConfigBackendData",
    "SeriesConfigChange",
    "SeriesConfigChangesResult",
    "SeriesConfigPersistenceOptions",
    "SeriesConfigState",
    "SeriesConfiguration",
    "SeriesInputConfig",
    "SeriesStyleConfig",
    "SeriesType",
    "SeriesVisibilityConfig",
]
