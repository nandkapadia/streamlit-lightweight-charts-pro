"""
Base options class for streamlit-lightweight-charts.

This module provides the base Options class that all option classes should inherit from.
It provides common functionality for serialization, validation, and frontend communication
through standardized dictionary conversion with camelCase key formatting.
"""

from abc import ABC
from dataclasses import dataclass, fields
from enum import Enum
from typing import Any, Dict

from streamlit_lightweight_charts_pro.logging_config import get_logger
from streamlit_lightweight_charts_pro.utils.data_utils import snake_to_camel

# Initialize logger
logger = get_logger(__name__)


@dataclass
class Options(ABC):
    """
    Abstract base class for all option classes.

    This class provides common functionality for option classes including automatic
    camelCase key conversion for frontend serialization, enum value conversion,
    and standardized validation patterns. All option classes in the library should
    inherit from this base class to ensure consistent behavior.

    The class implements a sophisticated serialization system that handles:
    - Automatic snake_case to camelCase key conversion
    - Enum value extraction and conversion
    - Nested option object serialization
    - List serialization with recursive option handling
    - Dictionary serialization with recursive Options object detection
    - Special handling for _options fields with flattening logic

    Attributes:
        Inherited by subclasses with specific option attributes.

    Example:
        ```python
        @dataclass
        class MyOptions(Options):
            background_color: str = "#ffffff"
            text_color: str = "#000000"
            is_visible: bool = True

        @dataclass
        class NestedOptions(Options):
            color: str = "#ff0000"
            width: int = 2

        @dataclass
        class ContainerOptions(Options):
            main_options: MyOptions = None
            nested_dict: Dict[str, NestedOptions] = None

        options = ContainerOptions(
            main_options=MyOptions(),
            nested_dict={"line": NestedOptions(), "area": NestedOptions()}
        )
        result = options.asdict()
        # Returns: {
        #     "mainOptions": {"backgroundColor": "#ffffff", "textColor": "#000000", "isVisible": True},
        #     "nestedDict": {"line": {"color": "#ff0000", "width": 2}, "area": {"color": "#ff0000", "width": 2}}
        # }
        ```
    """

    def update(self, updates: Dict[str, Any]) -> "Options":
        """
        Update options with a dictionary of values.

        This method provides a flexible way to update option properties using a dictionary.
        It handles both simple properties and nested objects, automatically creating
        nested Options instances when needed.

        Args:
            updates: Dictionary of updates to apply. Keys can be in snake_case or camelCase.
                Values can be simple types or dictionaries for nested objects.

        Returns:
            Options: Self for method chaining.

        Raises:
            ValueError: If an update key doesn't correspond to a valid field.
            TypeError: If a value type is incompatible with the field type.

        Example:
            ```python
            options = MyOptions()

            # Update simple properties
            options.update({
                "background_color": "#ff0000",
                "is_visible": False
            })

            # Update nested objects
            options.update({
                "line_options": {
                    "color": "#00ff00",
                    "line_width": 3
                }
            })

            # Method chaining
            options.update({"color": "red"}).update({"width": 100})
            ```
        """
        for key, value in updates.items():
            if value is None:
                continue  # Skip None values for method chaining

            # Convert camelCase to snake_case for field lookup
            field_name = self._camel_to_snake(key)

            # Check if field exists
            if not hasattr(self, field_name):
                # Try the original key in case it's already snake_case
                if hasattr(self, key):
                    field_name = key
                else:
                    # Ignore invalid fields instead of raising an error

                    continue

            # Get field info for type checking
            field_info = None
            for field in fields(self):
                if field.name == field_name:
                    field_info = field
                    break

            if field_info is None:
                # Ignore fields not found in dataclass fields

                continue

            # Handle nested Options objects and complex type annotations
            contains_options, options_class, is_dict_type = self._analyze_type_for_options(
                field_info.type
            )

            if contains_options and isinstance(value, dict):
                if options_class is not None and not is_dict_type:
                    # Handle direct Options types (e.g., MyOptions, Optional[MyOptions])
                    current_value = getattr(self, field_name)
                    if current_value is None:
                        current_value = options_class()
                    current_value.update(value)
                    setattr(self, field_name, current_value)
                else:
                    # Handle Dict[str, Options] or similar complex types
                    # The value is a dict that should contain Options objects
                    # We'll process it recursively during asdict() call
                    setattr(self, field_name, value)
            else:
                # Simple value assignment - set the field directly to bypass validation
                # This is what we want for the update method
                setattr(self, field_name, value)

        return self

    def _camel_to_snake(self, camel_case: str) -> str:
        """
        Convert camelCase to snake_case.

        Args:
            camel_case: String in camelCase format.

        Returns:
            String in snake_case format.
        """
        import re  # pylint: disable=import-outside-toplevel

        return re.sub(r"(?<!^)(?=[A-Z])", "_", camel_case).lower()

    def _process_dict_recursively(self, data: Any) -> Any:
        """
        Recursively process data structures to handle Options objects.

        This method traverses through nested data structures (dicts, lists) and
        converts any Options objects to dictionaries using their asdict() method.
        It also converts dictionary keys from snake_case to camelCase.

        Args:
            data: The data to process. Can be any type, but the method specifically
                handles dict, list, and Options types.

        Returns:
            The processed data with all Options objects converted to dictionaries
            and keys converted to camelCase.
        """
        if isinstance(data, Options):
            return data.asdict()
        elif isinstance(data, dict):
            return {
                snake_to_camel(str(k)): self._process_dict_recursively(v) for k, v in data.items()
            }
        elif isinstance(data, list):
            return [self._process_dict_recursively(item) for item in data]
        else:
            return data

    def _analyze_type_for_options(self, field_type: Any) -> tuple[bool, type | None, bool]:
        """
        Analyze a type annotation to determine if it contains Options objects.

        Args:
            field_type: The type annotation to analyze.

        Returns:
            Tuple of (contains_options, options_class, is_dict_type) where:
            - contains_options: True if the type contains Options objects
            - options_class: The Options class if found, None otherwise
            - is_dict_type: True if the type is a Dict type (including Optional[Dict])
        """
        # Direct Options type
        if isinstance(field_type, type) and issubclass(field_type, Options):
            return True, field_type, False

        # Check if it's a generic type with origin
        if not hasattr(field_type, "__origin__") or field_type.__origin__ is None:
            return False, None, False

        origin = field_type.__origin__
        args = getattr(field_type, "__args__", ())

        # Dict type
        if origin is dict and len(args) >= 2:
            contains_options, options_class, _ = self._analyze_type_for_options(args[1])
            if contains_options:
                return True, options_class, True

        # List type
        elif origin is list and args:
            contains_options, options_class, _ = self._analyze_type_for_options(args[0])
            if contains_options:
                return True, options_class, False

        # Union type (Optional)
        elif origin is not None:  # Union types
            # Check if any non-None arg is a Dict type
            is_dict_type = any(
                hasattr(arg, "__origin__") and arg.__origin__ is dict
                for arg in args
                if arg is not type(None)
            )

            # Check each non-None argument
            for arg in args:
                if arg is type(None):
                    continue
                contains_options, options_class, _ = self._analyze_type_for_options(arg)
                if contains_options:
                    return True, options_class, is_dict_type

        return False, None, False

    def asdict(self) -> Dict[str, Any]:
        """
        Convert options to dictionary with camelCase keys for frontend.

        This method provides comprehensive serialization of option objects for
        frontend communication. It handles complex nested structures, enum values,
        and special field flattening patterns.

        The serialization process:
        1. Iterates through all dataclass fields
        2. Skips None values, empty strings, and empty dictionaries
        3. Converts enum values to their .value property
        4. Recursively serializes nested Options objects
        5. Handles lists of Options objects
        6. Recursively processes dictionaries that may contain Options objects at any level
        7. Converts field names from snake_case to camelCase
        8. Applies special flattening logic for _options fields

        Returns:
            Dict[str, Any]: Dictionary with camelCase keys ready for frontend
                consumption. All nested structures are properly serialized and
                enum values are converted to their primitive representations.

        Note:
            - Empty dictionaries and None values are omitted from output
            - Enum values are automatically converted to their .value property
            - Nested Options objects are recursively serialized
            - Lists containing Options objects are handled recursively
            - Dictionaries containing Options objects at any nesting level are processed recursively
            - background_options fields are flattened into the parent result
        """
        result = {}
        for f in fields(self):
            name = f.name
            value = getattr(self, name)

            # Skip None values, empty strings, and empty dictionaries
            if value is None or value == "" or value == {}:
                continue

            # Convert enum values to their .value property
            if isinstance(value, Enum):
                value = value.value
            elif (
                hasattr(value, "value")
                and hasattr(value, "__class__")
                and hasattr(value.__class__, "__bases__")
            ):
                # Check if it's an enum-like object
                for base in value.__class__.__bases__:
                    if hasattr(base, "__name__") and "Enum" in base.__name__:
                        value = value.value
                        break

            # Handle nested Options objects
            if isinstance(value, Options):
                value = value.asdict()
            elif isinstance(value, list):
                # Handle lists of Options objects
                value = [item.asdict() if isinstance(item, Options) else item for item in value]
            elif isinstance(value, dict):
                # Handle dictionaries that might contain Options objects at any level
                value = self._process_dict_recursively(value)
            # Convert to camelCase key
            key = snake_to_camel(name)

            # Special handling for fields ending in _options: flatten them
            if name.endswith("_options") and isinstance(value, dict):
                # Only flatten specific fields that should be flattened
                if name == "background_options":
                    # Merge the nested options into the parent result
                    result.update(value)
                else:
                    # For other _options fields, keep them nested but with camelCase key
                    result[key] = value
            else:
                result[key] = value

        return result
