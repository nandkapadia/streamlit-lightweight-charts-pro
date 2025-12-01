"""Unit tests for serialization utilities module.

Tests serialization functionality including:
- SerializationConfig
- SerializableMixin
- SimpleSerializableMixin
- Enum handling
- NaN conversion
- Field flattening
"""

import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from lightweight_charts_core.utils.serialization import (
    DEFAULT_CONFIG,
    SerializableMixin,
    SerializationConfig,
    SimpleSerializableMixin,
    create_serializable_mixin,
    snake_to_camel,
)


class TestEnum(Enum):
    """Test enum for serialization tests."""

    VALUE_ONE = "value1"
    VALUE_TWO = "value2"
    VALUE_THREE = "value3"


class TestSerializationConfig:
    """Tests for SerializationConfig class."""

    def test_default_config(self):
        """Test default configuration values."""
        config = SerializationConfig()

        assert config.skip_none is True
        assert config.skip_empty_strings is True
        assert config.skip_empty_dicts is True
        assert config.convert_nan_to_zero is True
        assert config.convert_enums is True
        assert config.flatten_options_fields is True

    def test_custom_config_all_false(self):
        """Test custom configuration with all values False."""
        config = SerializationConfig(
            skip_none=False,
            skip_empty_strings=False,
            skip_empty_dicts=False,
            convert_nan_to_zero=False,
            convert_enums=False,
            flatten_options_fields=False,
        )

        assert config.skip_none is False
        assert config.skip_empty_strings is False
        assert config.skip_empty_dicts is False
        assert config.convert_nan_to_zero is False
        assert config.convert_enums is False
        assert config.flatten_options_fields is False

    def test_partial_custom_config(self):
        """Test partial custom configuration."""
        config = SerializationConfig(
            skip_none=False,
            skip_empty_strings=False,
        )

        assert config.skip_none is False
        assert config.skip_empty_strings is False
        assert config.skip_empty_dicts is True  # Default
        assert config.convert_nan_to_zero is True  # Default

    def test_default_config_exists(self):
        """Test that DEFAULT_CONFIG is available."""
        assert DEFAULT_CONFIG is not None
        assert isinstance(DEFAULT_CONFIG, SerializationConfig)


class TestSerializableMixin:
    """Tests for SerializableMixin class."""

    def test_basic_serialization(self):
        """Test basic serialization without special features."""

        @dataclass
        class SimpleData(SerializableMixin):
            title: str = "Test"
            value: int = 42

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        data = SimpleData()
        result = data.asdict()

        assert result["title"] == "Test"
        assert result["value"] == 42

    def test_snake_to_camel_conversion(self):
        """Test snake_case to camelCase conversion."""

        @dataclass
        class CamelData(SerializableMixin):
            price_scale_id: str = "right"
            background_color: str = "#000"

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        data = CamelData()
        result = data.asdict()

        assert "priceScaleId" in result
        assert "backgroundColor" in result
        assert "price_scale_id" not in result

    def test_enum_conversion(self):
        """Test enum value conversion."""

        @dataclass
        class EnumData(SerializableMixin):
            status: TestEnum = TestEnum.VALUE_ONE

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        data = EnumData()
        result = data.asdict()

        assert result["status"] == "value1"
        assert not isinstance(result["status"], Enum)

    def test_none_value_skipping(self):
        """Test that None values are skipped by default."""

        @dataclass
        class NoneData(SerializableMixin):
            title: str = "Test"
            optional: str = None

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        data = NoneData()
        result = data.asdict()

        assert "title" in result
        assert "optional" not in result

    def test_none_value_included_with_config(self):
        """Test including None values with custom config."""

        @dataclass
        class NoneData(SerializableMixin):
            title: str = "Test"
            optional: str = None

            def asdict(self) -> dict[str, Any]:
                config = SerializationConfig(skip_none=False)
                return dict(self._serialize_to_dict(config=config))

        data = NoneData()
        result = data.asdict()

        assert "title" in result
        assert "optional" in result
        assert result["optional"] is None

    def test_empty_string_skipping(self):
        """Test that empty strings are skipped by default."""

        @dataclass
        class EmptyData(SerializableMixin):
            title: str = "Test"
            notes: str = ""

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        data = EmptyData()
        result = data.asdict()

        assert "title" in result
        assert "notes" not in result

    def test_nan_conversion(self):
        """Test NaN to zero conversion."""

        @dataclass
        class NanData(SerializableMixin):
            value: float = math.nan

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        data = NanData()
        result = data.asdict()

        assert result["value"] == 0.0
        assert not math.isnan(result["value"])

    def test_nan_preservation_with_config(self):
        """Test NaN preservation with custom config."""

        @dataclass
        class NanData(SerializableMixin):
            value: float = math.nan

            def asdict(self) -> dict[str, Any]:
                config = SerializationConfig(convert_nan_to_zero=False)
                return dict(self._serialize_to_dict(config=config))

        data = NanData()
        result = data.asdict()

        assert math.isnan(result["value"])

    def test_nested_serialization(self):
        """Test nested object serialization."""

        @dataclass
        class Inner(SerializableMixin):
            inner_value: int = 10

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        @dataclass
        class Outer(SerializableMixin):
            outer_value: str = "test"
            nested: Inner = field(default_factory=Inner)

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        data = Outer()
        result = data.asdict()

        assert "outerValue" in result
        assert "nested" in result
        assert isinstance(result["nested"], dict)
        assert "innerValue" in result["nested"]

    def test_override_fields(self):
        """Test field overrides."""

        @dataclass
        class OverrideData(SerializableMixin):
            value: int = 10

            def asdict(self) -> dict[str, Any]:
                overrides = {"value": 999}
                return dict(self._serialize_to_dict(override_fields=overrides))

        data = OverrideData()
        result = data.asdict()

        assert result["value"] == 999


class TestSimpleSerializableMixin:
    """Tests for SimpleSerializableMixin class."""

    def test_simple_mixin_basic(self):
        """Test basic SimpleSerializableMixin functionality."""

        @dataclass
        class SimpleData(SimpleSerializableMixin):
            title: str = "Test"
            value: int = 42

        data = SimpleData()
        result = data.asdict()

        assert result["title"] == "Test"
        assert result["value"] == 42

    def test_simple_mixin_no_asdict_needed(self):
        """Test that SimpleSerializableMixin provides asdict automatically."""

        @dataclass
        class AutoData(SimpleSerializableMixin):
            name: str = "Auto"

        data = AutoData()
        assert hasattr(data, "asdict")
        result = data.asdict()
        assert isinstance(result, dict)


class TestCreateSerializableMixin:
    """Tests for create_serializable_mixin function."""

    def test_create_with_default_config(self):
        """Test creating serializable class with default config."""
        serializable_class = create_serializable_mixin()

        @dataclass
        class MyData(serializable_class):
            value: int = 10

        data = MyData()
        result = data.asdict()

        assert result["value"] == 10

    def test_create_with_custom_config(self):
        """Test creating serializable class with custom config."""
        config = SerializationConfig(skip_none=False)
        serializable_class = create_serializable_mixin(config)

        @dataclass
        class MyData(serializable_class):
            value: int = 10
            optional: str = None

        data = MyData()
        result = data.asdict()

        assert result["value"] == 10
        assert "optional" in result
        assert result["optional"] is None


class TestSnakeToCamel:
    """Tests for snake_to_camel function."""

    def test_snake_to_camel_basic(self):
        """Test basic snake_to_camel conversion."""
        assert snake_to_camel("price_scale_id") == "priceScaleId"
        assert snake_to_camel("background_color") == "backgroundColor"

    def test_snake_to_camel_single_word(self):
        """Test single word (no conversion)."""
        assert snake_to_camel("price") == "price"

    def test_snake_to_camel_empty(self):
        """Test empty string."""
        result = snake_to_camel("")
        assert result == ""


class TestSerializationIntegration:
    """Integration tests for serialization functionality."""

    def test_complex_nested_structure(self):
        """Test serialization of complex nested structure."""

        @dataclass
        class Level3(SerializableMixin):
            deep_value: int = 30

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        @dataclass
        class Level2(SerializableMixin):
            mid_value: str = "middle"
            level3: Level3 = field(default_factory=Level3)

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        @dataclass
        class Level1(SerializableMixin):
            top_value: float = 1.0
            level2: Level2 = field(default_factory=Level2)

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        data = Level1()
        result = data.asdict()

        assert "topValue" in result
        assert "level2" in result
        assert "midValue" in result["level2"]
        assert "level3" in result["level2"]
        assert "deepValue" in result["level2"]["level3"]

    def test_mixed_types_serialization(self):
        """Test serialization with mixed types."""

        @dataclass
        class MixedData(SerializableMixin):
            string_val: str = "test"
            int_val: int = 42
            float_val: float = 3.14
            bool_val: bool = True
            none_val: str = None
            empty_val: str = ""
            enum_val: TestEnum = TestEnum.VALUE_TWO
            nan_val: float = math.nan

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        data = MixedData()
        result = data.asdict()

        assert result["stringVal"] == "test"
        assert result["intVal"] == 42
        assert result["floatVal"] == 3.14
        assert result["boolVal"] is True
        assert "noneVal" not in result  # Skipped
        assert "emptyVal" not in result  # Skipped
        assert result["enumVal"] == "value2"
        assert result["nanVal"] == 0.0

    def test_configuration_combinations(self):
        """Test various configuration combinations."""

        @dataclass
        class ConfigData(SerializableMixin):
            value: int = 10
            none_val: str = None
            empty_val: str = ""
            nan_val: float = math.nan

            def asdict_with_config(self, config: SerializationConfig) -> dict[str, Any]:
                return dict(self._serialize_to_dict(config=config))

        data = ConfigData()

        # Test default config
        result_default = data.asdict_with_config(DEFAULT_CONFIG)
        assert "noneVal" not in result_default
        assert "emptyVal" not in result_default
        assert result_default["nanVal"] == 0.0

        # Test with all preservation
        config_preserve = SerializationConfig(
            skip_none=False,
            skip_empty_strings=False,
            convert_nan_to_zero=False,
        )
        result_preserve = data.asdict_with_config(config_preserve)
        assert result_preserve["noneVal"] is None
        assert result_preserve["emptyVal"] == ""
        assert math.isnan(result_preserve["nanVal"])

    def test_enum_and_nested_combination(self):
        """Test combination of enums and nested objects."""

        @dataclass
        class Inner(SerializableMixin):
            status: TestEnum = TestEnum.VALUE_ONE

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        @dataclass
        class Outer(SerializableMixin):
            inner: Inner = field(default_factory=Inner)
            outer_status: TestEnum = TestEnum.VALUE_TWO

            def asdict(self) -> dict[str, Any]:
                return dict(self._serialize_to_dict())

        data = Outer()
        result = data.asdict()

        assert result["outerStatus"] == "value2"
        assert result["inner"]["status"] == "value1"
        assert not isinstance(result["outerStatus"], Enum)
        assert not isinstance(result["inner"]["status"], Enum)
