"""Baseline series for streamlit-lightweight-charts.

This module provides the BaselineSeries class for creating baseline charts that display
areas above and below a baseline value with different colors. Baseline series are commonly
used for highlighting positive/negative trends and threshold analysis.

The BaselineSeries class supports various styling options for the baseline, fill colors,
and animation effects. It also supports markers and price line configurations.

Example:
    from lightweight_charts_core.charts.series import BaselineSeries
    from lightweight_charts_core.data.baseline_data import BaselineData

    # Create baseline data
    data = [
        BaselineData(time=1640995200, value=100.5),
        BaselineData(time=1641081600, value=105.2)
    ]

    # Create baseline series with styling
    series = BaselineSeries(data=data)
    series.base_value = {"type": "price", "price": 100}
    series.top_line_color = "#26a69a"
    series.bottom_line_color = "#ef5350"

"""

from typing import Any

import pandas as pd
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.constants import (
    BASELINE_BOTTOM_FILL_COLOR1,
    BASELINE_BOTTOM_FILL_COLOR2,
    BASELINE_BOTTOM_LINE_COLOR,
    BASELINE_TOP_FILL_COLOR1,
    BASELINE_TOP_FILL_COLOR2,
    BASELINE_TOP_LINE_COLOR,
)
from lightweight_charts_core.data.baseline_data import BaselineData
from lightweight_charts_core.exceptions import BaseValueFormatError, ColorValidationError
from lightweight_charts_core.type_definitions import ChartType
from lightweight_charts_core.utils import chainable_property
from lightweight_charts_core.utils.data_utils import is_valid_color


def _validate_base_value_static(base_value) -> dict[str, Any]:
    """Static version of base_value validator for decorator use."""
    if isinstance(base_value, (int, float)):
        return {"type": "price", "price": float(base_value)}
    if isinstance(base_value, dict):
        if "type" not in base_value or "price" not in base_value:
            raise BaseValueFormatError()
        return {"type": str(base_value["type"]), "price": float(base_value["price"])}
    raise BaseValueFormatError()


@chainable_property("line_options", LineOptions, allow_none=True)
@chainable_property("base_value", validator=_validate_base_value_static)
@chainable_property("relative_gradient", bool)
@chainable_property("top_fill_color1", str, validator="color")
@chainable_property("top_fill_color2", str, validator="color")
@chainable_property("top_line_color", str, validator="color")
@chainable_property("bottom_fill_color1", str, validator="color")
@chainable_property("bottom_fill_color2", str, validator="color")
@chainable_property("bottom_line_color", str, validator="color")
class BaselineSeries(Series):
    """Baseline series for lightweight charts."""

    DATA_CLASS = BaselineData

    def __init__(
        self,
        data: list[BaselineData] | pd.DataFrame | pd.Series,
        column_mapping: dict | None = None,
        visible: bool = True,
        price_scale_id: str = "right",
        pane_id: int | None = 0,
    ):
        super().__init__(
            data=data,
            column_mapping=column_mapping,
            visible=visible,
            price_scale_id=price_scale_id,
            pane_id=pane_id,
        )

        # Initialize LineOptions for common line properties
        self._line_options = LineOptions()

        # Baseline-specific properties (not in LineOptions) - set default values internally
        self._base_value = self._validate_base_value({"type": "price", "price": 0})
        self._relative_gradient = False
        self._top_fill_color1 = BASELINE_TOP_FILL_COLOR1
        self._top_fill_color2 = BASELINE_TOP_FILL_COLOR2
        self._top_line_color = BASELINE_TOP_LINE_COLOR
        self._bottom_fill_color1 = BASELINE_BOTTOM_FILL_COLOR1
        self._bottom_fill_color2 = BASELINE_BOTTOM_FILL_COLOR2
        self._bottom_line_color = BASELINE_BOTTOM_LINE_COLOR

    def _validate_base_value(self, base_value: int | float | dict[str, Any]) -> dict[str, Any]:
        """Validate and normalize base_value."""
        if isinstance(base_value, (int, float)):
            return {"type": "price", "price": float(base_value)}
        if isinstance(base_value, dict):
            if "type" not in base_value or "price" not in base_value:
                raise BaseValueFormatError()
            return {"type": str(base_value["type"]), "price": float(base_value["price"])}
        raise BaseValueFormatError()

    def _validate_color(self, color: str, property_name: str) -> str:
        """Validate color format."""
        if not is_valid_color(color):
            raise ColorValidationError(property_name, color)
        return color

    @property
    def chart_type(self) -> ChartType:
        """Get the chart type for this series."""
        return ChartType.BASELINE
