"""Unit tests for LocalizationOptions class.

This module tests the LocalizationOptions class functionality including
construction, validation, and serialization.
"""

from lightweight_charts_core.charts.options.localization_options import LocalizationOptions


class TestLocalizationOptions:
    """Test cases for LocalizationOptions."""

    def test_default_construction(self):
        """Test LocalizationOptions construction with default values."""
        options = LocalizationOptions()

        assert options.locale == "en-US"
        assert options.date_format == "yyyy-MM-dd"
        assert options.price_formatter is None
        assert options.percentage_formatter is None

    def test_construction_with_parameters(self):
        """Test LocalizationOptions construction with custom parameters."""
        options = LocalizationOptions(locale="en-US", date_format="yyyy-MM-dd")

        assert options.locale == "en-US"
        assert options.date_format == "yyyy-MM-dd"

    def test_asdict_method(self):
        """Test the asdict method returns correct structure."""
        options = LocalizationOptions(locale="en-US", date_format="yyyy-MM-dd")

        result = options.asdict()

        assert result["locale"] == "en-US"
        assert result["dateFormat"] == "yyyy-MM-dd"

    def test_asdict_with_none_values(self):
        """Test asdict method handles None values correctly."""
        options = LocalizationOptions()
        result = options.asdict()

        # Should contain default values
        assert result["locale"] == "en-US"
        assert result["dateFormat"] == "yyyy-MM-dd"
        assert "priceFormatter" not in result
        assert "percentageFormatter" not in result

    def test_method_chaining(self):
        """Test method chaining functionality."""
        options = LocalizationOptions()

        result = options.set_locale("en-US").set_date_format("yyyy-MM-dd")

        assert result is options
        assert options.locale == "en-US"
        assert options.date_format == "yyyy-MM-dd"

    def test_validation_locale(self):
        """Test validation of locale parameter."""
        # Valid locale
        options = LocalizationOptions(locale="en-US")
        assert options.locale == "en-US"

        # Valid locale with different format
        options = LocalizationOptions(locale="fr-FR")
        assert options.locale == "fr-FR"

        # Valid locale with region only
        options = LocalizationOptions(locale="en")
        assert options.locale == "en"

    def test_validation_date_format(self):
        """Test validation of date_format parameter."""
        # Valid date format
        options = LocalizationOptions(date_format="yyyy-MM-dd")
        assert options.date_format == "yyyy-MM-dd"

        # Valid date format with time
        options = LocalizationOptions(date_format="yyyy-MM-dd HH:mm:ss")
        assert options.date_format == "yyyy-MM-dd HH:mm:ss"

        # Valid date format with different separators
        options = LocalizationOptions(date_format="MM/dd/yyyy")
        assert options.date_format == "MM/dd/yyyy"

    def test_edge_cases(self):
        """Test edge cases and boundary conditions."""
        # Empty string values
        options = LocalizationOptions(locale="", date_format="")
        assert options.locale == ""
        assert options.date_format == ""

        # Special characters in locale
        options = LocalizationOptions(locale="zh-CN", date_format="yyyy年MM月dd日")
        assert options.locale == "zh-CN"
        assert options.date_format == "yyyy年MM月dd日"

    def test_serialization_consistency(self):
        """Test that serialization is consistent across multiple calls."""
        options = LocalizationOptions(locale="en-US", date_format="yyyy-MM-dd")

        result1 = options.asdict()
        result2 = options.asdict()

        assert result1 == result2

    def test_copy_method(self):
        """Test the copy method creates a new instance with same values."""
        original = LocalizationOptions(locale="en-US", date_format="yyyy-MM-dd")

        # Since LocalizationOptions doesn't have a copy method, we'll test that
        # we can create a new instance with the same values
        copied = LocalizationOptions(
            locale=original.locale,
            date_format=original.date_format,
            price_formatter=original.price_formatter,
            percentage_formatter=original.percentage_formatter,
        )

        assert copied is not original
        assert copied.locale == original.locale
        assert copied.date_format == original.date_format
        assert copied.price_formatter == original.price_formatter
        assert copied.percentage_formatter == original.percentage_formatter

    def test_common_locale_formats(self):
        """Test common locale formats."""
        locales = [
            "en-US",
            "en-GB",
            "fr-FR",
            "de-DE",
            "es-ES",
            "it-IT",
            "pt-BR",
            "ru-RU",
            "ja-JP",
            "ko-KR",
            "zh-CN",
            "zh-TW",
        ]

        for locale in locales:
            options = LocalizationOptions(locale=locale)
            assert options.locale == locale

    def test_common_date_formats(self):
        """Test common date format patterns."""
        date_formats = [
            "yyyy-MM-dd",
            "MM/dd/yyyy",
            "dd/MM/yyyy",
            "yyyy-MM-dd HH:mm:ss",
            "MM/dd/yyyy HH:mm",
            "dd MMM yyyy",
            "MMM dd, yyyy",
            "yyyy年MM月dd日",
            "dd.MM.yyyy",
            "yyyy-MM-dd'T'HH:mm:ss",
        ]

        for date_format in date_formats:
            options = LocalizationOptions(date_format=date_format)
            assert options.date_format == date_format

    def test_partial_configuration(self):
        """Test configuration with only one parameter set."""
        # Only locale (other values will be defaults)
        options = LocalizationOptions(locale="fr-FR")
        result = options.asdict()
        assert "locale" in result
        assert "dateFormat" in result  # Default value
        assert result["locale"] == "fr-FR"
        assert result["dateFormat"] == "yyyy-MM-dd"  # Default

        # Only date format (other values will be defaults)
        options = LocalizationOptions(date_format="MM/dd/yyyy")
        result = options.asdict()
        assert "dateFormat" in result
        assert "locale" in result  # Default value
        assert result["dateFormat"] == "MM/dd/yyyy"
        assert result["locale"] == "en-US"  # Default
