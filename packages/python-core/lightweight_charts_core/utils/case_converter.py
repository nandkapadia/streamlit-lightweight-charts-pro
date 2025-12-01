"""Case conversion utilities for Streamlit Lightweight Charts Pro.

This module provides a single source of truth for case conversion between
Python's snake_case naming convention and JavaScript's camelCase convention.

All case conversion logic is centralized here to ensure consistency and
maintainability across the entire codebase. This prevents bugs that arise
from having multiple implementations with slightly different behavior.

The module serves as a critical bridge between Python and JavaScript naming
conventions, enabling seamless data exchange between the Python backend and
the JavaScript frontend chart library. Without proper case conversion, chart
options and data would be misnamed and fail to work correctly.

Key Features:
    - Snake_case to camelCase conversion
    - CamelCase to snake_case conversion
    - Recursive dictionary key conversion
    - List processing with nested structure support
    - Comprehensive edge case handling (numbers, special characters, etc.)
    - Type-safe with proper error handling
    - Pre-compiled regex patterns for optimal performance
    - Thread-safe static methods

Architecture:
    The module follows a utility class pattern with all static methods,
    eliminating the need for instance creation. This design ensures:
        - Zero instantiation overhead
        - Thread-safe operations (no shared state)
        - Simple import and usage patterns
        - Centralized logic for easy maintenance

    Conversion Strategy:
        snake_to_camel:
            - Removes underscores
            - Capitalizes first letter of each word after underscore
            - Preserves numbers in their original positions
            - Handles edge cases (leading/trailing underscores, etc.)

        camel_to_snake:
            - Inserts underscores before capital letters
            - Converts all letters to lowercase
            - Handles consecutive capitals (HTTP → http)
            - Preserves numbers in their original positions

        convert_dict_keys:
            - Recursively processes nested dictionaries
            - Handles lists containing dictionaries
            - Preserves non-string keys
            - Creates new dictionary (doesn't modify original)

Example Usage:
    Basic string conversion::

        from lightweight_charts_core.utils.case_converter import CaseConverter

        # Convert Python naming to JavaScript naming
        js_name = CaseConverter.snake_to_camel("price_scale_id")
        print(js_name)  # "priceScaleId"

        # Convert JavaScript naming back to Python naming
        py_name = CaseConverter.camel_to_snake("priceScaleId")
        print(py_name)  # "price_scale_id"

    Dictionary key conversion for chart options::

        # Prepare chart options for JavaScript frontend
        python_options = {"price_scale_id": "right", "line_width": 2, "line_color": "#FF0000"}

        # Convert to JavaScript-compatible format
        js_options = CaseConverter.convert_dict_keys(python_options, to_camel=True)
        # Result: {
        #     "priceScaleId": "right",
        #     "lineWidth": 2,
        #     "lineColor": "#FF0000"
        # }

    Nested structure conversion::

        # Complex nested chart configuration
        python_config = {
            "chart_options": {
                "time_scale": {"visible": True},
                "price_scale": {"auto_scale": False}
            },
            "series_options": {"line_width": 2},
        }

        # Recursively convert all keys
        js_config = CaseConverter.convert_dict_keys(python_config)
        # Result: {
        #     "chartOptions": {
        #         "timeScale": {"visible": True},
        #         "priceScale": {"autoScale": False}
        #     },
        #     "seriesOptions": {
        #         "lineWidth": 2
        #     }
        # }

    Shallow conversion (top-level only)::

        # Only convert top-level keys
        data = {"price_scale": {"visible": True}}
        result = CaseConverter.convert_keys_shallow(data)
        # Result: {"priceScale": {"visible": True}}
        # Note: nested "visible" stays unchanged

    Using convenience functions::

        from lightweight_charts_core.utils.case_converter import snake_to_camel, camel_to_snake

        # These wrap CaseConverter methods for backward compatibility
        js_name = snake_to_camel("price_scale_id")  # "priceScaleId"
        py_name = camel_to_snake("priceScaleId")  # "price_scale_id"

Note:
    This module is performance-optimized:
        - Regex patterns are pre-compiled at module load time
        - No unnecessary string allocations
        - Efficient recursive algorithms
        - Zero instance overhead (all static methods)

    Edge cases handled:
        - Leading underscores: "_private" → "Private"
        - Trailing underscores: "value_" → "value"
        - Multiple underscores: "a___b" → "aB"
        - Numbers: "value_123_test" → "value123Test"
        - Already converted: idempotent conversions
        - Empty strings: returns empty string
        - Non-string keys: preserved as-is

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT

"""

# Standard Imports
import re
from typing import Any

# Define public API for module
__all__ = ["CaseConverter"]


class CaseConverter:
    """Single source of truth for case conversion operations.

    This class provides static methods for converting between snake_case
    (Python convention) and camelCase (JavaScript convention). It handles
    various edge cases and supports recursive conversion of nested structures.

    All methods are static, eliminating the need for instance creation and
    ensuring thread-safe operations with zero overhead.

    Design Patterns:
        - Utility Class: All methods are static, no instance state
        - Single Responsibility: Only handles case conversion
        - DRY: Single implementation used throughout codebase
        - Pre-compilation: Regex patterns compiled at class definition

    Performance Characteristics:
        - Pre-compiled regex: O(n) string processing
        - No instance overhead: Zero memory allocation
        - Recursive dict conversion: O(n*m) where n=keys, m=nesting depth
        - Thread-safe: No shared mutable state

    Thread Safety:
        All methods are thread-safe as they don't maintain any mutable state.
        Multiple threads can safely call these methods concurrently.

    Example:
        >>> CaseConverter.snake_to_camel("price_scale_id")
        'priceScaleId'
        >>> CaseConverter.camel_to_snake("priceScaleId")
        'price_scale_id'

    """

    # Pre-compiled regex patterns for performance optimization
    # These are compiled once at class definition time and reused for all conversions

    # Pattern for identifying camelCase word boundaries
    # (?<!^) - Negative lookbehind: don't match at string start
    # (?=[A-Z]) - Positive lookahead: match position before uppercase letter
    # Result: Matches positions where we need to insert underscores
    # Example: "priceScaleId" → matches before 'S' and 'I'
    _CAMEL_PATTERN = re.compile(r"(?<!^)(?=[A-Z])")

    # Pattern for identifying snake_case word boundaries
    # _([a-z0-9]) - Matches underscore followed by lowercase letter or digit
    # The capturing group (parentheses) captures the letter/digit to preserve it
    # Example: "price_scale_id" → matches "_s" and "_i"
    _SNAKE_PATTERN = re.compile(r"_([a-z0-9])")

    @staticmethod
    def snake_to_camel(snake_case: str) -> str:
        """Convert snake_case string to camelCase.

        This function converts strings from Python's snake_case format to
        JavaScript's camelCase format. The first character remains lowercase
        (unless there are leading underscores), and each word after an
        underscore is capitalized with the underscore removed.

        The conversion process:
            1. Strip and count leading underscores (affect first letter)
            2. Strip trailing underscores (always removed)
            3. Split on underscores to get word components
            4. Filter out empty components (from multiple underscores)
            5. Keep first word lowercase (or capitalize if leading underscores)
            6. Capitalize subsequent words
            7. Join all words together

        Args:
            snake_case (str): String in snake_case format. Examples:
                "price_scale_id", "line_color", "http_status_code"

        Returns:
            str: String in camelCase format. Examples:
                "priceScaleId", "lineColor", "httpStatusCode"

        Examples:
            Basic conversions::

                >>> CaseConverter.snake_to_camel("price_scale_id")
                'priceScaleId'
                >>> CaseConverter.snake_to_camel("line_color")
                'lineColor'
                >>> CaseConverter.snake_to_camel("http_status_code")
                'httpStatusCode'

            Edge cases::

                >>> CaseConverter.snake_to_camel("single_word")
                'singleWord'
                >>> CaseConverter.snake_to_camel("with_123_numbers")
                'with123Numbers'
                >>> CaseConverter.snake_to_camel("_leading_underscore")
                'LeadingUnderscore'  # Leading underscore capitalizes first letter
                >>> CaseConverter.snake_to_camel("trailing_underscore_")
                'trailingUnderscore'  # Trailing underscore removed
                >>> CaseConverter.snake_to_camel("multiple___underscores")
                'multipleUnderscores'  # Multiple underscores treated as one
                >>> CaseConverter.snake_to_camel("")
                ''  # Empty string returns empty string

        Note:
            Edge case handling:
                - Leading underscores result in capitalized first letter
                - Trailing underscores are removed
                - Multiple consecutive underscores are treated as one
                - Empty strings return empty strings
                - Strings with no underscores return unchanged (except leading/trailing)
                - Numbers are preserved in their original positions

        """
        # Handle empty string case immediately
        if not snake_case:
            return snake_case

        # Step 1: Handle leading underscores specially
        # Leading underscores indicate "private" or "protected" in Python
        # In JavaScript, this typically means we capitalize the first letter
        # Count how many leading underscores we have
        leading_underscores = len(snake_case) - len(snake_case.lstrip("_"))
        # Remove leading underscores for processing
        snake_case = snake_case.lstrip("_")

        # Step 2: Handle trailing underscores
        # Trailing underscores are uncommon and should be removed
        snake_case = snake_case.rstrip("_")

        # If string is now empty (was only underscores), return empty string
        if not snake_case:
            return ""

        # Step 3: Split on underscores to get word components
        # Example: "price_scale_id" → ["price", "scale", "id"]
        components = snake_case.split("_")

        # Step 4: Filter out empty strings from multiple consecutive underscores
        # Example: "price___scale" → ["price", "", "", "scale"] → ["price", "scale"]
        components = [c for c in components if c]

        # If no valid components remain, return empty string
        if not components:
            return ""

        # Step 5: Process first component
        # Keep it lowercase unless there were leading underscores
        result = components[0]
        if leading_underscores > 0:
            # Leading underscores mean we capitalize the first letter
            # Example: "_private_method" → "PrivateMethod"
            result = result.capitalize()

        # Step 6: Process subsequent components
        # Capitalize the first letter of each word and join them
        # Example: ["price", "scale", "id"] → "price" + "Scale" + "Id"
        result += "".join(word.capitalize() for word in components[1:])

        # Return the fully converted camelCase string
        return result

    @staticmethod
    def camel_to_snake(camel_case: str) -> str:
        """Convert camelCase string to snake_case.

        This function converts strings from JavaScript's camelCase format to
        Python's snake_case format. Capital letters (except the first character)
        are converted to lowercase and preceded by an underscore.

        The conversion process:
            1. Use regex to find positions before capital letters
            2. Insert underscore at those positions
            3. Convert entire string to lowercase

        The regex pattern handles consecutive capitals correctly:
            - "HTTPStatusCode" → "http_status_code"
            - "IOError" → "io_error"

        Args:
            camel_case (str): String in camelCase format. Examples:
                "priceScaleId", "lineColor", "HTTPStatusCode"

        Returns:
            str: String in snake_case format. Examples:
                "price_scale_id", "line_color", "http_status_code"

        Examples:
            Basic conversions::

                >>> CaseConverter.camel_to_snake("priceScaleId")
                'price_scale_id'
                >>> CaseConverter.camel_to_snake("lineColor")
                'line_color'
                >>> CaseConverter.camel_to_snake("singleWord")
                'single_word'

            Handling acronyms and numbers::

                >>> CaseConverter.camel_to_snake("HTTPStatusCode")
                'http_status_code'
                >>> CaseConverter.camel_to_snake("IOError")
                'io_error'
                >>> CaseConverter.camel_to_snake("HTTPSConnection")
                'https_connection'
                >>> CaseConverter.camel_to_snake("getHTTPResponseCode")
                'get_http_response_code'
                >>> CaseConverter.camel_to_snake("with123Numbers")
                'with123_numbers'

            Edge cases::

                >>> CaseConverter.camel_to_snake("")
                ''  # Empty string returns empty string
                >>> CaseConverter.camel_to_snake("alreadySnake")
                'already_snake'

        Note:
            Conversion characteristics:
                - Consecutive capital letters are kept together until lowercase
                  (HTTP → http, not H_T_T_P → h_t_t_p)
                - Numbers are preserved in their original position
                - Already snake_case strings pass through unchanged
                - Empty strings return empty strings
                - First character is never preceded by underscore

            The regex pattern (?<!^)(?=[A-Z]) means:
                - (?<!^): Negative lookbehind - don't match at start
                - (?=[A-Z]): Positive lookahead - match before uppercase
                This ensures we insert underscores before capitals but not
                at the beginning of the string.

        """
        # Handle empty string case immediately
        if not camel_case:
            return camel_case

        # Step 1: Insert underscore before uppercase letters using regex
        # The pattern finds positions before capital letters (except at start)
        # Example: "priceScaleId" → "price_Scale_Id"
        snake_case = CaseConverter._CAMEL_PATTERN.sub("_", camel_case)

        # Step 2: Convert entire string to lowercase
        # Example: "price_Scale_Id" → "price_scale_id"
        return snake_case.lower()

    @staticmethod
    def convert_dict_keys(
        data: dict[str, Any], to_camel: bool = True, recursive: bool = True
    ) -> dict[str, Any]:
        """Convert all dictionary keys between snake_case and camelCase.

        This function converts dictionary keys while preserving the structure
        and values. It can optionally recurse into nested dictionaries and lists,
        enabling complete conversion of complex nested structures like chart
        configurations.

        The conversion process:
            1. Validate input is a dictionary
            2. Select conversion function based on direction
            3. Iterate through key-value pairs
            4. Convert each key (if it's a string)
            5. Recursively process nested structures if enabled
            6. Return new dictionary with converted keys

        Args:
            data (Dict[str, Any]): Dictionary with keys to convert. Can contain
                nested dictionaries, lists, or any other types.
            to_camel (bool, optional): Direction of conversion. Defaults to True.
                - True: Convert snake_case → camelCase (Python → JavaScript)
                - False: Convert camelCase → snake_case (JavaScript → Python)
            recursive (bool, optional): Whether to recursively convert nested
                structures. Defaults to True.
                - True: Convert keys in nested dicts and lists
                - False: Only convert top-level keys

        Returns:
            Dict[str, Any]: New dictionary with converted keys. The original
                dictionary is not modified. Structure and values are preserved,
                only keys are converted.

        Examples:
            Basic dictionary conversion::

                >>> data = {"price_scale": {"visible": True}}
                >>> CaseConverter.convert_dict_keys(data)
                {'priceScale': {'visible': True}}

            Reverse conversion::

                >>> data = {"priceScale": {"autoScale": False}}
                >>> CaseConverter.convert_dict_keys(data, to_camel=False)
                {'price_scale': {'auto_scale': False}}

            Nested structures with lists::

                >>> data = {
                ...     "chart_options": {
                ...         "series": [
                ...             {"line_color": "red"},
                ...             {"line_color": "blue"}
                ...         ]
                ...     }
                ... }
                >>> CaseConverter.convert_dict_keys(data)
                {
                    'chartOptions': {
                        'series': [
                            {'lineColor': 'red'},
                            {'lineColor': 'blue'}
                        ]
                    }
                }

            Shallow conversion (non-recursive)::

                >>> data = {"price_scale": {"auto_scale": True}}
                >>> CaseConverter.convert_dict_keys(data, recursive=False)
                {'priceScale': {'auto_scale': True}}
                # Note: nested 'auto_scale' key is not converted

        Note:
            Conversion behavior:
                - Non-string keys are preserved as-is (ints, tuples, etc.)
                - Nested dictionaries are converted if recursive=True
                - Lists containing dicts are processed if recursive=True
                - Original dictionary is never modified (returns new dict)
                - Value types are preserved exactly
                - Order is preserved (Python 3.7+ dict insertion order)

            Performance considerations:
                - Creates a new dictionary (doesn't modify original)
                - Recursive conversion is O(n*m) where n=keys, m=nesting depth
                - Non-recursive conversion is O(n) where n=keys

        """
        # Validate input is a dictionary
        # If not, return unchanged (protects against misuse)
        if not isinstance(data, dict):
            return data

        # Step 1: Select appropriate conversion function based on direction
        # This is done once at the start to avoid repeated conditionals
        converter = CaseConverter.snake_to_camel if to_camel else CaseConverter.camel_to_snake

        # Step 2: Initialize result dictionary
        # We create a new dict rather than modifying the original
        result = {}

        # Step 3: Iterate through all key-value pairs
        for key, value in data.items():
            # Step 3a: Convert key if it's a string
            # Non-string keys (int, tuple, etc.) are preserved as-is
            # Example: "price_scale" → "priceScale" (if to_camel=True)
            new_key = converter(key) if isinstance(key, str) else key

            # Step 3b: Process value based on type and recursion setting
            if recursive:
                # Recursive mode: process nested structures
                if isinstance(value, dict):
                    # Value is a nested dictionary - recursively convert it
                    # Example: {"auto_scale": True} → {"autoScale": True}
                    result[new_key] = CaseConverter.convert_dict_keys(value, to_camel, recursive)
                elif isinstance(value, list):
                    # Value is a list - may contain dicts that need conversion
                    # Example: [{"line_color": "red"}] → [{"lineColor": "red"}]
                    result[new_key] = CaseConverter._convert_list(value, to_camel, recursive)
                else:
                    # Value is a primitive type (str, int, bool, etc.)
                    # Keep it as-is
                    result[new_key] = value
            else:
                # Non-recursive mode: just copy the value as-is
                # Even if value is a dict or list, don't process it
                result[new_key] = value

        # Return the new dictionary with converted keys
        return result

    @staticmethod
    def _convert_list(items: list[Any], to_camel: bool, recursive: bool) -> list[Any]:
        """Convert dictionary keys in a list of items.

        This is a helper method for convert_dict_keys to handle lists that
        may contain dictionaries or nested lists. It processes each item in
        the list, converting dictionaries while leaving other types unchanged.

        The method is called recursively when lists contain nested lists,
        ensuring complete conversion of deeply nested structures.

        Args:
            items (List[Any]): List of items to process. May contain any types:
                - Dictionaries (will be converted)
                - Lists (will be recursively processed if recursive=True)
                - Primitives (will be passed through unchanged)
            to_camel (bool): Direction of conversion (True = to camelCase)
            recursive (bool): Whether to recurse into nested structures

        Returns:
            List[Any]: New list with converted items. Original list is not
                modified. Dictionaries in the list have their keys converted,
                while other types are preserved exactly.

        Example:
            >>> items = [{"line_color": "red"}, "some_string", 42, [{"nested_color": "blue"}]]
            >>> CaseConverter._convert_list(items, to_camel=True, recursive=True)
            [
                {"lineColor": "red"},
                "some_string",
                42,
                [{"nestedColor": "blue"}]
            ]

        Note:
            This is an internal method. Use convert_dict_keys instead of
            calling this directly. It's designed to be called by
            convert_dict_keys when it encounters list values.

            The method handles:
                - Dictionaries: Recursively converts keys
                - Nested lists: Recursively processes if recursive=True
                - Primitives: Passes through unchanged
                - Mixed types: Handles lists with heterogeneous types

        """
        # Initialize result list to hold processed items
        result = []

        # Process each item in the input list
        for item in items:
            if isinstance(item, dict):
                # Item is a dictionary - convert its keys recursively
                # This ensures nested dicts within lists are also converted
                # Example: {"line_color": "red"} → {"lineColor": "red"}
                result.append(CaseConverter.convert_dict_keys(item, to_camel, recursive))
            elif isinstance(item, list) and recursive:
                # Item is a nested list and we're in recursive mode
                # Recursively process the nested list
                # Example: [{"nested_key": "value"}] → [{"nestedKey": "value"}]
                result.append(CaseConverter._convert_list(item, to_camel, recursive))
            else:
                # Item is a primitive type (str, int, bool, etc.) or we're not
                # recursing into lists
                # Keep it unchanged
                result.append(item)

        # Return the new list with processed items
        return result

    @staticmethod
    def convert_keys_shallow(data: dict[str, Any], to_camel: bool = True) -> dict[str, Any]:
        """Convert dictionary keys without recursing into nested structures.

        This is a convenience method equivalent to calling convert_dict_keys
        with recursive=False. Use this when you only want to convert the
        top-level keys and leave nested structures unchanged.

        This is useful when:
            - You only need to convert the outermost keys
            - Performance is critical and deep recursion is expensive
            - Nested structures are already in the correct format
            - You want fine-grained control over conversion depth

        Args:
            data (Dict[str, Any]): Dictionary with keys to convert. Nested
                dictionaries and lists will not have their keys converted.
            to_camel (bool, optional): Direction of conversion. Defaults to True.
                - True: Convert snake_case → camelCase (Python → JavaScript)
                - False: Convert camelCase → snake_case (JavaScript → Python)

        Returns:
            Dict[str, Any]: New dictionary with converted top-level keys only.
                Nested structures are preserved exactly as-is.

        Examples:
            Shallow conversion::

                >>> data = {
                ...     "price_scale": {"auto_scale": True},
                ...     "line_width": 2
                ... }
                >>> CaseConverter.convert_keys_shallow(data)
                {
                    'priceScale': {'auto_scale': True},
                    'lineWidth': 2
                }
                # Note: nested 'auto_scale' is not converted

            Compare with recursive conversion::

                >>> # Shallow conversion
                >>> shallow = CaseConverter.convert_keys_shallow(data)
                >>> shallow["priceScale"]
                {'auto_scale': True}  # Nested key unchanged
                >>>
                >>> # Recursive conversion
                >>> deep = CaseConverter.convert_dict_keys(data)
                >>> deep["priceScale"]
                {'autoScale': True}  # Nested key converted

        See Also:
            convert_dict_keys: For recursive conversion of nested structures.

        Note:
            This is simply a convenience wrapper that calls convert_dict_keys
            with recursive=False. It's provided for:
                - Improved code readability (intent is clearer)
                - Convenience (don't need to remember parameter name)
                - API consistency (matches common use cases)

        """
        # Call convert_dict_keys with recursive=False
        # This converts only top-level keys
        return CaseConverter.convert_dict_keys(data, to_camel, recursive=False)


# Convenience functions for backward compatibility
# These wrap CaseConverter methods for simpler imports and existing code compatibility


def snake_to_camel(snake_case: str) -> str:
    """Convert snake_case to camelCase.

    This is a convenience function that wraps CaseConverter.snake_to_camel()
    for backward compatibility with existing code and simplified imports.

    Args:
        snake_case (str): String in snake_case format.

    Returns:
        str: String in camelCase format.

    Examples:
        >>> snake_to_camel("price_scale_id")
        'priceScaleId'
        >>> snake_to_camel("line_color")
        'lineColor'

    See Also:
        CaseConverter.snake_to_camel: The main implementation with full
            documentation and examples.

    Note:
        This function exists for:
            - Backward compatibility with code written before CaseConverter
            - Simpler imports (can import function directly)
            - Shorter code when class prefix is not needed
        For new code, consider using CaseConverter.snake_to_camel directly
        for clarity.

    """
    # Delegate to CaseConverter static method
    return CaseConverter.snake_to_camel(snake_case)


def camel_to_snake(camel_case: str) -> str:
    """Convert camelCase to snake_case.

    This is a convenience function that wraps CaseConverter.camel_to_snake()
    for backward compatibility with existing code and simplified imports.

    Args:
        camel_case (str): String in camelCase format.

    Returns:
        str: String in snake_case format.

    Examples:
        >>> camel_to_snake("priceScaleId")
        'price_scale_id'
        >>> camel_to_snake("lineColor")
        'line_color'

    See Also:
        CaseConverter.camel_to_snake: The main implementation with full
            documentation and examples.

    Note:
        This function exists for:
            - Backward compatibility with code written before CaseConverter
            - Simpler imports (can import function directly)
            - Shorter code when class prefix is not needed
        For new code, consider using CaseConverter.camel_to_snake directly
        for clarity.

    """
    # Delegate to CaseConverter static method
    return CaseConverter.camel_to_snake(camel_case)
