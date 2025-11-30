"""Case conversion utilities for lightweight-charts-core.

This module provides case conversion between Python's snake_case naming
convention and JavaScript's camelCase convention.
"""

import re
from typing import Any, Dict, List

__all__ = ["CaseConverter", "snake_to_camel", "camel_to_snake"]


class CaseConverter:
    """Single source of truth for case conversion operations."""

    _CAMEL_PATTERN = re.compile(r"(?<!^)(?=[A-Z])")
    _SNAKE_PATTERN = re.compile(r"_([a-z0-9])")

    @staticmethod
    def snake_to_camel(snake_case: str) -> str:
        """Convert snake_case string to camelCase.

        Args:
            snake_case: String in snake_case format.

        Returns:
            String in camelCase format.
        """
        if not snake_case:
            return snake_case

        leading_underscores = len(snake_case) - len(snake_case.lstrip("_"))
        snake_case = snake_case.lstrip("_")
        snake_case = snake_case.rstrip("_")

        if not snake_case:
            return ""

        components = snake_case.split("_")
        components = [c for c in components if c]

        if not components:
            return ""

        result = components[0]
        if leading_underscores > 0:
            result = result.capitalize()

        result += "".join(word.capitalize() for word in components[1:])
        return result

    @staticmethod
    def camel_to_snake(camel_case: str) -> str:
        """Convert camelCase string to snake_case.

        Args:
            camel_case: String in camelCase format.

        Returns:
            String in snake_case format.
        """
        if not camel_case:
            return camel_case

        snake_case = CaseConverter._CAMEL_PATTERN.sub("_", camel_case)
        return snake_case.lower()

    @staticmethod
    def convert_dict_keys(
        data: Dict[str, Any], to_camel: bool = True, recursive: bool = True
    ) -> Dict[str, Any]:
        """Convert all dictionary keys between snake_case and camelCase.

        Args:
            data: Dictionary with keys to convert.
            to_camel: Direction of conversion. True = snake_case to camelCase.
            recursive: Whether to recursively convert nested structures.

        Returns:
            New dictionary with converted keys.
        """
        if not isinstance(data, dict):
            return data

        converter = CaseConverter.snake_to_camel if to_camel else CaseConverter.camel_to_snake
        result = {}

        for key, value in data.items():
            new_key = converter(key) if isinstance(key, str) else key

            if recursive:
                if isinstance(value, dict):
                    result[new_key] = CaseConverter.convert_dict_keys(value, to_camel, recursive)
                elif isinstance(value, list):
                    result[new_key] = CaseConverter._convert_list(value, to_camel, recursive)
                else:
                    result[new_key] = value
            else:
                result[new_key] = value

        return result

    @staticmethod
    def _convert_list(items: List[Any], to_camel: bool, recursive: bool) -> List[Any]:
        """Convert dictionary keys in a list of items."""
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
        """Convert dictionary keys without recursing into nested structures."""
        return CaseConverter.convert_dict_keys(data, to_camel, recursive=False)


def snake_to_camel(snake_case: str) -> str:
    """Convert snake_case to camelCase."""
    return CaseConverter.snake_to_camel(snake_case)


def camel_to_snake(camel_case: str) -> str:
    """Convert camelCase to snake_case."""
    return CaseConverter.camel_to_snake(camel_case)
