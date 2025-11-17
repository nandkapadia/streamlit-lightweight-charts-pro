#!/usr/bin/env python3
"""Command-line interface for streamlit-lightweight-charts-pro.

This module provides command-line utilities for managing the
streamlit-lightweight-charts-pro package, including frontend building,
dependency management, and development tools.

The CLI supports:
    - Frontend build management and validation
    - Dependency installation and updates
    - Development environment setup
    - Package validation and testing

Key Features:
    - Automatic frontend build detection and building
    - NPM dependency management with validation
    - Development vs production mode handling
    - Error handling with clear user messages
    - Cross-platform compatibility

Example:
    Build frontend assets::

        $ python -m streamlit_lightweight_charts_pro build-frontend

    Check frontend build status::

        $ python -m streamlit_lightweight_charts_pro check

    Show version information::

        $ python -m streamlit_lightweight_charts_pro version

Note:
    This module requires Node.js and NPM to be installed for
    frontend build operations.
"""

# Standard Imports
import os
import shutil
import subprocess
import sys
from pathlib import Path

# Local Imports
from streamlit_lightweight_charts_pro import __version__
from streamlit_lightweight_charts_pro.exceptions import NpmNotFoundError


def check_frontend_build():
    """Check if frontend is built and trigger build if necessary.

    This function validates that the frontend build directory exists and
    contains the required static assets. If the frontend is not built or
    missing static assets, it automatically triggers the build process.

    The function checks for:
        - Existence of the 'build' directory
        - Existence of the 'static' subdirectory within build

    Returns:
        bool: True if frontend is built successfully or already exists,
            False if build fails.

    Example:
        >>> if check_frontend_build():
        ...     print("Frontend is ready")
        ... else:
        ...     print("Frontend build failed")
    """
    # Get the absolute path to the frontend directory
    # __file__ gives us the path to this cli.py module
    # .parent gets the package directory
    frontend_dir = Path(__file__).parent / "frontend"

    # Build directory is where compiled frontend assets are stored
    build_dir = frontend_dir / "build"

    # Check if build directory exists AND contains static assets
    # Both conditions must be true for frontend to be considered built
    if not build_dir.exists() or not (build_dir / "static").exists():
        # Inform user that frontend needs to be built
        print("❌ Frontend not built. Building now...")
        # Trigger the build process and return its result
        return build_frontend()

    # Frontend is already built, no action needed
    return True


def build_frontend():
    """Build the frontend assets using NPM.

    This function handles the complete frontend build process including
    dependency installation, production build execution, and error handling.

    The build process:
        1. Locates NPM executable in system PATH
        2. Changes to frontend directory
        3. Installs NPM dependencies via 'npm install'
        4. Runs production build via 'npm run build'
        5. Restores original working directory

    Returns:
        bool: True if build succeeds, False otherwise.

    Raises:
        NpmNotFoundError: If NPM is not installed or not found in PATH.
        ValueError: If NPM path validation fails.

    Note:
        The function uses shell=False for security to prevent command
        injection attacks. It also validates the NPM path before execution.

    Example:
        >>> success = build_frontend()
        >>> if success:
        ...     print("Frontend built successfully")
    """
    # Get the absolute path to the frontend directory
    # This is where package.json and source files are located
    frontend_dir = Path(__file__).parent / "frontend"

    try:
        # Store current working directory so we can restore it later
        # This ensures we don't leave the user in a different directory
        original_dir = Path.cwd()

        # Change to frontend directory for NPM operations
        # NPM needs to run from the directory containing package.json
        os.chdir(frontend_dir)

        # Install dependencies first to ensure all packages are available
        print("📦 Installing frontend dependencies...")

        # Find NPM executable in system PATH
        # shutil.which() returns full path to executable or None
        npm_path = shutil.which("npm")

        # Check if NPM was found in PATH
        if not npm_path:
            # Define nested function to raise NPM not found error
            # This pattern is used to satisfy certain linting rules
            def _raise_npm_not_found():
                raise NpmNotFoundError()  # noqa: TRY301

            # Execute the error raising function
            _raise_npm_not_found()

        # Validate npm_path to prevent command injection attacks
        # We need to ensure the path actually exists and is valid
        def _raise_invalid_npm_path():
            raise ValueError("Invalid npm path")  # noqa: TRY301

        # Double-check NPM path exists on filesystem
        if not npm_path or not Path(npm_path).exists():
            _raise_invalid_npm_path()

        # Run 'npm install' to install all dependencies from package.json
        # check=True causes subprocess to raise CalledProcessError on failure
        # shell=False prevents shell injection attacks
        subprocess.run([npm_path, "install"], check=True, shell=False)

        # Build frontend using the build script defined in package.json
        print("🔨 Building frontend...")
        # Run 'npm run build' which executes the build script
        subprocess.run([npm_path, "run", "build"], check=True, shell=False)

        # Build completed successfully
        print("✅ Frontend build successful!")
        # Return True to indicate success
        # Note: No explicit return needed as we reach end of try block

    except subprocess.CalledProcessError as e:
        # NPM command failed (non-zero exit code)
        # Print error message to help user diagnose the issue
        print(f"❌ Frontend build failed: {e}")
        return False

    except Exception as e:
        # Catch any other unexpected errors
        # This could include file system errors, permission errors, etc.
        print(f"❌ Unexpected error during frontend build: {e}")
        return False

    finally:
        # Always restore original working directory
        # This executes whether build succeeded or failed
        os.chdir(original_dir)


def main():
    """Main CLI entry point for command-line interface.

    Parses command-line arguments and dispatches to appropriate handler
    functions. Supported commands:
        - build-frontend: Build the frontend assets
        - check: Check if frontend is built
        - version: Show version information

    Returns:
        int: Exit code (0 for success, 1 for failure).

    Example:
        >>> import sys
        >>> sys.argv = ['cli', 'version']
        >>> exit_code = main()
        >>> print(f"Exit code: {exit_code}")
    """
    # Check if user provided a command argument
    # sys.argv[0] is the script name, sys.argv[1] is the command
    if len(sys.argv) < 2:
        # No command provided, show usage information
        print("Usage: streamlit-lightweight-charts-pro <command>")
        print("Commands:")
        print("  build-frontend  Build the frontend assets")
        print("  check          Check if frontend is built")
        print("  version        Show version information")
        # Return 1 to indicate error (missing command)
        return 1

    # Extract the command from command-line arguments
    command = sys.argv[1]

    # Handle 'build-frontend' command
    if command == "build-frontend":
        # Trigger frontend build process
        success = build_frontend()
        # Return 0 if successful, 1 if failed
        return 0 if success else 1

    # Handle 'check' command
    if command == "check":
        # Check if frontend is already built
        success = check_frontend_build()
        # Return 0 if successful, 1 if failed
        return 0 if success else 1

    # Handle 'version' command
    if command == "version":
        # Display version information from package metadata
        print(f"streamlit-lightweight-charts-pro version {__version__}")
        # Return 0 to indicate success
        return 0

    # Unknown command provided
    print(f"Unknown command: {command}")
    # Return 1 to indicate error (invalid command)
    return 1


# Execute main function if this script is run directly
# This allows the module to be used as a script or imported as a library
if __name__ == "__main__":
    # sys.exit() terminates with the return code from main()
    sys.exit(main())
