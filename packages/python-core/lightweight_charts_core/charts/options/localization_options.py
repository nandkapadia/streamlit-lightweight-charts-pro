"""Localization options for Streamlit Lightweight Charts.

This module provides localization configuration options for charts, enabling
customization of locale-specific formatting for dates, prices, and percentages.

Key Features:
    - Locale selection for international markets
    - Custom date format configuration
    - Price and percentage formatter customization
    - Support for custom formatting functions

Example:
    ```python
    from lightweight_charts_core.charts.options import LocalizationOptions

    # Create localization options for European market
    localization = LocalizationOptions(locale="de-DE", date_format="dd.MM.yyyy")
    ```

Version: 0.1.9
License: MIT

"""

from collections.abc import Callable
from dataclasses import dataclass

from lightweight_charts_core.charts.options.base_options import Options
from lightweight_charts_core.utils import chainable_field


@dataclass
@chainable_field("locale", str)
@chainable_field("date_format", str)
@chainable_field("price_formatter", allow_none=True)
@chainable_field("percentage_formatter", allow_none=True)
class LocalizationOptions(Options):
    """Localization configuration for charts.

    This class provides comprehensive localization options for customizing
    how dates, prices, and percentages are formatted and displayed in charts.
    It supports both locale-based formatting and custom formatter functions.

    Attributes:
        locale (str): The locale string for internationalization (e.g., 'en-US', 'de-DE').
            Defaults to 'en-US'. Must be a valid BCP 47 language tag.
        date_format (str): Date format string using standard format tokens.
            Defaults to 'yyyy-MM-dd'. Common formats include 'dd/MM/yyyy', 'MM/dd/yyyy'.
        price_formatter (Optional[Callable]): Custom function for formatting price values.
            If None, uses default price formatting based on locale.
        percentage_formatter (Optional[Callable]): Custom function for formatting percentage values.
            If None, uses default percentage formatting based on locale.

    Example:
        ```python
        from lightweight_charts_core.charts.options import LocalizationOptions

        # Basic locale configuration
        localization = LocalizationOptions(locale="ja-JP", date_format="yyyy年MM月dd日")


        # Custom formatter example
        def custom_price_formatter(price):
            return f"${price:,.2f}"


        localization = LocalizationOptions(locale="en-US", price_formatter=custom_price_formatter)
        ```

    See Also:
        ChartOptions: Main chart configuration that includes localization options.

    """

    locale: str = "en-US"
    date_format: str = "yyyy-MM-dd"
    price_formatter: Callable | None = None
    percentage_formatter: Callable | None = None
