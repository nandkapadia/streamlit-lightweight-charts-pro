"""Localization option classes for streamlit-lightweight-charts."""

from dataclasses import dataclass
from typing import Callable, Optional

from streamlit_lightweight_charts_pro.charts.options.base_options import Options
from streamlit_lightweight_charts_pro.utils import chainable_field


@dataclass
@chainable_field("locale", str)
@chainable_field("date_format", str)
@chainable_field("time_format", str)
@chainable_field("price_formatter", Callable)
@chainable_field("percentage_formatter", Callable)
class LocalizationOptions(Options):
    """Localization configuration for chart."""

    locale: str = "en-US"
    date_format: str = "yyyy-MM-dd"
    time_format: str = "HH:mm:ss"
    price_formatter: Optional[Callable] = None
    percentage_formatter: Optional[Callable] = None
