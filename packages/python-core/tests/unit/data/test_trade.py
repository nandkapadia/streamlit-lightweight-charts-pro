"""Comprehensive unit tests for TradeData class.

This module provides extensive test coverage for TradeData including:
- Basic construction and validation
- Various time format inputs
- Price validation and edge cases
- Type conversions
- Additional data handling
- Error conditions
- P&L calculations with edge cases
- Serialization and tooltip generation
"""

from datetime import datetime

import pandas as pd
import pytest
from lightweight_charts_core.data.trade import TradeData
from lightweight_charts_core.exceptions import (
    ExitTimeAfterEntryTimeError,
    ValueValidationError,
)


class TestTradeDataConstruction:
    """Test TradeData construction with various configurations."""

    def test_minimal_construction(self):
        """Test TradeData construction with minimal required fields."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )

        assert trade.entry_time == 1640995200
        assert trade.entry_price == 100.0
        assert trade.exit_time == 1641081600
        assert trade.exit_price == 105.0
        assert trade.is_profitable is True
        assert trade.id == "trade1"
        assert trade.additional_data is None

    def test_construction_with_additional_data(self):
        """Test TradeData construction with additional_data."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=False,
            id="trade2",
            additional_data={
                "quantity": 1000,
                "trade_type": "short",
                "strategy": "momentum",
                "notes": "Test trade",
                "risk_level": "high",
            },
        )

        assert trade.entry_time == 1640995200
        assert trade.entry_price == 100.0
        assert trade.exit_time == 1641081600
        assert trade.exit_price == 105.0
        assert trade.is_profitable is False
        assert trade.id == "trade2"
        assert trade.additional_data is not None
        assert trade.additional_data["quantity"] == 1000
        assert trade.additional_data["trade_type"] == "short"
        assert trade.additional_data["strategy"] == "momentum"


class TestTradeDataTimeFormats:
    """Test TradeData with various time formats."""

    def test_unix_timestamp_seconds(self):
        """Test with Unix timestamp in seconds."""
        trade = TradeData(
            entry_time=1640995200,  # Jan 1, 2022
            entry_price=100.0,
            exit_time=1641081600,  # Jan 2, 2022
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )
        # Verify times are stored correctly
        assert trade.entry_time == 1640995200
        assert trade.exit_time == 1641081600
        # Verify asdict converts them correctly
        result = trade.asdict()
        assert result["entryTime"] == 1640995200
        assert result["exitTime"] == 1641081600

    def test_unix_timestamp_milliseconds(self):
        """Test with Unix timestamp in milliseconds (handled by to_utc_timestamp)."""
        trade = TradeData(
            entry_time=1640995200000,  # Milliseconds
            entry_price=100.0,
            exit_time=1641081600000,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )
        # Timestamps are converted to UTC in asdict()
        result = trade.asdict()
        assert result["entryTime"] is not None
        assert result["exitTime"] is not None
        # Verify they're valid timestamps
        assert isinstance(result["entryTime"], (int, float, str))
        assert isinstance(result["exitTime"], (int, float, str))

    def test_string_datetime(self):
        """Test with string datetime format."""
        trade = TradeData(
            entry_time="2022-01-01T00:00:00",
            entry_price=100.0,
            exit_time="2022-01-02T00:00:00",
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )
        # Verify conversion happens in asdict()
        result = trade.asdict()
        assert result["entryTime"] is not None
        assert result["exitTime"] is not None

    def test_datetime_object(self):
        """Test with datetime object."""
        trade = TradeData(
            entry_time=datetime(2022, 1, 1),
            entry_price=100.0,
            exit_time=datetime(2022, 1, 2),
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )
        # Verify conversion happens in asdict()
        result = trade.asdict()
        assert result["entryTime"] is not None
        assert result["exitTime"] is not None

    def test_pandas_timestamp(self):
        """Test with pandas Timestamp."""
        trade = TradeData(
            entry_time=pd.Timestamp("2022-01-01"),
            entry_price=100.0,
            exit_time=pd.Timestamp("2022-01-02"),
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )
        # Verify conversion happens in asdict()
        result = trade.asdict()
        assert result["entryTime"] is not None
        assert result["exitTime"] is not None


class TestTradeDataPriceValidation:
    """Test price validation and edge cases."""

    def test_positive_prices(self):
        """Test with normal positive prices."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )
        assert trade.entry_price == 100.0
        assert trade.exit_price == 105.0

    def test_zero_entry_price(self):
        """Test with zero entry price (edge case for percentage calculation)."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=0.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )
        assert trade.entry_price == 0.0
        assert trade.pnl_percentage == 0.0  # Should handle division by zero

    def test_very_large_prices(self):
        """Test with very large prices."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=1_000_000.0,
            exit_time=1641081600,
            exit_price=1_050_000.0,
            is_profitable=True,
            id="trade1",
        )
        assert trade.entry_price == 1_000_000.0
        assert trade.exit_price == 1_050_000.0

    def test_very_small_prices(self):
        """Test with very small decimal prices (crypto/forex)."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=0.00001,
            exit_time=1641081600,
            exit_price=0.000011,
            is_profitable=True,
            id="trade1",
        )
        assert trade.entry_price == 0.00001
        assert trade.exit_price == 0.000011

    def test_integer_prices_converted_to_float(self):
        """Test that integer prices are converted to float."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100,  # Integer
            exit_time=1641081600,
            exit_price=105,  # Integer
            is_profitable=True,
            id="trade1",
        )
        assert isinstance(trade.entry_price, float)
        assert isinstance(trade.exit_price, float)


class TestTradeDataValidation:
    """Test validation logic and error conditions."""

    def test_validation_required_fields(self):
        """Test validation of all required fields."""
        # Missing entry_time
        with pytest.raises(TypeError):
            TradeData(
                entry_price=100.0,
                exit_time=1641081600,
                exit_price=105.0,
                is_profitable=True,
                id="trade1",
            )

        # Missing entry_price
        with pytest.raises(TypeError):
            TradeData(
                entry_time=1640995200,
                exit_time=1641081600,
                exit_price=105.0,
                is_profitable=True,
                id="trade1",
            )

        # Missing exit_time
        with pytest.raises(TypeError):
            TradeData(
                entry_time=1640995200,
                entry_price=100.0,
                exit_price=105.0,
                is_profitable=True,
                id="trade1",
            )

        # Missing exit_price
        with pytest.raises(TypeError):
            TradeData(
                entry_time=1640995200,
                entry_price=100.0,
                exit_time=1641081600,
                is_profitable=True,
                id="trade1",
            )

        # Missing is_profitable
        with pytest.raises(TypeError):
            TradeData(
                entry_time=1640995200,
                entry_price=100.0,
                exit_time=1641081600,
                exit_price=105.0,
                id="trade1",
            )

        # Missing id
        with pytest.raises(TypeError):
            TradeData(
                entry_time=1640995200,
                entry_price=100.0,
                exit_time=1641081600,
                exit_price=105.0,
                is_profitable=True,
            )

    def test_exit_time_equal_to_entry_time(self):
        """Test when exit time equals entry time (edge case)."""
        with pytest.raises((ExitTimeAfterEntryTimeError, ValueValidationError)):
            TradeData(
                entry_time=1640995200,
                entry_price=100.0,
                exit_time=1640995200,  # Same as entry
                exit_price=105.0,
                is_profitable=True,
                id="trade1",
            )

    def test_validation_exit_time_after_entry_time(self):
        """Test validation that exit time must be after entry time."""
        # Exit time before entry time should raise error
        with pytest.raises(ExitTimeAfterEntryTimeError):
            TradeData(
                entry_time=1641081600,  # Later time
                entry_price=100.0,
                exit_time=1640995200,  # Earlier time
                exit_price=105.0,
                is_profitable=True,
                id="trade1",
            )

    def test_is_profitable_type_conversion(self):
        """Test that is_profitable is converted to boolean."""
        # Test with integer
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=1,  # Integer
            id="trade1",
        )
        assert isinstance(trade.is_profitable, bool)
        assert trade.is_profitable is True

        # Test with zero
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=95.0,
            is_profitable=0,  # Integer zero
            id="trade1",
        )
        assert isinstance(trade.is_profitable, bool)
        assert trade.is_profitable is False


class TestTradeDataAdditionalData:
    """Test additional_data handling and edge cases."""

    def test_additional_data_flexibility(self):
        """Test that additional_data accepts any custom fields."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "strategy": "momentum",
                "risk_level": "high",
                "timeframe": "intraday",
                "custom_field_1": "value1",
                "custom_field_2": 123,
                "custom_field_3": True,
            },
        )

        assert trade.additional_data["strategy"] == "momentum"
        assert trade.additional_data["risk_level"] == "high"
        assert trade.additional_data["timeframe"] == "intraday"
        assert trade.additional_data["custom_field_1"] == "value1"
        assert trade.additional_data["custom_field_2"] == 123
        assert trade.additional_data["custom_field_3"] is True

    def test_empty_additional_data_dict(self):
        """Test with empty additional_data dict (not None)."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={},  # Empty dict
        )
        assert trade.additional_data == {}
        result = trade.asdict()
        # Core fields should still be present
        assert "entryTime" in result
        assert "isProfitable" in result

    def test_additional_data_with_nested_structures(self):
        """Test additional_data with nested dicts and lists."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "strategy": "momentum",
                "indicators": {
                    "rsi": 70,
                    "macd": {"signal": "bullish", "value": 1.5},
                },
                "tags": ["scalp", "high_confidence", "breakout"],
            },
        )
        assert trade.additional_data["indicators"]["rsi"] == 70
        assert trade.additional_data["indicators"]["macd"]["signal"] == "bullish"
        assert "scalp" in trade.additional_data["tags"]

    def test_additional_data_with_various_types(self):
        """Test additional_data with various Python types."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "string_field": "test",
                "int_field": 123,
                "float_field": 45.67,
                "bool_field": True,
                "none_field": None,
                "list_field": [1, 2, 3],
                "dict_field": {"key": "value"},
            },
        )
        result = trade.asdict()
        assert result["string_field"] == "test"
        assert result["int_field"] == 123
        assert result["float_field"] == 45.67
        assert result["bool_field"] is True
        assert result["none_field"] is None


class TestTradeDataPnLCalculations:
    """Test P&L calculation logic and edge cases."""

    def test_pnl_calculation_from_additional_data(self):
        """Test P&L calculation when provided in additional_data."""
        # With explicit P&L in additional_data
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "quantity": 1000,
                "pnl": 5000.0,
                "pnl_percentage": 5.0,
            },
        )

        assert trade.pnl == 5000.0  # From additional_data
        assert trade.pnl_percentage == 5.0  # From additional_data

    def test_pnl_calculation_fallback(self):
        """Test P&L calculation fallback when not in additional_data."""
        # Without P&L in additional_data - should use basic calculation
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )

        # Basic price difference
        assert trade.pnl == 5.0  # 105 - 100
        assert trade.pnl_percentage == 5.0  # (105-100)/100 * 100

    def test_negative_pnl_calculation(self):
        """Test negative P&L calculation."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=95.0,
            is_profitable=False,
            id="trade1",
        )
        assert trade.pnl == -5.0  # 95 - 100
        assert trade.pnl_percentage == -5.0  # (95-100)/100 * 100

    def test_zero_pnl_calculation(self):
        """Test zero P&L calculation."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=100.0,
            is_profitable=False,
            id="trade1",
        )
        assert trade.pnl == 0.0
        assert trade.pnl_percentage == 0.0

    def test_very_small_percentage_change(self):
        """Test very small percentage change calculation."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=10000.0,
            exit_time=1641081600,
            exit_price=10000.01,
            is_profitable=True,
            id="trade1",
        )
        expected_percentage = (10000.01 - 10000.0) / 10000.0 * 100
        assert abs(trade.pnl_percentage - expected_percentage) < 0.001


class TestTradeDataSerialization:
    """Test serialization and asdict method."""

    def test_asdict_method(self):
        """Test the asdict method returns correct structure."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "quantity": 1000,
                "trade_type": "long",
                "notes": "Test trade",
            },
        )

        result = trade.asdict()

        # Core fields
        assert "entryTime" in result
        assert "entryPrice" in result
        assert "exitTime" in result
        assert "exitPrice" in result
        assert "isProfitable" in result
        assert "id" in result
        assert "pnl" in result
        assert "pnlPercentage" in result

        # Additional data fields should be merged
        assert result["quantity"] == 1000
        assert result["trade_type"] == "long"
        assert result["notes"] == "Test trade"

    def test_asdict_camelcase_conversion(self):
        """Test that asdict converts to camelCase."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )
        result = trade.asdict()
        # Check camelCase keys
        assert "entryTime" in result
        assert "entryPrice" in result
        assert "exitTime" in result
        assert "exitPrice" in result
        assert "isProfitable" in result
        assert "pnlPercentage" in result

    def test_asdict_includes_all_additional_data(self):
        """Test that asdict merges all additional_data fields."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "field1": "value1",
                "field2": 123,
                "field3": True,
            },
        )
        result = trade.asdict()
        # All additional_data fields should be at top level
        assert result["field1"] == "value1"
        assert result["field2"] == 123
        assert result["field3"] is True

    def test_asdict_merges_additional_data(self):
        """Test that asdict properly merges additional_data into result."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "strategy": "momentum",
                "risk_level": "high",
                "quantity": 1000,
            },
        )

        result = trade.asdict()

        # Core fields present
        assert result["id"] == "trade1"
        assert result["isProfitable"] is True

        # Additional data merged at top level
        assert result["strategy"] == "momentum"
        assert result["risk_level"] == "high"
        assert result["quantity"] == 1000

    def test_asdict_with_none_additional_data(self):
        """Test asdict when additional_data is None."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data=None,
        )
        result = trade.asdict()
        # Should still have core fields
        assert "entryTime" in result
        assert "isProfitable" in result
        assert len(result) >= 7  # Core fields count


class TestTradeDataTooltipGeneration:
    """Test tooltip text generation."""

    def test_generate_tooltip_text(self):
        """Test tooltip text generation with additional_data."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "quantity": 1000,
                "notes": "Test notes",
                "pnl": 5000.0,
                "pnl_percentage": 5.0,
            },
        )

        tooltip = trade.generate_tooltip_text()

        assert "Entry: 100.00" in tooltip
        assert "Exit: 105.00" in tooltip
        assert "Qty: 1000.00" in tooltip
        assert "P&L: 5000.00" in tooltip
        assert "Win" in tooltip
        assert "Test notes" in tooltip

    def test_generate_tooltip_text_without_quantity(self):
        """Test tooltip text generation without quantity in additional_data."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )

        tooltip = trade.generate_tooltip_text()

        assert "Entry: 100.00" in tooltip
        assert "Exit: 105.00" in tooltip
        # Qty should not be in tooltip if not in additional_data
        assert "Qty:" not in tooltip

    def test_tooltip_with_profitable_trade(self):
        """Test tooltip generation for profitable trade."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "quantity": 1000,
                "pnl": 5000.0,
                "pnl_percentage": 5.0,
            },
        )
        tooltip = trade.generate_tooltip_text()
        assert "Entry: 100.00" in tooltip
        assert "Exit: 105.00" in tooltip
        assert "Win" in tooltip

    def test_tooltip_with_loss_trade(self):
        """Test tooltip generation for loss-making trade."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=95.0,
            is_profitable=False,
            id="trade1",
            additional_data={
                "quantity": 1000,
                "pnl": -5000.0,
                "pnl_percentage": -5.0,
            },
        )
        tooltip = trade.generate_tooltip_text()
        assert "Entry: 100.00" in tooltip
        assert "Exit: 95.00" in tooltip
        assert "Loss" in tooltip

    def test_tooltip_without_optional_fields(self):
        """Test tooltip generation without optional fields."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )
        tooltip = trade.generate_tooltip_text()
        # Should still generate basic tooltip
        assert "Entry: 100.00" in tooltip
        assert "Exit: 105.00" in tooltip
        # Should not include quantity if not provided
        assert "Qty:" not in tooltip


class TestTradeDataUTCConversion:
    """Test UTC conversion behavior in asdict()."""

    def test_utc_conversion_happens_in_asdict(self):
        """Test that UTC conversion happens in asdict(), not in __post_init__."""
        trade = TradeData(
            entry_time="2022-01-01T00:00:00",
            entry_price=100.0,
            exit_time="2022-01-02T00:00:00",
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )

        # Call asdict multiple times - should return same result
        result1 = trade.asdict()
        result2 = trade.asdict()

        assert result1["entryTime"] == result2["entryTime"]
        assert result1["exitTime"] == result2["exitTime"]
        # Verify the times were converted (not the string values)
        assert isinstance(result1["entryTime"], (int, float))
        assert isinstance(result1["exitTime"], (int, float))

    def test_changing_entry_time_updates_asdict(self):
        """Test that changing entry_time after construction updates asdict() output."""
        trade = TradeData(
            entry_time=1640995200,  # Jan 1, 2022
            entry_price=100.0,
            exit_time=1641081600,  # Jan 2, 2022
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )

        # Get initial serialization
        result1 = trade.asdict()
        initial_entry_time = result1["entryTime"]

        # Change entry_time
        trade.entry_time = 1641081600  # Jan 2, 2022

        # Get new serialization
        result2 = trade.asdict()
        new_entry_time = result2["entryTime"]

        # Verify the change is reflected
        assert new_entry_time != initial_entry_time
        assert new_entry_time == 1641081600

    def test_changing_exit_time_updates_asdict(self):
        """Test that changing exit_time after construction updates asdict() output."""
        trade = TradeData(
            entry_time=1640995200,  # Jan 1, 2022
            entry_price=100.0,
            exit_time=1641081600,  # Jan 2, 2022
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )

        # Get initial serialization
        result1 = trade.asdict()
        initial_exit_time = result1["exitTime"]

        # Change exit_time
        trade.exit_time = 1641168000  # Jan 3, 2022

        # Get new serialization
        result2 = trade.asdict()
        new_exit_time = result2["exitTime"]

        # Verify the change is reflected
        assert new_exit_time != initial_exit_time
        assert new_exit_time == 1641168000

    def test_multiple_time_format_conversions(self):
        """Test that different time formats all convert properly in asdict()."""
        # Test with timestamp
        trade1 = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )

        # Test with string
        trade2 = TradeData(
            entry_time="2022-01-01T00:00:00",
            entry_price=100.0,
            exit_time="2022-01-02T00:00:00",
            exit_price=105.0,
            is_profitable=True,
            id="trade2",
        )

        # Test with datetime
        trade3 = TradeData(
            entry_time=datetime(2022, 1, 1),
            entry_price=100.0,
            exit_time=datetime(2022, 1, 2),
            exit_price=105.0,
            is_profitable=True,
            id="trade3",
        )

        # All should serialize to numeric timestamps
        result1 = trade1.asdict()
        result2 = trade2.asdict()
        result3 = trade3.asdict()

        assert isinstance(result1["entryTime"], (int, float))
        assert isinstance(result2["entryTime"], (int, float))
        assert isinstance(result3["entryTime"], (int, float))

    def test_asdict_converts_fresh_each_time(self):
        """Test that asdict() does fresh conversion each time, not caching."""
        trade = TradeData(
            entry_time="2022-01-01T00:00:00",
            entry_price=100.0,
            exit_time="2022-01-02T00:00:00",
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
        )

        # First call
        result1 = trade.asdict()
        time1 = result1["entryTime"]

        # Modify the time
        trade.entry_time = "2022-01-03T00:00:00"

        # Second call should reflect the change
        result2 = trade.asdict()
        time2 = result2["entryTime"]

        # Times should be different
        assert time1 != time2


class TestTradeDataEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_edge_cases(self):
        """Test edge cases and boundary conditions."""
        # Same entry and exit price
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=100.0,
            is_profitable=False,
            id="trade1",
        )

        assert trade.pnl == 0.0
        assert trade.pnl_percentage == 0.0
        assert trade.is_profitable is False

    def test_unicode_in_id(self):
        """Test trade with Unicode characters in ID."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade_🚀_α",  # Unicode characters
        )
        assert trade.id == "trade_🚀_α"
        result = trade.asdict()
        assert result["id"] == "trade_🚀_α"

    def test_very_long_id(self):
        """Test trade with very long ID."""
        long_id = "trade_" + "x" * 1000
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id=long_id,
        )
        assert trade.id == long_id
        assert len(trade.id) > 1000

    def test_additional_data_with_core_field_names(self):
        """Test that additional_data can have fields with core field names."""
        # This tests that additional_data fields don't conflict
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "custom_entry_time": "2022-01-01",  # Similar name to core field
                "custom_id": "custom123",  # Similar name to core field
            },
        )
        result = trade.asdict()
        # Core fields should take precedence
        assert result["id"] == "trade1"
        # Custom fields should also be present
        assert result["custom_entry_time"] == "2022-01-01"
        assert result["custom_id"] == "custom123"

    def test_multiple_trades_independence(self):
        """Test that multiple trade instances are independent."""
        trade1 = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={"strategy": "momentum"},
        )

        trade2 = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=95.0,
            is_profitable=False,
            id="trade2",
            additional_data={"strategy": "mean_reversion"},
        )

        # Modify trade1's additional_data
        trade1.additional_data["new_field"] = "new_value"

        # trade2 should not be affected
        assert "new_field" not in trade2.additional_data
        assert trade2.additional_data["strategy"] == "mean_reversion"
