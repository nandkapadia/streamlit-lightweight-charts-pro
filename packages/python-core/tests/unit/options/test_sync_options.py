"""Unit tests for SyncOptions module.

This module tests the SyncOptions class functionality including
synchronization configuration, method chaining, and edge cases.
"""

from lightweight_charts_core.charts.options.sync_options import SyncOptions


class TestSyncOptionsInitialization:
    """Test SyncOptions initialization."""

    def test_default_initialization(self):
        """Test default initialization values."""
        sync_options = SyncOptions()

        assert sync_options.enabled is False
        assert sync_options.crosshair is False
        assert sync_options.time_range is False
        assert sync_options.group_id is None

    def test_custom_initialization(self):
        """Test initialization with custom values."""
        sync_options = SyncOptions(
            enabled=True,
            crosshair=True,
            time_range=True,
            group_id="test_group",
        )

        assert sync_options.enabled is True
        assert sync_options.crosshair is True
        assert sync_options.time_range is True
        assert sync_options.group_id == "test_group"

    def test_partial_initialization(self):
        """Test initialization with partial values."""
        sync_options = SyncOptions(enabled=True, crosshair=True)

        assert sync_options.enabled is True
        assert sync_options.crosshair is True
        assert sync_options.time_range is False
        assert sync_options.group_id is None


class TestSyncOptionsEnableAll:
    """Test enable_all method."""

    def test_enable_all(self):
        """Test enabling all synchronization features."""
        sync_options = SyncOptions()

        result = sync_options.enable_all()

        assert result is sync_options  # Method chaining
        assert sync_options.enabled is True
        assert sync_options.crosshair is True
        assert sync_options.time_range is True

    def test_enable_all_already_enabled(self):
        """Test enable_all when already enabled."""
        sync_options = SyncOptions(enabled=True, crosshair=True, time_range=True)

        result = sync_options.enable_all()

        assert result is sync_options
        assert sync_options.enabled is True
        assert sync_options.crosshair is True
        assert sync_options.time_range is True


class TestSyncOptionsDisableAll:
    """Test disable_all method."""

    def test_disable_all(self):
        """Test disabling all synchronization features."""
        sync_options = SyncOptions(enabled=True, crosshair=True, time_range=True)

        result = sync_options.disable_all()

        assert result is sync_options  # Method chaining
        assert sync_options.enabled is False
        assert sync_options.crosshair is False
        assert sync_options.time_range is False

    def test_disable_all_already_disabled(self):
        """Test disable_all when already disabled."""
        sync_options = SyncOptions()

        result = sync_options.disable_all()

        assert result is sync_options
        assert sync_options.enabled is False
        assert sync_options.crosshair is False
        assert sync_options.time_range is False


class TestSyncOptionsEnableCrosshair:
    """Test enable_crosshair method."""

    def test_enable_crosshair(self):
        """Test enabling crosshair synchronization."""
        sync_options = SyncOptions()

        result = sync_options.enable_crosshair()

        assert result is sync_options  # Method chaining
        assert sync_options.crosshair is True
        assert sync_options.enabled is True  # Should also enable overall sync

    def test_enable_crosshair_already_enabled(self):
        """Test enable_crosshair when already enabled."""
        sync_options = SyncOptions(crosshair=True, enabled=True)

        result = sync_options.enable_crosshair()

        assert result is sync_options
        assert sync_options.crosshair is True
        assert sync_options.enabled is True


class TestSyncOptionsDisableCrosshair:
    """Test disable_crosshair method."""

    def test_disable_crosshair_with_time_range_enabled(self):
        """Test disabling crosshair when time_range is still enabled."""
        sync_options = SyncOptions(enabled=True, crosshair=True, time_range=True)

        result = sync_options.disable_crosshair()

        assert result is sync_options
        assert sync_options.crosshair is False
        assert sync_options.time_range is True
        assert sync_options.enabled is True  # Should remain enabled

    def test_disable_crosshair_with_time_range_disabled(self):
        """Test disabling crosshair when time_range is also disabled."""
        sync_options = SyncOptions(enabled=True, crosshair=True, time_range=False)

        result = sync_options.disable_crosshair()

        assert result is sync_options
        assert sync_options.crosshair is False
        assert sync_options.time_range is False
        assert sync_options.enabled is False  # Should disable overall sync

    def test_disable_crosshair_already_disabled(self):
        """Test disable_crosshair when already disabled."""
        sync_options = SyncOptions(crosshair=False, enabled=False)

        result = sync_options.disable_crosshair()

        assert result is sync_options
        assert sync_options.crosshair is False
        assert sync_options.enabled is False


class TestSyncOptionsEnableTimeRange:
    """Test enable_time_range method."""

    def test_enable_time_range(self):
        """Test enabling time range synchronization."""
        sync_options = SyncOptions()

        result = sync_options.enable_time_range()

        assert result is sync_options  # Method chaining
        assert sync_options.time_range is True
        assert sync_options.enabled is True  # Should also enable overall sync

    def test_enable_time_range_already_enabled(self):
        """Test enable_time_range when already enabled."""
        sync_options = SyncOptions(time_range=True, enabled=True)

        result = sync_options.enable_time_range()

        assert result is sync_options
        assert sync_options.time_range is True
        assert sync_options.enabled is True


class TestSyncOptionsDisableTimeRange:
    """Test disable_time_range method."""

    def test_disable_time_range_with_crosshair_enabled(self):
        """Test disabling time_range when crosshair is still enabled."""
        sync_options = SyncOptions(enabled=True, crosshair=True, time_range=True)

        result = sync_options.disable_time_range()

        assert result is sync_options
        assert sync_options.time_range is False
        assert sync_options.crosshair is True
        assert sync_options.enabled is True  # Should remain enabled

    def test_disable_time_range_with_crosshair_disabled(self):
        """Test disabling time_range when crosshair is also disabled."""
        sync_options = SyncOptions(enabled=True, crosshair=False, time_range=True)

        result = sync_options.disable_time_range()

        assert result is sync_options
        assert sync_options.time_range is False
        assert sync_options.crosshair is False
        assert sync_options.enabled is False  # Should disable overall sync

    def test_disable_time_range_already_disabled(self):
        """Test disable_time_range when already disabled."""
        sync_options = SyncOptions(time_range=False, enabled=False)

        result = sync_options.disable_time_range()

        assert result is sync_options
        assert sync_options.time_range is False
        assert sync_options.enabled is False


class TestSyncOptionsMethodChaining:
    """Test method chaining functionality."""

    def test_method_chaining_enable_disable(self):
        """Test chaining enable and disable methods."""
        sync_options = SyncOptions()

        result = (
            sync_options.enable_all().disable_crosshair().enable_crosshair().disable_time_range()
        )

        assert result is sync_options
        assert sync_options.enabled is True
        assert sync_options.crosshair is True
        assert sync_options.time_range is False

    def test_complex_chaining(self):
        """Test complex method chaining scenarios."""
        sync_options = SyncOptions()

        result = (
            sync_options.enable_crosshair().enable_time_range().disable_all().enable_time_range()
        )

        assert result is sync_options
        assert sync_options.enabled is True
        assert sync_options.crosshair is False
        assert sync_options.time_range is True


class TestSyncOptionsGroupId:
    """Test group_id functionality."""

    def test_group_id_persistence(self):
        """Test that group_id persists through method calls."""
        sync_options = SyncOptions(group_id="test_group")

        result = sync_options.enable_all()

        assert result is sync_options
        assert sync_options.group_id == "test_group"

    def test_group_id_with_different_values(self):
        """Test group_id with different string values."""
        sync_options = SyncOptions(group_id="price_charts")

        assert sync_options.group_id == "price_charts"

        sync_options.group_id = "volume_charts"
        assert sync_options.group_id == "volume_charts"

        sync_options.group_id = None
        assert sync_options.group_id is None


class TestSyncOptionsEdgeCases:
    """Test edge cases and error conditions."""

    def test_boolean_edge_values(self):
        """Test with boolean edge values."""
        sync_options = SyncOptions(enabled=False, crosshair=False, time_range=False)

        # Test enabling when all are False
        sync_options.enable_all()
        assert all([sync_options.enabled, sync_options.crosshair, sync_options.time_range])

        # Test disabling when all are True
        sync_options.disable_all()
        assert not any([sync_options.enabled, sync_options.crosshair, sync_options.time_range])

    def test_mixed_state_transitions(self):
        """Test various state transitions."""
        sync_options = SyncOptions()

        # Start disabled, enable crosshair only
        sync_options.enable_crosshair()
        assert sync_options.enabled is True
        assert sync_options.crosshair is True
        assert sync_options.time_range is False

        # Add time_range
        sync_options.enable_time_range()
        assert sync_options.enabled is True
        assert sync_options.crosshair is True
        assert sync_options.time_range is True

        # Disable crosshair, time_range should remain
        sync_options.disable_crosshair()
        assert sync_options.enabled is True
        assert sync_options.crosshair is False
        assert sync_options.time_range is True

        # Disable time_range, everything should be disabled
        sync_options.disable_time_range()
        assert sync_options.enabled is False
        assert sync_options.crosshair is False
        assert sync_options.time_range is False


class TestSyncOptionsAsDict:
    """Test serialization to dictionary."""

    def test_asdict_default(self):
        """Test asdict with default values."""
        sync_options = SyncOptions()
        result = sync_options.asdict()

        # The actual implementation includes False values
        expected = {"crosshair": False, "enabled": False, "timeRange": False}
        assert result == expected

    def test_asdict_custom_values(self):
        """Test asdict with custom values."""
        sync_options = SyncOptions(
            enabled=True,
            crosshair=True,
            time_range=True,
            group_id="test_group",
        )
        result = sync_options.asdict()

        expected = {"enabled": True, "crosshair": True, "timeRange": True, "groupId": "test_group"}
        assert result == expected

    def test_asdict_partial_values(self):
        """Test asdict with partial values."""
        sync_options = SyncOptions(enabled=True, crosshair=False, group_id="partial_group")
        result = sync_options.asdict()

        expected = {
            "enabled": True,
            "crosshair": False,
            "timeRange": False,
            "groupId": "partial_group",
        }
        assert result == expected
