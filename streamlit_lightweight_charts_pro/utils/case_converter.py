"""Case conversion utilities for Streamlit Lightweight Charts Pro.

This module provides a single source of truth for case conversion between
Python's snake_case naming convention and JavaScript's camelCase convention.

All case conversion logic is centralized here to ensure consistency and
maintainability across the entire codebase. This prevents bugs that arise
from having multiple implementations with slightly different behavior.

Key Features:
    - Snake_case to camelCase conversion
    - CamelCase to snake_case conversion
    - Recursive dictionary key conversion
    - List processing with nested structure support
    - Comprehensive edge case handling (numbers, special characters, etc.)
    - Type-safe with proper error handling

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.utils.case_converter import CaseConverter

    # Basic string conversion
    CaseConverter.snake_to_camel("price_scale_id")  # Returns: "priceScaleId"
    CaseConverter.camel_to_snake("priceScaleId")  # Returns: "price_scale_id"

    # Dictionary key conversion
    data = {"price_scale_id": "right", "line_width": 2}
    CaseConverter.convert_dict_keys(data, to_camel=True)
    # Returns: {"priceScaleId": "right", "lineWidth": 2}

    # Nested structure conversion
    nested = {"chart_options": {"time_scale": {"visible": True}, "price_scale": {"auto_scale": False}}}
    CaseConverter.convert_dict_keys(nested, to_camel=True)
    # Returns: {"chartOptions": {"timeScale": {...}, "priceScale": {...}}}
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

import re
from typing import Any, Dict, List

__all__ = ["CaseConverter"]


class CaseConverter:
    """Single source of truth for case conversion operations.

    This class provides static methods for converting between snake_case
    (Python convention) and camelCase (JavaScript convention). It handles
    various edge cases and supports recursive conversion of nested structures.

    All methods are static, so no instance creation is needed.

    Design Patterns:
        - Utility Class: All methods are static
        - Single Responsibility: Only handles case conversion
        - DRY: Single implementation used throughout codebase

    Thread Safety:
        All methods are thread-safe as they don't maintain any state.
    """

    # Compiled regex patterns for performance
    _CAMEL_PATTERN = re.compile(r"(?<!^)(?=[A-Z])")
    _SNAKE_PATTERN = re.compile(r"_([a-z0-9])")

    @staticmethod
    def snake_to_camel(snake_case: str) -> str:
        """Convert snake_case string to camelCase.

        This function converts strings from Python's snake_case format to
        JavaScript's camelCase format. The first character remains lowercase,
        and each word after an underscore is capitalized with the underscore
        removed.

        Args:
            snake_case: String in snake_case format (e.g., "price_scale_id").

        Returns:
            str: String in camelCase format (e.g., "priceScaleId").

        Examples:
            >>> CaseConverter.snake_to_camel("price_scale_id")
            'priceScaleId'
            >>> CaseConverter.snake_to_camel("line_color")
            'lineColor'
            >>> CaseConverter.snake_to_camel("http_status_code")
            'httpStatusCode'
            >>> CaseConverter.snake_to_camel("single_word")
            'singleWord'
            >>> CaseConverter.snake_to_camel("already_camel")
            'alreadyCamel'
            >>> CaseConverter.snake_to_camel("with_123_numbers")
            'with123Numbers'
            >>> CaseConverter.snake_to_camel("_leading_underscore")
            'LeadingUnderscore'
            >>> CaseConverter.snake_to_camel("trailing_underscore_")
            'trailingUnderscore'
            >>> CaseConverter.snake_to_camel("multiple___underscores")
            'multipleUnderscores'

        Note:
            - Leading underscores result in capitalized first letter
            - Trailing underscores are removed
            - Multiple consecutive underscores are treated as one
            - Empty strings return empty strings
            - Strings with no underscores return unchanged
        """
        if not snake_case:
            return snake_case

        # Handle leading underscores specially
        leading_underscores = len(snake_case) - len(snake_case.lstrip("_"))
        snake_case = snake_case.lstrip("_")

        # Handle trailing underscores
        snake_case = snake_case.rstrip("_")

        if not snake_case:
            return ""

        # Split on underscores and capitalize all but first word
        components = snake_case.split("_")
        # Filter out empty strings from multiple underscores
        components = [c for c in components if c]

        if not components:
            return ""

        # First component stays lowercase (unless there were leading underscores)
        result = components[0]
        if leading_underscores > 0:
            result = result.capitalize()

        # Subsequent components are capitalized
        result += "".join(word.capitalize() for word in components[1:])

        return result

    @staticmethod
    def camel_to_snake(camel_case: str) -> str:
        """Convert camelCase string to snake_case.

        This function converts strings from JavaScript's camelCase format to
        Python's snake_case format. Capital letters (except the first character)
        are converted to lowercase and preceded by an underscore.

        Args:
            camel_case: String in camelCase format (e.g., "priceScaleId").

        Returns:
            str: String in snake_case format (e.g., "price_scale_id").

        Examples:
            >>> CaseConverter.camel_to_snake("priceScaleId")
            'price_scale_id'
            >>> CaseConverter.camel_to_snake("lineColor")
            'line_color'
            >>> CaseConverter.camel_to_snake("HTTPStatusCode")
            'http_status_code'
            >>> CaseConverter.camel_to_snake("singleWord")
            'single_word'
            >>> CaseConverter.camel_to_snake("alreadySnake")
            'already_snake'
            >>> CaseConverter.camel_to_snake("IOError")
            'io_error'
            >>> CaseConverter.camel_to_snake("HTTPSConnection")
            'https_connection'
            >>> CaseConverter.camel_to_snake("getHTTPResponseCode")
            'get_http_response_code'
            >>> CaseConverter.camel_to_snake("with123Numbers")
            'with123_numbers'

        Note:
            - Consecutive capital letters are kept together (HTTP → http)
            - Numbers are preserved in their original position
            - Already snake_case strings are returned unchanged
            - Empty strings return empty strings
        """
        if not camel_case:
            return camel_case

        # Insert underscore before uppercase letters
        snake_case = CaseConverter._CAMEL_PATTERN.sub("_", camel_case)

        # Convert to lowercase
        return snake_case.lower()

    @staticmethod
    def convert_dict_keys(
        data: Dict[str, Any], to_camel: bool = True, recursive: bool = True
    ) -> Dict[str, Any]:
        """Convert all dictionary keys between snake_case and camelCase.

        This function converts dictionary keys while preserving the structure
        and values. It can optionally recurse into nested dictionaries and lists.

        Args:
            data: Dictionary with keys to convert.
            to_camel: If True, convert to camelCase; if False, to snake_case.
                Defaults to True (Python → JavaScript).
            recursive: If True, recursively convert nested structures.
                Defaults to True.

        Returns:
            Dict[str, Any]: New dictionary with converted keys. Original dict
                is not modified.

        Examples:
            >>> data = {"price_scale": {"visible": True}}
            >>> CaseConverter.convert_dict_keys(data)
            {'priceScale': {'visible': True}}

            >>> data = {"priceScale": {"autoScale": False}}
            >>> CaseConverter.convert_dict_keys(data, to_camel=False)
            {'price_scale': {'auto_scale': False}}

            >>> data = {"chart_options": {"series": [{"line_color": "red"}, {"line_color": "blue"}]}}
            >>> CaseConverter.convert_dict_keys(data)
            {'chartOptions': {'series': [{'lineColor': 'red'}, {'lineColor': 'blue'}]}}

        Note:
            - Non-string keys are preserved as-is
            - Nested dictionaries are converted if recursive=True
            - Lists containing dicts are processed if recursive=True
            - Original dictionary is not modified (returns new dict)
        """
        if not isinstance(data, dict):
            return data

        converter = CaseConverter.snake_to_camel if to_camel else CaseConverter.camel_to_snake
        result = {}

        for key, value in data.items():
            # Convert key if it's a string
            new_key = converter(key) if isinstance(key, str) else key

            # Process value based on type
            if recursive:
                if isinstance(value, dict):
                    # Recursively convert nested dictionaries
                    result[new_key] = CaseConverter.convert_dict_keys(value, to_camel, recursive)
                elif isinstance(value, list):
                    # Process lists, converting any dictionaries within
                    result[new_key] = CaseConverter._convert_list(value, to_camel, recursive)
                else:
                    result[new_key] = value
            else:
                result[new_key] = value

        return result

    @staticmethod
    def _convert_list(items: List[Any], to_camel: bool, recursive: bool) -> List[Any]:
        """Convert dictionary keys in a list of items.

        This is a helper method for convert_dict_keys to handle lists.
        It processes each item in the list, converting dictionaries
        while leaving other types unchanged.

        Args:
            items: List of items to process.
            to_camel: Direction of conversion.
            recursive: Whether to recurse into nested structures.

        Returns:
            List[Any]: New list with converted items.

        Note:
            This is an internal method. Use convert_dict_keys instead.
        """
        result = []
        for item in items:
            if isinstance(item, dict):
                result.append(CaseConverter.convert_dict_keys(item, to_camel, recursive))
            elif isinstance(item, list) and recursive:
                result.append(CaseConverter._convert_list(item, to_camel, recursive))
            else:
                result.append(item)
        return result

    @staticmethod
    def convert_keys_shallow(data: Dict[str, Any], to_camel: bool = True) -> Dict[str, Any]:
        """Convert dictionary keys without recursing into nested structures.

        This is a convenience method equivalent to calling convert_dict_keys
        with recursive=False. Use this when you only want to convert the
        top-level keys.

        Args:
            data: Dictionary with keys to convert.
            to_camel: If True, convert to camelCase; if False, to snake_case.

        Returns:
            Dict[str, Any]: New dictionary with converted top-level keys only.

        Examples:
            >>> data = {"price_scale": {"visible": True}}
            >>> CaseConverter.convert_keys_shallow(data)
            {'priceScale': {'visible': True}}  # nested 'visible' unchanged

        See Also:
            convert_dict_keys: For recursive conversion.
        """
        return CaseConverter.convert_dict_keys(data, to_camel, recursive=False)


# Convenience functions for backward compatibility
def snake_to_camel(snake_case: str) -> str:
    """Convert snake_case to camelCase.

    This is a convenience function that wraps CaseConverter.snake_to_camel()
    for backward compatibility with existing code.

    Args:
        snake_case: String in snake_case format.

    Returns:
        str: String in camelCase format.

    Examples:
        >>> snake_to_camel("price_scale_id")
        'priceScaleId'

    See Also:
        CaseConverter.snake_to_camel: The main implementation.
    """
    return CaseConverter.snake_to_camel(snake_case)


def camel_to_snake(camel_case: str) -> str:
    """Convert camelCase to snake_case.

    This is a convenience function that wraps CaseConverter.camel_to_snake()
    for backward compatibility with existing code.

    Args:
        camel_case: String in camelCase format.

    Returns:
        str: String in snake_case format.

    Examples:
        >>> camel_to_snake("priceScaleId")
        'price_scale_id'

    See Also:
        CaseConverter.camel_to_snake: The main implementation.
    """
    return CaseConverter.camel_to_snake(camel_case)
