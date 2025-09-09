"""
Unit tests for TradeData class.

This module tests the TradeData class functionality including
construction, validation, and serialization.
"""

import pytest

from streamlit_lightweight_charts_pro.data.trade import TradeData
from streamlit_lightweight_charts_pro.type_definitions.enums import TradeType


class TestTradeData:
    """Test cases for TradeData class."""

    def test_default_construction(self):
        """Test TradeData construction with default values."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            quantity=1000,
        )

        assert trade.entry_time == 1640995200
        assert trade.entry_price == 100.0
        assert trade.exit_time == 1641081600
        assert trade.exit_price == 105.0
        assert trade.quantity == 1000
        assert trade.trade_type == TradeType.LONG
        assert trade.id is None
        assert trade.notes is None
        assert trade.text is not None  # Should be auto-generated

    def test_construction_with_all_parameters(self):
        """Test TradeData construction with all parameters."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            quantity=1000,
            trade_type=TradeType.SHORT,
            id="trade1",
            notes="Test trade",
            text="Custom text",
        )

        assert trade.entry_time == 1640995200
        assert trade.entry_price == 100.0
        assert trade.exit_time == 1641081600
        assert trade.exit_price == 105.0
        assert trade.quantity == 1000
        assert trade.trade_type == TradeType.SHORT
        assert trade.id == "trade1"
        assert trade.notes == "Test trade"
        assert trade.text == "Custom text"

    def test_asdict_method(self):
        """Test the asdict method returns correct structure."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            quantity=1000,
            trade_type=TradeType.LONG,
            id="trade1",
            notes="Test trade",
        )

        result = trade.asdict()

        assert "entryTime" in result
        assert "entryPrice" in result
        assert "exitTime" in result
        assert "exitPrice" in result
        assert "quantity" in result
        assert "tradeType" in result
        assert "isProfitable" in result
        assert "pnl" in result
        assert "pnlPercentage" in result
        assert result["id"] == "trade1"
        assert result["notes"] == "Test trade"

    def test_validation_required_fields(self):
        """Test validation of required fields."""
        # Missing entry_time
        with pytest.raises(TypeError):
            TradeData(entry_price=100.0, exit_time=1641081600, exit_price=105.0, quantity=1000)

        # Missing entry_price
        with pytest.raises(TypeError):
            TradeData(entry_time=1640995200, exit_time=1641081600, exit_price=105.0, quantity=1000)

        # Missing exit_time
        with pytest.raises(TypeError):
            TradeData(entry_time=1640995200, entry_price=100.0, exit_price=105.0, quantity=1000)

        # Missing exit_price
        with pytest.raises(TypeError):
            TradeData(entry_time=1640995200, entry_price=100.0, exit_time=1641081600, quantity=1000)

        # Missing quantity
        with pytest.raises(TypeError):
            TradeData(
                entry_time=1640995200, entry_price=100.0, exit_time=1641081600, exit_price=105.0
            )

    def test_validation_exit_time_after_entry_time(self):
        """Test validation that exit time must be after entry time."""
        # Exit time before entry time should raise error
        with pytest.raises(ValueError, match="Exit time must be after entry time"):
            TradeData(
                entry_time=1641081600,  # Later time
                entry_price=100.0,
                exit_time=1640995200,  # Earlier time
                exit_price=105.0,
                quantity=1000,
            )

    def test_pnl_calculation_long_trade(self):
        """Test P&L calculation for long trades."""
        # Profitable long trade
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            quantity=1000,
            trade_type=TradeType.LONG,
        )

        assert trade.pnl == 5000.0  # (105 - 100) * 1000
        assert trade.pnl_percentage == 5.0  # (105 - 100) / 100 * 100
        assert trade.is_profitable is True

        # Loss-making long trade
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=95.0,
            quantity=1000,
            trade_type=TradeType.LONG,
        )

        assert trade.pnl == -5000.0  # (95 - 100) * 1000
        assert trade.pnl_percentage == -5.0  # (95 - 100) / 100 * 100
        assert trade.is_profitable is False

    def test_pnl_calculation_short_trade(self):
        """Test P&L calculation for short trades."""
        # Profitable short trade
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=95.0,
            quantity=1000,
            trade_type=TradeType.SHORT,
        )

        assert trade.pnl == 5000.0  # (100 - 95) * 1000
        assert trade.pnl_percentage == 5.0  # (100 - 95) / 100 * 100
        assert trade.is_profitable is True

        # Loss-making short trade
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            quantity=1000,
            trade_type=TradeType.SHORT,
        )

        assert trade.pnl == -5000.0  # (100 - 105) * 1000
        assert trade.pnl_percentage == -5.0  # (100 - 105) / 100 * 100
        assert trade.is_profitable is False

    def test_trade_type_conversion(self):
        """Test trade type string to enum conversion."""
        # String to enum conversion
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            quantity=1000,
            trade_type="short",
        )

        assert trade.trade_type == TradeType.SHORT

        # Already enum
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            quantity=1000,
            trade_type=TradeType.LONG,
        )

        assert trade.trade_type == TradeType.LONG

    def test_to_markers_method(self):
        """Test the to_markers method."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            quantity=1000,
            trade_type=TradeType.LONG,
            id="test_trade",
        )

        markers = trade.to_markers()

        assert len(markers) == 2  # Entry and exit markers
        assert markers[0].time == trade._entry_timestamp
        assert markers[1].time == trade._exit_timestamp

    def test_generate_tooltip_text(self):
        """Test tooltip text generation."""
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            quantity=1000,
            trade_type=TradeType.LONG,
            notes="Test notes",
        )

        tooltip = trade.generate_tooltip_text()

        assert "Entry: 100.00" in tooltip
        assert "Exit: 105.00" in tooltip
        assert "Qty: 1000.00" in tooltip
        assert "P&L: 5000.00" in tooltip
        assert "Win" in tooltip
        assert "Test notes" in tooltip

    def test_edge_cases(self):
        """Test edge cases and boundary conditions."""
        # Zero quantity
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=105.0,
            quantity=0,
        )

        assert trade.quantity == 0
        assert trade.pnl == 0.0

        # Same entry and exit price
        trade = TradeData(
            entry_time=1640995200,
            entry_price=100.0,
            exit_time=1641081600,
            exit_price=100.0,
            quantity=1000,
        )

        assert trade.pnl == 0.0
        assert trade.pnl_percentage == 0.0
        assert trade.is_profitable is False  # No profit, so not profitable
