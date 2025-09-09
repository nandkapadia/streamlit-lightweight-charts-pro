"""
Component initialization for streamlit-lightweight-charts.

This module handles the initialization of the Streamlit component to avoid
circular import issues. It manages the component function that renders
charts in Streamlit applications.

The module supports both development and production modes:
    - Development mode: Uses local development server for hot reloading
    - Production mode: Uses built frontend files for deployment

The component function is initialized once when the module is first imported
and can be retrieved using get_component_func() for use throughout the application.

Example:
    ```python
    from streamlit_lightweight_charts_pro.component import get_component_func

    component_func = get_component_func()
    if component_func:
        component_func(config=chart_config, key="my_chart")
    ```

Raises:
    ImportError: If Streamlit components module cannot be imported
    FileNotFoundError: If frontend build directory is missing in production mode
"""

from pathlib import Path
from typing import Any, Callable, Dict, Optional

import streamlit.components.v1 as components

from streamlit_lightweight_charts_pro.logging_config import get_logger

# Component function for Streamlit integration - initialized once
_component_func: Optional[Callable[..., Any]] = None

# Initialize logger
logger = get_logger("component")

# Determine if we're in a release build or development
# Set to True for production builds, False for development
_RELEASE = True


def get_component_func() -> Optional[Callable[..., Any]]:
    """
    Get the Streamlit component function for rendering charts.

    This function returns the initialized component function that can be used
    to render charts in Streamlit applications. The component function is
    initialized once when the module is first imported.

    The component function takes chart configuration and renders it using
    the React frontend component. It handles the communication between
    Python and the JavaScript frontend.

    Returns:
        Optional[Callable[..., Any]]: The component function if successfully
            initialized, None otherwise. The function signature is:
            component_func(config: Dict[str, Any], key: Optional[str] = None) -> Any

    Raises:
        RuntimeError: If component initialization fails (handled internally)

    Example:
        ```python
        component_func = get_component_func()
        if component_func:
            result = component_func(config=chart_config, key="my_chart")
        else:
            logger.warning("Component function not available")
        ```
    """
    if _component_func is None:
        logger.warning("Component function is not initialized. This may indicate a loading issue.")
    return _component_func


def debug_component_status() -> Dict[str, Any]:
    """
    Debug function to check component initialization status.

    Returns:
        Dict[str, Any]: Status information about the component
    """
    status = {
        "component_initialized": _component_func is not None,
        "release_mode": _RELEASE,
        "frontend_dir_exists": False,
        "component_type": type(_component_func).__name__ if _component_func else None,
    }

    if _RELEASE:
        frontend_dir = Path(__file__).parent / "frontend" / "build"
        status["frontend_dir_exists"] = frontend_dir.exists()
        status["frontend_dir_path"] = str(frontend_dir)

        # Check if build files exist
        if frontend_dir.exists():
            static_dir = frontend_dir / "static"
            js_dir = static_dir / "js" if static_dir.exists() else None
            status["static_dir_exists"] = static_dir.exists()
            status["js_dir_exists"] = js_dir.exists() if js_dir else False

            if js_dir and js_dir.exists():
                js_files = list(js_dir.glob("*.js"))
                status["js_files_count"] = len(js_files)
                status["js_files"] = [f.name for f in js_files]

    return status


def reinitialize_component() -> bool:
    """
    Attempt to reinitialize the component if it failed to load initially.

    Returns:
        bool: True if reinitialization was successful, False otherwise
    """
    global _component_func  # pylint: disable=global-statement

    logger.info("Attempting to reinitialize component...")

    if _RELEASE:
        frontend_dir = Path(__file__).parent / "frontend" / "build"
        if frontend_dir.exists():
            try:
                _component_func = components.declare_component(
                    "streamlit_lightweight_charts_pro", path=str(frontend_dir)
                )
                logger.info("Successfully reinitialized production component")
                return True
            except Exception as e:
                logger.error("Failed to reinitialize component: %s", e)
                return False
    else:
        try:
            _component_func = components.declare_component(
                "streamlit_lightweight_charts_pro", url="http://localhost:3001"
            )
            logger.info("Successfully reinitialized development component")
            return True
        except Exception as e:
            logger.error("Failed to reinitialize development component: %s", e)
            return False

    return False


def _initialize_component() -> None:
    """Initialize the component function based on environment."""
    global _component_func  # pylint: disable=global-statement

    if _RELEASE:
        # Production mode: Use built frontend files from the build directory
        frontend_dir = Path(__file__).parent / "frontend" / "build"
        logger.info("Checking frontend directory: %s", frontend_dir)

        if frontend_dir.exists():
            logger.info("Frontend directory exists, attempting to initialize component")
            try:
                logger.info("Successfully imported streamlit.components.v1")

                # Declare the component with the built frontend files
                _component_func = components.declare_component(
                    "streamlit_lightweight_charts_pro", path=str(frontend_dir)
                )
                logger.info("Successfully initialized production component")
            except ImportError as e:
                # Log warning if Streamlit components module cannot be imported
                logger.error("Failed to import streamlit.components.v1: %s", e)
                _component_func = None
            except Exception as e:
                # Log warning if component initialization fails
                logger.error("Could not load frontend component: %s", e)
                _component_func = None
        else:
            # Log warning if build directory is missing
            logger.error("Frontend build directory not found at %s", frontend_dir)
            _component_func = None
    else:
        # Development mode: Use local development server for hot reloading
        # This allows for real-time development without rebuilding
        logger.info("Development mode: attempting to initialize component with local server")
        try:
            logger.info("Successfully imported streamlit.components.v1 for development")

            # Declare the component with development server URL
            _component_func = components.declare_component(
                "streamlit_lightweight_charts_pro", url="http://localhost:3001"
            )
            logger.info("Successfully initialized development component")
        except ImportError as e:
            # Log warning if Streamlit components module cannot be imported
            logger.error("Failed to import streamlit.components.v1 for development: %s", e)
            _component_func = None
        except Exception as e:
            # Log warning if development component initialization fails
            logger.error("Could not load development component: %s", e)
            _component_func = None


# Initialize component function
_initialize_component()
