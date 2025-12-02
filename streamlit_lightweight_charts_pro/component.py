"""Component initialization for Streamlit Lightweight Charts Pro.

This module handles the initialization of the Streamlit custom component that
enables TradingView Lightweight Charts in Streamlit applications. It manages
the component lifecycle, handles both development and production modes, and
provides utilities for debugging component initialization issues.

The module uses Streamlit's components API to create a bidirectional bridge
between Python (backend) and React/JavaScript (frontend). This bridge allows:
    - Sending chart configuration from Python to JavaScript
    - Receiving user interactions from JavaScript back to Python
    - Managing component state and lifecycle
    - Hot reloading during development

Key Features:
    - Automatic mode detection (development vs production)
    - Lazy component initialization to avoid import cycles
    - Comprehensive error handling and logging
    - Debug utilities for troubleshooting
    - Support for component reinitialization

Architecture:
    The component follows a singleton pattern where _component_func is
    initialized once at module import time. This ensures consistent behavior
    across the application and avoids redundant initialization overhead.

    Component Modes:
        - Production (_RELEASE=True): Uses pre-built static files from
          frontend/build directory. Optimized for deployment.
        - Development (_RELEASE=False): Connects to local dev server at
          localhost:3001 for hot reloading and rapid iteration.

Example:
    Basic chart rendering::

        from streamlit_lightweight_charts_pro.component import get_component_func

        # Get the initialized component function
        component_func = get_component_func()

        if component_func:
            # Render a chart with configuration
            result = component_func(config={"chart_options": {...}}, key="my_chart")
        else:
            st.error("Chart component failed to initialize")

    Debugging initialization issues::

        from streamlit_lightweight_charts_pro.component import (
            debug_component_status,
            reinitialize_component,
        )

        # Check component status
        status = debug_component_status()
        print(f"Component initialized: {status['component_initialized']}")

        # Attempt reinitialization if needed
        if not status["component_initialized"]:
            success = reinitialize_component()
            print(f"Reinitialization {'succeeded' if success else 'failed'}")

Note:
    The module initializes the component automatically at import time.
    Component initialization failures are logged but don't raise exceptions,
    allowing the application to start even if charts can't be rendered.

Raises:
    ImportError: If Streamlit components module cannot be imported
    FileNotFoundError: If frontend build directory is missing in production
"""

# Standard Imports
from pathlib import Path
from typing import Any, Callable, Optional

# Third Party Imports
import streamlit.components.v1 as components

# Local Imports
from lightweight_charts_pro.logging_config import get_logger

# Component function for Streamlit integration - initialized once at module load
# This is a module-level singleton that holds the Streamlit component function
# None indicates the component hasn't been initialized or initialization failed
_component_func: Optional[Callable[..., Any]] = None

# Initialize logger for this module
# Uses hierarchical naming: streamlit_lightweight_charts_pro.component
logger = get_logger("component")

# Determine if we're in a release build or development mode
# True = Production mode (use built files from frontend/build)
# False = Development mode (use dev server at localhost:3001)
_RELEASE = True


def get_component_func() -> Optional[Callable[..., Any]]:
    """Get the Streamlit component function for rendering charts.

    This function returns the initialized component function that enables
    chart rendering in Streamlit applications. The component function acts
    as a bridge between Python configuration and the React frontend.

    The returned function can be called with chart configuration to render
    interactive TradingView Lightweight Charts. It handles serialization,
    communication with the JavaScript frontend, and state management.

    Returns:
        Optional[Callable[..., Any]]: The component function if successfully
            initialized, None if initialization failed. When not None, the
            function has the signature:

            component_func(
                config: Dict[str, Any],
                key: Optional[str] = None,
                height: int = 400
            ) -> Any

            Where:
                - config: Chart configuration dictionary
                - key: Unique identifier for the component instance
                - height: Component height in pixels

    Example:
        Render a simple chart::

            >>> component_func = get_component_func()
            >>> if component_func:
            ...     component_func(
            ...         config={"chart_options": {"layout": {...}}},
            ...         key="my_chart",
            ...         height=500
            ...     )

        Handle missing component gracefully::

            >>> component_func = get_component_func()
            >>> if component_func is None:
            ...     st.warning("Chart component unavailable")

    Note:
        If the function returns None, check logs and use
        debug_component_status() to diagnose initialization issues.
        Common causes include:
            - Missing frontend build files
            - Incorrect file paths
            - Import errors
            - Permission issues
    """
    # Check if component function was successfully initialized
    if _component_func is None:
        # Log warning to help diagnose why component is unavailable
        # This could indicate:
        # - Frontend build directory missing
        # - Component declaration failed
        # - Import errors during initialization
        logger.warning("Component function is not initialized. This may indicate a loading issue.")

    # Return the component function (or None if initialization failed)
    return _component_func


def debug_component_status() -> dict[str, Any]:
    """Debug function to check component initialization status.

    This utility function provides comprehensive information about the
    component's initialization state, file paths, and available resources.
    It's invaluable for troubleshooting component loading issues.

    The function checks:
        - Whether component function was initialized
        - Current mode (production vs development)
        - Frontend directory existence and path
        - Static asset directory structure
        - JavaScript bundle files availability

    Returns:
        Dict[str, Any]: Status information dictionary containing:
            - component_initialized (bool): True if component loaded
            - release_mode (bool): True if in production mode
            - frontend_dir_exists (bool): True if build dir exists
            - component_type (str): Type name of component function
            - frontend_dir_path (str): Absolute path to frontend
            - static_dir_exists (bool): True if static dir exists
            - js_dir_exists (bool): True if js dir exists
            - js_files_count (int): Number of JavaScript files found
            - js_files (List[str]): Names of JavaScript bundle files

    Example:
        Basic status check::

            >>> status = debug_component_status()
            >>> print(f"Initialized: {status['component_initialized']}")
            >>> print(f"Mode: {'Production' if status['release_mode'] else 'Dev'}")

        Diagnose missing files::

            >>> status = debug_component_status()
            >>> if not status['component_initialized']:
            ...     if not status['frontend_dir_exists']:
            ...         print("Frontend build missing - run npm build")
            ...     elif not status['js_dir_exists']:
            ...         print("JavaScript bundles missing")
            ...     else:
            ...         print(f"Found {status['js_files_count']} JS files")

    Note:
        This function only checks production mode files. Development mode
        status depends on the dev server running at localhost:3001.
    """
    # Initialize status dictionary with basic component information
    # This will be populated with detailed information below
    status: dict[str, Any] = {
        # Check if component function was successfully created
        "component_initialized": _component_func is not None,
        # Current mode: True = production, False = development
        "release_mode": _RELEASE,
        # Will be set to True if frontend directory exists
        "frontend_dir_exists": False,
        # Type of component function (or None if not initialized)
        "component_type": (type(_component_func).__name__ if _component_func else None),
    }

    # Only check filesystem paths in production mode
    # In development mode, frontend is served from separate dev server
    if _RELEASE:
        # Construct path to the frontend build directory
        # This is where npm build outputs the compiled React app
        frontend_dir = Path(__file__).parent / "frontend" / "build"

        # Check if the build directory actually exists on disk
        status["frontend_dir_exists"] = frontend_dir.exists()

        # Store the absolute path for debugging
        status["frontend_dir_path"] = str(frontend_dir)

        # If build directory exists, check for required subdirectories
        if frontend_dir.exists():
            # The 'static' directory contains all compiled assets
            static_dir = frontend_dir / "static"

            # The 'js' subdirectory contains JavaScript bundles
            js_dir = static_dir / "js" if static_dir.exists() else None

            # Record whether static directory exists
            status["static_dir_exists"] = static_dir.exists()

            # Record whether js directory exists (only if static exists)
            status["js_dir_exists"] = js_dir.exists() if js_dir else False

            # If js directory exists, enumerate JavaScript bundle files
            if js_dir and js_dir.exists():
                # Find all .js files in the js directory
                js_files = list(js_dir.glob("*.js"))

                # Count how many JavaScript files were found
                status["js_files_count"] = len(js_files)

                # Store list of filenames for detailed debugging
                status["js_files"] = [f.name for f in js_files]

    # Return the populated status dictionary
    return status


def reinitialize_component() -> bool:
    """Attempt to reinitialize the component if it failed to load initially.

    This function provides a recovery mechanism for component initialization
    failures. It's useful when the frontend build was missing at import time
    but has since been built, or when temporary errors prevented loading.

    The function attempts to reinitialize the component using the same logic
    as the initial _initialize_component() call. It respects the current
    mode (production vs development) and updates the global _component_func.

    Returns:
        bool: True if reinitialization succeeded, False if it failed.
            Success means the component function was successfully declared
            and is ready for use. Failure indicates persistent issues that
            require investigation.

    Example:
        Retry after building frontend::

            >>> # Initial load failed, build frontend
            >>> subprocess.run(["npm", "run", "build"], cwd="frontend")
            >>> # Attempt to reinitialize
            >>> if reinitialize_component():
            ...     print("Component now ready")
            ... else:
            ...     print("Reinitialization failed")

        Check status before reinitializing::

            >>> status = debug_component_status()
            >>> if not status['component_initialized']:
            ...     if status['frontend_dir_exists']:
            ...         # Build exists, try reinitializing
            ...         success = reinitialize_component()
            ...     else:
            ...         print("Build frontend first")

    Note:
        This function modifies the global _component_func variable.
        Reinitialization does not affect existing component instances,
        only new components created after this call.

        Common reasons to reinitialize:
            - Frontend was built after module import
            - Temporary file system issues resolved
            - Network issues resolved (dev mode)
            - Manual troubleshooting steps completed
    """
    # Declare _component_func as global so we can modify it
    # Without this, we'd create a new local variable instead
    global _component_func  # pylint: disable=global-statement  # noqa: PLW0603

    # Log the reinitialization attempt for debugging
    logger.info("Attempting to reinitialize component...")

    # Handle production mode reinitialization
    if _RELEASE:
        # Construct path to frontend build directory
        frontend_dir = Path(__file__).parent / "frontend" / "build"

        # Verify build directory exists before attempting initialization
        if not frontend_dir.exists():
            # Log error with specific path that's missing
            logger.error("Frontend build directory not found at %s", frontend_dir)
            # Return False to indicate reinitialization failed
            return False

        try:
            # Attempt to declare the production component
            # Use package name only to avoid module path conflicts
            _component_func = components.declare_component(
                "streamlit_lightweight_charts_pro",
                path=str(frontend_dir),
            )
        except (OSError, ValueError, RuntimeError):
            # Log the exception with full traceback for debugging
            logger.exception("Failed to reinitialize component")
            # Return False to indicate reinitialization failed
            return False
        else:
            # No exception raised, initialization succeeded
            logger.info("Successfully reinitialized production component")
            # Return True to indicate success
            return True

    # Handle development mode reinitialization
    try:
        # Attempt to declare the development component
        # Connects to local dev server at localhost:3001
        _component_func = components.declare_component(
            "streamlit_lightweight_charts_pro",
            url="http://localhost:3001",
        )
    except (OSError, ValueError, RuntimeError):
        # Log the exception with full traceback for debugging
        logger.exception("Failed to reinitialize development component")
        # Return False to indicate reinitialization failed
        return False
    else:
        # No exception raised, initialization succeeded
        logger.info("Successfully reinitialized development component")
        # Return True to indicate success
        return True


def _initialize_component() -> None:
    """Initialize the component function based on environment.

    This is an internal function called automatically at module import time
    to set up the Streamlit component. It detects the current mode
    (production vs development) and initializes the component accordingly.

    The function is idempotent - calling it multiple times is safe, though
    typically it's only called once during module initialization.

    The initialization process:
        1. Checks the _RELEASE flag to determine mode
        2. In production: Verifies frontend build exists and declares component
        3. In development: Declares component pointing to dev server
        4. Logs all steps for debugging
        5. Sets _component_func on success, None on failure

    Component Initialization Details:
        Production Mode (_RELEASE=True):
            - Looks for frontend/build directory
            - Verifies directory exists before declaring component
            - Uses components.declare_component() with path parameter
            - Logs errors if build directory is missing

        Development Mode (_RELEASE=False):
            - Declares component with url parameter
            - Points to http://localhost:3001 for dev server
            - Assumes developer has started dev server manually
            - Useful for hot reloading during development

    Side Effects:
        - Modifies global _component_func variable
        - Writes log messages at INFO, WARNING, and ERROR levels
        - May attempt filesystem operations in production mode

    Note:
        This function is called automatically when the module is imported.
        Manual calls to this function are unnecessary and may cause
        duplicate logging. Use reinitialize_component() instead for
        manual reinitialization.

        Error Handling:
            All exceptions are caught and logged. The function never raises
            exceptions to prevent import failures. If initialization fails,
            _component_func is set to None and the error is logged.
    """
    # Declare _component_func as global so we can modify it
    # This allows us to update the module-level singleton
    global _component_func  # pylint: disable=global-statement  # noqa: PLW0603

    # Branch based on current mode (production vs development)
    if _RELEASE:
        # === Production Mode Initialization ===

        # Construct absolute path to the frontend build directory
        # __file__ gives us this module's path
        # .parent navigates to the package directory
        frontend_dir = Path(__file__).parent / "frontend" / "build"

        # Log the path we're checking for debugging
        logger.info("Checking frontend directory: %s", frontend_dir)

        # Verify the build directory exists before attempting to use it
        if frontend_dir.exists():
            # Build directory found, proceed with component declaration
            logger.info("Frontend directory exists, attempting to initialize component")

            try:
                # Log successful import of Streamlit components API
                logger.info("Successfully imported streamlit.components.v1")

                # Declare the Streamlit component with built frontend files
                # IMPORTANT: Use just the package name, not full module path
                # This avoids conflicts when Streamlit tries to load the component
                # The 'path' parameter tells Streamlit where to find the built
                # React app (index.html, static assets, etc.)
                _component_func = components.declare_component(
                    "streamlit_lightweight_charts_pro",
                    path=str(frontend_dir),
                )

                # Log successful initialization
                logger.info("Successfully initialized production component")

            except ImportError:
                # Streamlit components module couldn't be imported
                # This might indicate an incompatible Streamlit version
                logger.exception("Failed to import streamlit.components.v1")
                # Set to None to indicate initialization failed
                _component_func = None

            except (OSError, ValueError, RuntimeError):
                # Catch any other unexpected errors during initialization
                # This could include:
                # - File permission errors
                # - Invalid build files
                # - Component declaration failures
                logger.exception("Could not load frontend component")
                # Set to None to indicate initialization failed
                _component_func = None

        else:
            # Build directory doesn't exist - frontend hasn't been built
            # Log as ERROR since this is a critical issue in production
            logger.error("Frontend build directory not found at %s", frontend_dir)
            # Set to None to indicate component unavailable
            _component_func = None

    else:
        # === Development Mode Initialization ===

        # In development, we connect to a local dev server instead of
        # using built files. This enables hot reloading and faster iteration.
        logger.info("Development mode: attempting to initialize component with local server")

        try:
            # Log successful import of Streamlit components API
            logger.info("Successfully imported streamlit.components.v1 for development")

            # Declare the component with development server URL
            # The dev server is typically started with 'npm start' in the
            # frontend directory and runs on port 3001 by default
            _component_func = components.declare_component(
                "streamlit_lightweight_charts_pro",
                url="http://localhost:3001",
            )

            # Log successful initialization
            logger.info("Successfully initialized development component")

        except ImportError:
            # Streamlit components module couldn't be imported
            logger.exception("Failed to import streamlit.components.v1 for development")
            # Set to None to indicate initialization failed
            _component_func = None

        except (OSError, ValueError, RuntimeError):
            # Catch any other unexpected errors during initialization
            # In dev mode, this often means the dev server isn't running
            logger.exception("Could not load development component")
            # Set to None to indicate initialization failed
            _component_func = None


# Initialize component function automatically at module import time
# This ensures the component is ready to use as soon as the module is imported
# Any initialization errors are logged but don't prevent import
_initialize_component()
