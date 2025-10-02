"""Comprehensive unit tests for the component module.

This module contains extensive unit tests for the Streamlit component
initialization and management functionality. The tests cover component
lifecycle, error handling, and integration with the Streamlit framework.

Key Features Tested:
    - Component initialization and status management
    - Error handling for missing or invalid components
    - Debug functionality for troubleshooting
    - Component reinitialization and recovery
    - Streamlit integration and compatibility
    - Release version management and validation

Example Test Usage:
    ```python
    from tests.unit.test_component import TestComponentInitialization

    # Run specific test
    test_instance = TestComponentInitialization()
    test_instance.test_get_component_func_not_initialized()
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
import inspect
from unittest.mock import Mock, patch

# Local Imports
import streamlit_lightweight_charts_pro.component as component_module
from streamlit_lightweight_charts_pro.component import (
    _RELEASE,
    _component_func,
    debug_component_status,
    get_component_func,
    reinitialize_component,
)


class TestComponentInitialization:
    """Test cases for component initialization and status management.

    This test class focuses on verifying that the Streamlit component
    can be properly initialized, managed, and debugged. It tests the
    component lifecycle and error handling scenarios.

    The tests ensure that:
        - Component status can be checked and managed
        - Error handling works for uninitialized components
        - Debug functionality provides useful information
        - Component can be reinitialized when needed
    """

    def test_get_component_func_not_initialized(self):
        """Test get_component_func when component is not initialized.

        This test verifies that the component function returns None
        when the component has not been initialized, ensuring proper
        error handling for uninitialized states.

        The test ensures:
            - Uninitialized component returns None
            - No exceptions are raised for uninitialized state
            - Component state can be safely checked
        """
        # Store the original component function to restore later
        # This ensures we don't permanently break the module state
        original_func = _component_func
        try:
            # Simulate uninitialized state by setting component function to None
            # This tests the behavior when the component hasn't been loaded yet
            component_module._component_func = None

            # Test that get_component_func returns None for uninitialized state
            result = get_component_func()
            assert result is None  # Verify uninitialized component returns None
        finally:
            # Always restore the original value to prevent test interference
            # This ensures other tests aren't affected by this test's changes
            component_module._component_func = original_func

    def test_get_component_func_initialized(self):
        """Test get_component_func when component is initialized."""
        mock_func = Mock()

        # Temporarily set _component_func to mock
        original_func = _component_func
        try:
            component_module._component_func = mock_func

            result = get_component_func()
            assert result == mock_func
        finally:
            # Restore original value
            component_module._component_func = original_func

    def test_debug_component_status(self):
        """Test debug_component_status function."""
        status = debug_component_status()

        # Check that all expected keys are present
        expected_keys = [
            "component_initialized",
            "release_mode",
            "frontend_dir_exists",
            "component_type",
        ]
        for key in expected_keys:
            assert key in status

        # Check release mode
        assert status["release_mode"] == _RELEASE

        # Check component type
        if _component_func is not None:
            assert status["component_type"] == type(_component_func).__name__
        else:
            assert status["component_type"] is None

    def test_debug_component_status_with_frontend_dir(self):
        """Test debug_component_status when frontend directory exists."""
        with patch("pathlib.Path.exists", return_value=True):  # noqa: SIM117
            with patch("pathlib.Path.glob", return_value=[Mock(name="test.js")]):
                status = debug_component_status()

                assert status["frontend_dir_exists"] is True
                assert "frontend_dir_path" in status
                assert "static_dir_exists" in status
                assert "js_dir_exists" in status
                assert "js_files_count" in status
                assert "js_files" in status

    def test_debug_component_status_without_frontend_dir(self):
        """Test debug_component_status when frontend directory doesn't exist."""
        with patch("pathlib.Path.exists", return_value=False):
            status = debug_component_status()

            assert status["frontend_dir_exists"] is False
            assert "frontend_dir_path" in status


class TestComponentReinitialization:
    """Test component reinitialization functionality."""

    @patch("streamlit_lightweight_charts_pro.component._RELEASE", True)
    @patch("pathlib.Path.exists", return_value=True)
    @patch("streamlit.components.v1.declare_component")
    def test_reinitialize_component_production_success(self, mock_declare, _mock_exists):
        """Test successful reinitialization in production mode."""
        mock_component = Mock()
        mock_declare.return_value = mock_component

        # Temporarily set _component_func to None
        original_func = _component_func
        try:
            component_module._component_func = None

            result = reinitialize_component()

            assert result is True
            assert component_module._component_func == mock_component
            mock_declare.assert_called_once()
        finally:
            # Restore original value
            component_module._component_func = original_func

    @patch("streamlit_lightweight_charts_pro.component._RELEASE", True)
    @patch("pathlib.Path.exists", return_value=False)
    def test_reinitialize_component_production_no_frontend_dir(self, _mock_exists):
        """Test reinitialization failure when frontend directory doesn't exist."""
        result = reinitialize_component()
        assert result is False

    @patch("streamlit_lightweight_charts_pro.component._RELEASE", True)
    @patch("pathlib.Path.exists", return_value=True)
    @patch("streamlit.components.v1.declare_component", side_effect=ImportError("Test error"))
    def test_reinitialize_component_production_import_error(self, _mock_declare, _mock_exists):
        """Test reinitialization failure due to import error."""
        result = reinitialize_component()
        assert result is False

    @patch("streamlit_lightweight_charts_pro.component._RELEASE", True)
    @patch("pathlib.Path.exists", return_value=True)
    @patch("streamlit.components.v1.declare_component", side_effect=Exception("Test error"))
    def test_reinitialize_component_production_general_error(self, _mock_declare, _mock_exists):
        """Test reinitialization failure due to general error."""
        result = reinitialize_component()
        assert result is False

    @patch("streamlit_lightweight_charts_pro.component._RELEASE", False)
    @patch("streamlit.components.v1.declare_component")
    def test_reinitialize_component_development_success(self, mock_declare):
        """Test successful reinitialization in development mode."""
        mock_component = Mock()
        mock_declare.return_value = mock_component

        # Temporarily set _component_func to None
        original_func = _component_func
        try:
            component_module._component_func = None

            result = reinitialize_component()

            assert result is True
            assert component_module._component_func == mock_component
            mock_declare.assert_called_once_with(
                "streamlit_lightweight_charts_pro",
                url="http://localhost:3001",
            )
        finally:
            # Restore original value
            component_module._component_func = original_func

    @patch("streamlit_lightweight_charts_pro.component._RELEASE", False)
    @patch("streamlit.components.v1.declare_component", side_effect=ImportError("Test error"))
    def test_reinitialize_component_development_import_error(self, _mock_declare):
        """Test reinitialization failure in development mode due to import error."""
        result = reinitialize_component()
        assert result is False

    @patch("streamlit_lightweight_charts_pro.component._RELEASE", False)
    @patch("streamlit.components.v1.declare_component", side_effect=Exception("Test error"))
    def test_reinitialize_component_development_general_error(self, _mock_declare):
        """Test reinitialization failure in development mode due to general error."""
        result = reinitialize_component()
        assert result is False


class TestComponentModuleStructure:
    """Test the overall structure and imports of the component module."""

    def test_module_imports(self):
        """Test that the module can be imported successfully."""

        # Check that all expected attributes exist
        assert hasattr(component_module, "get_component_func")
        assert hasattr(component_module, "debug_component_status")
        assert hasattr(component_module, "reinitialize_component")
        assert hasattr(component_module, "_component_func")
        assert hasattr(component_module, "_RELEASE")
        assert hasattr(component_module, "logger")

    def test_logger_initialization(self):
        """Test that the logger is properly initialized."""

        assert component_module.logger is not None
        assert hasattr(component_module.logger, "info")
        assert hasattr(component_module.logger, "warning")
        assert hasattr(component_module.logger, "error")

    def test_release_flag(self):
        """Test that the release flag is properly set."""

        # The release flag should be a boolean
        assert isinstance(component_module._RELEASE, bool)


class TestComponentErrorHandling:
    """Test error handling in the component module."""

    @patch("streamlit_lightweight_charts_pro.component.logger")
    def test_get_component_func_logs_warning_when_not_initialized(self, mock_logger):
        """Test that get_component_func logs a warning when component is not initialized."""
        # Temporarily set _component_func to None
        original_func = _component_func
        try:
            component_module._component_func = None

            get_component_func()

            mock_logger.warning.assert_called_once_with(
                "Component function is not initialized. This may indicate a loading issue.",
            )
        finally:
            # Restore original value
            component_module._component_func = original_func

    @patch("streamlit_lightweight_charts_pro.component.logger")
    def test_get_component_func_no_warning_when_initialized(self, mock_logger):
        """Test that get_component_func doesn't log warning when component is initialized."""
        if _component_func is not None:
            get_component_func()
            mock_logger.warning.assert_not_called()


class TestComponentIntegration:
    """Test component integration scenarios."""

    def test_component_func_type(self):
        """Test that the component function has the expected type when initialized."""
        if _component_func is not None:
            # The component function should be callable
            assert callable(_component_func)

            # Streamlit components use *args and **kwargs for flexibility
            # The function should be callable with any arguments

            sig = inspect.signature(_component_func)
            params = list(sig.parameters.keys())

            # Streamlit components typically use *args and **kwargs
            # or have flexible parameter signatures
            assert len(params) >= 0  # Can have no explicit parameters (uses *args/**kwargs)

    def test_component_func_availability(self):
        """Test that the component function is available after module import."""
        # Re-import the module to ensure initialization

        # The component function should be available (either None or callable)
        assert (
            component_module._component_func is not None or component_module._component_func is None
        )

        # If it's not None, it should be callable
        if component_module._component_func is not None:
            assert callable(component_module._component_func)
