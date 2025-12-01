"""Test utilities for streamlit-lightweight-charts-pro tests."""


def _get_enum_value(value, enum_class):
    """Helper function to get enum value, handling both enum objects and strings.

    This function safely converts enum values to their string representations,
    handling cases where the value might already be a string or an enum object.
    It provides robust conversion for enum values used throughout the series
    configuration system.

    Args:
        value: The value to convert (can be enum object or string).
        enum_class: The enum class to use for conversion.

    Returns:
        str: The string value of the enum.

    Example:
        ```python
        # With enum object
        _get_enum_value(LineStyle.SOLID, LineStyle)  # Returns "solid"

        # With string
        _get_enum_value("solid", LineStyle)  # Returns "solid"
        ```

    """
    if isinstance(value, enum_class):
        return value.value
    if isinstance(value, str):
        # Try to convert string to enum
        try:
            return enum_class(value).value
        except ValueError:
            # If conversion fails, return the string as-is
            return value
    else:
        return value
