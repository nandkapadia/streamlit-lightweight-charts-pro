"""Comprehensive tests for case_converter module.

This test module provides thorough coverage of all case conversion functionality,
including edge cases and error conditions.
"""

from lightweight_charts_core.utils.case_converter import (
    CaseConverter,
    camel_to_snake,
    snake_to_camel,
)


class TestSnakeToCamel:
    """Tests for snake_case to camelCase conversion."""

    def test_basic_conversion(self):
        """Test basic snake_case to camelCase conversion."""
        assert CaseConverter.snake_to_camel("price_scale_id") == "priceScaleId"
        assert CaseConverter.snake_to_camel("line_color") == "lineColor"
        assert CaseConverter.snake_to_camel("background_color") == "backgroundColor"

    def test_single_word(self):
        """Test single words remain unchanged."""
        assert CaseConverter.snake_to_camel("price") == "price"
        assert CaseConverter.snake_to_camel("color") == "color"
        assert CaseConverter.snake_to_camel("visible") == "visible"

    def test_two_words(self):
        """Test two-word snake_case conversion."""
        assert CaseConverter.snake_to_camel("line_width") == "lineWidth"
        assert CaseConverter.snake_to_camel("auto_scale") == "autoScale"
        assert CaseConverter.snake_to_camel("price_line") == "priceLine"

    def test_three_plus_words(self):
        """Test multi-word snake_case conversion."""
        assert CaseConverter.snake_to_camel("http_status_code") == "httpStatusCode"
        assert CaseConverter.snake_to_camel("right_price_scale_id") == "rightPriceScaleId"
        assert CaseConverter.snake_to_camel("visible_range_from_time") == "visibleRangeFromTime"

    def test_numbers_in_name(self):
        """Test conversion with numbers in the string."""
        assert CaseConverter.snake_to_camel("with_123_numbers") == "with123Numbers"
        assert CaseConverter.snake_to_camel("rgb_255_color") == "rgb255Color"
        assert CaseConverter.snake_to_camel("option_1") == "option1"

    def test_leading_underscores(self):
        """Test handling of leading underscores."""
        assert CaseConverter.snake_to_camel("_private") == "Private"
        assert CaseConverter.snake_to_camel("__dunder") == "Dunder"
        assert CaseConverter.snake_to_camel("_leading_underscore") == "LeadingUnderscore"

    def test_trailing_underscores(self):
        """Test handling of trailing underscores."""
        assert CaseConverter.snake_to_camel("trailing_") == "trailing"
        assert CaseConverter.snake_to_camel("trailing_underscore_") == "trailingUnderscore"

    def test_multiple_underscores(self):
        """Test handling of multiple consecutive underscores."""
        assert CaseConverter.snake_to_camel("multiple___underscores") == "multipleUnderscores"
        assert CaseConverter.snake_to_camel("a__b__c") == "aBC"

    def test_empty_string(self):
        """Test empty string returns empty string."""
        assert CaseConverter.snake_to_camel("") == ""

    def test_only_underscores(self):
        """Test strings with only underscores."""
        assert CaseConverter.snake_to_camel("_") == ""
        assert CaseConverter.snake_to_camel("__") == ""
        assert CaseConverter.snake_to_camel("___") == ""

    def test_already_camel_case(self):
        """Test that already camelCase strings work reasonably."""
        assert CaseConverter.snake_to_camel("alreadyCamel") == "alreadyCamel"

    def test_convenience_function(self):
        """Test the convenience function wrapper."""
        assert snake_to_camel("price_scale_id") == "priceScaleId"
        assert snake_to_camel("line_color") == "lineColor"


class TestCamelToSnake:
    """Tests for camelCase to snake_case conversion."""

    def test_basic_conversion(self):
        """Test basic camelCase to snake_case conversion."""
        assert CaseConverter.camel_to_snake("priceScaleId") == "price_scale_id"
        assert CaseConverter.camel_to_snake("lineColor") == "line_color"
        assert CaseConverter.camel_to_snake("backgroundColor") == "background_color"

    def test_single_word(self):
        """Test single words remain unchanged."""
        assert CaseConverter.camel_to_snake("price") == "price"
        assert CaseConverter.camel_to_snake("color") == "color"
        assert CaseConverter.camel_to_snake("visible") == "visible"

    def test_two_words(self):
        """Test two-word camelCase conversion."""
        assert CaseConverter.camel_to_snake("lineWidth") == "line_width"
        assert CaseConverter.camel_to_snake("autoScale") == "auto_scale"
        assert CaseConverter.camel_to_snake("priceLine") == "price_line"

    def test_three_plus_words(self):
        """Test multi-word camelCase conversion."""
        assert CaseConverter.camel_to_snake("httpStatusCode") == "http_status_code"
        assert CaseConverter.camel_to_snake("rightPriceScaleId") == "right_price_scale_id"
        assert CaseConverter.camel_to_snake("visibleRangeFromTime") == "visible_range_from_time"

    def test_consecutive_capitals(self):
        """Test handling of consecutive capital letters."""
        assert CaseConverter.camel_to_snake("HTTPStatusCode") == "h_t_t_p_status_code"
        assert CaseConverter.camel_to_snake("IOError") == "i_o_error"
        assert CaseConverter.camel_to_snake("HTTPSConnection") == "h_t_t_p_s_connection"

    def test_mixed_case_with_capitals(self):
        """Test mixed case with capital letters."""
        assert CaseConverter.camel_to_snake("getHTTPResponseCode") == "get_h_t_t_p_response_code"
        assert CaseConverter.camel_to_snake("parseXMLDocument") == "parse_x_m_l_document"

    def test_numbers_in_name(self):
        """Test conversion with numbers."""
        assert CaseConverter.camel_to_snake("with123Numbers") == "with123_numbers"
        assert CaseConverter.camel_to_snake("rgb255Color") == "rgb255_color"
        assert CaseConverter.camel_to_snake("option1") == "option1"

    def test_empty_string(self):
        """Test empty string returns empty string."""
        assert CaseConverter.camel_to_snake("") == ""

    def test_already_snake_case(self):
        """Test that already snake_case strings work."""
        assert CaseConverter.camel_to_snake("already_snake") == "already_snake"
        assert CaseConverter.camel_to_snake("price_scale_id") == "price_scale_id"

    def test_single_capital(self):
        """Test single capital letters."""
        assert CaseConverter.camel_to_snake("A") == "a"
        assert CaseConverter.camel_to_snake("B") == "b"

    def test_convenience_function(self):
        """Test the convenience function wrapper."""
        assert camel_to_snake("priceScaleId") == "price_scale_id"
        assert camel_to_snake("lineColor") == "line_color"


class TestRoundTripConversion:
    """Tests for round-trip conversion (snake → camel → snake and vice versa)."""

    def test_snake_to_camel_to_snake(self):
        """Test that snake → camel → snake produces original."""
        original = "price_scale_id"
        camel = CaseConverter.snake_to_camel(original)
        back_to_snake = CaseConverter.camel_to_snake(camel)
        assert back_to_snake == original

    def test_camel_to_snake_to_camel(self):
        """Test that camel → snake → camel produces original."""
        original = "priceScaleId"
        snake = CaseConverter.camel_to_snake(original)
        back_to_camel = CaseConverter.snake_to_camel(snake)
        assert back_to_camel == original

    def test_multiple_round_trips(self):
        """Test multiple round-trip conversions."""
        test_cases = [
            "line_color",
            "price_scale",
            "http_status_code",
            "visible_range_from_time",
        ]

        for snake_original in test_cases:
            camel = CaseConverter.snake_to_camel(snake_original)
            back = CaseConverter.camel_to_snake(camel)
            assert back == snake_original


class TestConvertDictKeys:
    """Tests for dictionary key conversion."""

    def test_basic_dict_conversion(self):
        """Test basic dictionary key conversion."""
        data = {"price_scale_id": "right", "line_width": 2}
        result = CaseConverter.convert_dict_keys(data)
        assert result == {"priceScaleId": "right", "lineWidth": 2}

    def test_empty_dict(self):
        """Test empty dictionary returns empty dictionary."""
        assert CaseConverter.convert_dict_keys({}) == {}

    def test_non_string_keys(self):
        """Test that non-string keys are preserved."""
        data = {1: "one", 2: "two", "three": 3}
        result = CaseConverter.convert_dict_keys(data)
        assert result == {1: "one", 2: "two", "three": 3}

    def test_nested_dict_conversion(self):
        """Test nested dictionary conversion."""
        data = {
            "chart_options": {"time_scale": {"visible": True}, "price_scale": {"auto_scale": False}}
        }
        result = CaseConverter.convert_dict_keys(data)
        assert result == {
            "chartOptions": {"timeScale": {"visible": True}, "priceScale": {"autoScale": False}}
        }

    def test_deeply_nested_conversion(self):
        """Test deeply nested structure conversion."""
        data = {"level_1": {"level_2": {"level_3": {"deep_value": "test"}}}}
        result = CaseConverter.convert_dict_keys(data)
        assert result == {"level1": {"level2": {"level3": {"deepValue": "test"}}}}

    def test_list_of_dicts_conversion(self):
        """Test conversion of lists containing dictionaries."""
        data = {
            "series_list": [
                {"line_color": "red", "line_width": 1},
                {"line_color": "blue", "line_width": 2},
            ]
        }
        result = CaseConverter.convert_dict_keys(data)
        assert result == {
            "seriesList": [
                {"lineColor": "red", "lineWidth": 1},
                {"lineColor": "blue", "lineWidth": 2},
            ]
        }

    def test_reverse_conversion(self):
        """Test conversion from camelCase to snake_case."""
        data = {"priceScaleId": "right", "lineWidth": 2, "autoScale": True}
        result = CaseConverter.convert_dict_keys(data, to_camel=False)
        assert result == {"price_scale_id": "right", "line_width": 2, "auto_scale": True}

    def test_shallow_conversion(self):
        """Test shallow (non-recursive) conversion."""
        data = {"price_scale": {"auto_scale": True, "visible_range": {"from_time": 0}}}
        result = CaseConverter.convert_keys_shallow(data)
        assert result == {
            "priceScale": {
                "auto_scale": True,
                "visible_range": {"from_time": 0},
            }
        }

    def test_preserve_values(self):
        """Test that values are preserved during conversion."""
        data = {
            "string_value": "test",
            "int_value": 42,
            "float_value": 3.14,
            "bool_value": True,
            "none_value": None,
            "list_value": [1, 2, 3],
        }
        result = CaseConverter.convert_dict_keys(data)
        assert result["stringValue"] == "test"
        assert result["intValue"] == 42
        assert result["floatValue"] == 3.14
        assert result["boolValue"] is True
        assert result["noneValue"] is None
        assert result["listValue"] == [1, 2, 3]

    def test_original_dict_unchanged(self):
        """Test that original dictionary is not modified."""
        data = {"price_scale_id": "right"}
        result = CaseConverter.convert_dict_keys(data)

        assert "price_scale_id" in data
        assert "priceScaleId" not in data
        assert "priceScaleId" in result
        assert "price_scale_id" not in result
        assert id(data) != id(result)


class TestRealWorldExamples:
    """Tests based on real-world usage in the codebase."""

    def test_chart_options_conversion(self):
        """Test conversion of actual chart options."""
        options = {
            "right_price_scale": {
                "visible": True,
                "scale_margins": {"top": 0.1, "bottom": 0.1},
                "border_color": "#2B2B43",
            },
            "time_scale": {"visible": True, "time_visible": True, "seconds_visible": False},
        }

        result = CaseConverter.convert_dict_keys(options)

        assert "rightPriceScale" in result
        assert "timeScale" in result
        assert "scaleMargins" in result["rightPriceScale"]
        assert "borderColor" in result["rightPriceScale"]
        assert "timeVisible" in result["timeScale"]
        assert "secondsVisible" in result["timeScale"]

    def test_series_data_conversion(self):
        """Test conversion of series data."""
        series_data = {
            "series_type": "Line",
            "line_options": {"line_color": "#2196F3", "line_width": 2, "line_style": 0},
            "price_scale_id": "right",
        }

        result = CaseConverter.convert_dict_keys(series_data)

        assert result == {
            "seriesType": "Line",
            "lineOptions": {"lineColor": "#2196F3", "lineWidth": 2, "lineStyle": 0},
            "priceScaleId": "right",
        }
